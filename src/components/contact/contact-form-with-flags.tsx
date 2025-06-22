"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, Shield } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  FEATURE_FLAGS,
  FeatureFlag,
  useFeatureFlagEnabled,
} from "@/lib/feature-flags/client-exports";
import { type ContactFormData, contactFormSchema } from "@/lib/schemas/contact";

/**
 * Enhanced Contact Form with Feature Flags
 *
 * Demonstrates:
 * - CAPTCHA protection (when enabled)
 * - Rate limiting indicators
 * - Debug information
 * - File upload support (future feature)
 */
export function ContactFormWithFlags() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">("idle");
  const { toast } = useToast();

  // Feature flags
  const captchaEnabled = useFeatureFlagEnabled(FEATURE_FLAGS.CONTACT_FORM_CAPTCHA);
  const rateLimitEnabled = useFeatureFlagEnabled(FEATURE_FLAGS.CONTACT_FORM_RATE_LIMIT);
  const fileUploadEnabled = useFeatureFlagEnabled(FEATURE_FLAGS.CONTACT_FORM_FILE_UPLOAD);
  const debugEnabled = useFeatureFlagEnabled(FEATURE_FLAGS.DEBUG_MODE);

  // Generate unique IDs for form fields
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const gdprId = useId();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setFormStatus("idle");

    try {
      // Simulate CAPTCHA verification if enabled
      if (captchaEnabled) {
        // In a real implementation, this would verify with a CAPTCHA service
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add rate limit header if enabled
          ...(rateLimitEnabled && { "X-Rate-Limit-Check": "true" }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setFormStatus("success");
      reset();
      toast({
        title: "Message sent!",
        description: "Thanks for reaching out. I'll get back to you soon.",
      });
    } catch (error) {
      setFormStatus("error");
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feature flags status (only in debug mode) */}
      {debugEnabled && (
        <Alert className="border-blue-500">
          <Shield className="h-4 w-4" />
          <AlertTitle>Feature Flags Status</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1 text-sm">
              <div>
                CAPTCHA:{" "}
                <Badge variant={captchaEnabled ? "default" : "secondary"}>
                  {captchaEnabled ? "ON" : "OFF"}
                </Badge>
              </div>
              <div>
                Rate Limiting:{" "}
                <Badge variant={rateLimitEnabled ? "default" : "secondary"}>
                  {rateLimitEnabled ? "ON" : "OFF"}
                </Badge>
              </div>
              <div>
                File Upload:{" "}
                <Badge variant={fileUploadEnabled ? "default" : "secondary"}>
                  {fileUploadEnabled ? "ON" : "OFF"}
                </Badge>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Rate limit warning */}
        <FeatureFlag flag={FEATURE_FLAGS.CONTACT_FORM_RATE_LIMIT}>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please note: Contact form submissions are limited to prevent spam.
            </AlertDescription>
          </Alert>
        </FeatureFlag>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              type="text"
              placeholder="John Doe"
              {...register("name")}
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? `${nameId}-error` : undefined}
            />
            {errors.name && (
              <p id={`${nameId}-error`} className="text-sm text-red-500">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              id={emailId}
              type="email"
              placeholder="john@example.com"
              {...register("email")}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? `${emailId}-error` : undefined}
            />
            {errors.email && (
              <p id={`${emailId}-error`} className="text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={messageId}>Message</Label>
          <Textarea
            id={messageId}
            placeholder="Your message..."
            className="min-h-[150px]"
            {...register("message")}
            aria-invalid={errors.message ? "true" : "false"}
            aria-describedby={errors.message ? `${messageId}-error` : undefined}
          />
          {errors.message && (
            <p id={`${messageId}-error`} className="text-sm text-red-500">
              {errors.message.message}
            </p>
          )}
        </div>

        {/* File upload (when enabled) */}
        <FeatureFlag flag={FEATURE_FLAGS.CONTACT_FORM_FILE_UPLOAD}>
          <div className="space-y-2">
            <Label htmlFor="file">Attachment (Optional)</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              disabled={!fileUploadEnabled}
            />
            <p className="text-sm text-gray-500">
              Max file size: 5MB. Accepted formats: PDF, DOC, DOCX, TXT
            </p>
          </div>
        </FeatureFlag>

        {/* CAPTCHA placeholder */}
        <FeatureFlag flag={FEATURE_FLAGS.CONTACT_FORM_CAPTCHA}>
          <div className="flex items-center justify-center p-4 border rounded bg-gray-50 dark:bg-gray-900">
            <Shield className="mr-2 h-4 w-4" />
            <span className="text-sm">CAPTCHA verification would appear here</span>
          </div>
        </FeatureFlag>

        <div className="flex items-start space-x-2">
          <input
            id={gdprId}
            type="checkbox"
            className="mt-1"
            {...register("gdprConsent")}
            aria-invalid={errors.gdprConsent ? "true" : "false"}
            aria-describedby={errors.gdprConsent ? `${gdprId}-error` : undefined}
          />
          <div className="space-y-1">
            <Label htmlFor={gdprId} className="text-sm font-normal">
              I consent to the processing of my personal data for the purpose of responding to my
              inquiry
            </Label>
            {errors.gdprConsent && (
              <p id={`${gdprId}-error`} className="text-sm text-red-500">
                {errors.gdprConsent.message}
              </p>
            )}
          </div>
        </div>

        {formStatus === "success" && (
          <Alert className="border-green-500">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Your message has been sent successfully. I'll get back to you soon.
            </AlertDescription>
          </Alert>
        )}

        {formStatus === "error" && (
          <Alert className="border-red-500">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error sending your message. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={!isValid || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Message"
          )}
        </Button>
      </form>
    </div>
  );
}
