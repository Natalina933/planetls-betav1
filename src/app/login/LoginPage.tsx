"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./LoginPage.module.scss";
import { FaEye, FaEyeSlash, FaTimesCircle, FaCheckCircle } from "react-icons/fa";
import { signIn } from "next-auth/react";

const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string; auth?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "email") {
      setErrors(prev => ({ ...prev, email: validateEmail(value) ? "" : "Email invalide" }));
    }
    if (name === "password") {
      setErrors(prev => ({ ...prev, password: value.length >= 8 ? "" : "Minimum 8 caractères" }));
    }
  };

  const canSubmit = () => formData.email && formData.password && !errors.email && !errors.password;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) {
      setErrors(prev => ({ ...prev, auth: "Veuillez corriger les erreurs" }));
      return;
    }

    setLoading(true);
    setErrors({});

    const result = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
    });

    setLoading(false);

    if (result?.error) {
      setErrors(prev => ({ ...prev, auth: "Email ou mot de passe incorrect" }));
    } else {
      router.push("/dashboard"); // ou chemin selon ton app
    }
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Connexion</h1>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <label htmlFor="email">Email</label>
        <div className={styles.inputWrapper}>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            required
            autoComplete="email"
            className={errors.email ? styles.inputError : styles.input}
          />
          {formData.email && (
            <span className={styles.validationIcon}>
              {errors.email ? <FaTimesCircle color="#e74c3c" /> : <FaCheckCircle color="#2ecc71" />}
            </span>
          )}
          {errors.email && (
            <small role="alert" className={styles.errorMsg}>
              {errors.email}
            </small>
          )}
        </div>

        <label htmlFor="password">Mot de passe</label>
        <div className={styles.passwordInputWrapper}>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            placeholder="Votre mot de passe"
            aria-invalid={!!errors.password}
            required
            minLength={8}
            autoComplete="current-password"
            className={errors.password ? styles.inputError : styles.input}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className={styles.passwordToggle}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {errors.password && (
          <small role="alert" className={styles.errorMsg}>
            {errors.password}
          </small>
        )}

        {errors.auth && (
          <div role="alert" className={styles.errorMsg} style={{ marginTop: "1rem" }}>
            {errors.auth}
          </div>
        )}

        <button type="submit" disabled={!canSubmit() || loading} className={styles.submitButton} aria-busy={loading}>
          {loading ? "⏳ Connexion en cours..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
