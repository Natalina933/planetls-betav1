"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  ClipboardCheck,
  Home,
  MapPinned,
  MessageSquareText,
  PenLine,
  Plus,
  Route,
  Sparkles,
  X,
} from "lucide-react";
import styles from "./DashboardMobileExperience.module.scss";

type MobileRole = "owner" | "concierge" | "provider" | "admin";

type Props = {
  role?: string | null;
  pathname?: string | null;
};

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

const CHECKLIST_KEY = "planetls.mobile.fieldChecklist";
const SIGNATURE_KEY = "planetls.mobile.signature";

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "access", label: "Accès et clés vérifiés", done: false },
  { id: "photos", label: "Photos terrain prises", done: false },
  { id: "checklist", label: "Checklist mission terminée", done: false },
  { id: "owner", label: "Propriétaire informé", done: false },
];

function normalizeRole(role?: string | null): MobileRole {
  const value = String(role ?? "").toLowerCase();
  if (value.includes("admin")) return "admin";
  if (value.includes("concierge")) return "concierge";
  if (value.includes("provider") || value.includes("artisan")) return "provider";
  return "owner";
}

function safeChecklist(value: string | null) {
  if (!value) return DEFAULT_CHECKLIST;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return DEFAULT_CHECKLIST;
    return DEFAULT_CHECKLIST.map((item) => ({
      ...item,
      done: Boolean(parsed.find((entry: ChecklistItem) => entry?.id === item.id)?.done),
    }));
  } catch {
    return DEFAULT_CHECKLIST;
  }
}

function getRoleHome(role: MobileRole) {
  if (role === "concierge") return "/dashboard/concierge";
  if (role === "provider") return "/dashboard/provider";
  if (role === "admin") return "/dashboard/admin";
  return "/dashboard/owner";
}

function getRolePlanning(role: MobileRole) {
  if (role === "concierge") return "/dashboard/concierge/planning";
  if (role === "provider") return "/dashboard/provider/planning";
  if (role === "admin") return "/dashboard/admin/controle";
  return "/dashboard/owner/planning";
}

function getRoleMessages(role: MobileRole) {
  if (role === "concierge") return "/dashboard/concierge/messages";
  if (role === "provider") return "/dashboard/provider/messages";
  if (role === "admin") return "/dashboard/admin/controle";
  return "/dashboard/owner/messages";
}

function getRoleMissionHub(role: MobileRole) {
  if (role === "concierge") return "/dashboard/concierge/missions";
  if (role === "provider") return "/dashboard/provider/interventions";
  if (role === "admin") return "/dashboard/admin/missions";
  return "/dashboard/owner/missions";
}

