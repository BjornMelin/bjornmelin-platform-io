import { z } from "zod";

/** Defines the schema for shared profile metadata and copy. */
export const ProfileSchema = z.strictObject({
  name: z.string(),
  heroTagline: z.string(),
  shortTitle: z.string(),
  summary: z.string(),
  aboutLead: z.string(),
  aboutBody: z.string(),
  websiteSummary: z.string(),
  keywords: z.array(z.string()),
});

/** Defines the profile data type inferred from ProfileSchema. */
export type Profile = z.infer<typeof ProfileSchema>;
