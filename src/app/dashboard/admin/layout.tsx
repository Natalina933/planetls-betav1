import type { ReactNode } from "react";
import { requireAdminAccess } from "./adminAccess";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminAccess();
  return children;
}
