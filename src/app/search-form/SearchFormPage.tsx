"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import AvatarUpload from "../components/ui/AvatarUpload/AvatarUpload"; // <-- import du composant
import styles from "./SearchFormPage.module.scss";

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  avatar: File | null;
}

interface QueryData {
  category: string;
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Gestion erreurs temps réel
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setQueryData({
      category: searchParams.get("category") || "",
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
  };

  const canSubmit = () =>
    formData.username.trim().length >= 3 &&
    formData.password.length >= 6 &&
    formData.password === formData.confirmPassword &&
    Object.values(errors).every((err) => err === "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) {
      return alert("⚠️ Corrigez les erreurs avant de continuer.");
    }

    const formPayload = new FormData();
    formPayload.append("username", formData.username);
    formPayload.append("password", formData.password);
    if (formData.avatar) {
      formPayload.append("avatar", formData.avatar);
    }

    // TODO: Envoyer vers ton backend
    // await fetch("/api/register", { method: "POST", body: formPayload });

    alert("✅ Inscription finalisée avec succès !");
    router.push("/");
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Finalisez votre inscription</h1>

      {/* Étapes */}
      <nav aria-label="Progression inscription" className={styles.stepNav}>
        <ul>
          <li>1. Recherche & localisation</li>
          <li>2. Services sélectionnés</li>
          <li>3. Profils & coordonnées</li>
          <li className={styles.activeStep}>4. Créez un compte</li>
        </ul>
      </nav>

      {/* Résumé */}
      <section className={styles.summary}>
        <h2>Récapitulatif</h2>

        <p>
          <strong>Je recherche un :</strong> {queryData.category || "—"} à{" "}
          {queryData.location || "—"}.
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

        {/* Avatar unique ici */}
        <div className={styles.avatarSection}>
          <h3>Photo de profil</h3>
          <AvatarUpload value={formData.avatar} onChange={handleAvatarChange} />
          {formData.avatar && (
            <div className={styles.avatarPreview}>
              {/* <Image
                src={URL.createObjectURL(formData.avatar)}
                alt="Avatar utilisateur"
                width={120}
                height={120}
                className={styles.avatarImg}
              /> */}
              {/* <small className={styles.fileName}>{formData.avatar.name}</small> */}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.back()}
          className={styles.editButton}
        >
          Modifier mes informations
        </button>
      </section>


      {/* Formulaire inscription */}
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



        <button type="submit" disabled={!canSubmit()}>
          Finaliser mon inscription
        </button>
      </form>
    </div>
  );
}
