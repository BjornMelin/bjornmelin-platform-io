import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { Toaster } from "@/components/ui/toaster";
import { PROFILE } from "@/lib/profile";

export const metadata: Metadata = {
  title: `Contact | ${PROFILE.name}`,
  description: "Get in touch with me through this contact form.",
};

/**
 * Contact page component displaying a contact form for visitors to send messages.
 * @returns The rendered contact page with form and toast notifications.
 */
export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-balance text-3xl font-bold tracking-tighter">Contact Me</h1>
          <p className="text-muted-foreground">
            Have a question or want to get in touch? Fill out the form below and I&apos;ll get back
            to you as soon as possible.
          </p>
        </div>
        <ContactForm />
      </div>
      <Toaster />
    </div>
  );
}
