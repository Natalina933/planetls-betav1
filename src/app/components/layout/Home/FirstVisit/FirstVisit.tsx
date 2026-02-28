"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import styles from "./FirstVisit.module.scss";

const FirstVisit = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const router = useRouter();

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
          relation en quelques clics.
        </p>
        <div className={styles.actions}>
          <button onClick={() => router.push("/home")}>Decouvrir</button>
          <button onClick={handleContactClick}>Nous contacter</button>
        </div>
      </div>
    </div>
  );
};

export default FirstVisit;
