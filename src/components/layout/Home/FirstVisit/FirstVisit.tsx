"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Button } from "@/components/ui";
import styles from "./FirstVisit.module.scss";

const FirstVisit = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const hasVisited = Cookies.get("hasVisited");
    if (!hasVisited) {
      setIsFirstVisit(true);
      Cookies.set("hasVisited", "true", { expires: 30 });
    }
  }, []);

  if (!isFirstVisit) return null;

  const handleContactClick = () => {
    const contactElement = document.getElementById("contact");
    if (contactElement) {
      contactElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={styles.firstVisitOverlay}>
      <div className={styles.card}>
        <button
          className={styles.closeBtn}
          onClick={() => setIsFirstVisit(false)}
          aria-label="Fermer"
        >
          x
        </button>
        <h1>Bienvenue sur PlanetLS</h1>
        <p>
          Parcourez les services, explorez les concierges recommandes et lancez votre mise en
          relation depuis un parcours plus clair, plus rapide et plus actionnable.
        </p>
        <div className={styles.actions}>
          <Button onClick={() => setIsFirstVisit(false)} variant="primary">
            Decouvrir
          </Button>
          <Button onClick={handleContactClick} variant="secondary">
            Nous contacter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FirstVisit;
