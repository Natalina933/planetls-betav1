"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle, FaEdit } from "react-icons/fa";
import { Button, Input } from "@/components/ui";

import AvatarUpload from "../components/ui/AvatarUpload/AvatarUpload";
import Confetti from "../components/ui/Confetti/Confetti";
import ExperiencePopup, { ExperienceLevel } from "../components/popups/ExperiencePopup/ExperiencePopup";

import styles from "./CompleteRegistrationPage.module.scss";

const DEFAULT_AVATAR_URL = "/icons/account-svgrepo-com.svg";

// ============================================================================
// TYPES
// ============================================================================

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
    creation: "Je demarre mon activite",
    micro_entreprise: "Micro-entreprise",
    societe: "Societe deja creee",
    particulier: "Particulier / complement d'activite",
    temps_plein: "Temps plein",
    temps_partiel: "Temps partiel",
    soirs_weekends: "Soirs et week-ends",
    sur_demande: "Sur demande selon les missions",
    ponctuelles: "Missions ponctuelles",
    regulieres: "Contrats reguliers",
    les_deux: "Missions ponctuelles et contrats reguliers",
    simple: "Mode simple",
    business: "Mode business",
    premieres_missions: "Trouver mes premieres missions",
    complement_revenu: "Completer mes revenus",
    structurer_activite: "Structurer mon activite de conciergerie",
    developper_portefeuille: "Developper mon portefeuille clients",
    guidage_simple: "Guidage simple pour bien demarrer",
    modeles_outils: "Modeles, tarifs et outils de gestion",
    missions_qualifiees: "Priorite aux demandes qualifiees",
    autonome: "Je suis autonome",
  };

  return labels[value] ?? value;
};

// ============================================================================
// HELPERS
// ============================================================================

