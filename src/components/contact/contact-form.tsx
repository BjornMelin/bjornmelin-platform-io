"use client";

/**
 * @fileoverview Contact form component with client-side validation and POST to
 * /api/contact. Displays success/error alerts and toasts.
 * Includes honeypot and timing-based abuse prevention.
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
import { type ContactFormData, contactFormSchema } from "@/lib/schemas/contact";

interface APIErrorResponse {
  error: string;
  code?: string;
  details?: Array<{ message: string; path: string[] }>;
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
  // Honeypot field value
  const [honeypot, setHoneypot] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setFormStatus("idle");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
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

      const result = (await response.json()) as APIErrorResponse;

      if (!response.ok) {
        // Handle validation errors
        if (response.status === 400 && result.details) {
          result.details.forEach(({ message, path }) => {
            const field = path[0] as keyof ContactFormData;
            setError(field, { message });
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
            Please try again. If the problem persists, reach out via the contact form later or send
            a message through{" "}
            <a
              href="https://www.linkedin.com/in/bjornmelin/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-red-400"
            >
              LinkedIn
            </a>
            .
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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
            placeholder="Your name"
            {...register("name")}
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
            placeholder="your.email@example.com"
            {...register("email")}
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
            placeholder="Your message..."
            {...register("message")}
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

        <Button type="submit" disabled={isSubmitting || !isValid} className="w-full">
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
