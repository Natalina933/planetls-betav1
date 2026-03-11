import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import styles from "./Topbar.module.scss";
import type { DashboardPersona } from "../types";

interface TopbarProps {
  persona: DashboardPersona;
  title: string;
  subtitle: string;
}

const personaLabel: Record<DashboardPersona, string> = {
  owner: "Proprietaire",
  conciergerie: "Conciergerie",
  artisan: "Artisan / commercant",
};

export function Topbar({ persona, title, subtitle }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <div>
        <Badge variant="info">{personaLabel[persona]}</Badge>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      <div className={styles.search}>
        <Input placeholder="Rechercher une mission, un bien, un contact..." />
      </div>
    </header>
  );
}
