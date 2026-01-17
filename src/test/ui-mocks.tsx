import type { ReactNode } from "react";

/**
 * Shared mock implementations for Radix UI components.
 * These are intended to be used with vi.mock() in test files.
 */

export const SelectMocks = {
  Select: ({
    value,
    onValueChange,
    children,
    "aria-label": ariaLabel = "Sort projects by",
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
    "aria-label"?: string;
  }) => (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) =>
    placeholder ? (
      <option value="" disabled hidden>
        {placeholder}
      </option>
    ) : null,
  SelectGroup: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectLabel: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectSeparator: () => null,
  SelectScrollUpButton: () => null,
  SelectScrollDownButton: () => null,
};

export const ToggleGroupMocks = {
  ToggleGroup: ({
    onValueChange,
    children,
  }: {
    onValueChange: (value: string) => void;
    children: ReactNode;
  }) => (
    <div>
      <button type="button" onClick={() => onValueChange("")}>
        Clear
      </button>
      {children}
    </div>
  ),
  ToggleGroupItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
};
