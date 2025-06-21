import { describe, expect, it } from "vitest";
import { cn } from "../../utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
    expect(cn("foo", null, "bar")).toBe("foo bar");
    expect(cn("foo", false, "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe("base active");
  });

  it("merges tailwind classes correctly", () => {
    // Should override conflicting classes
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("mt-4 mb-4", "my-2")).toBe("my-2");
  });

  it("handles arrays of classes", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
    expect(cn("foo", ["bar", "baz"])).toBe("foo bar baz");
  });

  it("handles object notation", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
    expect(cn(undefined)).toBe("");
    expect(cn(null)).toBe("");
  });

  it("trims whitespace", () => {
    expect(cn("  foo  ", "  bar  ")).toBe("foo bar");
    expect(cn("foo ", " bar")).toBe("foo bar");
  });

  it("handles complex nested structures", () => {
    expect(
      cn(
        "base",
        ["array-class-1", "array-class-2"],
        {
          "object-class-1": true,
          "object-class-2": false,
        },
        undefined,
        null,
        false,
        "final-class"
      )
    ).toBe("base array-class-1 array-class-2 object-class-1 final-class");
  });
});