import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges conditional class names without duplicates", () => {
    expect(
      cn(
        "p-2",
        "text-sm",
        {
          hidden: false,
          "text-sm": true,
          "font-bold": true,
        },
        undefined,
        "font-bold",
      ),
    ).toBe("p-2 text-sm font-bold");
  });
});
