"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  // FaSave,
} from "react-icons/fa";

import AvatarUpload from "../components/ui/AvatarUpload/AvatarUpload";
import Confetti from "../components/ui/Confetti/Confetti";
import ExperiencePopup, {
  ExperienceLevel,
} from "../components/popups/ExperiencePopup/ExperiencePopup";

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

  experienceLevel: ExperienceLevel | "";
  yearsExperience: string;
}

interface AccountFormData {
  username: string;
  password: string;
  confirmPassword: string;
}

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

  // --------------------------------------------------------------------------
  // INIT FROM URL
  // --------------------------------------------------------------------------

  useEffect(() => {
    setProfile({
      category: searchParams.get("category") ?? "",
      searchTarget: searchParams.get("searchTarget") ?? "",
      option: searchParams.get("option") ?? "",
      location: searchParams.get("location") ?? "",

      firstName: searchParams.get("firstName") ?? "",
      lastName: searchParams.get("lastName") ?? "",
      email: searchParams.get("email") ?? "",
      phone: searchParams.get("phone") ?? "",
      additionalInfo: searchParams.get("additionalInfo") ?? "",

      experienceLevel:
        (searchParams.get("experienceLevel") as ExperienceLevel) ?? "",
      yearsExperience: searchParams.get("yearsExperience") ?? "",
    });
  }, [searchParams]);

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  // const handleProfileChange = (
  //   e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  // ) => {
  //   const { name, value } = e.target;
  //   setProfile((prev) => ({ ...prev, [name]: value }));
  // };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(value),
      }));
    }

    if (name === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword:
          value !== form.password
            ? "Les mots de passe ne correspondent pas"
            : "",
      }));
    }
  };

  // --------------------------------------------------------------------------
  // EXPERIENCE POPUP
  // --------------------------------------------------------------------------

  const handleExperienceValidate = async (
    level: ExperienceLevel,
    years: string
  ) => {
    setProfile((prev) => ({
      ...prev,
      experienceLevel: level,
      yearsExperience: years,
    }));

    await fetch("/api/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experience_level: level,
        years_experience: years,
      }),
    });

    setShowExperiencePopup(false);
  };

  // --------------------------------------------------------------------------
  // AVATAR
  // --------------------------------------------------------------------------

  const handleAvatarChange = async (file: File | null) => {
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/profiles/avatar", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    if (data?.url) {
      setUploadedAvatarUrl(data.url);
    }
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

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.username,
        password: form.password,
        avatar_url: uploadedAvatarUrl,

        first_name: profile.firstName,
        last_name: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        additional_info: profile.additionalInfo,

        category: profile.category,
        search_target: profile.searchTarget,
        option: profile.option,
        location: profile.location,

        experience_level: profile.experienceLevel,
        years_experience: profile.yearsExperience,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erreur lors de l'inscription");
      setLoading(false);
      return;
    }

    setShowConfetti(true);

    await signIn("credentials", {
      email: profile.email,
      password: form.password,
      redirect: false,
    });

    router.replace("/dashboard/owner");
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div className={styles.pageContainer}>
      {showConfetti && <Confetti />}

      <h1 className={styles.title}>Dernière étape avant de commencer</h1>
{/* RÉCAP */}
<section className={styles.recapSection}>
  <h2>🧾 Récapitulatif de votre demande</h2>

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
      <p>
        {profile.firstName} {profile.lastName}
      </p>
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
  </div>
</section>

      {/* PROFIL */}
      <section className={styles.section}>
        <h2>👤 Profil professionnel</h2>

        <p><strong>Type :</strong> {profile.category}</p>
        <p><strong>Recherche :</strong> {profile.searchTarget}</p>
        <p><strong>Localisation :</strong> {profile.location}</p>

        <div className={styles.experienceBlock}>
          <strong>Expérience</strong>

          {profile.experienceLevel ? (
            <p>
              {profile.yearsExperience} —{" "}
              <span className={styles.experienceBadge}>
                {profile.experienceLevel}
              </span>
            </p>
          ) : (
            <p>Aucune expérience renseignée</p>
          )}

          <button
            type="button"
            className={styles.editButton}
            onClick={() => setShowExperiencePopup(true)}
          >
            <FaEdit /> Modifier mon expérience
          </button>
        </div>
      </section>

      {/* AVATAR */}
      <section className={styles.avatarSection}>
        <h3>📷 Photo de profil</h3>
        <AvatarUpload
          value={avatarFile}
          existingUrl={
            uploadedAvatarUrl ??
            avatarPreview ??
            DEFAULT_AVATAR_URL
          }
          isEditing
          onChange={handleAvatarChange}
        />
      </section>

      {/* FORM */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>🔐 Création du compte</h2>

        <input
          name="username"
          placeholder="Nom d'utilisateur"
          value={form.username}
          onChange={handleFormChange}
          required
        />

        <div className={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={handleFormChange}
            required
          />
          <button type="button" onClick={() => setShowPassword(v => !v)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {errors.password && (
          <small className={styles.errorMsg}>
            <FaTimesCircle /> {errors.password}
          </small>
        )}

        <div className={styles.passwordWrapper}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirmation"
            value={form.confirmPassword}
            onChange={handleFormChange}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(v => !v)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {!errors.confirmPassword && form.confirmPassword && (
          <small className={styles.successMsg}>
            <FaCheckCircle /> Les mots de passe correspondent
          </small>
        )}

        {errors.confirmPassword && (
          <small className={styles.errorMsg}>
            <FaTimesCircle /> {errors.confirmPassword}
          </small>
        )}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className={styles.submitButton}
        >
          {loading ? "Inscription..." : "Finaliser mon inscription"}
        </button>
      </form>

      {showExperiencePopup && (
        <ExperiencePopup
          onClose={() => setShowExperiencePopup(false)}
          onValidate={handleExperienceValidate}
        />
      )}
    </div>
  );
}
