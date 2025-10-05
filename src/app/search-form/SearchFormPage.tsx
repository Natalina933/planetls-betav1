"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import AvatarUpload from "../components/ui/AvatarUpload/AvatarUpload";
import styles from "./SearchFormPage.module.scss";

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  avatar: File | null;
}

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

export default function SearchFormPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

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

  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    confirmPassword: "",
    avatar: null,
  });

  const [avatarUrlState, setAvatarUrlState] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("proprietaire");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setQueryData({
      category: searchParams.get("category") || "",
      searchTarget: searchParams.get("searchTarget") || "",
      option: searchParams.get("option") || "",
      location: searchParams.get("location") || "",
      firstName: searchParams.get("firstName") || "",
      lastName: searchParams.get("lastName") || "",
      email: searchParams.get("email") || "",
      phone: searchParams.get("phone") || "",
      additionalInfo: searchParams.get("additionalInfo") || "",
    });
  }, [searchParams]);

  const validate = (name: string, value: string) => {
    let message = "";
    if (name === "username" && value.trim().length < 3) {
      message = "Le nom d’utilisateur doit contenir au moins 3 caractères.";
    }
    if (name === "password" && value.length < 6) {
      message = "Le mot de passe doit contenir au moins 6 caractères.";
    }
    if (name === "confirmPassword" && value !== formData.password) {
      message = "Les mots de passe ne correspondent pas.";
    }
    setErrors((prev) => ({ ...prev, [name]: message }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validate(name, value);
  };

  const handleAvatarChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, avatar: file }));
    if (file) {
      const simulatedUrl = URL.createObjectURL(file);
      setAvatarUrlState(simulatedUrl);
    } else {
      setAvatarUrlState(null);
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value);
  };

  const canSubmit = () =>
    formData.username.trim().length >= 3 &&
    formData.password.length >= 6 &&
    formData.password === formData.confirmPassword &&
    Object.values(errors).every((err) => err === "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) {
      alert("Corrigez les erreurs avant de continuer.");
      return;
    }
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: queryData.email,
          avatar_url: avatarUrlState,
          role: selectedRole,
        }),
      });

      const text = await response.text();
      console.log("Réponse brute API :", text);

      try {
        const data = JSON.parse(text);
        if (data.error) {
          alert(data.error);
        } else {
          alert("Inscription réussie !");
          router.push("/dashboard");
        }
      } catch {
        alert("Erreur serveur, réponse non valide.");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Erreur attrapée:", error.message);
        alert(error.message);
      } else {
        console.error("Erreur inconnue attrapée:", error);
        alert("Une erreur inattendue est survenue.");
      }
    }

  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Finalisez votre inscription</h1>

      <nav aria-label="Progression inscription" className={styles.stepNav}>
        <ul>
          <li>1. Recherche & localisation</li>
          <li>2. Services sélectionnés</li>
          <li>3. Profils & coordonnées</li>
          <li className={styles.activeStep}>4. Créez un compte</li>
        </ul>
      </nav>

      <section className={styles.summary}>
        <h2>Récapitulatif</h2>
        <p>
          <strong>Je suis :</strong> {queryData.category || "—"} <br />
          <strong>Je recherche un :</strong> {queryData.searchTarget || "—"} à {queryData.location || "—"}.
        </p>
        <div className={styles.services}>
          <strong>Services recherchés :</strong>
          {queryData.option ? (
            <ul>
              {queryData.option.split(",").map((service, index) => (
                <li key={index}>{service.trim()}</li>
              ))}
            </ul>
          ) : (
            "—"
          )}
        </div>
        <hr />
        <h2>Profils & Coordonnées</h2>
        <p>
          <strong>Prénom :</strong> {queryData.firstName || "—"}
        </p>
        <p>
          <strong>Nom :</strong> {queryData.lastName || "—"}
        </p>
        <p>
          <strong>Email :</strong> {queryData.email || "—"}
        </p>
        <p>
          <strong>Téléphone :</strong> {queryData.phone || "—"}
        </p>
        <p>
          <strong>Besoin :</strong> {queryData.additionalInfo || "—"}
        </p>
        <div className={styles.avatarSection}>
          <h3>Photo de profil</h3>
          <AvatarUpload value={formData.avatar} onChange={handleAvatarChange} />
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className={styles.editButton}
        >
          Modifier mes informations
        </button>
      </section>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label>
          Nom d’utilisateur*
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choisissez un identifiant"
            required
            minLength={3}
            aria-describedby="usernameError"
          />
          {errors.username && (
            <small id="usernameError" className={styles.errorMsg}>
              {errors.username}
            </small>
          )}
        </label>

        <label className={styles.passwordLabel}>
          Mot de passe* (min. 6 caractères)
          <div className={styles.passwordInputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Entrez un mot de passe sécurisé"
              required
              minLength={6}
              autoComplete="new-password"
              aria-describedby="passwordError"
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && (
            <small id="passwordError" className={styles.errorMsg}>
              {errors.password}
            </small>
          )}
        </label>

        <label className={styles.passwordLabel}>
          Confirmez le mot de passe*
          <div className={styles.passwordInputWrapper}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Retapez le mot de passe"
              required
              minLength={6}
              autoComplete="new-password"
              aria-describedby="confirmError"
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.confirmPassword && (
            <small id="confirmError" className={styles.errorMsg}>
              {errors.confirmPassword}
            </small>
          )}
        </label>

        <label>
          Rôle utilisateur*
          <select value={selectedRole} onChange={handleRoleChange}>
            <option value="proprietaire">Propriétaire</option>
            <option value="concierge">Concierge</option>
            <option value="artisan">Artisan</option>
          </select>
        </label>

        <button type="submit" disabled={!canSubmit()}>
          Finaliser mon inscription
        </button>
      </form>
    </div>
  );
}
