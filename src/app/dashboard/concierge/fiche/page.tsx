"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import styles from "./FicheConciergerie.module.scss"; // adapte le nom au tien si besoin
import AvatarUpload from "@/app/components/ui/AvatarUpload/AvatarUpload";
interface Profile {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    avatar_url: string | null;
    additional_info: string | null;
    category: string;
    created_at: string;
    location: string | null;
    option: string | null;
    search_target: string | null;
    role: string | null;
}

export default function FicheConciergerie() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [editProfile, setEditProfile] = useState<Profile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/profiles/current");
                const data: Profile | { error: string } = await res.json();
                if ("error" in data) throw new Error(data.error);
                setProfile(data as Profile);
                setEditProfile(data as Profile);
                setErrorMsg("");
            } catch (err: unknown) {
                setErrorMsg(
                    err instanceof Error ? err.message : "Erreur chargement profil."
                );
            }
        })();
    }, []);

    const handleEditChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        if (!editProfile) return;
        setEditProfile({ ...editProfile, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!editProfile) return;
        setLoading(true);
        try {
            const res = await fetch("/api/profiles", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editProfile),
            });
            const result = await res.json();
            if (result.error) throw new Error(result.error);
            setProfile(editProfile);
            setIsEditing(false);
            setSuccessMsg("Profil mis à jour avec succès !");
            setErrorMsg("");
        } catch (err: unknown) {
            setErrorMsg(
                err instanceof Error ? err.message : "Impossible de sauvegarder."
            );
        } finally {
            setLoading(false);
        }
    };

    if (errorMsg)
        return <div className={styles.errorMsg}>{errorMsg}</div>;
    if (!profile || !editProfile) return <div>Chargement…</div>;

    const data = isEditing ? editProfile : profile;

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>Fiche & Infos utilisateur</h1>
            {successMsg && <div className={styles.successBanner}>{successMsg}</div>}

            {/* Avatar block */}
            <div className={styles.avatarBlock}>
                <AvatarUpload
                    value={null}
                    existingUrl={profile.avatar_url}
                    onChange={() => { }}
                />
            </div>

            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Username :</span>
                {isEditing ? (
                    <input
                        className={styles.fieldInput}
                        name="username"
                        value={data.username}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span className={styles.fieldValue}>{data.username}</span>
                )}
            </div>
            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Nom :</span>
                {isEditing ? (
                    <input
                        className={styles.fieldInput}
                        name="last_name"
                        value={data.last_name}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span className={styles.fieldValue}>{data.last_name}</span>
                )}
            </div>
            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Prénom :</span>
                {isEditing ? (
                    <input
                        className={styles.fieldInput}
                        name="first_name"
                        value={data.first_name}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span className={styles.fieldValue}>{data.first_name}</span>
                )}
            </div>
            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Email :</span>
                {isEditing ? (
                    <input
                        className={styles.fieldInput}
                        name="email"
                        type="email"
                        value={data.email}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span className={styles.fieldValue}>{data.email}</span>
                )}
            </div>
            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Téléphone :</span>
                {isEditing ? (
                    <input
                        className={styles.fieldInput}
                        name="phone"
                        value={data.phone ?? ""}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span className={styles.fieldValue}>{data.phone ?? "—"}</span>
                )}
            </div>
            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Catégorie :</span>
                <span className={styles.fieldValue}>{data.category}</span>
            </div>
            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Emplacement :</span>
                {isEditing ? (
                    <input
                        className={styles.fieldInput}
                        name="location"
                        value={data.location ?? ""}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span className={styles.fieldValue}>{data.location ?? "—"}</span>
                )}
            </div>
            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Services principaux :</span>
                {isEditing ? (
                    <input
                        className={styles.fieldInput}
                        name="option"
                        value={data.option ?? ""}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span className={styles.fieldValue}>{data.option ?? "—"}</span>
                )}
            </div>
            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Recherche cible :</span>
                {isEditing ? (
                    <input
                        className={styles.fieldInput}
                        name="search_target"
                        value={data.search_target ?? ""}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span className={styles.fieldValue}>{data.search_target ?? "—"}</span>
                )}
            </div>
            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>À propos :</span>
                {isEditing ? (
                    <textarea
                        className={styles.fieldTextarea}
                        name="additional_info"
                        value={data.additional_info ?? ""}
                        onChange={handleEditChange}
                        rows={2}
                    />
                ) : (
                    <span className={styles.fieldValue}>{data.additional_info ?? "—"}</span>
                )}
            </div>
            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Date de création :</span>
                <span className={styles.fieldValue}>
                    {data.created_at
                        ? new Date(data.created_at).toLocaleDateString("fr-FR")
                        : "—"}
                </span>
            </div>
            <br />
            {isEditing ? (
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className={styles.saveButton}
                >
                    Sauvegarder
                </button>
            ) : (
                <button
                    onClick={() => setIsEditing(true)}
                    className={styles.editButton}
                >
                    Modifier
                </button>
            )}
        </div>
    );
}