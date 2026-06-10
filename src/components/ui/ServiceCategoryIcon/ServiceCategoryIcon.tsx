import type { ComponentProps } from "react";
import {
  Armchair,
  BadgeEuro,
  Camera,
  CircleHelp,
  FileText,
  Hammer,
  Home,
  KeyRound,
  Leaf,
  MessageSquareText,
  ShieldCheck,
  Shirt,
  ShoppingBasket,
  Sparkles,
  Trees,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  getServiceCategoryIconLabel,
  getServiceCategoryIconName,
  type ServiceCategoryIconName,
} from "@/app/lib/serviceCategoryIcon";

export type ServiceCategoryIconProps = Omit<ComponentProps<LucideIcon>, "ref"> & {
  category?: string | null;
  decorative?: boolean;
};

const ICONS: Record<ServiceCategoryIconName, LucideIcon> = {
  home: Home,
  sparkles: Sparkles,
  shirt: Shirt,
  key: KeyRound,
  wrench: Wrench,
  shopping: ShoppingBasket,
  file: FileText,
  trees: Trees,
  shield: ShieldCheck,
  comfort: Armchair,
  leaf: Leaf,
  camera: Camera,
  message: MessageSquareText,
  chart: BadgeEuro,
  users: UsersRound,
  hammer: Hammer,
  help: CircleHelp,
};

export function ServiceCategoryIcon({
  category,
  decorative = true,
  size = 18,
  strokeWidth = 2,
  ...props
}: ServiceCategoryIconProps) {
  const iconName = getServiceCategoryIconName(category);
  const Icon = ICONS[iconName] ?? CircleHelp;
  const label = getServiceCategoryIconLabel(category);

  return (
    <Icon
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      size={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
