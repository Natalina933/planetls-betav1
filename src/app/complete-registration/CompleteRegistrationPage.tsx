"use client";

import React, { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  FaBriefcase,
  FaBullseye,
  FaCheckCircle,
  FaClipboardList,
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaMapMarkerAlt,
  FaSearch,
  FaTimesCircle,
  FaTools,
  FaUser,
} from "react-icons/fa";
import { Button, Input } from "@/components/ui";
import OnboardingStepHeader from "@/app/components/onboarding/OnboardingStepHeader/OnboardingStepHeader";
import useReadabilityScale from "@/app/components/onboarding/useReadabilityScale";
import { trackOnboardingEvent } from "@/app/lib/onboardingAnalytics";

import AvatarUpload from "../components/ui/AvatarUpload/AvatarUpload";
import Confetti from "../components/ui/Confetti/Confetti";
import ExperiencePopup, { ExperienceLevel } from "../components/popups/ExperiencePopup/ExperiencePopup";
import CategoryPopup from "../components/popups/CategoryPopup/CategoryPopup";
import AccessPopup, { FormData as AccessFormData } from "../components/popups/AccessPopup/AccessPopup";
import styles from "./CompleteRegistrationPage.module.scss";

const DEFAULT_AVATAR_URL = "/icons/account-svgrepo-com.svg";
const ONBOARDING_TOTAL_STEPS = 5;
const FINAL_STEP = 5;

interface ProfileData {
  category: string;
  searchTarget: string;
  option: string;
  location: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  additionalInfo: string;
  companyName: string;
  legalForm: string;
  serviceRadiusKm: string;
  availability: string;
  missionPreference: string;
  signupMode: string;
  onboardingGoal: string;
  supportNeed: string;
  existingTools: string[];
  businessLink: string;
  propertyTypes: string[];
  propertyType: string;
  needVolume: string;
  tradeBody: string;
  startingPriceRange: string;
  firstRequestTemplate: string;
  experienceLevel: ExperienceLevel | "";
  yearsExperience: string;
}

interface AccountFormData {
  username: string;
  password: string;
  confirmPassword: string;
}

interface GeocodeLookupPayload {
  error?: string;
  label?: string;
}

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

const formatChoice = (value: string): string => {
  const labels: Record<string, string> = {
    creation: "Je d\u00e9marre mon activit\u00e9",
    micro_entreprise: "Micro-entreprise",
    societe: "Soci\u00e9t\u00e9 d\u00e9j\u00e0 cr\u00e9\u00e9e",
    particulier: "Particulier / compl\u00e9ment d'activit\u00e9",
    temps_plein: "Temps plein",
    temps_partiel: "Temps partiel",
    soirs_weekends: "Soirs et week-ends",
    sur_demande: "Sur demande selon les missions",
    ponctuelles: "Missions ponctuelles",
    regulieres: "Contrats r\u00e9guliers",
    les_deux: "Missions ponctuelles et contrats r\u00e9guliers",
    simple: "Mode simple",
    express: "Mode express",
    business: "Mode business",
    premieres_missions: "Trouver mes premi\u00e8res missions",
    complement_revenu: "Compl\u00e9ter mes revenus",
    structurer_activite: "Structurer mon activit\u00e9 de conciergerie",
    developper_portefeuille: "D\u00e9velopper mon portefeuille clients",
    guidage_simple: "Guidage simple pour bien d\u00e9marrer",
    modeles_outils: "Mod\u00e8les, tarifs et outils de gestion",
    missions_qualifiees: "Priorit\u00e9 aux demandes qualifi\u00e9es",
    autonome: "Je suis autonome",
    deleguer_location: "Déléguer la gestion locative",
    trouver_concierge: "Trouver une conciergerie fiable",
    securiser_interventions: "Sécuriser les interventions",
    optimiser_revenus: "Optimiser mes revenus",
    besoin_ponctuel: "Besoin ponctuel",
    suivi_regulier: "Suivi régulier",
    urgence_24h: "Urgences sous 24 h",
    interventions_planifiees: "Interventions planifiées",
    assurance_ok: "Assurance professionnelle à jour",
    assurance_a_preciser: "Assurance à préciser plus tard",
    gestion_complete: "Déléguer la gestion complète",
    comparer_concierges: "Comparer plusieurs concierges",
    occasionnel: "Occasionnel",
    regulier: "Régulier",
    saisonnier: "Saisonnier",
    urgent: "Besoin urgent",
    sur_devis: "Sur devis",
    moins_50: "Moins de 50 € / h",
    "50_80": "50 à 80 € / h",
    "80_plus": "80 € / h et +",
  };

  return labels[value] ?? value;
};

