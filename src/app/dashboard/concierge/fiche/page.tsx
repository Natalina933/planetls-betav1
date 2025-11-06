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
            setProfile(editProfile); // met à jour l’affichage
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

    if (errorMsg) return <div className={styles.errorMsg}>{errorMsg}</div>;
    if (!profile || !editProfile) return <div>Chargement…</div>;

    const data = isEditing ? editProfile : profile;

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>Fiche & Infos utilisateur</h1>
            {successMsg && <div className={styles.successBanner}>{successMsg}</div>}
            <div>
                <AvatarUpload
                    value={null}
                    existingUrl={profile.avatar_url}
                    onChange={() => { }}
                />
                <strong>Username :</strong>
                {isEditing ? (
                    <input
                        name="username"
                        value={data.username}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span> {data.username}</span>
                )}
            </div>
            <div>
                <strong>Nom :</strong>
                {isEditing ? (
                    <input
                        name="last_name"
                        value={data.last_name}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span>{data.last_name}</span>
                )}
            </div>
            <div>
                <strong>Prénom :</strong>
                {isEditing ? (
                    <input
                        name="first_name"
                        value={data.first_name}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span>{data.first_name}</span>
                )}
            </div>
            <div>
                <strong>Email :</strong>
                {isEditing ? (
                    <input
                        name="email"
                        type="email"
                        value={data.email}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span>{data.email}</span>
                )}
            </div>
            <div>
                <strong>Téléphone :</strong>
                {isEditing ? (
                    <input
                        name="phone"
                        value={data.phone ?? ""}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span>{data.phone ?? "—"}</span>
                )}
            </div>
            <div>
                <strong>Catégorie :</strong> <span>{data.category}</span>
            </div>
            <div>
                <strong>Emplacement :</strong>
                {isEditing ? (
                    <input
                        name="location"
                        value={data.location ?? ""}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span>{data.location ?? "—"}</span>
                )}
            </div>
            <div>
                <strong>Services principaux :</strong>
                {isEditing ? (
                    <input
                        name="option"
                        value={data.option ?? ""}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span>{data.option ?? "—"}</span>
                )}
            </div>
            <div>
                <strong>Recherche cible :</strong>
                {isEditing ? (
                    <input
                        name="search_target"
                        value={data.search_target ?? ""}
                        onChange={handleEditChange}
                    />
                ) : (
                    <span>{data.search_target ?? "—"}</span>
                )}
            </div>
            <div>
                <strong>À propos :</strong>
                {isEditing ? (
                    <textarea
                        name="additional_info"
                        value={data.additional_info ?? ""}
                        onChange={handleEditChange}
                        rows={2}
                    />
                ) : (
                    <span>{data.additional_info ?? "—"}</span>
                )}
            </div>
            <div>
                <strong>Date de création :</strong>{" "}
                <span>
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
