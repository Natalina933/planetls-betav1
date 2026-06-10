"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";

function getNotificationsPageHref(role?: string | null) {
  if (role === "owner" || role === "owner_pro") return "/dashboard/owner/alertes";
  if (role === "concierge" || role === "concierge_pro") return "/dashboard/concierge/alertes";
  if (
    role === "provider" ||
    role === "provider_pro" ||
    role === "artisan" ||
    role === "artisan_pro"
  ) {
    return "/dashboard/provider/alertes";
  }
  return "/dashboard";
}

export default function DashboardNotificationsRedirectPage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;
    router.replace(getNotificationsPageHref(user?.role));
  }, [loading, router, user?.role]);

  return <section className="dashboard-grid">Redirection vers vos notifications...</section>;
}
