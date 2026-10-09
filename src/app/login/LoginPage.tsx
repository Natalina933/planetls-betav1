"use client";

import React, { useEffect, useRef, useState, ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import { getProviders, signIn } from "next-auth/react";
import styles from "./LoginPage.module.scss";
import { FaEye, FaEyeSlash, FaTimesCircle, FaCheckCircle } from "react-icons/fa";
import { Button, Input } from "@/components/ui";

type WorkspaceKey = "owner" | "concierge" | "provider" | "admin";
type QuickWorkspace = { key: WorkspaceKey; label: string; href: string };
type SocialProvider = { id: string; name: string };

const workspacePresentation: Record<WorkspaceKey, { label: string; description: string; image: string }> = {
  owner: { label: "Propriétaire", description: "Logements, demandes et collaborations", image: "proprietaire" },
  concierge: { label: "Concierge", description: "Services, missions et propriétaires", image: "concierge" },
  provider: { label: "Artisan", description: "Interventions, demandes et activité", image: "artisan" },
  admin: { label: "Administration", description: "Pilotage de PlanetLS", image: "administrateur" },
};

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const maskEmail = (email: string): string => {
  const [localPart = "", domainPart = ""] = email.split("@");
  if (!localPart || !domainPart) {
    return email;
  }

  const visibleLocal =
    localPart.length <= 2 ? `${localPart.charAt(0)}*` : `${localPart.slice(0, 2)}***`;
  return `${visibleLocal}@${domainPart}`;
};

const getDashboardPathFromRole = (role: string | null | undefined): string => {
  switch (role) {
    case "admin":
    case "super_admin":
      return "/dashboard/admin";
    case "concierge":
    case "concierge_pro":
      return "/dashboard/concierge";
    case "owner":
    case "owner_pro":
      return "/dashboard/owner";
    case "provider":
    case "provider_pro":
    case "artisan":
    case "artisan_pro":
      return "/dashboard/provider";
    default:
      return "/dashboard/owner";
  }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LoginPage() {
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string; auth?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [quickWorkspaces, setQuickWorkspaces] = useState<QuickWorkspace[]>([]);
  const [preparingWorkspace, setPreparingWorkspace] = useState<WorkspaceKey | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceKey | null>(null);
  const [quickLoginMessage, setQuickLoginMessage] = useState("");
  const [socialProviders, setSocialProviders] = useState<SocialProvider[]>([]);
  const [socialLoadingProvider, setSocialLoadingProvider] = useState<string | null>(null);

  const prepareWorkspaceCredentials = async (workspace: WorkspaceKey) => {
    setPreparingWorkspace(workspace);
    setSelectedWorkspace(null);
    setQuickLoginMessage("");

    try {
      const response = await fetch("/api/auth/dev-workspace-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        email?: string;
        password?: string;
        label?: string;
      };

      if (!response.ok || !payload.email || !payload.password) {
        throw new Error("Compte de travail indisponible");
      }

      setFormData({ email: payload.email, password: payload.password });
      setErrors({});
      setSelectedWorkspace(workspace);
      setQuickLoginMessage(
        "Les identifiants de démonstration sont prêts.",
      );
      window.history.replaceState(null, "", `/login?workspace=${workspace}`);
    } catch {
      setQuickLoginMessage(
        "Impossible de préparer cet espace. Veuillez réessayer.",
      );
    } finally {
      setPreparingWorkspace(null);
    }
  };

  useEffect(() => {
    const syncAutofilledValues = () => {
      const email = emailRef.current?.value ?? "";
      const password = passwordRef.current?.value ?? "";

      setFormData((prev) =>
        prev.email === email && prev.password === password ? prev : { email, password },
      );
      setErrors((prev) => ({
        ...prev,
        email: email ? (validateEmail(email) ? "" : "Email invalide") : prev.email,
        password: password ? (password.length >= 8 ? "" : "Minimum 8 caractères") : prev.password,
      }));
    };

    syncAutofilledValues();
    const timeoutId = window.setTimeout(syncAutofilledValues, 250);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSocialProviders() {
      const providers = await getProviders().catch(() => null);
      if (cancelled || !providers) return;

      setSocialProviders(
        Object.values(providers)
          .filter((provider) => provider.id !== "credentials")
          .map((provider) => ({ id: provider.id, name: provider.name })),
      );
    }

    void loadSocialProviders();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadQuickWorkspaces() {
      const response = await fetch("/api/auth/dev-workspace-login", { cache: "no-store" }).catch(
        () => null,
      );
      if (!response?.ok) return;

      const payload = (await response.json()) as { workspaces?: QuickWorkspace[] };
      if (cancelled || !Array.isArray(payload.workspaces)) return;
      setQuickWorkspaces(payload.workspaces);

      const requestedWorkspace = new URLSearchParams(window.location.search).get("workspace");
      const workspace = payload.workspaces.find((item) => item.key === requestedWorkspace)?.key;
      if (workspace) await prepareWorkspaceCredentials(workspace);
    }

    void loadQuickWorkspaces();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolveRoleFromSession = async (): Promise<string | null> => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      console.info("[LoginPage] resolving role from session", { attempt: attempt + 1 });
      const res = await fetch(`/api/auth/session?ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const session = await res.json();
      const role = session?.user?.role;
      if (role) {
        console.info("[LoginPage] role resolved from session", { role });
        return role;
      }
      await wait(250);
    }
    console.warn("[LoginPage] no role found in session after retries");
    return null;
  };

  const resolveRoleFromLoginApi = async (): Promise<string | null> => {
    console.info("[LoginPage] resolving role from fallback login api", {
      email: maskEmail(formData.email),
    });
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    if (!res.ok) {
      console.warn("[LoginPage] fallback login api failed", { status: res.status });
      return null;
    }

    const payload = await res.json();
    console.info("[LoginPage] role resolved from fallback login api", {
      role: payload?.user?.role ?? null,
    });
    return payload?.user?.role ?? null;
  };

  useEffect(() => {
    const socialStatus = new URLSearchParams(window.location.search).get("social");
    if (socialStatus !== "success") return;

    let cancelled = false;

    async function redirectAfterSocialLogin() {
      setLoading(true);
      setErrors({});

      try {
        const role = await resolveRoleFromSession();
        if (cancelled) return;

        window.location.assign(getDashboardPathFromRole(role));
      } catch (error) {
        console.error("[LoginPage] social redirect failed", error);
        if (!cancelled) {
          window.location.assign("/dashboard/owner");
        }
      }
    }

    void redirectAfterSocialLogin();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) ? "" : "Email invalide" }));
    }
    if (name === "password") {
      setErrors((prev) => ({ ...prev, password: value.length >= 8 ? "" : "Minimum 8 caractères" }));
    }
  };

  const canSubmit = () =>
    formData.email && formData.password && !errors.email && !errors.password;

  const handleSocialSignIn = async (providerId: string) => {
    setSocialLoadingProvider(providerId);
    setErrors({});

    await signIn(providerId, {
      callbackUrl: "/login?social=success",
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const email = emailRef.current?.value?.trim() ?? formData.email.trim();
    const password = passwordRef.current?.value ?? formData.password;
    const nextErrors = {
      email: validateEmail(email) ? "" : "Email invalide",
      password: password.length >= 8 ? "" : "Minimum 8 caractères",
    };

    setFormData({ email, password });
    setErrors(nextErrors);

    console.info("[LoginPage] submit", {
      email: maskEmail(email),
      hasEmail: Boolean(email),
      passwordLength: password.length,
      canSubmit: Boolean(email && password && !nextErrors.email && !nextErrors.password),
    });

    if (!email || !password || nextErrors.email || nextErrors.password) {
      console.warn("[LoginPage] blocked before signIn", { nextErrors });
      setErrors((prev) => ({ ...prev, auth: "Veuillez corriger les erreurs" }));
      return;
    }

    setLoading(true);
    setErrors({});

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    console.info("[LoginPage] signIn result", {
      ok: result?.ok ?? false,
      status: result?.status ?? null,
      error: result?.error ?? null,
      url: result?.url ?? null,
    });

    if (result?.error) {
      setLoading(false);
      setErrors((prev) => ({ ...prev, auth: "Email ou mot de passe incorrect" }));
    } else {
      try {
        let role = await resolveRoleFromSession();

        if (!role) {
          role = await resolveRoleFromLoginApi();
        }

        const targetPath = getDashboardPathFromRole(role);
        console.info("[LoginPage] redirecting to dashboard", {
          role,
          targetPath,
        });
        window.location.assign(targetPath);
      } catch (err) {
        console.error("[LoginPage] redirect fallback after exception", err);
        window.location.assign("/dashboard/owner");
      }
    }
  };

  return (
    <main className={styles.pageShell}>
      <section className={styles.authLayout} aria-label="Connexion Planet LS">
        <aside className={styles.visualPanel} aria-label="Aperçu Planet LS">
          <Image
            src="/images/hero-warmv2.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 900px) 100vw, 54vw"
            className={styles.heroImage}
          />
          <div className={styles.visualShade} aria-hidden="true" />

          <div className={styles.visualContent}>
            <Image
              src="/logo/Logo%20PlanetLS%20_%20globe%20dor%C3%A9%20et%20%C3%A9l%C3%A9gance%20verte.png"
              alt="Planet LS"
              width={178}
              height={54}
              className={styles.logo}
              priority
            />
            <div className={styles.visualText}>
              <span className={styles.visualEyebrow}>Propriétaire · Concierge · Artisan</span>
              <h2>Retrouvez votre espace.</h2>
              <p>
                Un accès unique pour gérer vos logements, vos missions et vos collaborations.
              </p>
            </div>

            <div className={styles.previewStrip} aria-hidden="true">
              <Image
                src="/images/generated/hero-carousel/planetls-hero-proprietaires.png"
                alt=""
                width={168}
                height={112}
                className={styles.previewImage}
              />
              <Image
                src="/images/generated/hero-carousel/planetls-hero-conciergeries.png"
                alt=""
                width={168}
                height={112}
                className={styles.previewImage}
              />
              <Image
                src="/images/generated/hero-carousel/planetls-hero-artisans.png"
                alt=""
                width={168}
                height={112}
                className={styles.previewImage}
              />
            </div>

          </div>
        </aside>

        <div className={styles.pageContainer}>
          <div className={styles.headerBlock}>
            <span className={styles.eyebrow}>Espace sécurisé</span>
            <h1 className={styles.title}>Connexion</h1>
            <p className={styles.subtitle}>
              Retrouvez votre activité là où vous l’avez laissée.
            </p>
          </div>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {socialProviders.length > 0 ? (
              <section className={styles.socialLogin} aria-label="Connexion avec un compte externe">
                <div className={styles.socialButtons}>
                  {socialProviders.map((provider) => (
                    <Button
                      key={provider.id}
                      type="button"
                      variant="outline"
                      size="lg"
                      disabled={loading || socialLoadingProvider !== null}
                      className={styles.socialButton}
                      onClick={() => void handleSocialSignIn(provider.id)}
                    >
                      <span className={styles.socialMark} aria-hidden="true">
                        {provider.id === "google" ? "G" : provider.name.charAt(0)}
                      </span>
                      {socialLoadingProvider === provider.id
                        ? "Connexion..."
                        : `Continuer avec ${provider.name}`}
                    </Button>
                  ))}
                </div>
                <div className={styles.formDivider} aria-hidden="true">
                  <span>ou</span>
                </div>
              </section>
            ) : null}

            {quickWorkspaces.length > 0 ? (
              <section className={styles.quickAccess} aria-labelledby="quick-access-title">
                <div>
                  <strong id="quick-access-title">Changer d’espace</strong>
                  <p>Explorez PlanetLS depuis l’espace que vous souhaitez découvrir.</p>
                </div>
                <div className={styles.quickAccessButtons}>
                  {quickWorkspaces.map((workspace) => (
                    <Button
                      key={workspace.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={preparingWorkspace !== null || loading}
                      aria-busy={preparingWorkspace === workspace.key}
                      aria-pressed={selectedWorkspace === workspace.key}
                      className={selectedWorkspace === workspace.key ? styles.workspaceSelected : undefined}
                      onClick={() => void prepareWorkspaceCredentials(workspace.key)}
                    >
                      <span className={styles.workspaceOption}>
                        <Image
                          src={`/images/workspaces/${workspacePresentation[workspace.key].image}.png`}
                          alt=""
                          width={112}
                          height={112}
                          className={styles.workspaceIllustration}
                        />
                        <span className={styles.workspaceText}>
                          <span className={styles.workspaceName}>
                            {workspacePresentation[workspace.key].label}
                          </span>
                          <span className={styles.workspaceDescription}>
                            {preparingWorkspace === workspace.key
                              ? "Préparation…"
                              : workspacePresentation[workspace.key].description}
                          </span>
                        </span>
                        {selectedWorkspace === workspace.key ? (
                          <span className={styles.workspaceCheck} aria-hidden="true">✓</span>
                        ) : null}
                      </span>
                    </Button>
                  ))}
                </div>
                {quickLoginMessage ? (
                  <p className={styles.quickAccessMessage} role="status">
                    {selectedWorkspace ? (
                      <span>✓ Espace {workspacePresentation[selectedWorkspace].label} sélectionné</span>
                    ) : null}
                    <span>{quickLoginMessage}</span>
                  </p>
                ) : null}
              </section>
            ) : null}

            <label htmlFor="email" className={styles.fieldLabel}>
              Email
            </label>
            <div className={styles.inputWrapper}>
              <Input
                bare
                suppressHydrationWarning
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                required
                autoComplete="email"
                className={errors.email ? styles.inputError : styles.input}
              />
              {formData.email && (
                <span className={styles.validationIcon}>
                  {errors.email ? <FaTimesCircle color="#e74c3c" /> : <FaCheckCircle color="#2ecc71" />}
                </span>
              )}
              {errors.email && (
                <small role="alert" className={styles.errorMsg}>
                  {errors.email}
                </small>
              )}
            </div>

            <label htmlFor="password" className={styles.fieldLabel}>
              Mot de passe
            </label>
            <div className={styles.passwordInputWrapper}>
              <Input
                bare
                ref={passwordRef}
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="Votre mot de passe"
                aria-invalid={!!errors.password}
                required
                minLength={8}
                autoComplete="current-password"
                className={errors.password ? styles.inputError : styles.input}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className={styles.passwordToggle}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </Button>
            </div>
            {errors.password && (
              <small role="alert" className={styles.errorMsg}>
                {errors.password}
              </small>
            )}

            {errors.auth && (
              <div role="alert" className={`${styles.errorMsg} ${styles.authError}`}>
                {errors.auth}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!canSubmit() || loading}
              className={styles.submitButton}
              aria-busy={loading}
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