export function DashboardMobileExperience({ role, pathname }: Props) {
  const router = useRouter();
  const roleKey = normalizeRole(role);
  const isAdmin = roleKey === "admin";
  const [open, setOpen] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const progress = useMemo(() => {
    const done = checklist.filter((item) => item.done).length + (validated ? 1 : 0) + (signatureSaved ? 1 : 0);
    return Math.round((done / (checklist.length + 2)) * 100);
  }, [checklist, signatureSaved, validated]);

  const quickActions = useMemo(
    () =>
      roleKey === "admin"
        ? [
            { label: "Vue plateforme", href: getRoleHome(roleKey), icon: Home },
            { label: "Pilotage business", href: "/dashboard/admin/pilotage", icon: Route },
            { label: "Contrôle détaillé", href: "/dashboard/admin/controle", icon: ClipboardCheck },
            { label: "Développement", href: "/dashboard/admin/developpement", icon: MessageSquareText },
            { label: "Missions", href: getRoleMissionHub(roleKey), icon: MapPinned },
          ]
        : [
            { label: "Accueil", href: getRoleHome(roleKey), icon: Home },
            { label: "Planning", href: getRolePlanning(roleKey), icon: Route },
            { label: roleKey === "provider" ? "Interventions" : "Missions", href: getRoleMissionHub(roleKey), icon: ClipboardCheck },
            { label: "Messages", href: getRoleMessages(roleKey), icon: MessageSquareText },
          ],
    [roleKey],
  );

  useEffect(() => {
    const storedChecklist = safeChecklist(localStorage.getItem(CHECKLIST_KEY));
    setChecklist(
      DEFAULT_CHECKLIST.map((item) => ({
        ...item,
        done: Boolean(storedChecklist.find((entry) => entry.id === item.id)?.done),
      })),
    );
    setSignatureSaved(Boolean(localStorage.getItem(SIGNATURE_KEY)));
  }, []);

  useEffect(() => {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklist));
  }, [checklist]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const toggleChecklist = useCallback((id: string) => {
    setChecklist((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  }, []);

  const handlePhotoChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    setPhotoPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setChecklist((current) =>
      current.map((item) => (item.id === "photos" ? { ...item, done: true } : item)),
    );
  }, []);

  const getCanvasPoint = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }, []);

  const startSignature = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(event);
      if (!point) return;
      drawingRef.current = true;
      lastPointRef.current = point;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [getCanvasPoint],
  );

  const drawSignature = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      const canvas = canvasRef.current;
      const point = getCanvasPoint(event);
      const lastPoint = lastPointRef.current;
      if (!canvas || !point || !lastPoint) return;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.strokeStyle = "#163b3a";
      context.lineWidth = 4;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(lastPoint.x, lastPoint.y);
      context.lineTo(point.x, point.y);
      context.stroke();
      lastPointRef.current = point;
    },
    [getCanvasPoint],
  );

  const endSignature = useCallback(() => {
    drawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem(SIGNATURE_KEY);
    setSignatureSaved(false);
  }, []);

  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    localStorage.setItem(SIGNATURE_KEY, canvas.toDataURL("image/png"));
    setSignatureSaved(true);
  }, []);

  const isConcierge = roleKey === "concierge";

  return (
    <>
      <nav className={styles.mobileDock} aria-label={isAdmin ? "Navigation mobile administration" : "Navigation mobile terrain"}>
        {quickActions.map((action) => {
          const Icon = action.icon;
          const active = pathname === action.href || pathname?.startsWith(`${action.href}/`);
          return (
            <button
              key={`${action.label}-${action.href}`}
              type="button"
              className={active ? styles.activeDockItem : ""}
              onClick={() => navigate(action.href)}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{action.label}</span>
            </button>
          );
        })}
        {!isAdmin ? (
          <button type="button" className={styles.primaryDockAction} onClick={() => setOpen(true)}>
            <Plus size={24} aria-hidden="true" />
            <span>Terrain</span>
          </button>
        ) : null}
      </nav>

      {!isAdmin && open ? (
        <div className={styles.sheetOverlay} role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Actions mobiles terrain"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.sheetHeader}>
              <div>
                <p>{isConcierge ? "Mode concierge mobile" : "Mode mobile"}</p>
                <h2>Action terrain</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer">
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <div className={styles.progressCard}>
              <span>{progress}%</span>
              <div>
                <strong>Tournée prête</strong>
                <p>Checklist, preuve, validation et signature depuis le téléphone.</p>
              </div>
            </div>

            <div className={styles.bigActions}>
              <label className={styles.cameraButton}>
                <Camera size={24} aria-hidden="true" />
                <span>Prendre une photo</span>
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} />
              </label>
              <button type="button" onClick={() => setValidated(true)} className={validated ? styles.doneAction : ""}>
                <Check size={24} aria-hidden="true" />
                <span>{validated ? "Valide" : "Valider en 1 clic"}</span>
              </button>
            </div>

            {photoPreview ? (
              <div className={styles.photoPreview}>
                <span className={styles.photoPreviewImage}>
                  <Image src={photoPreview} alt={photoName || "Photo terrain"} fill sizes="82px" unoptimized />
                </span>
                <span>{photoName || "Photo prête à joindre"}</span>
              </div>
            ) : null}

            <section className={styles.mobileSection}>
              <div className={styles.sectionTitle}>
                <ClipboardCheck size={18} aria-hidden="true" />
                <h3>Checklist mobile</h3>
              </div>
              <div className={styles.checklist}>
                {checklist.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={item.done ? styles.checkDone : ""}
                    onClick={() => toggleChecklist(item.id)}
                  >
                    <span>{item.done ? <Check size={16} aria-hidden="true" /> : null}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.mobileSection}>
              <div className={styles.sectionTitle}>
                <PenLine size={18} aria-hidden="true" />
                <h3>Signature</h3>
              </div>
              <canvas
                ref={canvasRef}
                width={640}
                height={220}
                className={styles.signaturePad}
                onPointerDown={startSignature}
                onPointerMove={drawSignature}
                onPointerUp={endSignature}
                onPointerCancel={endSignature}
                aria-label="Zone de signature"
              />
              <div className={styles.signatureActions}>
                <button type="button" onClick={clearSignature}>Effacer</button>
                <button type="button" onClick={saveSignature} className={signatureSaved ? styles.doneAction : ""}>
                  {signatureSaved ? "Signature prête" : "Enregistrer"}
                </button>
              </div>
            </section>

            <div className={styles.sheetShortcuts}>
              <button type="button" onClick={() => navigate(getRolePlanning(roleKey))}>
                <MapPinned size={18} aria-hidden="true" />
                Planning
              </button>
              <button type="button" onClick={() => navigate(getRoleMissionHub(roleKey))}>
                <Sparkles size={18} aria-hidden="true" />
                Ouvrir mission
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
