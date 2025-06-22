"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FEATURE_FLAGS,
  FeatureFlag,
  useFeatureFlag,
  useFeatureFlagEnabled,
  useFeatureFlags,
  useFeatureFlagUserContext,
} from "@/lib/feature-flags/client-exports";

export default function FeatureFlagDemo() {
  const { updateUser, clearUser } = useFeatureFlagUserContext();
  const [userRole, setUserRole] = useState<string>("user");

  // Individual flag hooks
  const darkMode = useFeatureFlag(FEATURE_FLAGS.DARK_MODE);
  const newNavEnabled = useFeatureFlagEnabled(FEATURE_FLAGS.NEW_NAVIGATION);
  const ctaColor = useFeatureFlag(FEATURE_FLAGS.CTA_BUTTON_COLOR, "blue");

  // Multiple flags
  const multipleFlags = useFeatureFlags([
    FEATURE_FLAGS.CONTACT_FORM_CAPTCHA,
    FEATURE_FLAGS.PROJECT_ANALYTICS,
    FEATURE_FLAGS.IMAGE_OPTIMIZATION,
  ]);

  const handleUserRoleChange = (role: string) => {
    setUserRole(role);
    updateUser(`user-${Date.now()}`, `${role}@example.com`, role, {
      abTestGroup: role === "beta-tester" ? "variant-a" : "variant-b",
    });
  };

  return (
    <div className="space-y-8">
      {/* User Context Controls */}
      <Card>
        <CardHeader>
          <CardTitle>User Context</CardTitle>
          <CardDescription>
            Change user context to see how targeting rules affect feature flags
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={userRole === "user" ? "default" : "outline"}
              onClick={() => handleUserRoleChange("user")}
            >
              Regular User
            </Button>
            <Button
              variant={userRole === "beta-tester" ? "default" : "outline"}
              onClick={() => handleUserRoleChange("beta-tester")}
            >
              Beta Tester
            </Button>
            <Button
              variant={userRole === "admin" ? "default" : "outline"}
              onClick={() => handleUserRoleChange("admin")}
            >
              Admin
            </Button>
            <Button variant="outline" onClick={clearUser}>
              Clear User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Client-Side Evaluation */}
      <Card>
        <CardHeader>
          <CardTitle>Client-Side Evaluation</CardTitle>
          <CardDescription>Real-time feature flag evaluation in the browser</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Individual Flags:</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>Dark Mode:</span>
                <Badge variant={darkMode.enabled ? "default" : "secondary"}>
                  {darkMode.enabled ? "Enabled" : "Disabled"}
                </Badge>
                {darkMode.loading && <span className="text-sm text-gray-500">Loading...</span>}
              </div>

              <div className="flex items-center gap-2">
                <span>New Navigation:</span>
                <Badge variant={newNavEnabled ? "default" : "secondary"}>
                  {newNavEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span>CTA Button Color:</span>
                <Badge style={{ backgroundColor: ctaColor.value as string }}>
                  {ctaColor.value as string}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Multiple Flags:</h3>
            <div className="space-y-1">
              {Object.entries(multipleFlags).map(([key, flag]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-sm">{key}:</span>
                  <Badge variant={flag.enabled ? "default" : "secondary"} className="text-xs">
                    {flag.value?.toString()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flag Component Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Component-Based Feature Flags</CardTitle>
          <CardDescription>
            Using the FeatureFlag component for conditional rendering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureFlag
            flag={FEATURE_FLAGS.BETA_FEATURES}
            fallback={
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
                <p>Standard features are available.</p>
              </div>
            }
          >
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded">
              <p className="font-medium">🎉 Beta features are enabled!</p>
              <p className="text-sm mt-2">You have access to experimental features.</p>
            </div>
          </FeatureFlag>

          <FeatureFlag
            flag={FEATURE_FLAGS.PROJECT_ANALYTICS}
            loading={<p className="text-gray-500">Checking analytics access...</p>}
          >
            <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 rounded">
              <p className="font-medium">📊 Analytics Dashboard</p>
              <p className="text-sm mt-2">View detailed analytics for your projects.</p>
            </div>
          </FeatureFlag>
        </CardContent>
      </Card>
    </div>
  );
}
