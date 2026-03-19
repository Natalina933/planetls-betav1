"use client";

import { FaSun, FaMoon, FaGem } from "react-icons/fa";
import { GiScrollQuill } from "react-icons/gi";
import { useTheme } from "@/app/providers/ThemeProvider";
import styles from "./ThemeToggle.module.scss";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={styles.themeToggle}
      role="group"
      aria-label="Choix du thème"
    >
      <button
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
        title="Mode clair"
      >
        <FaSun />
      </button>

      <button
        aria-pressed={theme === "mucha-dark"}
        onClick={() => setTheme("mucha-dark")}
        title="Mucha Nocturne"
      >
        <FaMoon />
      </button>

      <button
        aria-pressed={theme === "art-deco"}
        onClick={() => setTheme("art-deco")}
        title="Art Deco"
      >
        <FaGem />
      </button>

      <button
        aria-pressed={theme === "sepia"}
        onClick={() => setTheme("sepia")}
        title="Sepia 1900"
      >
        <GiScrollQuill />
      </button>
    </div>
  );
}
