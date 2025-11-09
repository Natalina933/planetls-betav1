"use client";

import React, { ChangeEvent } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import styles from "./InputWithValidation.module.scss";

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

const VALID_AUTOCOMPLETE_VALUES = new Set([
  "off",
  "on",
  "name",
  "given-name",
  "family-name",
  "username",
  "email",
  "tel",
  "new-password",
  "current-password",
  "organization",
  "address-line1",
  "address-line2",
  "postal-code",
  "country",
]);

const getSafeAutoComplete = (value?: string) => {
  return value && VALID_AUTOCOMPLETE_VALUES.has(value) ? value : "off";
};

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
  const safeAutoComplete = getSafeAutoComplete(autoComplete);

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
        aria-label={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete={safeAutoComplete}
      />

      {value && (
        <span className={styles.validationIcon}>
          {error ? (
            <FaTimesCircle color="#e74c3c" aria-hidden="true" />
          ) : isValid ? (
            <FaCheckCircle color="#2ecc71" aria-hidden="true" />
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

export default InputWithValidation;
