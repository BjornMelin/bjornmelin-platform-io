"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Loader2,
  Mail,
  MessageSquare,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useCSRFHeaders } from "@/components/providers/csrf-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { type ContactFormData, contactFormSchema } from "@/lib/schemas/contact";
import { cn } from "@/lib/utils";

// Animation variants
const formVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const successVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 10,
    },
  },
  exit: { scale: 0, opacity: 0 },
};

// Custom error messages for better UX
const getFieldErrorMessage = (error: { message?: string; type?: string }): string => {
  if (error?.message) {
    return error.message;
  }
  if (error?.type === "required") {
    return "This field is required";
  }
  if (error?.type === "min") {
    return "This field is too short";
  }
  if (error?.type === "max") {
    return "This field is too long";
  }
  if (error?.type === "pattern") {
    return "Please enter a valid value";
  }
  return "Please check this field";
};

export function ContactFormEnhanced() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const csrfHeaders = useCSRFHeaders();

  // Generate unique IDs for form fields
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const honeypotId = useId();
  const gdprId = useId();

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    reset,
    watch,
    setFocus,
    setValue,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      message: "",
      honeypot: "",
      gdprConsent: false,
    },
  });

  // Watch form values for button state
  const watchedValues = watch();
  const hasAllRequiredFields =
    watchedValues.name?.length >= 2 &&
    watchedValues.email?.length > 0 &&
    watchedValues.message?.length >= 10 &&
    watchedValues.gdprConsent === true;

  // Focus on first error field
  useEffect(() => {
    const firstErrorField = Object.keys(errors)[0] as keyof ContactFormData;
    if (firstErrorField && firstErrorField !== "honeypot") {
      setFocus(firstErrorField);
    }
  }, [errors, setFocus]);

  // Handle form submission
  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: csrfHeaders,
        body: JSON.stringify(data),
        credentials: "same-origin",
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const resetTime = response.headers.get("X-RateLimit-Reset");
          const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null;
          const minutesUntilReset = resetDate
            ? Math.ceil((resetDate.getTime() - Date.now()) / 60000)
            : 15;

          toast({
            title: "Too many requests",
            description: `Please wait ${minutesUntilReset} minute${minutesUntilReset > 1 ? "s" : ""} before trying again.`,
            variant: "destructive",
            duration: 10000,
          });
          return;
        }

        // Handle validation errors
        if (result.errors && Array.isArray(result.errors)) {
          toast({
            title: "Validation Error",
            description: "Please check the form fields and try again.",
            variant: "destructive",
          });
          return;
        }

        throw new Error(result.error || "Failed to send message");
      }

      // Success!
      setSubmitSuccess(true);
      reset();

      // Show success toast
      toast({
        title: "Message sent successfully!",
        description: "Thank you for reaching out. I'll get back to you soon.",
        duration: 5000,
      });

      // Reset success state after animation
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Contact form error:", error);
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="relative w-full max-w-2xl mx-auto p-8 backdrop-blur-xl bg-card/50 border-primary/10 overflow-hidden">
      <AnimatePresence mode="wait">
        {submitSuccess ? (
          <motion.div
            key="success"
            variants={successVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 flex flex-col items-center justify-center bg-card/95 z-10"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Thank You!</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Your message has been sent successfully. I'll get back to you as soon as possible.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.form
        ref={formRef}
        variants={formVariants}
        initial="initial"
        animate="animate"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
        aria-label="Contact form"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Get in Touch
          </h2>
          <p className="text-muted-foreground">
            Have a question or want to work together? Send me a message!
          </p>
        </div>

        {/* Name Field */}
        <motion.div
          className="space-y-2"
          animate={{ x: errors.name ? [0, -10, 10, -10, 0] : 0 }}
          transition={{ duration: 0.4 }}
        >
          <Label htmlFor={nameId} className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id={nameId}
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            aria-describedby={errors.name ? `${nameId}-error` : undefined}
            aria-invalid={!!errors.name}
            className={cn(
              "transition-colors",
              errors.name && "border-destructive focus-visible:ring-destructive",
              touchedFields.name && !errors.name && "border-green-500",
            )}
            {...register("name")}
          />
          {errors.name && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              id={`${nameId}-error`}
              className="text-sm text-destructive flex items-center gap-1"
              role="alert"
            >
              <AlertCircle className="w-3 h-3" />
              {getFieldErrorMessage(errors.name)}
            </motion.p>
          )}
        </motion.div>

        {/* Email Field */}
        <motion.div
          className="space-y-2"
          animate={{ x: errors.email ? [0, -10, 10, -10, 0] : 0 }}
          transition={{ duration: 0.4 }}
        >
          <Label htmlFor={emailId} className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id={emailId}
            type="email"
            autoComplete="email"
            placeholder="john@example.com"
            aria-describedby={errors.email ? `${emailId}-error` : undefined}
            aria-invalid={!!errors.email}
            className={cn(
              "transition-colors",
              errors.email && "border-destructive focus-visible:ring-destructive",
              touchedFields.email && !errors.email && "border-green-500",
            )}
            {...register("email")}
          />
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              id={`${emailId}-error`}
              className="text-sm text-destructive flex items-center gap-1"
              role="alert"
            >
              <AlertCircle className="w-3 h-3" />
              {getFieldErrorMessage(errors.email)}
            </motion.p>
          )}
        </motion.div>

        {/* Message Field */}
        <motion.div
          className="space-y-2"
          animate={{ x: errors.message ? [0, -10, 10, -10, 0] : 0 }}
          transition={{ duration: 0.4 }}
        >
          <Label htmlFor={messageId} className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Message <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id={messageId}
            placeholder="Tell me about your project or idea..."
            rows={5}
            aria-describedby={errors.message ? `${messageId}-error` : undefined}
            aria-invalid={!!errors.message}
            className={cn(
              "resize-none transition-colors",
              errors.message && "border-destructive focus-visible:ring-destructive",
              touchedFields.message && !errors.message && "border-green-500",
            )}
            {...register("message")}
          />
          <div className="flex justify-between items-center">
            {errors.message ? (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                id={`${messageId}-error`}
                className="text-sm text-destructive flex items-center gap-1"
                role="alert"
              >
                <AlertCircle className="w-3 h-3" />
                {getFieldErrorMessage(errors.message)}
              </motion.p>
            ) : (
              <span className="text-xs text-muted-foreground">Minimum 10 characters</span>
            )}
            <span className="text-xs text-muted-foreground">
              {watchedValues.message?.length || 0} / 1000
            </span>
          </div>
        </motion.div>

        {/* Honeypot field (hidden) */}
        <div className="sr-only" aria-hidden="true">
          <Label htmlFor={honeypotId}>Leave this field empty</Label>
          <Input
            id={honeypotId}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("honeypot")}
          />
        </div>

        {/* GDPR Consent */}
        <motion.div
          className="space-y-2"
          animate={{ x: errors.gdprConsent ? [0, -10, 10, -10, 0] : 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-start space-x-2">
            <Checkbox
              id={gdprId}
              aria-describedby={errors.gdprConsent ? `${gdprId}-error` : undefined}
              aria-invalid={!!errors.gdprConsent}
              checked={watchedValues.gdprConsent}
              onCheckedChange={(checked) => {
                setValue("gdprConsent", checked === true, { shouldValidate: true });
              }}
            />
            <div className="space-y-1 leading-none">
              <Label
                htmlFor={gdprId}
                className="text-sm font-normal cursor-pointer flex items-start gap-2"
              >
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  I agree to the{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    privacy policy
                  </a>{" "}
                  and consent to the processing of my data{" "}
                  <span className="text-destructive">*</span>
                </span>
              </Label>
            </div>
          </div>
          {errors.gdprConsent && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              id={`${gdprId}-error`}
              className="text-sm text-destructive flex items-center gap-1 ml-6"
              role="alert"
            >
              <AlertCircle className="w-3 h-3" />
              {getFieldErrorMessage(errors.gdprConsent)}
            </motion.p>
          )}
        </motion.div>

        {/* Submit Button */}
        <motion.div
          whileHover={{ scale: hasAllRequiredFields && !isSubmitting ? 1.02 : 1 }}
          whileTap={{ scale: hasAllRequiredFields && !isSubmitting ? 0.98 : 1 }}
        >
          <Button
            type="submit"
            size="lg"
            disabled={!hasAllRequiredFields || isSubmitting}
            className="w-full relative overflow-hidden"
            aria-busy={isSubmitting}
          >
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </motion.span>
              ) : (
                <motion.span
                  key="send"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  Send Message
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Form Status for Screen Readers */}
        <output className="sr-only" aria-live="polite" aria-atomic="true">
          {isSubmitting && "Sending your message..."}
          {submitSuccess && "Message sent successfully!"}
          {Object.keys(errors).length > 0 && "Please fix the errors in the form."}
        </output>
      </motion.form>
    </Card>
  );
}
