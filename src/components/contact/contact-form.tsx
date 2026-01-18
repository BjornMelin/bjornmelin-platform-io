"use client";

/**
 * Contact form component with client-side validation and POST to
 * `${NEXT_PUBLIC_API_URL}/contact`.
 *
 * Includes honeypot and timing-based abuse prevention and provides accessible
 * success/error feedback via alerts and toasts.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { buildContactEndpoint, safeParseUrl } from "@/lib/api/contact";
import { type ContactFormData, contactFormSchema } from "@/lib/schemas/contact";

interface APIErrorResponse {
  error: string;
  code?: string;
  details?: Array<{ message: string; path: Array<string | number> }>;
}

/**
 * Contact form UI with validation and submission logic.
 *
 * @returns A fully accessible contact form.
 */
export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">("idle");
  const { toast } = useToast();
  const idPrefix = useId();
  const fieldIds = useMemo(
    () => ({
      name: `${idPrefix}-name`,
      email: `${idPrefix}-email`,
      message: `${idPrefix}-message`,
      honeypot: `${idPrefix}-hp`,
    }),
    [idPrefix],
  );
  // Track when form was loaded for timing-based abuse prevention
  const formLoadTime = useRef(Date.now());
  const [honeypot, setHoneypot] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setFormStatus("idle");

    try {
      const allowLocalContact = process.env.NEXT_PUBLIC_ALLOW_LOCAL_CONTACT === "true";
      const runtimeApiUrl = (
        globalThis as typeof globalThis & {
          __CONTACT_API_URL__?: string;
        }
      ).__CONTACT_API_URL__;
      let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || runtimeApiUrl;

      if (!apiBaseUrl) {
        if (allowLocalContact) {
          // Must include /api prefix to avoid hitting the Next.js /contact page (HTML)
          apiBaseUrl = `${window.location.origin}/api`;
        } else {
          throw new Error(
            "Contact form is not configured. Set NEXT_PUBLIC_API_URL in your environment (see .env.example).",
          );
        }
      }

      // Final safeguard: if the URL points to the same origin without an /api prefix,
      // it will likely hit our own HTML page instead of an API.
      const url = safeParseUrl(apiBaseUrl);
      if (
        url &&
        url.origin === window.location.origin &&
        (!url.pathname.startsWith("/api") || !allowLocalContact)
      ) {
        throw new Error(
          "Contact API is not available on the same origin unless explicitly allowed via NEXT_PUBLIC_ALLOW_LOCAL_CONTACT. Set NEXT_PUBLIC_API_URL to a deployed API.",
        );
      }

      let endpoint: string;
      try {
        endpoint = buildContactEndpoint(apiBaseUrl);
      } catch {
        throw new Error(
          "Invalid NEXT_PUBLIC_API_URL. Expected a full URL like https://api.your-domain.com.",
        );
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          honeypot,
          formLoadTime: formLoadTime.current,
        }),
      });

      // Explicitly check if we got HTML instead of JSON (common when hitting the wrong route)
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/html")) {
        throw new Error(
          "The API returned HTML instead of JSON. You might be hitting the contact page instead of an API route.",
        );
      }

      let result: APIErrorResponse | null = null;
      try {
        result = (await response.json()) as APIErrorResponse;
      } catch {
        throw new Error("Failed to send message. The API returned invalid JSON.");
      }

      if (!response.ok) {
        // Map API validation errors onto form fields.
        if (response.status === 400 && result?.details) {
          const validFields: ReadonlySet<keyof ContactFormData> = new Set([
            "name",
            "email",
            "message",
          ]);
          result.details.forEach(({ message, path }) => {
            const field = path[0] as keyof ContactFormData;
            if (typeof field === "string" && validFields.has(field)) {
              setError(field, { message });
            } else {
              // eslint-disable-next-line no-console
              console.warn("contact-form: unexpected field error", field);
            }
          });
          throw new Error("Please check the form for errors");
        }

        throw new Error(result?.error || "Failed to send message");
      }

      setFormStatus("success");
      toast({
        title: "Message sent!",
        description: "Thanks for your message. I'll get back to you soon.",
      });
      reset();
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
        <Alert
          role="status"
          aria-live="polite"
          className="border-emerald-200/70 bg-emerald-50/90 text-emerald-950 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-50"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
          <AlertTitle>Message Sent Successfully!</AlertTitle>
          <AlertDescription className="text-emerald-800/90 dark:text-emerald-200/90">
            Thank you for your message. I&apos;ll get back to you as soon as possible.
          </AlertDescription>
        </Alert>
      )}

      {formStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to Send Message</AlertTitle>
          <AlertDescription>
            Please try again. If the problem persists, reach out via the contact form later or send
            a message through{" "}
            <a
              href="https://www.linkedin.com/in/bjornmelin/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm underline hover:text-red-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              LinkedIn
            </a>
            .
          </AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
        aria-busy={isSubmitting}
      >
        {/* Honeypot field - hidden from users, catches bots */}
        <div className="absolute -left-[9999px] opacity-0 pointer-events-none" aria-hidden="true">
          <label htmlFor={fieldIds.honeypot}>
            Leave this field empty
            <input
              type="text"
              id={fieldIds.honeypot}
              name="honeypot"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        <div className="space-y-2">
          <Label htmlFor={fieldIds.name}>Name</Label>
          <Input
            id={fieldIds.name}
            type="text"
            placeholder="Your name…"
            {...register("name")}
            autoComplete="name"
            aria-describedby={errors.name ? `${fieldIds.name}-error` : undefined}
            aria-invalid={!!errors.name}
            disabled={isSubmitting}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p id={`${fieldIds.name}-error`} className="text-sm text-red-500">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={fieldIds.email}>Email</Label>
          <Input
            id={fieldIds.email}
            type="email"
            placeholder="your.email@example.com…"
            {...register("email")}
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            aria-describedby={errors.email ? `${fieldIds.email}-error` : undefined}
            aria-invalid={!!errors.email}
            disabled={isSubmitting}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p id={`${fieldIds.email}-error`} className="text-sm text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={fieldIds.message}>Message</Label>
          <Textarea
            id={fieldIds.message}
            placeholder="Your message…"
            {...register("message")}
            autoComplete="off"
            aria-describedby={errors.message ? `${fieldIds.message}-error` : undefined}
            aria-invalid={!!errors.message}
            disabled={isSubmitting}
            rows={5}
            className={errors.message ? "border-red-500" : ""}
          />
          {errors.message && (
            <p id={`${fieldIds.message}-error`} className="text-sm text-red-500">
              {errors.message.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Send Message"
          )}
        </Button>
      </form>
    </div>
  );
}
