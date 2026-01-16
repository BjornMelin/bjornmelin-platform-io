import { afterEach, beforeEach, vi } from "vitest";
import { applyDefaultTestEnv } from "./setup-env";

applyDefaultTestEnv();

beforeEach(() => {
  applyDefaultTestEnv();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetAllMocks();
});
