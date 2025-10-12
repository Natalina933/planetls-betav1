"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AvatarUpload from "../components/ui/AvatarUpload/AvatarUpload";
import Confetti from "../components/ui/Confetti/Confetti";
import styles from "./CompleteRegistrationPage.module.scss";
import { FaEye, FaEyeSlash } from "react-icons/fa";

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

export default function CompleteRegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showConfetti, setShowConfetti] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  // Pour édition locale uniquement PROFILS & COORDONNÉES
  const [editableData, setEditableData] = useState<QueryData>({
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

  // Formulaire d'inscription
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    confirmPassword: "",
    avatar: null,
  });

  const [avatarUrlState, setAvatarUrlState] = useState<string | null>(null);


  // Show/hide password toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Gestion des erreurs simple (ajoute selon besoin)
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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

  // Edition uniquement champs profils & coordonnées
  const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditableData(prev => ({ ...prev, [name]: value }));
  };

  // Gestion formulaire inscription classique
  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validate(name, value);
  };

  const handleAvatarChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, avatar: file }));
    setAvatarUrlState(file ? URL.createObjectURL(file) : null);
  };

  // Validation simple
  const validate = (name: string, value: string) => {
    let message = "";
    if (name === "username" && value.trim().length < 3) message = "Nom d’utilisateur au moins 3 caractères.";
    if (name === "password" && value.length < 6) message = "Mot de passe au moins 6 caractères.";
    if (name === "confirmPassword" && value !== formData.password) message = "Mots de passe non identiques.";
    setErrors(prev => ({ ...prev, [name]: message }));
  };

  // Soumission finale inscription
  const canSubmit = () =>
    formData.username.trim().length >= 3 &&
    formData.password.length >= 6 &&
    formData.password === formData.confirmPassword &&
    Object.values(errors).every(err => err === "");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit()) {
      alert("⚠️ Corrigez les erreurs avant de continuer.");
      return;
    }
    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        avatar_url: avatarUrlState,
        ...editableData, // Envoi des profils & coordonnées édités LOCAL
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!data.error) {
        setShowConfetti(true);
        setTimeout(() => router.push("/dashboard"), 4500);
      } else {
        if (data.error.includes("duplicate key") && data.error.includes("profiles_username_key")) {
          setErrors(prev => ({ ...prev, username: "Ce nom d’utilisateur est déjà pris." }));
        } else {
          alert(data.error);
        }
      }

    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  // Passe ici en mode lecture (après édition sauvegardée localement)
  const handleSaveEdit = () => {
    setQueryData(editableData);
    setIsEditing(false);
  };

  return (
    <div className={styles.pageContainer}>
      {showConfetti && <Confetti />}

      <h1 className={styles.title}>Finalisez votre inscription</h1>

      <section className={styles.summary}>
        <h2>Récapitulatif</h2>
        <p>
          <strong>Je suis :</strong> {queryData.category || "—"}
          <br />
          <strong>Je recherche un :</strong> {queryData.searchTarget || "—"} à {queryData.location || "—"}.
        </p>

        <div className={styles.services}>
          <strong>Services recherchés :</strong>{" "}
          {queryData.option ? (
            <ul>
              {queryData.option.split(",").map((s, i) => <li key={i}>{s.trim()}</li>)}
            </ul>
          ) : "—"}
        </div>

        <hr />

        <h2>Profils & Coordonnées</h2>
        {["firstName", "lastName", "email", "phone", "additionalInfo"].map(name => (
          <p key={name}>
            <strong>{name === "firstName" ? "Prénom" : name === "lastName" ? "Nom" : name === "email" ? "Email" : name === "phone" ? "Téléphone" : "Besoin"} :</strong>{" "}
            {isEditing ? (
              <label>
                <input
                  name={name}
                  value={editableData[name as keyof QueryData]}
                  onChange={handleEditChange}
                  placeholder={`Entrez votre ${name}`}
                  title={name}
                  aria-label={name}
                />
              </label>
            ) : (
              queryData[name as keyof QueryData] || "—"
            )}
          </p>
        ))}

        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className={styles.editButton} type="button">
            Modifier mes informations
          </button>
        ) : (
          <button onClick={handleSaveEdit} className={styles.saveButton} type="button">
            Enregistrer les modifications
          </button>
        )}

        <div className={styles.avatarSection}>
          <h3>Photo de profil</h3>
          <AvatarUpload value={formData.avatar} onChange={handleAvatarChange} />
        </div>
      </section>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="username">Nom d’utilisateur*</label>
        <input
          id="username"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleFormChange}
          placeholder="Votre identifiant"
          title="Nom d'utilisateur"
          aria-label="Nom d'utilisateur"
          required
          minLength={3}
        />
        {errors.username && <small className={styles.errorMsg}>{errors.username}</small>}

        <label htmlFor="password">Mot de passe*</label>
        <div className={styles.passwordInputWrapper}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleFormChange}
            placeholder="Votre mot de passe"
            title="Mot de passe"
            aria-label="Mot de passe"
            required
            minLength={6}
          />
          <button
            type="button"
            className={styles.passwordToggle}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            onClick={() => setShowPassword(v => !v)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {errors.password && <small className={styles.errorMsg}>{errors.password}</small>}

        <label htmlFor="confirmPassword">Confirmation mot de passe*</label>
        <div className={styles.passwordInputWrapper}>
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleFormChange}
            placeholder="Retapez le mot de passe"
            title="Confirmation mot de passe"
            aria-label="Confirmation mot de passe"
            required
            minLength={6}
          />
          <button
            type="button"
            className={styles.passwordToggle}
            aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            onClick={() => setShowConfirmPassword(v => !v)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {errors.confirmPassword && <small className={styles.errorMsg}>{errors.confirmPassword}</small>}

        <button type="submit" disabled={!canSubmit() || loading}>
          {loading ? "Patientez…" : "Finaliser mon inscription"}
        </button>
      </form>
    </div>
  );
}
