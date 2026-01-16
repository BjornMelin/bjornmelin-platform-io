const defaultEnv: Record<string, string> = {
  AWS_REGION: "us-east-1",
  AWS_ACCESS_KEY_ID: "test-access-key",
  AWS_SECRET_ACCESS_KEY: "test-secret",
  CONTACT_EMAIL: "test@example.com",
  NEXT_PUBLIC_API_URL: "https://api.example.com",
  NEXT_PUBLIC_APP_URL: "https://example.com",
  NEXT_PUBLIC_BASE_URL: "https://example.com",
};

export const applyDefaultTestEnv = (): void => {
  for (const [key, value] of Object.entries(defaultEnv)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

export { defaultEnv };
