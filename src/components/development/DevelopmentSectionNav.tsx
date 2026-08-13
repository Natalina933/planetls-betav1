import Link from "next/link";
import { Palette, Radar, UsersRound } from "lucide-react";
import styles from "./DevelopmentSectionNav.module.scss";

type DevelopmentSection = "pilotage" | "personas" | "design-system";

const items = [
  { id: "pilotage", label: "Pilotage", href: "/dashboard/admin/developpement", icon: Radar },
  { id: "personas", label: "Personas", href: "/dashboard/admin/personas", icon: UsersRound },
  { id: "design-system", label: "Design system", href: "/design-system", icon: Palette },
] as const;

export function DevelopmentSectionNav({ active }: { active: DevelopmentSection }) {
  return (
    <nav className={styles.nav} aria-label="Outils de développement">
      {items.map((item) => {
        const Icon = item.icon;
        return item.id === active ? (
          <span key={item.id} aria-current="page">
            <Icon size={15} aria-hidden="true" /> {item.label}
          </span>
        ) : (
          <Link key={item.id} href={item.href}>
            <Icon size={15} aria-hidden="true" /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
