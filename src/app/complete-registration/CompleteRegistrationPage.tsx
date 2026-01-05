// src/app/complete-registration/CompleteRegistrationPage.tsx
"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaSave,
} from "react-icons/fa";

import AvatarUpload from "../components/ui/AvatarUpload/AvatarUpload";
import Confetti from "../components/ui/Confetti/Confetti";
import styles from "./CompleteRegistrationPage.module.scss";

const DEFAULT_AVATAR_URL = "/icons/account-svgrepo-com.svg";

// ============================================================================
// INTERFACES
// ============================================================================

interface QueryData {
  category: string;
  searchTarget: string;
  option: string;
  location: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  additionalInfo: string;
}

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  avatar: File | null;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

// ============================================================================
// HELPERS & VALIDATION
// ============================================================================

const validatePassword = (password: string): string => {
  if (password.length < 8) return "Minimum 8 caractères requis";
  if (!/[A-Z]/.test(password)) return "Au moins 1 majuscule requise";
  if (!/[a-z]/.test(password)) return "Au moins 1 minuscule requise";
  if (!/[0-9]/.test(password)) return "Au moins 1 chiffre requis";
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password)) {
    return "Au moins 1 caractère spécial requis";
  }
  return "";
};

const getPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password)) score++;

  const levels: PasswordStrength[] = [
    { label: "Très faible", color: "#e74c3c", score: 0 },
    { label: "Faible", color: "#e67e22", score: 1 },
    { label: "Moyen", color: "#f39c12", score: 2 },
    { label: "Bon", color: "#3498db", score: 3 },
    { label: "Fort", color: "#2ecc71", score: 4 },
    { label: "Très fort", color: "#27ae60", score: 5 },
  ];

  return levels[Math.min(score, 5)];
};

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePhone = (phone: string): boolean =>
  /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(
    phone
  );

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({
  password,
}) => {
  const strength = getPasswordStrength(password);

  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "4px",
              backgroundColor: i < strength.score ? strength.color : "#ddd",
              borderRadius: "2px",
              transition: "background-color 0.3s",
            }}
          />
        ))}
      </div>
      {password && (
        <small
          style={{
            color: strength.color,
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          {strength.label}
        </small>
      )}
    </div>
  );
};

interface InputWithValidationProps {
  id: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  isValid?: boolean;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}