const formatCategoryLabel = (category: string): string => {
  switch (category) {
    case "proprietaire":
      return "Propri\u00e9taire";
    case "concierge":
      return "Conciergerie";
    case "artisan":
      return "Artisan";
    default:
      return category || "\u2014";
  }
};

const formatExperienceLevel = (level: string): string => {
  const labels: Record<string, string> = {
    debutant: "d\u00e9butant",
    intermediaire: "interm\u00e9diaire",
    experimente: "exp\u00e9riment\u00e9",
  };

  return labels[level] ?? level;
};

const getServicesLabel = (category: string): string => {
  return category === "proprietaire" ? "Services recherch\u00e9s" : "Services propos\u00e9s";
};

const getServicesList = (value: string): string[] => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const getProfileSummaryText = (profile: ProfileData): string => {
  const servicesCount = getServicesList(profile.option).length;

  switch (profile.category) {
    case "concierge":
      return `Vous avez un profil de conciergerie. Vous souhaitez rencontrer des propriétaires qui cherchent une équipe locale fiable${servicesCount > 0 ? " pour ces services" : ""}.`;
    case "proprietaire":
      return `Vous avez un profil de propriétaire. Vous recherchez une conciergerie capable de vous accompagner${servicesCount > 0 ? " sur les services sélectionnés" : ""}.`;
    case "artisan":
      return `Vous avez un profil d'artisan. Vous souhaitez recevoir des demandes de propriétaires ou de conciergeries ayant besoin d'un professionnel de confiance${servicesCount > 0 ? " pour vos prestations" : ""}.`;
    default:
      return "Votre profil est prêt à être présenté de façon claire avant validation.";
  }
};

const getSearchIntentText = (profile: ProfileData): string => {
  switch (profile.category) {
    case "concierge":
      return "Je souhaite rencontrer des propriétaires";
    case "artisan":
      return "Je souhaite recevoir des missions locales";
    case "proprietaire":
      return "Je recherche une conciergerie";
    default:
      return profile.searchTarget
        ? `Je souhaite collaborer avec ${formatCategoryLabel(profile.searchTarget).toLowerCase()}`
        : "Recherche à préciser";
  }
};

