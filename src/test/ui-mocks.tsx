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
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
  }) => (
    <select
      aria-label="Sort projects by"
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
  ToggleGroupItem: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
  ),
};
