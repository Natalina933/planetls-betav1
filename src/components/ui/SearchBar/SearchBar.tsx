"use client";

import { FormEvent, InputHTMLAttributes, Ref, useEffect, useState } from "react";
import { Button } from "../Button";
import { Input } from "../Input";
import styles from "./SearchBar.module.scss";

export type SearchBarProps = {
  defaultValue?: string;
  placeholder?: string;
  buttonLabel?: string;
  label?: string;
  onSearch: (query: string) => void;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "value">;
};

export function SearchBar({
  defaultValue = "",
  placeholder = "Rechercher...",
  buttonLabel = "Rechercher",
  label = "Rechercher",
  onSearch,
  className = "",
  inputRef,
  inputProps,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(query.trim());
  };

  return (
    <form className={[styles.searchBar, className].filter(Boolean).join(" ")} role="search" onSubmit={handleSubmit}>
      <label htmlFor="site-search" className={styles.visuallyHidden}>
        {label}
      </label>
      <Input
        id="site-search"
        ref={inputRef}
        className={styles.input}
        {...inputProps}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          inputProps?.onChange?.(event);
        }}
        placeholder={placeholder}
        aria-label={inputProps?.["aria-label"] || label}
      />
      <Button type="submit" variant="primary" className={styles.button}>
        {buttonLabel}
      </Button>
    </form>
  );
}
