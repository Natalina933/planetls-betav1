"use client";

import { FormEvent, InputHTMLAttributes, Ref, useEffect, useState } from "react";
import { Button } from "../Button";
import { Input } from "../Input";
import styles from "./SearchBar.module.scss";

export type SearchBarProps = {
  defaultValue?: string;
  value?: string;
  placeholder?: string;
  buttonLabel?: string;
  buttonClassName?: string;
  onSearch: (query: string) => void;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "value">;
};

export function SearchBar({
  defaultValue = "",
  value,
  placeholder = "Rechercher...",
  buttonLabel = "Rechercher",
  buttonClassName = "",
  onSearch,
  className = "",
  inputRef,
  inputProps,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const isControlled = typeof value === "string";
  const currentValue = isControlled ? value : query;

  useEffect(() => {
    if (!isControlled) {
      setQuery(defaultValue);
    }
  }, [defaultValue, isControlled]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(currentValue.trim());
  };

  return (
    <form className={[styles.searchBar, className].filter(Boolean).join(" ")} role="search" onSubmit={handleSubmit}>
      <Input
        ref={inputRef}
        className={styles.input}
        {...inputProps}
        value={currentValue}
        onChange={(event) => {
          if (!isControlled) {
            setQuery(event.target.value);
          }
          inputProps?.onChange?.(event);
        }}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <Button type="submit" variant="primary" className={[styles.button, buttonClassName].filter(Boolean).join(" ")}>
        {buttonLabel}
      </Button>
    </form>
  );
}