const getReadinessScore = (profile: ProfileData): number => {
  const checks = [
    profile.location,
    profile.option,
    profile.serviceRadiusKm,
    profile.missionPreference,
    profile.category === "proprietaire" ? profile.onboardingGoal : profile.availability || profile.supportNeed,
    profile.category === "artisan" ? profile.tradeBody : profile.propertyType || profile.propertyTypes.length > 0,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const getNextActions = (profile: ProfileData) => {
  switch (profile.category) {
    case "proprietaire":
      return [
        { title: "Envoyer ma première demande", text: "Votre demande peut être pré-remplie avec l'objectif choisi." },
        { title: "Comparer 3 concierges", text: "Repérez les profils proches de votre bien avant d'engager la conversation." },
        { title: "Ajouter mon bien", text: "Complétez le type de bien et le volume de besoin pour affiner le matching." },
      ];
    case "artisan":
      return [
        { title: "Publier mon profil", text: "Mettez en avant métier, zone, urgences et créneaux disponibles." },
        { title: "Préparer un devis type", text: "Gagnez du temps avec une réponse rapide pour les demandes fréquentes." },
        { title: "Ajouter mes preuves", text: "SIRET, assurance et photos rassurent les propriétaires et conciergeries." },
      ];
    case "concierge":
    default:
      return [
        { title: "Configurer mes services", text: "Transformez vos prestations en offres lisibles et faciles à demander." },
        { title: "Ajouter mon premier bien", text: "Ajoutez votre premier logement ou une zone de mission proche." },
        { title: "Répondre à une demande", text: "Retrouvez vite vos premières opportunités depuis l'espace concierge." },
      ];
  }
};

const validatePassword = (password: string): string => {
  if (password.length < 8) return "Minimum 8 caract\u00e8res";
  if (!/[A-Z]/.test(password)) return "1 majuscule requise";
  if (!/[a-z]/.test(password)) return "1 minuscule requise";
  if (!/[0-9]/.test(password)) return "1 chiffre requis";
  if (!/[!@#$%^&*(),.?\":{}|<>_\-+=]/.test(password)) return "1 caract\u00e8re sp\u00e9cial requis";
  return "";
};

export default function CompleteRegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInitialized = useRef(false);

  const [profile, setProfile] = useState<ProfileData>({
    category: "",
    searchTarget: "",
    option: "",
    location: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    additionalInfo: "",
    companyName: "",
    legalForm: "",
    serviceRadiusKm: "",
    availability: "",
    missionPreference: "",
    signupMode: "simple",
    onboardingGoal: "",
    supportNeed: "",
    existingTools: [],
    businessLink: "",
    propertyTypes: [],
    propertyType: "",
    needVolume: "",
    tradeBody: "",
    startingPriceRange: "",
    firstRequestTemplate: "",
    experienceLevel: "",
    yearsExperience: "",
  });

  const [form, setForm] = useState<AccountFormData>({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showExperiencePopup, setShowExperiencePopup] = useState(false);
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [showAccessPopup, setShowAccessPopup] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showMobileAccountPopup, setShowMobileAccountPopup] = useState(false);
  const [mobileAccountPopupDismissed, setMobileAccountPopupDismissed] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [avatarScale, setAvatarScale] = useState(1);
  const [avatarOffsetX, setAvatarOffsetX] = useState(0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(0);
  const [avatarRotation, setAvatarRotation] = useState(0);
  const [locationError, setLocationError] = useState("");
  const accountFormRef = useRef<HTMLFormElement | null>(null);
  const { readabilityScale, setReadabilityScale } = useReadabilityScale();
  const hasOnboardingContext = Boolean(
    (searchParams.get("category") || profile.category) &&
      (searchParams.get("location") || profile.location) &&
      (searchParams.get("email") || profile.email)
  );

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    setProfile((prev) => ({
      ...prev,
      category: searchParams.get("category") ?? "",
      searchTarget: searchParams.get("searchTarget") ?? "",
      option: searchParams.get("option") ?? "",
      location: searchParams.get("location") ?? "",
      firstName: searchParams.get("firstName") ?? "",
      lastName: searchParams.get("lastName") ?? "",
      email: searchParams.get("email") ?? "",
      phone: searchParams.get("phone") ?? "",
      additionalInfo: searchParams.get("additionalInfo") ?? "",
      companyName: searchParams.get("companyName") ?? "",
      legalForm: searchParams.get("legalForm") ?? "",
      serviceRadiusKm: searchParams.get("serviceRadiusKm") ?? "",
      availability: searchParams.get("availability") ?? "",
      missionPreference: searchParams.get("missionPreference") ?? "",
      signupMode: searchParams.get("signupMode") ?? "simple",
      onboardingGoal: searchParams.get("onboardingGoal") ?? "",
      supportNeed: searchParams.get("supportNeed") ?? "",
      existingTools: (searchParams.get("existingTools") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      businessLink: searchParams.get("businessLink") ?? "",
      propertyTypes: (searchParams.get("propertyTypes") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      propertyType: searchParams.get("propertyType") ?? "",
      needVolume: searchParams.get("needVolume") ?? "",
      tradeBody: searchParams.get("tradeBody") ?? "",
      startingPriceRange: searchParams.get("startingPriceRange") ?? "",
      firstRequestTemplate: searchParams.get("firstRequestTemplate") ?? "",
      experienceLevel: (searchParams.get("experienceLevel") as ExperienceLevel) || "",
      yearsExperience: searchParams.get("yearsExperience") || "",
    }));
  }, [searchParams]);

  useEffect(() => {
    if (profile.category !== "concierge" || profile.serviceRadiusKm) return;
    setProfile((prev) => ({ ...prev, serviceRadiusKm: "15" }));
  }, [profile.category, profile.serviceRadiusKm]);

  useEffect(() => {
    const accountForm = accountFormRef.current;
    if (!accountForm || mobileAccountPopupDismissed) return;

    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const syncPopupState = () => {
      if (!mediaQuery.matches) {
        setShowMobileAccountPopup(false);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (mediaQuery.matches && entry.isIntersecting) {
          setShowMobileAccountPopup(true);
        }
      },
      { rootMargin: "0px 0px -38% 0px", threshold: 0.18 }
    );

    observer.observe(accountForm);
    syncPopupState();
    mediaQuery.addEventListener("change", syncPopupState);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", syncPopupState);
    };
  }, [mobileAccountPopupDismissed]);

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }

    if (name === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: value !== form.password ? "Les mots de passe ne correspondent pas" : "",
      }));
    }
  };

  const handleExperienceValidate = (level: ExperienceLevel, years: string) => {
    setProfile((prev) => ({
      ...prev,
      experienceLevel: level,
      yearsExperience: years,
    }));
    setShowExperiencePopup(false);
  };

  const handleServicesValidate = (selectedOptions: string[]) => {
    setProfile((prev) => ({
      ...prev,
      option: selectedOptions.join(","),
    }));
    setShowCategoryPopup(false);
  };

  const handleAccessValidate = (data: AccessFormData) => {
    setProfile((prev) => ({
      ...prev,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      additionalInfo: data.additionalInfo,
      companyName: data.companyName,
      legalForm: data.legalForm,
      serviceRadiusKm: data.serviceRadiusKm,
      availability: data.availability,
      missionPreference: data.missionPreference,
      signupMode: data.signupMode,
      onboardingGoal: data.onboardingGoal,
      supportNeed: data.supportNeed,
      existingTools: data.existingTools,
      businessLink: data.businessLink,
      propertyTypes: data.propertyTypes,
      propertyType: data.propertyType,
      needVolume: data.needVolume,
      tradeBody: data.tradeBody,
      startingPriceRange: data.startingPriceRange,
      firstRequestTemplate: data.firstRequestTemplate,
    }));
    setShowAccessPopup(false);
  };

  const handleAvatarChange = async (file: File | null) => {
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/profiles/avatar", { method: "POST", body: fd });
    const data = await res.json();

    if (data?.url) setUploadedAvatarUrl(data.url);
  };

  const handleAvatarRemove = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setUploadedAvatarUrl(null);
    setAvatarScale(1);
    setAvatarOffsetX(0);
    setAvatarOffsetY(0);
    setAvatarRotation(0);
  };

  const canSubmit =
    form.username.length >= 3 &&
    validatePassword(form.password) === "" &&
    !errors.password &&
    !errors.confirmPassword &&
    form.password === form.confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setLocationError("");

    let resolvedLocation = profile.location.trim();

    try {
      const geocodeResponse = await fetch(`/api/geocode?q=${encodeURIComponent(resolvedLocation)}`);
      const geocodePayload = (await geocodeResponse.json()) as GeocodeLookupPayload;

      if (!geocodeResponse.ok || typeof geocodePayload.label !== "string") {
        throw new Error(
          geocodePayload.error || "Veuillez s\u00e9lectionner une ville reconnue pour finaliser l'inscription."
        );
      }

      resolvedLocation = geocodePayload.label;
      if (resolvedLocation !== profile.location) {
        setProfile((prev) => ({ ...prev, location: resolvedLocation }));
      }
    } catch (error) {
      setLocationError(
        error instanceof Error
          ? error.message
          : "Veuillez s\u00e9lectionner une ville reconnue pour finaliser l'inscription."
      );
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.username,
        password: form.password,
        avatar_url: uploadedAvatarUrl,
        avatar_scale: avatarScale,
        avatar_offset_x: avatarOffsetX,
        avatar_offset_y: avatarOffsetY,
        avatar_rotation: avatarRotation,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        additionalInfo: profile.additionalInfo,
        companyName: profile.companyName,
        legalForm: profile.legalForm,
        serviceRadiusKm: profile.serviceRadiusKm,
        availability: profile.availability,
        missionPreference: profile.missionPreference,
        signupMode: profile.signupMode,
        onboardingGoal: profile.onboardingGoal,
        supportNeed: profile.supportNeed,
        existingTools: profile.existingTools,
        businessLink: profile.businessLink,
        propertyTypes: profile.propertyTypes,
        propertyType: profile.propertyType,
        needVolume: profile.needVolume,
        tradeBody: profile.tradeBody,
        startingPriceRange: profile.startingPriceRange,
        firstRequestTemplate: profile.firstRequestTemplate,
        category: profile.category,
        search_target: profile.searchTarget,
        option: profile.option,
        location: resolvedLocation,
        experienceLevel: profile.experienceLevel === "peu_importe" ? null : profile.experienceLevel,
        yearsExperience: profile.yearsExperience,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      trackOnboardingEvent({
        step: FINAL_STEP,
        category: profile.category,
        action: "onboarding_account_creation_failed",
        metadata: { reason: data.error || "unknown", signupMode: profile.signupMode },
      });
      alert(data.error || "Erreur lors de l'inscription");
      setLoading(false);
      return;
    }

    setShowConfetti(true);

    const loginResult = await signIn("credentials", {
      email: profile.email,
      password: form.password,
      redirect: false,
    });

    if (loginResult?.error) {
      setLoading(false);
      trackOnboardingEvent({
        step: FINAL_STEP,
        category: profile.category,
        action: "onboarding_auto_login_failed",
        metadata: { signupMode: profile.signupMode, onboardingVariant: profile.signupMode },
      });
      alert("Compte cr\u00e9\u00e9, mais la connexion automatique a \u00e9chou\u00e9. Merci de vous connecter manuellement.");
      router.replace("/login");
      return;
    }

    trackOnboardingEvent({
      step: FINAL_STEP,
      category: profile.category,
      action: profile.category === "concierge" ? "concierge_onboarding_step_completed" : "onboarding_account_created",
      metadata: {
        signupMode: profile.signupMode,
        onboardingVariant: profile.signupMode,
        onboardingGoal: profile.onboardingGoal,
        readinessScore: getReadinessScore(profile),
        timeToCompleteSeconds: null,
      },
    });
    router.replace(getDashboardPathFromCategory(profile.category));
  };

  const renderAccountFields = () => (
    <>
      <Input
        bare
        name="username"
        placeholder="Nom d'utilisateur"
        value={form.username}
        onChange={handleFormChange}
        autoComplete="username"
        required
      />

      <div className={styles.passwordWrapper}>
        <Input
          bare
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={handleFormChange}
          autoComplete="new-password"
          required
        />
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword((v) => !v)}>
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </Button>
      </div>

      {errors.password && (
        <small className={styles.errorMsg}><FaTimesCircle /> {errors.password}</small>
      )}
      {!errors.password && form.password && (
        <small className={styles.successMsg}><FaCheckCircle /> Mot de passe assez sÃ©curisÃ©</small>
      )}

      <div className={styles.passwordWrapper}>
        <Input
          bare
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          placeholder="Confirmation"
          value={form.confirmPassword}
          onChange={handleFormChange}
          autoComplete="new-password"
          required
        />
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowConfirmPassword((v) => !v)}>
          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
        </Button>
      </div>

      {form.confirmPassword && !errors.confirmPassword && (
        <small className={styles.successMsg}><FaCheckCircle /> Les mots de passe correspondent</small>
      )}

      {errors.confirmPassword && (
        <small className={styles.errorMsg}><FaTimesCircle /> {errors.confirmPassword}</small>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={!canSubmit || loading}
        className={styles.submitButton}
      >
        {loading ? "Inscription..." : "Finaliser mon inscription"}
      </Button>
    </>
  );

  if (!hasOnboardingContext) {
    return (
      <div className={styles.pageContainer}>
        <OnboardingStepHeader
          title={"Inscription guidée"}
          step={1}
          totalSteps={ONBOARDING_TOTAL_STEPS}
          progressPercent={0}
          readabilityScale={readabilityScale}
          onReadabilityChange={setReadabilityScale}
        />

        <section className={styles.recapSection}>
          <h1 className={styles.title}>Commencez par choisir votre parcours</h1>
          <p className={styles.recapMuted}>
            Cette page finalise un profil déjà préparé. Pour éviter un compte incomplet, reprenez
            depuis le choix de parcours puis laissez-vous guider jusqu&apos;à la création du compte.
          </p>
          <div className={styles.recapActions}>
            <Button type="button" variant="primary" size="lg" onClick={() => router.push("/parcours")}>
              Choisir mon parcours
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => router.push("/home")}>
              Revenir à l&apos;accueil
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
        title={"Étape 5/5 - Création du compte"}
        step={FINAL_STEP}
        totalSteps={ONBOARDING_TOTAL_STEPS}
        progressPercent={100}
        isFinalStep
        readabilityScale={readabilityScale}
        onReadabilityChange={setReadabilityScale}
      />

      <h1 className={styles.title}>{"Dernière étape avant de commencer"}</h1>

      {profile.category === "concierge" && (
        <p className={styles.localPromise}>
          Nous vous proposerons en priorité des missions proches de votre zone ({profile.serviceRadiusKm || "15"} km).
        </p>
      )}


      <section className={styles.avatarSection}>
        <h3>Aperçu de votre profil</h3>
        <div className={styles.avatarSectionLayout}>
          <div className={styles.avatarUploadPane}>
            <AvatarUpload
              value={avatarFile}
              existingUrl={uploadedAvatarUrl ?? avatarPreview ?? DEFAULT_AVATAR_URL}
              existingScale={avatarScale}
              existingOffsetX={avatarOffsetX}
              existingOffsetY={avatarOffsetY}
              existingRotation={avatarRotation}
              isEditing
              onChange={handleAvatarChange}
              onScaleChange={setAvatarScale}
              onOffsetChange={(x, y) => {
                setAvatarOffsetX(x);
                setAvatarOffsetY(y);
              }}
              onRotationChange={setAvatarRotation}
              onRemove={handleAvatarRemove}
            />
          </div>

          <div className={styles.avatarSummaryPane}>
            <div className={styles.recapBlock}>
              <div className={styles.recapBlockTitle}>
                <span className={styles.recapIcon}>
                  <FaUser />
                </span>
                <strong>Votre profil</strong>
              </div>

              {/* <p className={styles.recapMiniBadge}>Profil en construction ✨</p> */}

              <div className={styles.recapIdentityCopy}>
                <p className={styles.recapIdentityEyebrow}>J&apos;ai un profil de{" "}
                  {formatCategoryLabel(profile.category)}
                </p>

                <p className={styles.recapIdentityMeta}>{getSearchIntentText(profile)}</p>

                <p className={styles.recapIdentityMeta}>
                  {profile.location || "à définir"}
                </p>

                <p className={styles.recapIdentityMeta}>
                  {profile.experienceLevel
                    ? `${profile.yearsExperience} — ${formatExperienceLevel(profile.experienceLevel)}`
                    : "Expérience à préciser"}
                </p>

                <p className={styles.recapIdentityDescription}>
                  {getProfileSummaryText(profile)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className={styles.recapSection}>
        <h2>Votre profil avant validation</h2>
        {locationError ? <p className={styles.locationError}>{locationError}</p> : null}

        <div className={styles.recapTopline}>
          <span className={styles.recapPill}><FaBriefcase /> {formatCategoryLabel(profile.category)}</span>
          <span className={styles.recapPill}><FaSearch /> {formatCategoryLabel(profile.searchTarget)}</span>
          <span className={styles.recapPill}><FaMapMarkerAlt /> {profile.location || "à définir"}</span>
          <span className={styles.recapPill}><FaBullseye /> {profile.experienceLevel ? `${profile.yearsExperience} \u2014 ${formatExperienceLevel(profile.experienceLevel)}` : "Expérience à préciser"}</span>
        </div>

        <div className={styles.recapActions}>
          <Button type="button" variant="outline" size="sm" className={styles.editButton} onClick={() => setShowCategoryPopup(true)}>
            <FaEdit /> Modifier les services
          </Button>
          <Button type="button" variant="outline" size="sm" className={styles.editButton} onClick={() => setShowAccessPopup(true)}>
            <FaEdit /> {"Modifier les coordonn\u00e9es"}
          </Button>
          <Button type="button" variant="outline" size="sm" className={styles.editButton} onClick={() => setShowExperiencePopup(true)}>
            <FaEdit /> {"Modifier l'exp\u00e9rience"}
          </Button>
        </div>

        <div className={styles.recapCompact}>
          <div className={styles.recapBlock}>
            <div className={styles.recapBlockTitle}>
              <span className={styles.recapIcon}><FaUser /></span>
              <strong>{"Aperçu photo"}</strong>
            </div>
            <div className={styles.recapAvatarOnly}>
              <Image
                src={uploadedAvatarUrl ?? avatarPreview ?? DEFAULT_AVATAR_URL}
                alt="Photo de profil"
                className={styles.recapAvatar}
                width={72}
                height={72}
                style={{
                  transform: `translate(${avatarOffsetX}%, ${avatarOffsetY}%) scale(${avatarScale}) rotate(${avatarRotation}deg)`,
                  transformOrigin: "center",
                }}
              />
            </div>
          </div>

          <div className={styles.recapBlock}>
            <div className={styles.recapBlockTitle}>
              <span className={styles.recapIcon}><FaClipboardList /></span>
              <strong>{getServicesLabel(profile.category)}</strong>
            </div>
            {getServicesList(profile.option).length > 0 ? (
              <ul className={styles.serviceList}>
                {getServicesList(profile.option).map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.recapMuted}>Aucun service sélectionné pour le moment.</p>
            )}
          </div>

          {profile.category === "concierge" && (
            <div className={styles.recapBlock}>
              <div className={styles.recapBlockTitle}>
                <span className={styles.recapIcon}><FaTools /></span>
                <strong>{"Activité"}</strong>
              </div>
              <ul className={styles.detailList}>
                <li><span>Structure</span><strong>{profile.companyName || "à préciser"}</strong></li>
                <li><span>Parcours</span><strong>{formatChoice(profile.signupMode || "simple")}</strong></li>
                <li><span>Rayon</span><strong>{profile.serviceRadiusKm ? `${profile.serviceRadiusKm} km` : "à préciser"}</strong></li>
                <li><span>{"Disponibilité"}</span><strong>{profile.availability ? formatChoice(profile.availability) : "à préciser"}</strong></li>
                <li><span>Collaboration</span><strong>{profile.missionPreference ? formatChoice(profile.missionPreference) : "Ouverte aux opportunités"}</strong></li>
                <li><span>{"Biens gérés"}</span><strong>{profile.propertyTypes.length ? profile.propertyTypes.join(", ") : "à préciser"}</strong></li>
              </ul>
            </div>
          )}

          {profile.category === "proprietaire" && (
            <div className={styles.recapBlock}>
              <div className={styles.recapBlockTitle}>
                <span className={styles.recapIcon}><FaBullseye /></span>
                <strong>{"Votre projet"}</strong>
              </div>
              <ul className={styles.detailList}>
                <li><span>Objectif</span><strong>{profile.onboardingGoal ? formatChoice(profile.onboardingGoal) : "À préciser"}</strong></li>
                <li><span>Type de bien</span><strong>{profile.propertyType || "À préciser"}</strong></li>
                <li><span>Volume</span><strong>{profile.needVolume ? formatChoice(profile.needVolume) : "À définir"}</strong></li>
                <li><span>Besoin</span><strong>{profile.missionPreference ? formatChoice(profile.missionPreference) : "À définir"}</strong></li>
              </ul>
            </div>
          )}

          {profile.category === "artisan" && (
            <div className={styles.recapBlock}>
              <div className={styles.recapBlockTitle}>
                <span className={styles.recapIcon}><FaTools /></span>
                <strong>{"Profil mission"}</strong>
              </div>
              <ul className={styles.detailList}>
                <li><span>Métier</span><strong>{profile.tradeBody || "À définir"}</strong></li>
                <li><span>Zone</span><strong>{profile.serviceRadiusKm ? `${profile.serviceRadiusKm} km` : "À préciser"}</strong></li>
                <li><span>Urgences</span><strong>{profile.missionPreference ? formatChoice(profile.missionPreference) : "À définir"}</strong></li>
                <li><span>Confiance</span><strong>{profile.supportNeed ? formatChoice(profile.supportNeed) : "Assurance à préciser"}</strong></li>
                <li><span>Tarif</span><strong>{profile.startingPriceRange ? formatChoice(profile.startingPriceRange) : "Sur devis"}</strong></li>
              </ul>
            </div>
          )}
        </div>
      </section>
      <section className={styles.nextActionsSection}>
        <h2>{"Après inscription, choisissez votre première action"}</h2>
        <p className={styles.readinessText}>Profil prêt à recevoir des opportunités : {getReadinessScore(profile)}%</p>
        <div className={styles.nextActionsGrid}>
          {getNextActions(profile).map((action) => (
            <div key={action.title}>
              <strong>{action.title}</strong>
              <p>{action.text}</p>
            </div>
          ))}
        </div>
      </section>


      <form ref={accountFormRef} onSubmit={handleSubmit} className={styles.form}>
        <h2>{"Création du compte"}</h2>

        <Input
          bare
          name="username"
          placeholder="Nom d'utilisateur"
          value={form.username}
          onChange={handleFormChange}
          autoComplete="username"
          required
        />

        <div className={styles.passwordWrapper}>
          <Input
            bare
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={handleFormChange}
            autoComplete="new-password"
            required
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword((v) => !v)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </Button>
        </div>

        {errors.password && (
          <small className={styles.errorMsg}><FaTimesCircle /> {errors.password}</small>
        )}
        {!errors.password && form.password && (
          <small className={styles.successMsg}><FaCheckCircle /> Mot de passe assez sécurisé</small>
        )}

        <div className={styles.passwordWrapper}>
          <Input
            bare
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirmation"
            value={form.confirmPassword}
            onChange={handleFormChange}
            autoComplete="new-password"
            required
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowConfirmPassword((v) => !v)}>
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </Button>
        </div>

        {form.confirmPassword && !errors.confirmPassword && (
          <small className={styles.successMsg}><FaCheckCircle /> Les mots de passe correspondent</small>
        )}

        {errors.confirmPassword && (
          <small className={styles.errorMsg}><FaTimesCircle /> {errors.confirmPassword}</small>
        )}

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

      {showMobileAccountPopup && (
        <div className={styles.mobileAccountOverlay} role="dialog" aria-modal="true" aria-labelledby="mobile-account-title">
          <form onSubmit={handleSubmit} className={styles.mobileAccountSheet}>
            <div className={styles.mobileAccountHeader}>
              <div>
                <p>Derni&egrave;re action</p>
                <h2 id="mobile-account-title">Cr&eacute;ez votre compte</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowMobileAccountPopup(false);
                  setMobileAccountPopupDismissed(true);
                }}
                aria-label="Fermer la fenetre de creation du compte"
              >
                <FaTimesCircle />
              </Button>
            </div>
            {renderAccountFields()}
          </form>
        </div>
      )}

      {showExperiencePopup && (
        <ExperiencePopup
          category={profile.category}
          onClose={() => setShowExperiencePopup(false)}
          onValidate={handleExperienceValidate}
        />
      )}

      {showCategoryPopup && (
        <CategoryPopup
          category={profile.category}
          initialSelectedOptions={getServicesList(profile.option)}
          experienceLevel={profile.experienceLevel}
          signupMode={profile.signupMode}
          onboardingGoal={profile.onboardingGoal}
          onSignupModeChange={(signupMode) => {
            setProfile((prev) => ({ ...prev, signupMode }));
          }}
          onOnboardingGoalChange={(onboardingGoal) => {
            setProfile((prev) => ({ ...prev, onboardingGoal }));
          }}
          onClose={() => setShowCategoryPopup(false)}
          onNext={handleServicesValidate}
        />
      )}

      {showAccessPopup && (
        <AccessPopup
          selectedOptions={getServicesList(profile.option)}
          initialData={{
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phone: profile.phone,
            additionalInfo: profile.additionalInfo,
            companyName: profile.companyName,
            legalForm: profile.legalForm,
            serviceRadiusKm: profile.serviceRadiusKm,
            availability: profile.availability,
            missionPreference: profile.missionPreference,
            signupMode: profile.signupMode,
            onboardingGoal: profile.onboardingGoal,
            supportNeed: profile.supportNeed,
            existingTools: profile.existingTools,
            businessLink: profile.businessLink,
            propertyTypes: profile.propertyTypes,
            propertyType: profile.propertyType,
            needVolume: profile.needVolume,
            tradeBody: profile.tradeBody,
            startingPriceRange: profile.startingPriceRange,
            firstRequestTemplate: profile.firstRequestTemplate,
          }}
          recap={{
            category: profile.category,
            searchTarget: profile.searchTarget,
            location: profile.location,
            experienceLevel: profile.experienceLevel,
            yearsExperience: profile.yearsExperience,
          }}
          onBack={() => setShowAccessPopup(false)}
          onClose={() => setShowAccessPopup(false)}
          onValidate={handleAccessValidate}
        />
      )}
    </div>
  );
}
