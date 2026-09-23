"use client";

import React, { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FaCheckCircle, FaEye, FaEyeSlash, FaMapMarkerAlt, FaTimesCircle, FaUser } from "react-icons/fa";
import { Button, Input } from "@/components/ui";
import OnboardingStepHeader from "@/app/components/onboarding/OnboardingStepHeader/OnboardingStepHeader";
import useReadabilityScale from "@/app/components/onboarding/useReadabilityScale";
import { trackOnboardingEvent } from "@/app/lib/onboardingAnalytics";
import Confetti from "../components/ui/Confetti/Confetti";
import styles from "./CompleteRegistrationPage.module.scss";

const ONBOARDING_TOTAL_STEPS = 2;
const FINAL_STEP = 2;

interface AccountFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface GeocodeLookupPayload {
  error?: string;
  label?: string;
}

const PASSWORD_RULES = [
  { key: "length", label: "Au moins 8 caractères", test: (value: string) => value.length >= 8 },
  { key: "uppercase", label: "Une lettre majuscule", test: (value: string) => /[A-Z]/.test(value) },
  { key: "lowercase", label: "Une lettre minuscule", test: (value: string) => /[a-z]/.test(value) },
  { key: "number", label: "Un chiffre", test: (value: string) => /[0-9]/.test(value) },
  {
    key: "special",
    label: "Un caractère spécial",
    test: (value: string) => /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(value),
  },
];

const BENEFITS: Record<string, Array<{ title: string; text: string }>> = {
  proprietaire: [
    { title: "Votre espace personnel", text: "Retrouvez vos logements, demandes et échanges au même endroit." },
    { title: "Des partenaires adaptés", text: "PlanetLS vous aide à vous connecter selon votre besoin et votre secteur." },
    { title: "Un profil évolutif", text: "Complétez vos services recherchés, préférences et informations quand vous le souhaitez." },
  ],
  concierge: [
    { title: "Votre espace personnel", text: "Retrouvez vos missions, logements et échanges au même endroit." },
    { title: "Des partenaires adaptés", text: "PlanetLS vous aide à vous connecter selon votre activité et votre secteur." },
    { title: "Un profil évolutif", text: "Complétez vos services, disponibilités et préférences quand vous le souhaitez." },
  ],
  artisan: [
    { title: "Votre espace personnel", text: "Retrouvez vos interventions, demandes et échanges au même endroit." },
    { title: "Des partenaires adaptés", text: "PlanetLS vous aide à vous connecter selon votre métier et votre secteur." },
    { title: "Un profil évolutif", text: "Complétez vos services, disponibilités et préférences quand vous le souhaitez." },
  ],
};

const getDashboardPathFromCategory = (category: string): string => {
  switch (category) {
    case "concierge":
      return "/dashboard/concierge";
    case "artisan":
      return "/dashboard/provider";
    case "proprietaire":
    default:
      return "/dashboard/owner";
  }
};

const formatCategoryLabel = (category: string): string => {
  switch (category) {
    case "proprietaire":
      return "Propriétaire";
    case "concierge":
      return "Concierge";
    case "artisan":
      return "Artisan";
    default:
      return category || "Profil";
  }
};

