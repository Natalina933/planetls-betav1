"use client";

import React, { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import {
  FiBarChart,
  FiFileText,
  FiGlobe,
  FiMapPin,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { useSession } from "next-auth/react";
import conciergeStyles from "@/app/dashboard/concierge/profile/ConciergeProfilePage.module.scss";
import {
  ConciergeNotifications,
  ConciergePageHeader,
  EditableProfileField,
  EditableProfileSection,
} from "@/app/dashboard/concierge/profile/profileTabSections";
import ProfileSummary from "@/app/components/dashboard/concierge/ProfileSummary/ProfileSummary";
import { ProfileIdentity } from "@/app/components/dashboard/concierge/ProfileSummary/profileIdentity";

export type UnifiedProfileForm = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  avatar_url: string;
  avatar_scale: number;
  avatar_offset_x: number;
  avatar_offset_y: number;
  avatar_rotation: number;
  company_name: string;
  street_address: string;
  postal_code: string;
  city: string;
  country: string;
  website: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  additional_info: string;
};

type EditableUnifiedProfilePageProps = {
  roleLabel: string;
  identityIntro: string;
  verifiedCompleteText: string;
  verifiedPendingText: string;
  emptyDisplayName: string;
  presentationIntro: string;
  preferCompanyName?: boolean;
  requireCompanyForVerified?: boolean;
};

const DEFAULT_AVATAR = "/icons/account-svgrepo-com.svg";
const noop = () => {};

const SECTION_IDS = {
  SUMMARY: "summary",
  AVATAR: "avatar",
  ACCOUNT: "account",
  ADDRESS: "address",
  SOCIALS: "socials",
  PRESENTATION: "presentation",
} as const;

const SECTION_FIELDS: Record<string, Array<keyof UnifiedProfileForm>> = {
  [SECTION_IDS.ACCOUNT]: ["first_name", "last_name", "username", "phone", "company_name"],
  [SECTION_IDS.ADDRESS]: ["street_address", "postal_code", "city", "country"],
  [SECTION_IDS.SOCIALS]: [
    "website",
    "linkedin",
    "facebook",
    "instagram",
  ],
  [SECTION_IDS.PRESENTATION]: [
    "additional_info",
  ],
};

const emptyForm: UnifiedProfileForm = {
  id: "",
  created_at: "",
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  avatar_url: "",
  avatar_scale: 1,
  avatar_offset_x: 0,
  avatar_offset_y: 0,
  avatar_rotation: 0,
  company_name: "",
  street_address: "",
  postal_code: "",
  city: "",
  country: "France",
  website: "",
  linkedin: "",
  facebook: "",
  instagram: "",
  additional_info: "",
};

const toFormValue = (value: string | null | undefined) => value ?? "";

export default function EditableUnifiedProfilePage({
  roleLabel,
  identityIntro,
  verifiedCompleteText,
  verifiedPendingText,
  emptyDisplayName,
  presentationIntro,
  preferCompanyName = false,
  requireCompanyForVerified = false,
}: EditableUnifiedProfilePageProps) {
  const { update } = useSession();
  const [form, setForm] = useState<UnifiedProfileForm>(emptyForm);
  const [initialForm, setInitialForm] = useState<UnifiedProfileForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [sectionSnapshot, setSectionSnapshot] = useState<UnifiedProfileForm | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [SECTION_IDS.SUMMARY]: true,
    [SECTION_IDS.ACCOUNT]: true,
    [SECTION_IDS.ADDRESS]: true,
    [SECTION_IDS.SOCIALS]: true,
    [SECTION_IDS.PRESENTATION]: true,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setError(null);

        const response = await fetch("/api/profiles/current", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger votre profil.");
        }

        const profile = payload?.profile ?? payload ?? {};
        const nextForm = {
          id: toFormValue(profile.id),
          created_at: toFormValue(profile.created_at),
          first_name: toFormValue(profile.first_name),
          last_name: toFormValue(profile.last_name),
          username: toFormValue(profile.username),
          email: toFormValue(profile.email),
          phone: toFormValue(profile.phone),
          avatar_url: toFormValue(profile.avatar_url),
          avatar_scale: typeof profile.avatar_scale === "number" ? profile.avatar_scale : 1,
          avatar_offset_x:
            typeof profile.avatar_offset_x === "number" ? profile.avatar_offset_x : 0,
          avatar_offset_y:
            typeof profile.avatar_offset_y === "number" ? profile.avatar_offset_y : 0,
          avatar_rotation:
            typeof profile.avatar_rotation === "number" ? profile.avatar_rotation : 0,
          company_name: toFormValue(profile.company_name),
          street_address: toFormValue(profile.street_address),
          postal_code: toFormValue(profile.postal_code),
          city: toFormValue(profile.city),
          country: toFormValue(profile.country) || "France",
          website: toFormValue(profile.website),
          linkedin: toFormValue(profile.linkedin),
          facebook: toFormValue(profile.facebook),
          instagram: toFormValue(profile.instagram),
          additional_info: toFormValue(profile.additional_info),
        };

        setForm(nextForm);
        setInitialForm(nextForm);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger votre profil.");
      } finally {
      }
    }

    void loadProfile();
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleHeaderKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  const beginEditSection = (sectionId: string) => {
    setEditingSection(sectionId);
    setSectionSnapshot(form);
    setSuccess(null);
    setError(null);
  };

  const cancelEditSection = () => {
    setForm(sectionSnapshot ?? initialForm);
    setAvatarFile(null);
    setEditingSection(null);
    setSectionSnapshot(null);
    setSuccess(null);
    setError(null);
  };

  const uploadAvatarIfNeeded = async () => {
    if (!avatarFile || !form.id) {
      return form.avatar_url;
    }

    const formData = new FormData();
    formData.append("file", avatarFile);
    formData.append("userId", form.id);

    const response = await fetch("/api/profiles/avatar", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || result?.error) {
      throw new Error(result?.error || "Impossible de televerser l'avatar.");
    }

    return typeof result?.url === "string" ? result.url : form.avatar_url;
  };

  const saveSection = async (sectionId: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, string | number | null> = {};

      if (sectionId === SECTION_IDS.AVATAR) {
        payload.avatar_url = (await uploadAvatarIfNeeded()) || null;
        payload.avatar_scale = form.avatar_scale;
        payload.avatar_offset_x = form.avatar_offset_x;
        payload.avatar_offset_y = form.avatar_offset_y;
        payload.avatar_rotation = form.avatar_rotation;
      } else {
        for (const field of SECTION_FIELDS[sectionId] ?? []) {
          const value = form[field];
          payload[field] = typeof value === "string" ? value.trim() : value;
        }
      }

      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Impossible de mettre a jour votre profil.");
      }

      const nextForm = {
        ...form,
        created_at: toFormValue(result.created_at) || form.created_at,
        avatar_url: toFormValue(result.avatar_url) || form.avatar_url,
        avatar_scale: typeof result.avatar_scale === "number" ? result.avatar_scale : form.avatar_scale,
        avatar_offset_x:
          typeof result.avatar_offset_x === "number" ? result.avatar_offset_x : form.avatar_offset_x,
        avatar_offset_y:
          typeof result.avatar_offset_y === "number" ? result.avatar_offset_y : form.avatar_offset_y,
        avatar_rotation:
          typeof result.avatar_rotation === "number" ? result.avatar_rotation : form.avatar_rotation,
        first_name: toFormValue(result.first_name),
        last_name: toFormValue(result.last_name),
        username: toFormValue(result.username),
        phone: toFormValue(result.phone),
        company_name: toFormValue(result.company_name),
        street_address: toFormValue(result.street_address),
        postal_code: toFormValue(result.postal_code),
        city: toFormValue(result.city),
        country: toFormValue(result.country) || "France",
        website: toFormValue(result.website),
        linkedin: toFormValue(result.linkedin),
        facebook: toFormValue(result.facebook),
        instagram: toFormValue(result.instagram),
        additional_info: toFormValue(result.additional_info),
      };

      setForm(nextForm);
      setInitialForm(nextForm);
      setAvatarFile(null);
      setEditingSection(null);
      setSectionSnapshot(null);
      await update({
        user: {
          name: `${nextForm.first_name} ${nextForm.last_name}`.trim(),
          firstName: nextForm.first_name,
          lastName: nextForm.last_name,
          avatar_url: nextForm.avatar_url || null,
          image: nextForm.avatar_url || null,
          username: nextForm.username || null,
          company_name: nextForm.company_name || null,
        },
      });
      window.dispatchEvent(new Event("user-profile-updated"));
      setSuccess("Profil mis a jour avec succes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre a jour votre profil.");
    } finally {
      setSaving(false);
    }
  };

  const isSectionDirty = (sectionId: string) => {
    if (editingSection !== sectionId || !sectionSnapshot) {
      return false;
    }

    if (sectionId === SECTION_IDS.AVATAR) {
      return (
        avatarFile !== null ||
        form.avatar_url !== sectionSnapshot.avatar_url ||
        form.avatar_scale !== sectionSnapshot.avatar_scale ||
        form.avatar_offset_x !== sectionSnapshot.avatar_offset_x ||
        form.avatar_offset_y !== sectionSnapshot.avatar_offset_y ||
        form.avatar_rotation !== sectionSnapshot.avatar_rotation
      );
    }

    return (SECTION_FIELDS[sectionId] ?? []).some((field) => form[field] !== sectionSnapshot[field]);
  };

  const displayName = preferCompanyName
    ? `${form.first_name} ${form.last_name}`.trim() || form.company_name || form.username || emptyDisplayName
    : `${form.first_name} ${form.last_name}`.trim() || form.username || form.company_name || emptyDisplayName;
  const currentAvatar = form.avatar_url || DEFAULT_AVATAR;
  const isVerified = Boolean(
    form.email && form.phone && form.city && (!requireCompanyForVerified || form.company_name),
  );

  return (
    <div className={conciergeStyles.page}>
      <ConciergePageHeader styles={conciergeStyles} title="Mon profil" />

      <main className={conciergeStyles.main}>
        <ConciergeNotifications
          styles={conciergeStyles}
          successMsg={success}
          errorMsg={error}
        />

        <div className={conciergeStyles.tabContent}>
          <div className={conciergeStyles.tabPane}>
            <div className={conciergeStyles.grid}>
              <aside className={conciergeStyles.leftColumn}>
                <article className={conciergeStyles.profileCard}>
                  <ProfileIdentity
                    fullName={displayName}
                    roleLabel={roleLabel}
                    email={form.email}
                    phone={form.phone}
                    location={form.city || "Ville non renseignée"}
                    isEditing={editingSection === SECTION_IDS.AVATAR}
                    avatarFile={avatarFile}
                    existingAvatarUrl={currentAvatar}
                    existingScale={form.avatar_scale}
                    existingOffsetX={form.avatar_offset_x}
                    existingOffsetY={form.avatar_offset_y}
                    existingRotation={form.avatar_rotation}
                    onAvatarChange={setAvatarFile}
                    onAvatarScaleChange={(value) =>
                      setForm((current) => ({ ...current, avatar_scale: value }))
                    }
                    onAvatarOffsetChange={(x, y) =>
                      setForm((current) => ({
                        ...current,
                        avatar_offset_x: x,
                        avatar_offset_y: y,
                      }))
                    }
                    onAvatarRotationChange={(value) =>
                      setForm((current) => ({ ...current, avatar_rotation: value }))
                    }
                    onAvatarSave={() => {
                      if (editingSection !== SECTION_IDS.AVATAR) {
                        beginEditSection(SECTION_IDS.AVATAR);
                      }
                      void saveSection(SECTION_IDS.AVATAR);
                    }}
                    onAvatarRemove={() =>
                      setForm((current) => ({
                        ...current,
                        avatar_url: "",
                        avatar_scale: 1,
                        avatar_offset_x: 0,
                        avatar_offset_y: 0,
                        avatar_rotation: 0,
                      }))
                    }
                    onEditAvatarClick={() => beginEditSection(SECTION_IDS.AVATAR)}
                  />

                  <p className={conciergeStyles.sectionIntroText}>{identityIntro}</p>

                  <div className={conciergeStyles.profileStats}>
                    <div className={conciergeStyles.profileStatItem}>
                      <p className={conciergeStyles.profileStatLabel}>Ville</p>
                      <div className={conciergeStyles.profileStatValue}>{form.city || "-"}</div>
                    </div>
                    <div className={conciergeStyles.profileStatItem}>
                      <p className={conciergeStyles.profileStatLabel}>Structure</p>
                      <div className={conciergeStyles.profileStatValue}>{form.company_name || "-"}</div>
                    </div>
                  </div>
                </article>

                <div className={conciergeStyles.badgeCard}>
                  <h4 className={conciergeStyles.badgeTitle}>
                    <FiShield />
                    {isVerified ? "Badge vérifié" : "Vérification en attente"}
                  </h4>
                  <p className={conciergeStyles.badgeText}>
                    {isVerified ? verifiedCompleteText : verifiedPendingText}
                  </p>
                </div>

                <EditableProfileSection
                  styles={conciergeStyles}
                  title="Résumé du profil"
                  icon={<FiBarChart />}
                  canEdit={false}
                  collapsible
                  isOpen={openSections[SECTION_IDS.SUMMARY]}
                  isEditing={false}
                  isDirty={false}
                  isLoading={false}
                  onToggle={() => toggleSection(SECTION_IDS.SUMMARY)}
                  onHeaderKeyDown={handleHeaderKeyDown}
                  onBeginEdit={noop}
                  onSave={noop}
                  onCancel={noop}
                >
                  <ProfileSummary
                    profile={{
                      company_name: form.company_name,
                      created_at: form.created_at || new Date().toISOString(),
                      first_name: form.first_name,
                      last_name: form.last_name,
                      email: form.email,
                      phone: form.phone,
                      street_address: form.street_address,
                      postal_code: form.postal_code,
                      city: form.city,
                    }}
                    onEdit={() => beginEditSection(SECTION_IDS.ACCOUNT)}
                  />
                </EditableProfileSection>
              </aside>

              <div className={conciergeStyles.rightColumn}>
                <EditableProfileSection
                  styles={conciergeStyles}
                  title="Informations du compte"
                  icon={<FiUser />}
                  canEdit
                  collapsible
                  isOpen={openSections[SECTION_IDS.ACCOUNT]}
                  isEditing={editingSection === SECTION_IDS.ACCOUNT}
                  isDirty={isSectionDirty(SECTION_IDS.ACCOUNT)}
                  isLoading={saving}
                  onToggle={() => toggleSection(SECTION_IDS.ACCOUNT)}
                  onHeaderKeyDown={handleHeaderKeyDown}
                  onBeginEdit={() => beginEditSection(SECTION_IDS.ACCOUNT)}
                  onSave={() => void saveSection(SECTION_IDS.ACCOUNT)}
                  onCancel={cancelEditSection}
                >
                  <div className={conciergeStyles.fieldsGrid}>
                    <EditableProfileField styles={conciergeStyles} label="Prenom" name="first_name" value={form.first_name} isEditing={editingSection === SECTION_IDS.ACCOUNT} onChange={handleChange} />
                    <EditableProfileField styles={conciergeStyles} label="Nom" name="last_name" value={form.last_name} isEditing={editingSection === SECTION_IDS.ACCOUNT} onChange={handleChange} />
                    <EditableProfileField styles={conciergeStyles} label="Nom utilisateur" name="username" value={form.username} isEditing={editingSection === SECTION_IDS.ACCOUNT} onChange={handleChange} />
                    <EditableProfileField styles={conciergeStyles} label="Email" name="email" value={form.email} isEditing={false} onChange={handleChange} />
                    <EditableProfileField styles={conciergeStyles} label="Telephone" name="phone" value={form.phone} isEditing={editingSection === SECTION_IDS.ACCOUNT} onChange={handleChange} />
                    <EditableProfileField styles={conciergeStyles} label="Entreprise" name="company_name" value={form.company_name} isEditing={editingSection === SECTION_IDS.ACCOUNT} onChange={handleChange} />
                  </div>
                </EditableProfileSection>

                <EditableProfileSection
                  styles={conciergeStyles}
                  title="Adresse et présence locale"
                  icon={<FiMapPin />}
                  canEdit
                  collapsible
                  isOpen={openSections[SECTION_IDS.ADDRESS]}
                  isEditing={editingSection === SECTION_IDS.ADDRESS}
                  isDirty={isSectionDirty(SECTION_IDS.ADDRESS)}
                  isLoading={saving}
                  onToggle={() => toggleSection(SECTION_IDS.ADDRESS)}
                  onHeaderKeyDown={handleHeaderKeyDown}
                  onBeginEdit={() => beginEditSection(SECTION_IDS.ADDRESS)}
                  onSave={() => void saveSection(SECTION_IDS.ADDRESS)}
                  onCancel={cancelEditSection}
                >
                  <div className={conciergeStyles.fieldsGrid}>
                    <EditableProfileField styles={conciergeStyles} label="Adresse" name="street_address" value={form.street_address} isEditing={editingSection === SECTION_IDS.ADDRESS} onChange={handleChange} />
                    <EditableProfileField styles={conciergeStyles} label="Code postal" name="postal_code" value={form.postal_code} isEditing={editingSection === SECTION_IDS.ADDRESS} onChange={handleChange} />
                    <EditableProfileField styles={conciergeStyles} label="Ville" name="city" value={form.city} isEditing={editingSection === SECTION_IDS.ADDRESS} onChange={handleChange} />
                    <EditableProfileField styles={conciergeStyles} label="Pays" name="country" value={form.country} isEditing={editingSection === SECTION_IDS.ADDRESS} onChange={handleChange} />
                  </div>
                </EditableProfileSection>

                <EditableProfileSection
                  styles={conciergeStyles}
                  title="Site et réseaux sociaux"
                  icon={<FiGlobe />}
                  canEdit
                  collapsible
                  isOpen={openSections[SECTION_IDS.SOCIALS]}
                  isEditing={editingSection === SECTION_IDS.SOCIALS}
                  isDirty={isSectionDirty(SECTION_IDS.SOCIALS)}
                  isLoading={saving}
                  onToggle={() => toggleSection(SECTION_IDS.SOCIALS)}
                  onHeaderKeyDown={handleHeaderKeyDown}
                  onBeginEdit={() => beginEditSection(SECTION_IDS.SOCIALS)}
                  onSave={() => void saveSection(SECTION_IDS.SOCIALS)}
                  onCancel={cancelEditSection}
                >
                  <p className={conciergeStyles.sectionIntroText}>
                    Centralisez vos liens publics et vos réseaux sociaux.
                  </p>
                  <div className={conciergeStyles.fieldsGrid}>
                    <EditableProfileField styles={conciergeStyles} label="Site web" name="website" value={form.website} isEditing={editingSection === SECTION_IDS.SOCIALS} onChange={handleChange} />
                    <EditableProfileField styles={conciergeStyles} label="LinkedIn" name="linkedin" value={form.linkedin} isEditing={editingSection === SECTION_IDS.SOCIALS} onChange={handleChange} />
                    <EditableProfileField styles={conciergeStyles} label="Facebook" name="facebook" value={form.facebook} isEditing={editingSection === SECTION_IDS.SOCIALS} onChange={handleChange} />
                    <EditableProfileField styles={conciergeStyles} label="Instagram" name="instagram" value={form.instagram} isEditing={editingSection === SECTION_IDS.SOCIALS} onChange={handleChange} />
                  </div>
                </EditableProfileSection>

                <EditableProfileSection
                  styles={conciergeStyles}
                  title="Présentation"
                  icon={<FiFileText />}
                  canEdit
                  collapsible
                  isOpen={openSections[SECTION_IDS.PRESENTATION]}
                  isEditing={editingSection === SECTION_IDS.PRESENTATION}
                  isDirty={isSectionDirty(SECTION_IDS.PRESENTATION)}
                  isLoading={saving}
                  onToggle={() => toggleSection(SECTION_IDS.PRESENTATION)}
                  onHeaderKeyDown={handleHeaderKeyDown}
                  onBeginEdit={() => beginEditSection(SECTION_IDS.PRESENTATION)}
                  onSave={() => void saveSection(SECTION_IDS.PRESENTATION)}
                  onCancel={cancelEditSection}
                >
                  <p className={conciergeStyles.sectionIntroText}>
                    {presentationIntro}
                  </p>
                  <EditableProfileField
                    styles={conciergeStyles}
                    label="Présentation"
                    name="additional_info"
                    value={form.additional_info}
                    isEditing={editingSection === SECTION_IDS.PRESENTATION}
                    isTextarea
                    onChange={handleChange}
                  />
                </EditableProfileSection>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
