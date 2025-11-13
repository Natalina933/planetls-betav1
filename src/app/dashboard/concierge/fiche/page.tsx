"use client";

import { useState } from "react";
import { FiClipboard, FiMapPin, FiMail, FiPhone, FiEdit2, FiSave } from "react-icons/fi";
import styles from "./FicheConciergerie.module.scss";

export default function FicheConciergerie() {
  // ✅ États pour les champs éditables
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState("12 Rue des Érables, 66000 Perpignan");
  const [email, setEmail] = useState("contact@soleilconciergerie.fr");
  const [phone, setPhone] = useState("06 12 45 78 23");
  const [services, setServices] = useState([
    "Accueil voyageurs",
    "Ménage professionnel",
    "Gestion de clés",
    "Petits travaux & dépannage",
  ]);
  const [zones, setZones] = useState("Perpignan centre, Saint Estève, Canet, Bompas...");
  const [horaires, setHoraires] = useState("Lun-Sam : 8h-20h; Dim : Intervention sur demande");
  const [about, setAbout] = useState(
    "Nous assurons un service sur mesure pour les propriétaires souhaitant déléguer l’accueil, l’entretien et le suivi de leurs biens locatifs. Équipe locale, réactive et polyvalente !"
  );

  // ✅ Fonction pour sauvegarder les modifications
  const handleSave = async () => {
    const body = {
      location: address,
      email,
      phone,
      additionalInfo: `Services: ${services.join(", ")} | Zones: ${zones} | Horaires: ${horaires} | À propos: ${about}`,
    };

    const res = await fetch("/api/auth/update-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.success) {
      setEditing(false);
      alert("Profil mis à jour !");
    } else {
      alert("Erreur : " + data.error);
    }
  };

  return (
    <main className={styles.ficheContainer}>
      <header className={styles.header}>
        <FiClipboard className={styles.logoIcon} aria-hidden />
        <div>
          <h1 className={styles.title}>Conciergerie &quot;Le Soleil Catalan&quot;</h1>
          <p className={styles.subtitle}>Votre partenaire local, de confiance</p>
        </div>
        <button
          className={styles.editBtn}
          onClick={() => (editing ? handleSave() : setEditing(true))}
        >
          {editing ? <><FiSave /> Sauvegarder</> : <><FiEdit2 /> Modifier</>}
        </button>
      </header>

      <section className={styles.infoGrid}>
        <div>
          <h2>Coordonnées</h2>
          {editing ? (
            <>
              <input value={address} onChange={(e) => setAddress(e.target.value)} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </>
          ) : (
            <>
              <p><FiMapPin /> {address}</p>
              <p><FiMail /> {email}</p>
              <p><FiPhone /> {phone}</p>
            </>
          )}
          <p>SIREN : 123 456 789</p>
        </div>

        <div>
          <h2>Services phares</h2>
          {editing ? (
            <textarea
              value={services.join("\n")}
              onChange={(e) => setServices(e.target.value.split("\n"))}
            />
          ) : (
            <ul className={styles.serviceList}>
              {services.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2>Zones d’intervention</h2>
          {editing ? (
            <input value={zones} onChange={(e) => setZones(e.target.value)} />
          ) : (
            <span>{zones}</span>
          )}
        </div>

        <div>
          <h2>Horaires</h2>
          {editing ? (
            <input value={horaires} onChange={(e) => setHoraires(e.target.value)} />
          ) : (
            <p>{horaires}</p>
          )}
        </div>
      </section>

      <section className={styles.summary}>
        <h2>A propos</h2>
        {editing ? (
          <textarea value={about} onChange={(e) => setAbout(e.target.value)} />
        ) : (
          <p>{about}</p>
        )}
      </section>
    </main>
  );
}