const validatePassword = (password: string): string => {
  if (password.length < 8) return "Minimum 8 caractères";
  if (!/[A-Z]/.test(password)) return "1 majuscule requise";
  if (!/[a-z]/.test(password)) return "1 minuscule requise";
  if (!/[0-9]/.test(password)) return "1 chiffre requis";
  if (!/[!@#$%^&*(),.?\":{}|<>_\-+=]/.test(password)) return "1 caractère spécial requis";
  return "";
};

export default function CompleteRegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInitialized = useRef(false);
  const { readabilityScale, setReadabilityScale } = useReadabilityScale();

  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [form, setForm] = useState<AccountFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [locationError, setLocationError] = useState("");

  const hasRegistrationContext = Boolean(
    (searchParams.get("category") || category) && (searchParams.get("location") || location),
  );
  const benefits = BENEFITS[category] ?? BENEFITS.proprietaire;

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    setCategory(searchParams.get("category") ?? "");
    setLocation(searchParams.get("location") ?? "");
  }, [searchParams]);

  const handleFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(value),
        confirmPassword:
          form.confirmPassword && form.confirmPassword !== value
            ? "Les mots de passe ne correspondent pas"
            : "",
      }));
    }

    if (name === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: value !== form.password ? "Les mots de passe ne correspondent pas" : "",
      }));
    }
  };

  const canSubmit =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.email.trim().length > 0 &&
    validatePassword(form.password) === "" &&
    !errors.password &&
    !errors.confirmPassword &&
    form.password === form.confirmPassword;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setLocationError("");

    let resolvedLocation = location.trim();

    try {
      const geocodeResponse = await fetch(`/api/geocode?q=${encodeURIComponent(resolvedLocation)}`);
      const geocodePayload = (await geocodeResponse.json()) as GeocodeLookupPayload;

      if (!geocodeResponse.ok || typeof geocodePayload.label !== "string") {
        throw new Error(
          geocodePayload.error || "Veuillez sélectionner une ville reconnue pour finaliser l'inscription.",
        );
      }

      resolvedLocation = geocodePayload.label;
      if (resolvedLocation !== location) {
        setLocation(resolvedLocation);
      }
    } catch (error) {
      setLocationError(
        error instanceof Error
          ? error.message
          : "Veuillez sélectionner une ville reconnue pour finaliser l'inscription.",
      );
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        location: resolvedLocation,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      trackOnboardingEvent({
        step: FINAL_STEP,
        category,
        action: "onboarding_account_creation_failed",
        metadata: { reason: data.error || "unknown" },
      });
      alert(data.error || "Erreur lors de l'inscription");
      setLoading(false);
      return;
    }

    setShowConfetti(true);

    const loginResult = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (loginResult?.error) {
      setLoading(false);
      trackOnboardingEvent({
        step: FINAL_STEP,
        category,
        action: "onboarding_auto_login_failed",
        metadata: {},
      });
      alert("Compte créé, mais la connexion automatique a échoué. Merci de vous connecter manuellement.");
      router.replace("/login");
      return;
    }

    trackOnboardingEvent({
      step: FINAL_STEP,
      category,
      action: "onboarding_account_created",
      metadata: { location: resolvedLocation },
    });
    router.replace(getDashboardPathFromCategory(category));
  };

  if (!hasRegistrationContext) {
    return (
      <div className={styles.pageContainer}>
        <OnboardingStepHeader
          title="Inscription guidée"
          step={1}
          totalSteps={ONBOARDING_TOTAL_STEPS}
          progressPercent={0}
          readabilityScale={readabilityScale}
          onReadabilityChange={setReadabilityScale}
        />

        <section className={styles.recapSection}>
          <h1 className={styles.title}>Commencez par choisir votre parcours</h1>
          <p className={styles.recapMuted}>
            Pour éviter un compte incomplet, reprenez depuis le choix du profil et de la ville.
          </p>
          <div className={styles.recapActions}>
            <Button type="button" variant="primary" size="lg" onClick={() => router.push("/parcours")}>
              Choisir mon parcours
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => router.push("/home")}>
              Revenir à l'accueil
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {showConfetti && <Confetti />}

      <OnboardingStepHeader
        title="Étape 2/2"
        step={FINAL_STEP}
        totalSteps={ONBOARDING_TOTAL_STEPS}
        progressPercent={100}
        isFinalStep
        readabilityScale={readabilityScale}
        onReadabilityChange={setReadabilityScale}
      />

      <header className={styles.onboardingHeader}>
        <p className={styles.stepKicker}>Création du compte</p>
        <h1 className={styles.title}>Créez votre compte PlanetLS</h1>
        <p className={styles.subtitle}>Plus qu'une étape pour accéder à votre espace.</p>
      </header>

      <section className={styles.journeySummary} aria-label="Votre parcours">
        <h2 className={styles.journeyTitle}>Votre parcours</h2>
        {locationError ? <p className={styles.locationError}>{locationError}</p> : null}
        <span className={styles.journeyTag}>
          <FaUser /> {formatCategoryLabel(category)}
        </span>
        <span className={styles.journeyTag}>
          <FaMapMarkerAlt /> {location || "Ville à définir"}
        </span>
        <button type="button" className={styles.modifyButton} onClick={() => router.back()}>
          Modifier
        </button>
      </section>

      <div className={styles.accountLayout}>
        <form onSubmit={handleSubmit} className={styles.accountForm}>
          <section className={styles.formSection}>
            <h2 className={styles.formSectionTitle}>Vos informations</h2>
            <div className={styles.nameFields}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Prénom *</span>
                <Input
                  bare
                  name="firstName"
                  placeholder="Votre prénom"
                  value={form.firstName}
                  onChange={handleFormChange}
                  autoComplete="given-name"
                  required
                  className={styles.fieldInput}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Nom *</span>
                <Input
                  bare
                  name="lastName"
                  placeholder="Votre nom"
                  value={form.lastName}
                  onChange={handleFormChange}
                  autoComplete="family-name"
                  required
                  className={styles.fieldInput}
                />
              </label>
            </div>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Adresse e-mail *</span>
              <Input
                bare
                name="email"
                type="email"
                placeholder="exemple@votreemail.fr"
                value={form.email}
                onChange={handleFormChange}
                autoComplete="email"
                required
                className={styles.fieldInput}
              />
              <span className={styles.fieldHint}>Cette adresse sera utilisée pour vous connecter.</span>
            </label>
          </section>

          <section className={styles.formSection}>
            <h2 className={styles.formSectionTitle}>Votre mot de passe</h2>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Mot de passe *</span>
              <div className={styles.passwordWrapper}>
                <Input
                  bare
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Minimum 8 caractères"
                  value={form.password}
                  onChange={handleFormChange}
                  autoComplete="new-password"
                  required
                  className={styles.fieldInput}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </div>
            </label>

            <ul className={styles.passwordRules} aria-label="Règles du mot de passe">
              {PASSWORD_RULES.map((rule) => {
                const valid = rule.test(form.password);
                return (
                  <li key={rule.key} className={valid ? styles.validRule : ""}>
                    <FaCheckCircle aria-hidden="true" /> {rule.label}
                  </li>
                );
              })}
            </ul>

            {errors.password && (
              <small className={styles.errorMsg}>
                <FaTimesCircle /> {errors.password}
              </small>
            )}

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Confirmer le mot de passe *</span>
              <div className={styles.passwordWrapper}>
                <Input
                  bare
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Répétez votre mot de passe"
                  value={form.confirmPassword}
                  onChange={handleFormChange}
                  autoComplete="new-password"
                  required
                  className={styles.fieldInput}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowConfirmPassword((value) => !value)}>
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </div>
            </label>

            {errors.confirmPassword && (
              <small className={styles.errorMsg}>
                <FaTimesCircle /> {errors.confirmPassword}
              </small>
            )}
          </section>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!canSubmit || loading}
            className={styles.submitButton}
          >
            {loading ? "Inscription..." : "Finaliser mon inscription"}
          </Button>
        </form>

        <aside className={styles.sideReassurance} aria-label="Informations rassurantes">
          <h2 className={styles.sideReassuranceTitle}>Presque prêt !</h2>
          <p className={styles.sideReassuranceText}>
            Votre compte sera créé en quelques instants. Vous pourrez ensuite compléter votre profil à votre rythme.
          </p>
          <div className={styles.benefitList}>
            {benefits.map((benefit) => (
              <div key={benefit.title} className={styles.benefit}>
                <span aria-hidden="true">
                  <FaCheckCircle />
                </span>
                <div>
                  <strong className={styles.benefitTitle}>{benefit.title}</strong>
                  <p className={styles.benefitText}>{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
