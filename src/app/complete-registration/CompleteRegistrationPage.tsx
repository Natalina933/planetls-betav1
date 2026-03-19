"use client";

import dynamic from "next/dynamic";
import React, { useState, useEffect, ChangeEvent, FormEvent, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle, FaEdit } from "react-icons/fa";
import { Button, Input } from "@/components/ui";

import AvatarUpload from "@/components/ui/AvatarUpload/AvatarUpload";
import ExperiencePopup, { ExperienceLevel } from "@/components/popups/ExperiencePopup/ExperiencePopup";

import styles from "./CompleteRegistrationPage.module.scss";

const DEFAULT_AVATAR_URL = "/icons/account-svgrepo-com.svg";
const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";
const Confetti = dynamic(() => import("@/components/ui/Confetti/Confetti"), { ssr: false });

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

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

const USERNAME_ERROR_ID = "register-username-error";
const PASSWORD_ERROR_ID = "register-password-error";
const PASSWORD_HELP_ID = "register-password-help";
const CONFIRM_PASSWORD_ERROR_ID = "register-confirm-password-error";
const CAPTCHA_ERROR_ID = "register-captcha-error";

const validatePassword = (password: string): string => {
  if (password.length < 8) return "Minimum 8 caractères";
  if (!/[A-Z]/.test(password)) return "1 majuscule requise";
  if (!/[a-z]/.test(password)) return "1 minuscule requise";
  if (!/[0-9]/.test(password)) return "1 chiffre requis";
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password)) {
    return "1 caractère spécial requis";
  }
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
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReady, setCaptchaReady] = useState(false);

  const captchaContainerRef = useRef<HTMLDivElement | null>(null);
  const captchaWidgetIdRef = useRef<string | null>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

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
      experienceLevel: (searchParams.get("experienceLevel") as ExperienceLevel) || "",
      yearsExperience: searchParams.get("yearsExperience") || "",
    }));
  }, [searchParams]);

  useEffect(() => {
    if (!turnstileSiteKey) return;

    const renderCaptcha = () => {
      if (!window.turnstile || !captchaContainerRef.current || captchaWidgetIdRef.current) {
        return;
      }

      captchaWidgetIdRef.current = window.turnstile.render(captchaContainerRef.current, {
        sitekey: turnstileSiteKey,
        theme: "auto",
        callback: (token) => {
          setCaptchaToken(token);
          setErrors((prev) => ({ ...prev, captcha: "" }));
        },
        "expired-callback": () => {
          setCaptchaToken(null);
          setErrors((prev) => ({ ...prev, captcha: "Le captcha a expiré. Veuillez recommencer." }));
        },
        "error-callback": () => {
          setCaptchaToken(null);
          setErrors((prev) => ({ ...prev, captcha: "Le captcha n'a pas pu être validé." }));
        },
      });
      setCaptchaReady(true);
    };

    if (window.turnstile) {
      renderCaptcha();
      return;
    }

    let script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    const handleLoad = () => renderCaptcha();

    if (!script) {
      script = document.createElement("script");
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", handleLoad);
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", handleLoad);
    }

    return () => {
      script?.removeEventListener("load", handleLoad);
    };
  }, [turnstileSiteKey]);

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

  const canSubmit =
    form.username.length >= 3 &&
    !errors.password &&
    !errors.confirmPassword &&
    form.password === form.confirmPassword &&
    (!turnstileSiteKey || Boolean(captchaToken));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (turnstileSiteKey && !captchaToken) {
      setErrors((prev) => ({ ...prev, captcha: "Veuillez valider le captcha." }));
      return;
    }
    if (!canSubmit) return;

    setLoading(true);

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
        additional_info: profile.additionalInfo,
        category: profile.category,
        search_target: profile.searchTarget,
        option: profile.option,
        location: profile.location,
        experienceLevel:
          profile.experienceLevel === "peu_importe" ? null : profile.experienceLevel,
        yearsExperience: profile.yearsExperience,
        captchaToken,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      if (turnstileSiteKey && window.turnstile && captchaWidgetIdRef.current) {
        window.turnstile.reset(captchaWidgetIdRef.current);
        setCaptchaToken(null);
      }
      alert(data.error || "Erreur lors de l’inscription");
      setLoading(false);
      return;
    }

    setShowConfetti(true);
    setRegistrationComplete(true);
    setLoading(false);
  };

  if (registrationComplete) {
    return (
      <div className={styles.pageContainer}>
        {showConfetti && <Confetti />}
        <section className={styles.successPanel} aria-live="polite">
          <h1 className={styles.title}>Inscription presque terminée</h1>
          <p className={styles.successLead}>
            Votre compte a bien été créé. Vérifiez maintenant votre boîte email pour confirmer
            votre adresse avant de vous connecter.
          </p>
          <div className={styles.successChecklist}>
            <p>
              <strong>Email de vérification :</strong> {profile.email}
            </p>
            <p>1. Ouvrez l&apos;email envoyé par PlanetLs.</p>
            <p>2. Cliquez sur le lien de vérification.</p>
            <p>3. Revenez ensuite vous connecter.</p>
          </div>
          <div className={styles.successActions}>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className={styles.submitButton}
              onClick={() => router.push("/login")}
            >
              Aller à la connexion
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className={styles.secondaryButton}
              onClick={() => router.push("/home")}
            >
              Retour a l&apos;accueil
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {showConfetti && <Confetti />}

      <h1 className={styles.title}>Dernière étape avant de commencer</h1>

      <section className={styles.recapSection}>
        <h2>Récapitulatif de votre demande</h2>
        <div className={styles.recapGrid}>
          <div>
            <strong>Catégorie</strong>
            <p>{profile.category || "-"}</p>
          </div>
          <div>
            <strong>Recherche</strong>
            <p>{profile.searchTarget || "-"}</p>
          </div>
          <div>
            <strong>Option</strong>
            <p>{profile.option || "-"}</p>
          </div>
          <div>
            <strong>Localisation</strong>
            <p>{profile.location || "-"}</p>
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
                ? `${profile.yearsExperience} - ${profile.experienceLevel}`
                : "Non renseignée"}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Profil professionnel</h2>

        <p>
          <strong>Type :</strong> {profile.category}
        </p>
        <p>
          <strong>Recherche :</strong> {profile.searchTarget}
        </p>
        <p>
          <strong>Localisation :</strong> {profile.location}
        </p>

        <div className={styles.experienceBlock}>
          <strong>Expérience</strong>
          {profile.experienceLevel ? (
            <p>
              {profile.yearsExperience} -{" "}
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

      <section className={styles.avatarSection}>
        <h3>Photo de profil</h3>
        <AvatarUpload
          value={avatarFile}
          existingUrl={uploadedAvatarUrl ?? avatarPreview ?? DEFAULT_AVATAR_URL}
          isEditing
          onChange={handleAvatarChange}
        />
      </section>

      <form onSubmit={handleSubmit} className={styles.form} noValidate aria-labelledby="account-form-title">
        <h2 id="account-form-title">Création du compte</h2>

        <label htmlFor="register-username" className={styles.visuallyHidden}>
          Nom d&apos;utilisateur
        </label>
        <Input
          bare
          id="register-username"
          name="username"
          placeholder="Nom d'utilisateur"
          value={form.username}
          onChange={handleFormChange}
          autoComplete="username"
          aria-invalid={form.username.length > 0 && form.username.length < 3}
          aria-describedby={form.username.length > 0 && form.username.length < 3 ? USERNAME_ERROR_ID : undefined}
          aria-errormessage={
            form.username.length > 0 && form.username.length < 3 ? USERNAME_ERROR_ID : undefined
          }
          required
        />
        {form.username.length > 0 && form.username.length < 3 ? (
          <small id={USERNAME_ERROR_ID} role="alert" className={styles.errorMsg}>
            <FaTimesCircle /> Minimum 3 caractères pour le nom d&apos;utilisateur
          </small>
        ) : null}

        <div className={styles.passwordWrapper}>
          <label htmlFor="register-password" className={styles.visuallyHidden}>
            Mot de passe
          </label>
          <Input
            bare
            id="register-password"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={handleFormChange}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? `${PASSWORD_HELP_ID} ${PASSWORD_ERROR_ID}` : PASSWORD_HELP_ID}
            aria-errormessage={errors.password ? PASSWORD_ERROR_ID : undefined}
            required
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword((v) => !v)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </Button>
        </div>
        <small id={PASSWORD_HELP_ID} className={styles.helperText}>
          Minimum 8 caractères, avec majuscule, minuscule, chiffre et caractère spécial.
        </small>

        {errors.password ? (
          <small id={PASSWORD_ERROR_ID} role="alert" className={styles.errorMsg}>
            <FaTimesCircle /> {errors.password}
          </small>
        ) : null}

        <div className={styles.passwordWrapper}>
          <label htmlFor="register-confirm-password" className={styles.visuallyHidden}>
            Confirmation du mot de passe
          </label>
          <Input
            bare
            id="register-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirmation"
            value={form.confirmPassword}
            onChange={handleFormChange}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? CONFIRM_PASSWORD_ERROR_ID : undefined}
            aria-errormessage={errors.confirmPassword ? CONFIRM_PASSWORD_ERROR_ID : undefined}
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

        {form.confirmPassword && !errors.confirmPassword ? (
          <small className={styles.successMsg}>
            <FaCheckCircle /> Les mots de passe correspondent
          </small>
        ) : null}

        {errors.confirmPassword ? (
          <small id={CONFIRM_PASSWORD_ERROR_ID} role="alert" className={styles.errorMsg}>
            <FaTimesCircle /> {errors.confirmPassword}
          </small>
        ) : null}

        {turnstileSiteKey ? (
          <div className={styles.captchaBlock}>
            <div ref={captchaContainerRef} className={styles.captchaWidget} />
            {!captchaReady ? (
              <small className={styles.captchaHint}>
                Chargement de la vérification de sécurité...
              </small>
            ) : null}
            {errors.captcha ? (
              <small id={CAPTCHA_ERROR_ID} role="alert" className={styles.errorMsg}>
                <FaTimesCircle /> {errors.captcha}
              </small>
            ) : null}
          </div>
        ) : null}

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

      {showExperiencePopup ? (
        <ExperiencePopup
          category={profile.category}
          onClose={() => setShowExperiencePopup(false)}
          onValidate={handleExperienceValidate}
        />
      ) : null}
    </div>
  );
}
