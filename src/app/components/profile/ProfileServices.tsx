// "use client";

// import React, { useEffect, useState } from "react";
// import styles from "./ProfileServices.module.scss";
// import { supabaseBrowser } from "@/app/lib/dbClient";
// // import type { ServiceCatalogRow } from "@/types/supabase";

// interface ProfileServicesProps {
//   profileId: string;
//   category: "proprietaire" | "concierge" | "artisan";
//   editable?: boolean;
// }

// export default function ProfileServices({
//   profileId,
//   category,
//   editable = false,
// }: ProfileServicesProps) {
//   const supabase = supabaseBrowser();

//   // const [services, setServices] = useState<ServiceCatalogRow[]>([]);
//   const [selectedServices, setSelectedServices] = useState<number[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [message, setMessage] = useState("");

//   // Charger catalogue + services sélectionnés
//   useEffect(() => {
//     const fetchServices = async () => {
//       setLoading(true);

//       const { data: catalog } = await supabase
//         .from("services_catalog")
//         .select("*")
//         .eq("category", category);

//       setServices(catalog ?? []);

//       const { data: profileServices } = await supabase
//         .from("profile_services")
//         .select("service_id")
//         .eq("profile_id", profileId);

//       const arr = profileServices as { service_id: number }[] | null;
//       setSelectedServices(arr?.map((ps) => ps.service_id) ?? []);

//       setLoading(false);
//     };

//     fetchServices();
//   }, [profileId, category, supabase]);

//   // Toggle sélection
//   const handleToggle = (serviceId: number) => {
//     if (!editable) return;
//     setSelectedServices((prev) =>
//       prev.includes(serviceId)
//         ? prev.filter((id) => id !== serviceId)
//         : [...prev, serviceId]
//     );
//   };

//   // Sauvegarde via API
//   const handleSave = async () => {
//     setSaving(true);
//     setMessage("");

//     try {
//       const res = await fetch("/api/profiles/current", {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           profile_id: profileId,
//           services: selectedServices,
//         }),
//       });

//       const result = await res.json();

//       if (!res.ok) throw new Error(result.error || "Erreur inconnue");

//       setMessage(result.message);
//     } catch (err: unknown) {
//       setMessage(err instanceof Error ? "❌ " + err.message : "❌ Erreur inconnue");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) return <div>Chargement des services…</div>;

//   return (
//     <div className={styles.servicesContainer}>
//       <h2 className={styles.title}>Services ({category})</h2>
//       <ul className={styles.servicesList}>
//         {services.map((s) => (
//           <li key={s.id}>
//             <label className={styles.checkboxLabel}>
//               <input
//                 type="checkbox"
//                 checked={selectedServices.includes(s.id)}
//                 onChange={() => handleToggle(s.id)}
//                 disabled={!editable}
//               />
//               <span>{s.service}</span>
//             </label>
//           </li>
//         ))}
//       </ul>

//       {editable && (
//         <button
//           onClick={handleSave}
//           disabled={saving}
//           className={styles.saveButton}
//         >
//           {saving ? "💾 Sauvegarde..." : "Sauvegarder"}
//         </button>
//       )}

//       {message && <p className={styles.message}>{message}</p>}
//     </div>
//   );
// }
