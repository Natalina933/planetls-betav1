import { Button } from "@/components/ui";
import styles from "./OptionToggleGroup.module.scss";

type ToggleOption<T extends string> = {
  value: T;
  label: string;
};

type OptionToggleGroupProps<T extends string> = {
  ariaLabel: string;
  options: readonly ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  getClassName: (selected: boolean) => string;
  className?: string;
};

export function OptionToggleGroup<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  getClassName,
  className = "",
}: OptionToggleGroupProps<T>) {
  return (
    <div className={[styles.group, className].filter(Boolean).join(" ")} aria-label={ariaLabel}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            size="sm"
            className={getClassName(isSelected)}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
