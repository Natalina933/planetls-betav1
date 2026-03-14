import { Input, Select } from "@/components/ui";

type ConversationFilterOption = {
  label: string;
  value: string;
};

interface ConversationFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchLabel: string;
  statusValue: string;
  onStatusChange: (value: string) => void;
  statusLabel: string;
  statusOptions: ConversationFilterOption[];
  containerClassName: string;
  searchClassName: string;
  selectClassName: string;
  children?: React.ReactNode;
}

export function ConversationFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchLabel,
  statusValue,
  onStatusChange,
  statusLabel,
  statusOptions,
  containerClassName,
  searchClassName,
  selectClassName,
  children,
}: ConversationFiltersProps) {
  return (
    <div className={containerClassName}>
      <Input
        bare
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchLabel}
        className={searchClassName}
      />
      <Select
        value={statusValue}
        onChange={(event) => onStatusChange(event.target.value)}
        className={selectClassName}
        aria-label={statusLabel}
        title={statusLabel}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {children}
    </div>
  );
}