const InputWithValidation: React.FC<InputWithValidationProps> = ({
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  isValid,
  required,
  minLength,
  autoComplete,
}) => {
  const getInputClass = () => {
    if (!value) return styles.input;
    if (error) return `${styles.input} ${styles.inputError}`;
    if (isValid) return `${styles.input} ${styles.inputValid}`;
    return styles.input;
  };

  return (
    <div className={styles.inputWrapper}>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={getInputClass()}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        aria-label={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {value && (
        <span className={styles.validationIcon}>
          {error ? (
            <FaTimesCircle color="#e74c3c" />
          ) : isValid ? (
            <FaCheckCircle color="#2ecc71" />
          ) : null}
        </span>
      )}
      {error && (
        <small id={`${id}-error`} className={styles.errorMsg} role="alert">
          {error}
        </small>
      )}
    </div>
  );
};

// ============================================================================
// HOOK: Rate Limiting
// ============================================================================

const useRateLimit = (limit: number, windowMs: number) => {
  const [attempts, setAttempts] = useState<number[]>([]);

  const canAttempt = (): boolean => {
    const now = Date.now();
    const recentAttempts = attempts.filter((time) => now - time < windowMs);
    setAttempts(recentAttempts);
    return recentAttempts.length < limit;
  };

  const recordAttempt = () => {
    setAttempts((prev) => [...prev, Date.now()]);
  };

  return { canAttempt, recordAttempt };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CompleteRegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // États principaux
  const [showConfetti, setShowConfetti] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Données de requête
  const [queryData, setQueryData] = useState<QueryData>({
    category: "",
    searchTarget: "",
    option: "",
    location: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    additionalInfo: "",
  });

  const [editableData, setEditableData] = useState<QueryData>({ ...queryData });

  // Formulaire d'inscription
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    confirmPassword: "",
    avatar: null,
  });
  // états en haut du composant
  const [avatarSaveMessage, setAvatarSaveMessage] = useState<string | null>(null);

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(
    null
  );

  // Visibilité des mots de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Erreurs
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Rate limiting
  const { canAttempt, recordAttempt } = useRateLimit(3, 60000);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Chargement des paramètres URL
  useEffect(() => {
    const data: QueryData = {
      category: searchParams.get("category") || "",
      searchTarget: searchParams.get("searchTarget") || "",
      option: searchParams.get("option") || "",
      location: searchParams.get("location") || "",
      firstName: searchParams.get("firstName") || "",
      lastName: searchParams.get("lastName") || "",
      email: searchParams.get("email") || "",
      phone: searchParams.get("phone") || "",
      additionalInfo: searchParams.get("additionalInfo") || "",
    };
    setQueryData(data);
    setEditableData(data);
  }, [searchParams]);

  // Nettoyage de l'URL de preview avatar
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  // Warning avant de quitter la page
  useEffect(() => {
    const hasFilledForm = formData.username || formData.password;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasFilledForm && !showConfetti) {
        e.preventDefault();
        e.returnValue = "Vos modifications seront perdues. Continuer ?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, showConfetti]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleEditChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditableData((prev) => ({ ...prev, [name]: value }));

    let error = "";
    if (name === "email" && value && !validateEmail(value)) {
      error = "Email invalide";
    }
    if (name === "phone" && value && !validatePhone(value)) {
      error = "Numéro de téléphone invalide";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    let error = "";
    if (name === "username") {
      if (value.length > 0 && value.length < 3) {
        error = "Nom d'utilisateur : minimum 3 caractères";
      } else if (value.length > 0 && !/^[a-zA-Z0-9\-_]+$/.test(value)) {
        error =
          "Utilisez seulement lettres, chiffres, tirets (-) et underscores (_)";
      }
    }
    if (name === "password") {
      error = validatePassword(value);
    }
    if (name === "confirmPassword" && value !== formData.password) {
      error = "Les mots de passe ne correspondent pas";
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleAvatarChange = async (file: File | null) => {
    if (!file) {
      setFormData((prev) => ({ ...prev, avatar: null }));
      setAvatarPreviewUrl(null);
      setUploadedAvatarUrl(null);
      setErrors((prev) => ({ ...prev, avatar: "" }));
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Fichier trop volumineux (max 5MB)",
      }));
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Format non autorisé (JPEG, PNG, WEBP)",
      }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl(previewUrl);
    setErrors((prev) => ({ ...prev, avatar: "" }));

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("userId", queryData.email || "unknown");

      const response = await fetch("/api/profiles/avatar", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Erreur upload");
      }

      setUploadedAvatarUrl(data.url);
      setFormData((prev) => ({ ...prev, avatar: file }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        avatar:
          err instanceof Error
            ? `Erreur lors de l'upload: ${err.message}`
            : "Erreur inconnue",
      }));
      setUploadedAvatarUrl(null);
    }
  };
  const handleAvatarSave = () => {
    // Cette fonction peut être utilisée pour des actions supplémentaires lors de la sauvegarde de l'avatar
    // on considère que le dernier fichier choisi + uploadé est validé
    // on désactive juste la zone d’édition si besoin
    // par ex. repasser le formulaire en mode non-édition
    // ou ne rien faire si tu veux garder isEditing global
    setIsEditing(false); // on repasse en mode « lecture » pour le profil
    setAvatarSaveMessage("✅ Modifications de l'avatar enregistrées.");

    // Message temporaire 3s
    setTimeout(() => setAvatarSaveMessage(null), 3000);
  };

  const handleSaveEdit = () => {
    const emailValid =
      !editableData.email || validateEmail(editableData.email);
    const phoneValid =
      !editableData.phone || validatePhone(editableData.phone);

    if (!emailValid || !phoneValid) {
      alert("⚠️ Corrigez les erreurs avant de sauvegarder");
      return;
    }

    setQueryData(editableData);
    setIsEditing(false);
  };

  const canSubmit = (): boolean =>
    formData.username.trim().length >= 3 &&
    validatePassword(formData.password) === "" &&
    formData.password === formData.confirmPassword &&
    Object.values(errors).every((err) => err === "");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!canSubmit()) {
      alert("⚠️ Veuillez corriger les erreurs avant de continuer");
      return;
    }

    if (!canAttempt()) {
      alert("⏳ Trop de tentatives. Veuillez patienter 1 minute.");
      return;
    }

    recordAttempt();
    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        avatar_url: uploadedAvatarUrl,
        category: queryData.category,
        firstName: editableData.firstName,
        lastName: editableData.lastName,
        email: editableData.email,
        phone: editableData.phone,
        additionalInfo: editableData.additionalInfo,
        location: queryData.location,
        option: queryData.option,
        searchTarget: queryData.searchTarget,
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.error) {
        if (
          data.error.includes("duplicate key") &&
          data.error.includes("profiles_username_key")
        ) {
          setErrors((prev) => ({
            ...prev,
            username: "Ce nom d'utilisateur est déjà pris",
          }));
        } else if (
          data.error.includes("email") ||
          data.error.includes("authError")
        ) {
          setErrors((prev) => ({
            ...prev,
            email:
              "Cet email est déjà utilisé ou une erreur de création est survenue",
          }));
        } else {
          alert(`❌ ${data.error}`);
        }
        setLoading(false);
        return;
      }

      if (data.success) {
        setSuccessMessage(
          "✅ Inscription réussie ! Redirection vers votre dashboard..."
        );
        setShowConfetti(true);

        const loginResult = await signIn("credentials", {
          redirect: false,
          email: editableData.email,
          password: formData.password,
        });

        if (loginResult?.ok && !loginResult.error) {
          const sessionResponse = await fetch("/api/auth/session");
          const sessionData = await sessionResponse.json();

          const userRole = String(
            sessionData?.user?.role || data.user.role
          )
            .trim()
            .toLowerCase();
          const baseRole = userRole.split("_")[0];

          let targetRoleFolder = "owner";
          switch (baseRole) {
            case "concierge":
              targetRoleFolder = "concierge";
              break;
            case "provider":
            case "artisan":
              targetRoleFolder = baseRole;
              break;
            case "admin":
            case "super":
              targetRoleFolder = "admin";
              break;
            default:
              targetRoleFolder = "owner";
          }

          router.replace(`/dashboard/${targetRoleFolder}`);
        } else {
          router.replace("/login?success=true");
        }
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? `❌ ${err.message}`
          : "❌ Erreur serveur. Réessayez."
      );
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={styles.pageContainer}>
      {showConfetti && <Confetti />}

      {successMessage && (
        <div className={styles.successBanner} role="alert">
          {successMessage}
        </div>
      )}

      <h1 className={styles.title}>Finalisez votre inscription</h1>

      {/* RÉCAPITULATIF */}
      <section className={styles.summary}>
        <h2>📋 Récapitulatif de votre recherche</h2>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <strong>Je suis :</strong>
            <span>{queryData.category || "—"}</span>
          </div>
          <div className={styles.summaryItem}>
            <strong>Je recherche :</strong>
            <span>{queryData.searchTarget || "—"}</span>
          </div>
          <div className={styles.summaryItem}>
            <strong>Localisation :</strong>
            <span>{queryData.location || "—"}</span>
          </div>
        </div>

        {queryData.option && (
          <div className={styles.services}>
            <strong>🔍 Services proposés :</strong>
            <ul>
              {(() => {
                try {
                  const options = JSON.parse(queryData.option);
                  return Array.isArray(options)
                    ? options.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))
                    : queryData.option
                      .split(",")
                      .map((s, i) => <li key={i}>{s.trim()}</li>);
                } catch {
                  const parts = queryData.option
                    .split(/,(?![^(]*\))/)
                    .map((s) => s.trim());
                  return parts.map((s, i) => <li key={i}>{s}</li>);
                }
              })()}
            </ul>
          </div>
        )}

        <hr className={styles.divider} />

        {/* PROFIL & COORDONNÉES */}
        <div className={styles.profileHeader}>
          <h2>👤 Profil & Coordonnées</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className={styles.editButton}
              type="button"
              aria-label="Modifier mes informations"
            >
              <FaEdit /> Modifier
            </button>
          ) : (
            <button
              onClick={handleSaveEdit}
              className={styles.saveButton}
              type="button"
              aria-label="Sauvegarder les modifications"
            >
              <FaSave /> Enregistrer
            </button>
          )}
        </div>

        {isEditing && (
          <div className={styles.editModeBadge}>✏️ Mode édition activé</div>
        )}

        <div className={styles.profileGrid}>
          {[
            {
              key: "firstName",
              label: "Prénom",
              type: "text",
              autocomplete: "given-name",
            },
            {
              key: "lastName",
              label: "Nom",
              type: "text",
              autocomplete: "family-name",
            },
            {
              key: "email",
              label: "Email",
              type: "email",
              autocomplete: "email",
            },
            {
              key: "phone",
              label: "Téléphone",
              type: "tel",
              autocomplete: "tel",
            },
          ].map(({ key, label, type, autocomplete }) => (
            <div key={key} className={styles.profileField}>
              <strong>{label} :</strong>
              {isEditing ? (
                <InputWithValidation
                  id={key}
                  name={key}
                  type={type}
                  value={editableData[key as keyof QueryData]}
                  onChange={handleEditChange}
                  placeholder={`Entrez votre ${label.toLowerCase()}`}
                  error={errors[key]}
                  isValid={
                    key === "email"
                      ? editableData.email.length > 0 &&
                      validateEmail(editableData.email)
                      : key === "phone"
                        ? editableData.phone.length > 0 &&
                        validatePhone(editableData.phone)
                        : editableData[key as keyof QueryData].length > 0
                  }
                  autoComplete={autocomplete}
                />
              ) : (
                <span>{queryData[key as keyof QueryData] || "—"}</span>
              )}
            </div>
          ))}

          <div
            className={styles.profileField}
            style={{ gridColumn: "1 / -1" }}
          >
            <strong>Informations complémentaires :</strong>
            {isEditing ? (
              <textarea
                name="additionalInfo"
                value={editableData.additionalInfo}
                onChange={handleEditChange}
                placeholder="Décrivez vos besoins spécifiques..."
                className={styles.textarea}
                rows={4}
              />
            ) : (
              <span>{queryData.additionalInfo || "—"}</span>
            )}
          </div>
        </div>

        {/* AVATAR */}
        <div className={styles.avatarSection}>
          <h3>📷 Photo de profil</h3>
          <AvatarUpload
            value={formData.avatar}
            existingUrl={
              uploadedAvatarUrl ?? avatarPreviewUrl ?? DEFAULT_AVATAR_URL
            }
            isEditing={isEditing}
            onChange={handleAvatarChange}
            onSave={handleAvatarSave}
          />

          {errors.avatar && (
            <small className={styles.errorMsg}>{errors.avatar}</small>
          )}
          {avatarSaveMessage && (
            <small className={styles.successMsg}>{avatarSaveMessage}</small>
          )}
          {uploadedAvatarUrl && (
            <small className={styles.successMsg}>
              ✅ Avatar uploadé avec succès
            </small>
          )}
        </div>
      </section>

      {/* FORMULAIRE INSCRIPTION */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>🔐 Création de votre compte</h2>

        <label htmlFor="username">Nom d&apos;utilisateur *</label>
        <InputWithValidation
          id="username"
          name="username"
          value={formData.username}
          onChange={handleFormChange}
          placeholder="Choisissez un identifiant unique"
          error={errors.username}
          isValid={formData.username.length >= 3}
          required
          minLength={3}
          autoComplete="username"
        />

        <label htmlFor="password">Mot de passe *</label>
        <div className={styles.passwordInputWrapper}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleFormChange}
            placeholder="Créez un mot de passe sécurisé"
            className={errors.password ? styles.inputError : styles.input}
            required
            minLength={8}
            autoComplete="new-password"
            aria-label="Mot de passe"
          />
          <button
            type="button"
            className={styles.passwordToggle}
            aria-label={
              showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
            }
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {errors.password && (
          <small className={styles.errorMsg}>{errors.password}</small>
        )}
        <PasswordStrengthIndicator password={formData.password} />

        <label htmlFor="confirmPassword">
          Confirmation du mot de passe *
        </label>
        <div className={styles.passwordInputWrapper}>
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleFormChange}
            placeholder="Confirmez votre mot de passe"
            className={
              errors.confirmPassword ? styles.inputError : styles.input
            }
            required
            minLength={8}
            autoComplete="new-password"
            aria-label="Confirmation mot de passe"
          />
          <button
            type="button"
            className={styles.passwordToggle}
            aria-label={
              showConfirmPassword
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
            onClick={() => setShowConfirmPassword((v) => !v)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {errors.confirmPassword && (
          <small className={styles.errorMsg}>
            {errors.confirmPassword}
          </small>
        )}
        {formData.confirmPassword &&
          !errors.confirmPassword &&
          formData.password === formData.confirmPassword && (
            <small className={styles.successMsg}>
              ✅ Les mots de passe correspondent
            </small>
          )}

        <button
          type="submit"
          disabled={!canSubmit() || loading}
          className={styles.submitButton}
          aria-busy={loading}
        >
          {loading
            ? "⏳ Inscription en cours..."
            : "🚀 Finaliser mon inscription"}
        </button>

        {!canSubmit() && formData.username && (
          <div className={styles.infoMsg}>
            <strong>ℹ️ Veuillez compléter :</strong>
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
              {formData.username.trim().length < 3 && (
                <li>
                  Nom d&apos;utilisateur valide (min. 3 caractères)
                </li>
              )}
              {validatePassword(formData.password) !== "" && (
                <li>
                  Mot de passe sécurisé (8 chars, maj, min, chiffre,
                  spécial)
                </li>
              )}
              {formData.password !== formData.confirmPassword && (
                <li>Confirmation du mot de passe identique</li>
              )}
              {Object.entries(errors).map(
                ([key, error]) =>
                  error && <li key={key}>{error}</li>
              )}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}
