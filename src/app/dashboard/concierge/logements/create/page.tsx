"use client";

import { useState } from "react";
import styles from "../LogementsPage.module.scss"; // réutilise le SCSS existant
import { FiPlus } from "react-icons/fi";

interface FormState {
    name: string;
    city: string;
    photo?: string;
    status: "pret" | "menage" | "arrivee" | "depart";
}

export default function AddLogementPage() {
    const [form, setForm] = useState<FormState>({
        name: "",
        city: "",
        photo: "",
        status: "pret",
    });

    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Logement soumis :", form);
        setSubmitted(true);
        // Ici tu peux appeler ton API pour sauvegarder le logement
    };

    return (
        <div className={styles.logementsPage}>
            <div className={styles.header}>
                <h1>Ajouter un logement</h1>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="name">Nom du logement</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Appartement Haussmannien"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="city">Ville</label>
                    <input
                        type="text"
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        required
                        placeholder="Paris"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="photo">URL de la photo</label>
                    <input
                        type="text"
                        id="photo"
                        name="photo"
                        value={form.photo}
                        onChange={handleChange}
                        placeholder="/images/default-logement.jpg"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="status">Statut</label>
                    <select name="status" id="status" value={form.status} onChange={handleChange}>
                        <option value="pret">Prêt</option>
                        <option value="menage">Ménage en cours</option>
                        <option value="arrivee">Arrivée du jour</option>
                        <option value="depart">Départ du jour</option>
                    </select>
                </div>

                <button type="submit" className={styles.btnAdd}>
                    <FiPlus /> Enregistrer
                </button>

                {submitted && (
                    <p className={styles.successMessage}>Logement enregistré avec succès !</p>
                )}
            </form>
        </div>
    );
}
