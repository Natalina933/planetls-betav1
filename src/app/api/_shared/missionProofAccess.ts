/**
 * Resource isolation, not an attestation of who originally uploaded a file.
 * A stored unique proof, a fixed bucket and the mission namespace are required;
 * object existence is checked separately. source/created_by/sha256 grant no rights.
 */
export const MISSION_PROOF_BUCKET = "mission-evidence";

type ProofDetails = {
  id: string;
  label?: string;
  kind?: string;
  source?: string;
  created_by?: string;
  created_at?: string;
  sha256?: string;
  mime_type?: string;
  file_size_bytes?: number;
};
export type MissionProof = ProofDetails & (
  | { storage_bucket: typeof MISSION_PROOF_BUCKET; storage_path: string; url?: never }
  | { url: string; storage_bucket?: never; storage_path?: never }
);
type ProofStorage = {
  from(bucket: string): { info(path: string): Promise<{ data: unknown; error: unknown }> };
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROOF_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function safeMissionProofUrl(value: unknown): string | null {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value) || /[\s\\\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.hostname && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function isMissionProofPath(missionId: string, path: unknown): path is string {
  if (!UUID.test(missionId) || typeof path !== "string") return false;
  const parts = path.split("/");
  return parts.length === 3 && parts[0] === "missions" && UUID.test(parts[1])
    && parts[1].toLowerCase() === missionId.toLowerCase()
    && /^[A-Za-z0-9][A-Za-z0-9._-]{0,254}$/.test(parts[2]);
}

function parseProof(missionId: string, raw: Record<string, unknown>): MissionProof | null {
  if (typeof raw.id !== "string" || !PROOF_ID.test(raw.id)) return null;
  for (const key of ["mission_id", "missionId"]) {
    if (key in raw && (typeof raw[key] !== "string" || raw[key].toLowerCase() !== missionId.toLowerCase())) return null;
  }
  // Reject alternative locators rather than choosing one contradictory field.
  if (["bucket", "path", "storageBucket", "storagePath"].some(key => key in raw)) return null;
  const details: ProofDetails = { id: raw.id };
  for (const key of ["label", "kind", "source", "created_by", "created_at", "sha256", "mime_type"] as const) {
    if (typeof raw[key] === "string") details[key] = raw[key];
  }
  if (typeof raw.file_size_bytes === "number" && Number.isFinite(raw.file_size_bytes) && raw.file_size_bytes >= 0) {
    details.file_size_bytes = raw.file_size_bytes;
  }
  if ("storage_path" in raw) {
    if ("url" in raw || !isMissionProofPath(missionId, raw.storage_path)) return null;
    if ("storage_bucket" in raw && raw.storage_bucket !== MISSION_PROOF_BUCKET) return null;
    return { ...details, storage_bucket: MISSION_PROOF_BUCKET, storage_path: raw.storage_path };
  }
  if ("storage_bucket" in raw) return null;
  const url = safeMissionProofUrl(raw.url);
  return url ? { ...details, url } : null;
}

/** Invalid and duplicated IDs are removed in their entirety, never first-wins. */
export function missionProofs(missionId: string, metadata: unknown): MissionProof[] {
  const entries = record(metadata).proof_links;
  if (!UUID.test(missionId) || !Array.isArray(entries)) return [];
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const id = record(entry).id;
    if (typeof id === "string") counts.set(id.trim().toLowerCase(), (counts.get(id.trim().toLowerCase()) ?? 0) + 1);
  }
  return entries.flatMap(entry => {
    const raw = record(entry);
    if (typeof raw.id !== "string" || counts.get(raw.id.trim().toLowerCase()) !== 1) return [];
    const proof = parseProof(missionId, raw);
    return proof ? [proof] : [];
  });
}

export class MissionProofVerificationError extends Error {
  constructor() { super("Vérification des preuves indisponible."); }
}

/** Called only after actor/resource authorization and pure reference validation. */
export async function missionProofObjectExists(storage: ProofStorage, proof: MissionProof): Promise<boolean> {
  if (!proof.storage_path) return true;
  try {
    const result = await storage.from(MISSION_PROOF_BUCKET).info(proof.storage_path);
    if (!result || result.error !== null) {
      const error = record(result?.error);
      if (String(error.statusCode ?? error.status) === "404" || error.code === "NoSuchKey") return false;
      throw new MissionProofVerificationError();
    }
    const object = record(result.data);
    if (object.name !== proof.storage_path || object.bucketId !== MISSION_PROOF_BUCKET) {
      throw new MissionProofVerificationError();
    }
    return true;
  } catch (error) {
    if (error instanceof MissionProofVerificationError) throw error;
    throw new MissionProofVerificationError();
  }
}

/** Projection only: never rewrites legacy persisted metadata. */
export async function verifiedMissionProofs(storage: ProofStorage, missionId: string, metadata: unknown) {
  const proofs: MissionProof[] = [];
  for (const proof of missionProofs(missionId, metadata)) {
    if (await missionProofObjectExists(storage, proof)) proofs.push(proof);
  }
  return proofs;
}

/** A new mission has no existing server upload; only validated external links may be imported. */
export function missionCreationProofs(metadata: unknown): { ok: true; proofs?: MissionProof[] } | { ok: false } {
  const raw = record(metadata);
  if (!("proof_links" in raw)) return { ok: true };
  if (!Array.isArray(raw.proof_links)) return { ok: false };
  const proofs = missionProofs("00000000-0000-0000-0000-000000000000", raw);
  if (proofs.length !== raw.proof_links.length || proofs.some(proof => proof.storage_path)) return { ok: false };
  return { ok: true, proofs };
}
