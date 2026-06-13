import type { ComponentProps } from "react";
import {
  getServiceCategoryIconLabel,
  getServiceCategoryIconPath,
} from "@/app/lib/serviceCategoryIcon";
import { PublicIcon } from "@/components/ui/PublicIcon";

export type ServiceCategoryIconProps = Omit<ComponentProps<typeof PublicIcon>, "ref" | "src" | "label"> & {
  category?: string | null;
};

export function ServiceCategoryIcon({
  category,
  decorative = true,
  size = 18,
  ...props
}: ServiceCategoryIconProps) {
  const label = getServiceCategoryIconLabel(category);
  const src = getServiceCategoryIconPath(category);

  return (
    <PublicIcon
      decorative={decorative}
      label={label}
      size={size}
      src={src}
      {...props}
    />
  );
}
