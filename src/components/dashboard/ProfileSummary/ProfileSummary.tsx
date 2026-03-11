import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import styles from "./ProfileSummary.module.scss";

interface ProfileSummaryProps {
  name: string;
  subtitle: string;
  badge?: string;
  avatarSrc?: string;
}

export function ProfileSummary({ name, subtitle, badge, avatarSrc }: ProfileSummaryProps) {
  return (
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <h2>Profil</h2>
      </CardHeader>
      <CardBody className={styles.body}>
        <Avatar src={avatarSrc} name={name} size="md" />
        <div>
          <p className={styles.name}>{name}</p>
          <p className={styles.subtitle}>{subtitle}</p>
          {badge ? <Badge variant="success">{badge}</Badge> : null}
        </div>
      </CardBody>
    </Card>
  );
}
