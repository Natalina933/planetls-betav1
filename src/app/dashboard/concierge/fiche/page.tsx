//src/app/dashboard/concierge/fiche/page.tsx
"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import styles from "./FicheConciergerie.module.scss"; // adapte le nom au tien si besoin
import AvatarUpload from "@/app/components/ui/AvatarUpload/AvatarUpload";
import { SupabaseClient } from "@supabase/supabase-js";
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
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
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

        let avatar_url = editProfile.avatar_url;

        // Upload avatar si modifié
        if (avatarFile) {
            // [IMPORTANT : adapte le nom & bucket selon ton projet Supabase]
            const { data, error } = await supabase.storage
                .from("avatars")
                .upload(`user_${editProfile.id}_${Date.now()}`, avatarFile, {
                    cacheControl: "3600",
                    upsert: true,
                });
            if (error) {
                setErrorMsg("Erreur lors de l'envoi de l'avatar");
                setLoading(false);
                return;
            }
            const {
                data: { publicUrl },
            } = supabase.storage.from("avatars").getPublicUrl(data.path);
            avatar_url = publicUrl || avatar_url;
        }

        try {
            const res = await fetch("/api/profiles", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...editProfile, avatar_url }),
            });
            const result = await res.json();
            if (result.error) throw new Error(result.error);
            setProfile({ ...editProfile, avatar_url });
            setEditProfile({ ...editProfile, avatar_url });
            setIsEditing(false);
            setSuccessMsg("Profil mis à jour avec succès !");
            setAvatarFile(null);
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

            {/* Bloc Avatar */}
            <div className={styles.avatarBlock}>
                <AvatarUpload
                    value={avatarFile}
                    existingUrl={editProfile.avatar_url || null}
                    onChange={setAvatarFile}
                />
            </div>

            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>ID :</span>
                <span className={styles.fieldValue}>{data.id}</span>
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