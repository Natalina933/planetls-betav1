"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import AvatarUpload from "../components/ui/AvatarUpload/AvatarUpload";
// import AvatarPreview from "../components/ui/AvatarPreview/AvatarPreview";
import styles from "./SearchFormPage.module.scss";
import { createClient } from "@supabase/supabase-js";

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

// --- DANS SearchFormPage.tsx ---

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!canSubmit()) {
    return alert("⚠️ Corrigez les erreurs avant de continuer.");
  }

  try {
    let avatar_url = null;
    if (formData.avatar) {
      // ⚠️ ATTENTION : Utilisez la fonction createClient recommandée pour le client léger.
      // S'il existe une fonction que vous utilisez habituellement (par ex: createClientComponentClient), utilisez-la.
      // Sinon, on s'assure d'utiliser la clé publique (ANON_KEY).
      
      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // <-- Utilisation de la clé publique (ANON_KEY)
      );

      const fileExt = formData.avatar.name.split(".").pop();
      // On s'assure que le nom de fichier est sécurisé et aléatoire
      const fileName = `${formData.username}_${crypto.randomUUID()}.${fileExt}`; 

      // 1. Upload vers le bucket 'avatars'
      const { error: uploadError } = await supabaseClient.storage
        .from("avatars") // VERIFIEZ QUE LE NOM DU BUCKET EST BIEN 'avatars'
        .upload(fileName, formData.avatar, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        // Renvoie une erreur spécifique si le bucket n'est pas trouvé
        if (uploadError.message.includes("Bucket not found")) {
            throw new Error("Bucket 'avatars' non trouvé. Veuillez vérifier sa configuration dans Supabase.");
        }
        throw uploadError;
      }

      // 2. Récupération de l'URL publique
      const { data: publicUrlData } = supabaseClient.storage
        .from("avatars")
        .getPublicUrl(fileName);
        
      avatar_url = publicUrlData.publicUrl;
    }

    // Appel de l'API register
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.username,
        password: formData.password,
        email: queryData.email,
        avatar_url,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error ?? "Erreur inconnue");
    }

    alert("✅ Inscription finalisée avec succès ! Redirection vers le tableau de bord...");
    router.push("/dashboard"); // Redirection vers le dashboard
  } catch (err) {
    if (err instanceof Error) {
      alert("❌ Erreur : " + err.message);
    } else {
      alert("❌ Erreur serveur inconnue.");
    }
  }
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

        {/* Avatar avec barre latérale */}
        <div className={styles.avatarSection}>
          <h3>Photo de profil</h3>

          <AvatarUpload value={formData.avatar} onChange={handleAvatarChange} />

          {/* {formData.avatar && (
            <AvatarPreview file={formData.avatar} onChange={handleAvatarChange} />
          )} */}
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
