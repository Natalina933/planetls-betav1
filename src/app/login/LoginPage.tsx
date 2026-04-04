"use client";

import React, { useEffect, useRef, useState, ChangeEvent, FormEvent } from "react";
import { signIn } from "next-auth/react";
import styles from "./LoginPage.module.scss";
import { FaEye, FaEyeSlash, FaTimesCircle, FaCheckCircle } from "react-icons/fa";
import { Button, Input } from "@/components/ui";

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getDashboardPathFromRole = (role: string | null | undefined): string => {
  switch (role) {
    case "concierge":
    case "concierge_pro":
      return "/dashboard/concierge";
    case "owner":
    case "owner_pro":
      return "/dashboard/owner";
    case "provider":
    case "provider_pro":
    case "artisan":
    case "artisan_pro":
      return "/dashboard/provider";
    default:
      return "/dashboard/owner";
  }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LoginPage() {
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string; auth?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const syncAutofilledValues = () => {
      const email = emailRef.current?.value ?? "";
      const password = passwordRef.current?.value ?? "";

      setFormData((prev) =>
        prev.email === email && prev.password === password ? prev : { email, password },
      );
      setErrors((prev) => ({
        ...prev,
        email: email ? (validateEmail(email) ? "" : "Email invalide") : prev.email,
        password: password ? (password.length >= 8 ? "" : "Minimum 8 caracteres") : prev.password,
      }));
    };

    syncAutofilledValues();
    const timeoutId = window.setTimeout(syncAutofilledValues, 250);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const resolveRoleFromSession = async (): Promise<string | null> => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const res = await fetch(`/api/auth/session?ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const session = await res.json();
      const role = session?.user?.role;
      if (role) {
        return role;
      }
      await wait(250);
    }
    return null;
  };

  const resolveRoleFromLoginApi = async (): Promise<string | null> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    if (!res.ok) {
      return null;
    }

    const payload = await res.json();
    return payload?.user?.role ?? null;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) ? "" : "Email invalide" }));
    }
    if (name === "password") {
      setErrors((prev) => ({ ...prev, password: value.length >= 8 ? "" : "Minimum 8 caracteres" }));
    }
  };

  const canSubmit = () =>
    formData.email && formData.password && !errors.email && !errors.password;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const email = emailRef.current?.value?.trim() ?? formData.email.trim();
    const password = passwordRef.current?.value ?? formData.password;
    const nextErrors = {
      email: validateEmail(email) ? "" : "Email invalide",
      password: password.length >= 8 ? "" : "Minimum 8 caracteres",
    };

    setFormData({ email, password });
    setErrors(nextErrors);

    if (!email || !password || nextErrors.email || nextErrors.password) {
      setErrors((prev) => ({ ...prev, auth: "Veuillez corriger les erreurs" }));
      return;
    }

    setLoading(true);
    setErrors({});

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setLoading(false);
      setErrors((prev) => ({ ...prev, auth: "Email ou mot de passe incorrect" }));
    } else {
      try {
        let role = await resolveRoleFromSession();

        if (!role) {
          role = await resolveRoleFromLoginApi();
        }

        const targetPath = getDashboardPathFromRole(role);
        window.location.assign(targetPath);
      } catch (err) {
        window.location.assign("/dashboard/owner");
      }
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerBlock}>
        <span className={styles.eyebrow}>Espace securise</span>
        <h1 className={styles.title}>Connexion</h1>
        <p className={styles.subtitle}>
          Accedez a votre espace pour gerer vos demandes, vos missions et votre activite.
        </p>
      </div>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <label htmlFor="email" className={styles.fieldLabel}>
          Email
        </label>
        <div className={styles.inputWrapper}>
          <Input
            bare
            suppressHydrationWarning
            ref={emailRef}
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

        <label htmlFor="password" className={styles.fieldLabel}>
          Mot de passe
        </label>
        <div className={styles.passwordInputWrapper}>
          <Input
            bare
            ref={passwordRef}
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className={styles.passwordToggle}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </Button>
        </div>
        {errors.password && (
          <small role="alert" className={styles.errorMsg}>
            {errors.password}
          </small>
        )}

        {errors.auth && (
          <div role="alert" className={`${styles.errorMsg} ${styles.authError}`}>
            {errors.auth}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!canSubmit() || loading}
          className={styles.submitButton}
          aria-busy={loading}
        >
          {loading ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}
