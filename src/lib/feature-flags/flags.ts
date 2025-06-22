/**
 * Feature Flag Definitions
 *
 * Central location for all feature flag configurations.
 * This provides type safety and prevents typos in flag keys.
 */

import type { FeatureFlag } from "./types";

/**
 * Feature flag keys as const for type safety
 */
export const FEATURE_FLAGS = {
  // UI Features
  DARK_MODE: "dark-mode",
  NEW_NAVIGATION: "new-navigation",
  ENHANCED_ANIMATIONS: "enhanced-animations",
  BETA_FEATURES: "beta-features",

  // Contact Form Features
  CONTACT_FORM_CAPTCHA: "contact-form-captcha",
  CONTACT_FORM_RATE_LIMIT: "contact-form-rate-limit",
  CONTACT_FORM_FILE_UPLOAD: "contact-form-file-upload",

  // Project Features
  PROJECT_COMMENTS: "project-comments",
  PROJECT_ANALYTICS: "project-analytics",
  PROJECT_SOCIAL_SHARE: "project-social-share",

  // Performance Features
  IMAGE_OPTIMIZATION: "image-optimization",
  LAZY_LOADING: "lazy-loading",
  PREFETCH_ROUTES: "prefetch-routes",

  // Developer Features
  DEBUG_MODE: "debug-mode",
  PERFORMANCE_MONITORING: "performance-monitoring",
  ERROR_TRACKING: "error-tracking",

  // A/B Testing
  HOMEPAGE_VARIANT_B: "homepage-variant-b",
  CTA_BUTTON_COLOR: "cta-button-color",
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

/**
 * Default feature flag configurations
 */
export const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    key: FEATURE_FLAGS.DARK_MODE,
    name: "Dark Mode",
    description: "Enable dark mode theme support",
    defaultValue: true,
    enabled: true,
    rolloutPercentage: 100,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    key: FEATURE_FLAGS.NEW_NAVIGATION,
    name: "New Navigation",
    description: "Enable the redesigned navigation menu",
    defaultValue: false,
    enabled: true,
    rolloutPercentage: 50,
    targetingRules: [
      {
        condition: {
          attribute: "userRole",
          operator: "equals",
          value: "beta-tester",
        },
        value: true,
      },
    ],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    key: FEATURE_FLAGS.CONTACT_FORM_CAPTCHA,
    name: "Contact Form CAPTCHA",
    description: "Enable CAPTCHA verification on contact form",
    defaultValue: true,
    enabled: true,
    rolloutPercentage: 100,
    targetingRules: [
      {
        condition: {
          attribute: "environment",
          operator: "equals",
          value: "development",
        },
        value: false, // Disable in development
      },
    ],
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    key: FEATURE_FLAGS.CONTACT_FORM_RATE_LIMIT,
    name: "Contact Form Rate Limiting",
    description: "Enable rate limiting for contact form submissions",
    defaultValue: true,
    enabled: true,
    rolloutPercentage: 100,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    key: FEATURE_FLAGS.PROJECT_ANALYTICS,
    name: "Project Analytics",
    description: "Track and display project view analytics",
    defaultValue: false,
    enabled: true,
    rolloutPercentage: 25,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    key: FEATURE_FLAGS.IMAGE_OPTIMIZATION,
    name: "Image Optimization",
    description: "Enable next/image optimization features",
    defaultValue: true,
    enabled: true,
    rolloutPercentage: 100,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    key: FEATURE_FLAGS.DEBUG_MODE,
    name: "Debug Mode",
    description: "Show debug information in UI",
    defaultValue: false,
    enabled: true,
    rolloutPercentage: 100,
    targetingRules: [
      {
        condition: {
          attribute: "environment",
          operator: "notEquals",
          value: "production",
        },
        value: true,
      },
      {
        condition: {
          attribute: "customAttributes.debugUser",
          operator: "equals",
          value: "true",
        },
        value: true,
      },
    ],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    key: FEATURE_FLAGS.CTA_BUTTON_COLOR,
    name: "CTA Button Color",
    description: "Color variant for call-to-action buttons",
    defaultValue: "blue",
    enabled: true,
    rolloutPercentage: 100,
    targetingRules: [
      {
        condition: {
          attribute: "customAttributes.abTestGroup",
          operator: "equals",
          value: "variant-a",
        },
        value: "green",
      },
      {
        condition: {
          attribute: "customAttributes.abTestGroup",
          operator: "equals",
          value: "variant-b",
        },
        value: "purple",
      },
    ],
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
];

/**
 * Type-safe flag getter
 */
export function getFlagConfig(key: FeatureFlagKey): FeatureFlag | undefined {
  return DEFAULT_FLAGS.find((flag) => flag.key === key);
}

/**
 * Environment-specific flag overrides
 */
export function getEnvironmentFlags(): Partial<Record<FeatureFlagKey, Partial<FeatureFlag>>> {
  const env = process.env.NODE_ENV;

  if (env === "development") {
    return {
      [FEATURE_FLAGS.DEBUG_MODE]: { defaultValue: true },
      [FEATURE_FLAGS.ERROR_TRACKING]: { enabled: false },
      [FEATURE_FLAGS.PERFORMANCE_MONITORING]: { enabled: false },
    };
  }

  if (env === "test") {
    return {
      [FEATURE_FLAGS.CONTACT_FORM_RATE_LIMIT]: { enabled: false },
      [FEATURE_FLAGS.IMAGE_OPTIMIZATION]: { enabled: false },
    };
  }

  return {};
}