const validatePassword = (password: string): string => {
  if (password.length < 8) return "Minimum 8 caractères";
  if (!/[A-Z]/.test(password)) return "1 majuscule requise";
  if (!/[a-z]/.test(password)) return "1 minuscule requise";
  if (!/[0-9]/.test(password)) return "1 chiffre requis";
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password))
    return "1 caractère spécial requis";
  return "";
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function CompleteRegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInitialized = useRef(false);

  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------

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
  const [showConfetti, setShowConfetti] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [locationError, setLocationError] = useState("");
  const [readabilityMode, setReadabilityMode] = useState(false);


  // --------------------------------------------------------------------------
  // INIT FROM URL (une seule fois)
  // --------------------------------------------------------------------------

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
      experienceLevel: (searchParams.get("experienceLevel") as ExperienceLevel) || "",
      yearsExperience: searchParams.get("yearsExperience") || "",
    }));
  }, [searchParams]);

  useEffect(() => {
    const enabled = window.localStorage.getItem("planetls-readability-mode") === "1";
    setReadabilityMode(enabled);
  }, []);

  useEffect(() => {
    document.body.dataset.readability = readabilityMode ? "on" : "off";
    window.localStorage.setItem("planetls-readability-mode", readabilityMode ? "1" : "0");

    return () => {
      document.body.dataset.readability = "off";
    };
  }, [readabilityMode]);

  // --------------------------------------------------------------------------
  // FORM HANDLERS
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // EXPERIENCE POPUP
  // --------------------------------------------------------------------------

  // Popup expérience
  const handleExperienceValidate = (level: ExperienceLevel, years: string) => {
    setProfile((prev) => ({
      ...prev,
      experienceLevel: level,
      yearsExperience: years,
    }));
    setShowExperiencePopup(false);
  };

  // --------------------------------------------------------------------------
  // AVATAR HANDLER
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // SUBMIT
  // --------------------------------------------------------------------------

  const canSubmit =
    form.username.length >= 3 &&
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
          geocodePayload.error || "Veuillez sélectionner une ville reconnue pour finaliser l'inscription.",
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
          : "Veuillez sélectionner une ville reconnue pour finaliser l'inscription.",
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
      alert("Compte créé, mais la connexion automatique a échoué. Merci de vous connecter manuellement.");
      router.replace("/login");
      return;
    }

    const targetPath = getDashboardPathFromCategory(profile.category);
    router.replace(targetPath);

  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div className={styles.pageContainer}>
      {showConfetti && <Confetti />}

      <div className={styles.onboardingMeta}>
        <span className={styles.stepIndicator}>Etape 5/5 - Creation du compte</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={readabilityMode ? styles.readabilityActive : styles.readabilityButton}
          onClick={() => setReadabilityMode((value) => !value)}
        >
          Lisibilite +
        </Button>
      </div>

      <h1 className={styles.title}>Dernière étape avant de commencer</h1>

      {/* RÉCAP */}
      <section className={styles.recapSection}>
        <h2>🧾 Récapitulatif de votre demande</h2>
        {locationError ? <p className={styles.locationError}>{locationError}</p> : null}
        <div className={styles.recapGrid}>
          <div>
            <strong>Catégorie</strong>
            <p>{profile.category || "—"}</p>
          </div>
          <div>
            <strong>Recherche</strong>
            <p>{profile.searchTarget || "—"}</p>
          </div>
          <div>
            <strong>Option</strong>
            <p>{profile.option || "—"}</p>
          </div>
          <div>
            <strong>Localisation</strong>
            <p>{profile.location || "—"}</p>
          </div>
          <div>
            <strong>Nom</strong>
            <p>{profile.firstName} {profile.lastName}</p>
          </div>
          <div>
            <strong>Email</strong>
            <p>{profile.email}</p>
          </div>
          <div>
            <strong>Expérience</strong>
            <p>
              {profile.experienceLevel
                ? `${profile.yearsExperience} — ${profile.experienceLevel}`
                : "Non renseignée"}
            </p>
          </div>
          {profile.category === "concierge" && (
            <>
              <div>
                <strong>Structure</strong>
                <p>{profile.companyName || "A preciser"}</p>
              </div>
              <div>
                <strong>Statut</strong>
                <p>{profile.legalForm ? formatChoice(profile.legalForm) : "A preciser"}</p>
              </div>
              <div>
                <strong>Rayon</strong>
                <p>{profile.serviceRadiusKm ? `${profile.serviceRadiusKm} km` : "A preciser"}</p>
              </div>
              <div>
                <strong>Disponibilite</strong>
                <p>{profile.availability ? formatChoice(profile.availability) : "A definir"}</p>
              </div>
              <div>
                <strong>Collaboration</strong>
                <p>
                  {profile.missionPreference
                    ? formatChoice(profile.missionPreference)
                    : "Ouverte aux opportunites"}
                </p>
              </div>
              <div>
                <strong>Parcours</strong>
                <p>{formatChoice(profile.signupMode || "simple")}</p>
              </div>
              <div>
                <strong>Objectif</strong>
                <p>{profile.onboardingGoal ? formatChoice(profile.onboardingGoal) : "A preciser"}</p>
              </div>
              <div>
                <strong>Accompagnement</strong>
                <p>{profile.supportNeed ? formatChoice(profile.supportNeed) : "A definir"}</p>
              </div>
              {profile.signupMode === "business" && (
                <>
                  <div>
                    <strong>Outils</strong>
                    <p>{profile.existingTools.length ? profile.existingTools.join(", ") : "A connecter plus tard"}</p>
                  </div>
                  <div>
                    <strong>Lien pro</strong>
                    <p>{profile.businessLink || "A ajouter plus tard"}</p>
                  </div>
                </>
              )}
              <div>
                <strong>Biens geres</strong>
                <p>{profile.propertyTypes.length ? profile.propertyTypes.join(", ") : "A preciser"}</p>
              </div>
            </>
          )}
        </div>
      </section>

      {profile.category === "concierge" && (
        <section className={styles.nextActionsSection}>
          <h2>Apres inscription, choisissez votre premiere action</h2>
          <div className={styles.nextActionsGrid}>
            <div>
              <strong>Creer un bien</strong>
              <p>Ajoutez votre premier logement ou une zone de mission proche.</p>
            </div>
            <div>
              <strong>Creer une offre</strong>
              <p>Transformez vos services en packs simples a proposer.</p>
            </div>
            <div>
              <strong>Inviter un proprietaire</strong>
              <p>Retrouvez vite vos premiers contacts dans l&apos;espace concierge.</p>
            </div>
          </div>
        </section>
      )}

      {/* PROFIL PRO */}
      <section className={styles.section}>
        <h2>👤 Profil professionnel</h2>

        <p><strong>Type :</strong> {profile.category}</p>
        <p><strong>Recherche :</strong> {profile.searchTarget}</p>
        <p><strong>Localisation :</strong> {profile.location}</p>
        {profile.category === "concierge" && (
          <ul className={styles.profileList}>
            <li><strong>Structure :</strong> {profile.companyName || "A preciser"}</li>
            <li><strong>Statut :</strong> {profile.legalForm ? formatChoice(profile.legalForm) : "A preciser"}</li>
            <li><strong>Zone :</strong> {profile.serviceRadiusKm ? `${profile.location} + ${profile.serviceRadiusKm} km` : profile.location}</li>
            <li><strong>Disponibilite :</strong> {profile.availability ? formatChoice(profile.availability) : "A definir"}</li>
            <li><strong>Collaboration :</strong> {profile.missionPreference ? formatChoice(profile.missionPreference) : "Ouverte aux opportunites"}</li>
            <li><strong>Parcours :</strong> {formatChoice(profile.signupMode || "simple")}</li>
            <li><strong>Objectif :</strong> {profile.onboardingGoal ? formatChoice(profile.onboardingGoal) : "A preciser"}</li>
            <li><strong>Accompagnement :</strong> {profile.supportNeed ? formatChoice(profile.supportNeed) : "A definir"}</li>
            {profile.signupMode === "business" && (
              <>
                <li><strong>Outils :</strong> {profile.existingTools.length ? profile.existingTools.join(", ") : "A connecter plus tard"}</li>
                <li><strong>Lien pro :</strong> {profile.businessLink || "A ajouter plus tard"}</li>
              </>
            )}
            <li><strong>Types de biens :</strong> {profile.propertyTypes.length ? profile.propertyTypes.join(", ") : "A preciser"}</li>
          </ul>
        )}

        <div className={styles.experienceBlock}>
          <strong>Expérience</strong>
          {profile.experienceLevel ? (
            <p>
              {profile.yearsExperience} —{" "}
              <span className={styles.experienceBadge}>{profile.experienceLevel}</span>
            </p>
          ) : (
            <p>Aucune expérience renseignée</p>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className={styles.editButton}
            onClick={() => setShowExperiencePopup(true)}
          >
            <FaEdit /> Modifier mon expérience
          </Button>
        </div>
      </section>

      {/* AVATAR */}
      <section className={styles.avatarSection}>
        <h3>📷 Photo de profil</h3>
        <AvatarUpload
          value={avatarFile}
          existingUrl={uploadedAvatarUrl ?? avatarPreview ?? DEFAULT_AVATAR_URL}
          isEditing
          onChange={handleAvatarChange}
        />
      </section>

      {/* FORMULAIRE COMPTE */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>🔐 Création du compte</h2>

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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowConfirmPassword((v) => !v)}
          >
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

      {/* POPUP EXPERIENCE */}
      {showExperiencePopup && (
        <ExperiencePopup
          category={profile.category}
          onClose={() => setShowExperiencePopup(false)}
          onValidate={handleExperienceValidate}
        />
      )}
    </div>
  );
}
