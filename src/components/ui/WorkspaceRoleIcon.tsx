import styles from "./WorkspaceRoleIcon.module.scss";

type WorkspaceRole = "owner" | "concierge" | "provider" | "admin";

type WorkspaceRoleIconProps = {
  role: WorkspaceRole;
  label: string;
  size?: number;
  className?: string;
};

export function WorkspaceRoleIcon({
  role,
  label,
  size = 32,
  className,
}: WorkspaceRoleIconProps) {
  const classes = [styles.icon, styles[role], className].filter(Boolean).join(" ");

  return (
    <span
      className={classes}
      style={{ ["--icon-size" as string]: `${size}px` }}
      aria-hidden="true"
      title={label}
    />
  );
}
