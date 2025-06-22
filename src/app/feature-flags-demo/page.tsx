/**
 * Feature Flags Demo Page
 *
 * Demonstrates various feature flag patterns and usage.
 * This is a static page that uses client-side feature flag evaluation.
 */

import type { Metadata } from "next";
import FeatureFlagDemo from "./demo-client";

export const metadata: Metadata = {
  title: "Feature Flags Demo",
  description: "Demonstration of feature flag system capabilities",
};

export default function FeatureFlagsDemoPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Feature Flags Demo</h1>

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          This demo shows feature flag evaluation in a client-side context. For static site
          generation compatibility, all feature flags are evaluated on the client.
        </p>
      </div>

      {/* Client-side demo component */}
      <FeatureFlagDemo />
    </div>
  );
}
