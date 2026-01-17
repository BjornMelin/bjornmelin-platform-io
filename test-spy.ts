import * as React from "react";
import { expect, it, vi } from "vitest";

it("spies on useState", () => {
  const spy = vi.spyOn(React, "useState");
  React.useState(0);
  expect(spy).toHaveBeenCalled();
});
