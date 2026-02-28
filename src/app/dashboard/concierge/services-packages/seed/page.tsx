"use client";

import Link from "next/link";
import { useState } from "react";

interface ApiPackage {
  id: string;
  name: string;
}

interface ApiTemplate {
  id: string;
  title: string;
  package_id: string;
}

type SeedStatus = "idle" | "running" | "success" | "error";

const PACK_SEEDS = [
  {
    name: "Pack Budget (Seed)",
    description: "Menage + Check-in + Linge",
    category: "Courte Duree",
    service_ids: ["1", "16", "13"],
    templateTitle: "Modele Budget Standard (Seed)",
  },
  {
    name: "Pack Luxe (Seed)",
    description: "Tous services + Conciergerie 24/7",
    category: "Luxe",
    service_ids: ["1", "2", "13", "15", "16", "17", "18", "25", "35"],
    templateTitle: "Modele Luxe VIP (Seed)",
  },
];

const templateContent = (packName: string) =>
  `Contrat type pour ${packName}.\n\nServices inclus:\n- Menage\n- Check-in / Check-out\n- Gestion linge\n\nVariables: {{client_name}}, {{start_date}}, {{amount}}`;

export default function ServicesPackagesSeedPage() {
  const [status, setStatus] = useState<SeedStatus>("idle");
  const [logs, setLogs] = useState<string[]>([]);

  const pushLog = (line: string) => {
    setLogs((prev) => [...prev, line]);
  };

  const runSeed = async () => {
    setStatus("running");
    setLogs([]);

    try {
      pushLog("Recuperation des packs existants...");
      const packsRes = await fetch("/api/services/packages");
      if (!packsRes.ok) {
        throw new Error("Impossible de lire les packs.");
      }
      const existingPacks = (await packsRes.json()) as ApiPackage[];

      for (const seed of PACK_SEEDS) {
        let currentPack = existingPacks.find((p) => p.name === seed.name);

        if (!currentPack) {
          pushLog(`Creation du pack: ${seed.name}`);
          const createPackRes = await fetch("/api/services/packages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: seed.name,
              description: seed.description,
              category: seed.category,
              service_ids: seed.service_ids,
            }),
          });
          if (!createPackRes.ok) {
            throw new Error(`Echec creation pack: ${seed.name}`);
          }
          currentPack = (await createPackRes.json()) as ApiPackage;
        } else {
          pushLog(`Pack deja present: ${seed.name}`);
        }

        pushLog(`Vérification des modèles pour ${seed.name}...`);
        const templatesRes = await fetch(
          `/api/services/contract-templates?packageId=${encodeURIComponent(currentPack.id)}`,
        );
        if (!templatesRes.ok) {
          throw new Error("Impossible de lire les modèles de contrats.");
        }
        const templates = (await templatesRes.json()) as ApiTemplate[];
        const exists = templates.some((t) => t.title === seed.templateTitle);

        if (!exists) {
          pushLog(`Creation du modele: ${seed.templateTitle}`);
          const createTplRes = await fetch("/api/services/contract-templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              package_id: currentPack.id,
              title: seed.templateTitle,
              content: templateContent(seed.name),
              variables: {
                client_name: "",
                start_date: "",
                amount: "",
                services: "",
              },
            }),
          });
          if (!createTplRes.ok) {
            throw new Error(`Echec creation modele: ${seed.templateTitle}`);
          }
        } else {
          pushLog(`Modèle déjà présent : ${seed.templateTitle}`);
        }
      }

      setStatus("success");
      pushLog("Seed terminé avec succès.");
    } catch (err) {
      setStatus("error");
      pushLog(err instanceof Error ? err.message : "Erreur inconnue.");
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Seed Test Packs & Modeles</h1>
          <p style={{ margin: "0.35rem 0 0", color: "#666" }}>
            Crée 2 packs et 2 modèles de contrats de démonstration via l&apos;API.
          </p>
        </div>
        <Link href="/dashboard/concierge/services-packages">Retour aux packs</Link>
      </div>

      <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff" }}>
        <button
          type="button"
          onClick={runSeed}
          disabled={status === "running"}
          style={{
            border: 0,
            borderRadius: 8,
            padding: "0.65rem 1rem",
            background: status === "running" ? "#94a3b8" : "#2563eb",
            color: "#fff",
            cursor: status === "running" ? "not-allowed" : "pointer",
          }}
        >
          {status === "running" ? "Seed en cours..." : "Lancer le seed de test"}
        </button>

        <div style={{ marginTop: "1rem", padding: "0.75rem", borderRadius: 8, background: "#f8fafc" }}>
          <strong>Etat:</strong>{" "}
          {status === "idle" && "En attente"}
          {status === "running" && "Execution"}
          {status === "success" && "Succès"}
          {status === "error" && "Erreur"}
        </div>

        <div
          style={{
            marginTop: "1rem",
            maxHeight: 300,
            overflow: "auto",
            padding: "0.75rem",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#0b1220",
            color: "#dbeafe",
            fontFamily: "monospace",
            fontSize: 13,
          }}
        >
          {logs.length === 0 ? <div>Aucun log pour le moment.</div> : null}
          {logs.map((line, idx) => (
            <div key={`${line}-${idx}`}>- {line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
