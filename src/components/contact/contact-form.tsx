"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useId, useState } from "react";
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

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">("idle");
  const { toast } = useToast();
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();

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
        body: JSON.stringify(data),
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
            Please try again. If the problem persists, you can email me directly at{" "}
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
              className="underline hover:text-red-400"
            >
              {process.env.NEXT_PUBLIC_CONTACT_EMAIL}
            </a>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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
