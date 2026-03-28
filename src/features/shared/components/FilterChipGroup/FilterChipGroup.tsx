import { Button } from "@/components/ui";
import styles from "./FilterChipGroup.module.scss";

type FilterChipGroupProps = {
  items: string[];
  selectedItems: string[];
  onToggle: (value: string) => void;
  getClassName: (selected: boolean) => string;
  emptyLabel?: string;
  className?: string;
};

export function FilterChipGroup({
  items,
  selectedItems,
  onToggle,
  getClassName,
  emptyLabel,
  className = "",
}: FilterChipGroupProps) {
  if (items.length === 0) {
    return emptyLabel ? <span className={styles.empty}>{emptyLabel}</span> : null;
  }

  return (
    <div className={[styles.group, className].filter(Boolean).join(" ")}>
      {items.map((item) => {
        const isSelected = selectedItems.includes(item);
        return (
          <Button
            key={item}
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={isSelected}
            className={getClassName(isSelected)}
            onClick={() => onToggle(item)}
          >
            {item}
          </Button>
        );
      })}
    </div>
  );
}
