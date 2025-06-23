"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  type EnhancedContactFormData,
  enhancedContactFormSchema,
} from "@/lib/validation/contact-schema";

interface APIErrorResponse {
  error: string;
  code?: string;
  details?: Array<{ field: string; message: string }>;
  resetTime?: string;
}

interface CSRFTokenResponse {
  token: string;
  expiresIn: number;
}

export function SecureContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">("idle");
  const [csrfToken, setCSRFToken] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const { toast } = useToast();

  // Generate unique IDs for form fields
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const gdprId = useId();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isValid, touchedFields },
  } = useForm<EnhancedContactFormData>({
    resolver: zodResolver(enhancedContactFormSchema),
    mode: "onChange",
    criteriaMode: "all",
    shouldUseNativeValidation: true,
    progressive: true,
    defaultValues: {
      honeypot: "",
      gdprConsent: false,
      clientInfo: {
        timestamp: Date.now(),
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    },
  });

  // Fetch CSRF token on component mount
  useEffect(() => {
    async function fetchCSRFToken() {
      try {
        const response = await fetch("/api/csrf");
        const data = (await response.json()) as CSRFTokenResponse;

        setCSRFToken(data.token);
        setValue("csrfToken", data.token);

        // Store session ID from response headers
        const sessionHeader = response.headers.get("X-Session-ID");
        if (sessionHeader) {
          setSessionId(sessionHeader);
        }
      } catch (error) {
        console.error("Failed to fetch CSRF token:", error);
        toast({
          title: "Security Error",
          description: "Failed to initialize security token. Please refresh the page.",
          variant: "destructive",
        });
      }
    }

    fetchCSRFToken();
  }, [setValue, toast]);

  // Update timestamp periodically to prevent stale requests
  useEffect(() => {
    const interval = setInterval(() => {
      setValue("clientInfo.timestamp", Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [setValue]);

  // Watch form values to determine if button should be enabled
  const watchedValues = watch();
  const hasAllRequiredFields =
    watchedValues.name?.length >= 2 &&
    watchedValues.email?.length > 0 &&
    watchedValues.message?.length >= 10 &&
    watchedValues.gdprConsent === true &&
    csrfToken !== "";

  const onSubmit = async (data: EnhancedContactFormData) => {
    setIsSubmitting(true);
    setFormStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
          "X-Session-ID": sessionId,
        },
        body: JSON.stringify({
          ...data,
          clientInfo: {
            ...data.clientInfo,
            timestamp: Date.now(), // Ensure fresh timestamp
          },
        }),
      });

      const result = (await response.json()) as APIErrorResponse;

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const _resetTime = response.headers.get("X-RateLimit-Reset");

          throw new Error(`Too many requests. Please try again in ${retryAfter} seconds.`);
        }

        // Handle CSRF errors
        if (response.status === 403 && result.code === "CSRF_VALIDATION_FAILED") {
          // Fetch new CSRF token and retry once
          const csrfResponse = await fetch("/api/csrf");
          const csrfData = (await csrfResponse.json()) as CSRFTokenResponse;
          setCSRFToken(csrfData.token);
          setValue("csrfToken", csrfData.token);

          throw new Error("Security token expired. Please try again.");
        }

        // Handle validation errors
        if (response.status === 400 && result.details) {
          result.details.forEach(({ field, message }) => {
            const fieldPath = field.split(".") as any;
            setError(fieldPath[0], { message });
          });
          throw new Error("Please check the form for errors");
        }

        throw new Error(result.error || "Failed to send message");
      }

      setFormStatus("success");
      toast({
        title: "Message sent!",
        description: "Thanks for your message. I'll get back to you soon.",
      });

      // Reset form and fetch new CSRF token
      reset();
      const csrfResponse = await fetch("/api/csrf");
      const csrfData = (await csrfResponse.json()) as CSRFTokenResponse;
      setCSRFToken(csrfData.token);
      setValue("csrfToken", csrfData.token);
    } catch (error) {
      setFormStatus("error");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {formStatus === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Message Sent Successfully!</AlertTitle>
          <AlertDescription>
            Thank you for your message. I&apos;ll get back to you as soon as possible.
          </AlertDescription>
        </Alert>
      )}

      {formStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to Send Message</AlertTitle>
          <AlertDescription>
            Please try again. If the problem persists, you can email me directly at{" "}
            <a href="mailto:bjorn@bjornmelin.com" className="underline hover:text-red-400">
              bjorn@bjornmelin.com
            </a>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Hidden fields */}
        <input type="hidden" {...register("csrfToken")} value={csrfToken} />
        <input
          type="text"
          {...register("honeypot")}
          className="sr-only"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <div className="space-y-2">
          <Label htmlFor={nameId}>Name</Label>
          <Input
            id={nameId}
            type="text"
            placeholder="Your name"
            {...register("name")}
            aria-describedby={errors.name ? `${nameId}-error` : undefined}
            aria-invalid={!!errors.name}
            disabled={isSubmitting}
            className={errors.name ? "border-red-500" : ""}
            autoComplete="name"
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
            placeholder="your.email@example.com"
            {...register("email")}
            aria-describedby={errors.email ? `${emailId}-error` : undefined}
            aria-invalid={!!errors.email}
            disabled={isSubmitting}
            className={errors.email ? "border-red-500" : ""}
            autoComplete="email"
          />
          {errors.email && (
            <p id={`${emailId}-error`} className="text-sm text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={messageId}>Message</Label>
          <Textarea
            id={messageId}
            placeholder="Your message..."
            {...register("message")}
            aria-describedby={errors.message ? `${messageId}-error` : undefined}
            aria-invalid={!!errors.message}
            disabled={isSubmitting}
            rows={5}
            className={errors.message ? "border-red-500" : ""}
          />
          {errors.message && (
            <p id={`${messageId}-error`} className="text-sm text-red-500">
              {errors.message.message}
            </p>
          )}
        </div>

        {/* GDPR Consent */}
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <input
              id={gdprId}
              type="checkbox"
              {...register("gdprConsent")}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              aria-describedby={errors.gdprConsent ? `${gdprId}-error` : undefined}
              disabled={isSubmitting}
            />
            <div className="flex-1">
              <Label htmlFor={gdprId} className="text-sm font-normal">
                I agree to the processing of my personal data in accordance with the{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                >
                  Privacy Policy
                </a>
              </Label>
              {errors.gdprConsent && (
                <p id={`${gdprId}-error`} className="text-sm text-red-500 mt-1">
                  {errors.gdprConsent.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !hasAllRequiredFields ||
            (Object.keys(touchedFields).length > 0 && !isValid)
          }
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Message"
          )}
        </Button>

        {/* Security notice */}
        <p className="text-xs text-muted-foreground text-center">
          This form is protected by CSRF tokens and rate limiting for security.
        </p>
      </form>
    </div>
  );
}
