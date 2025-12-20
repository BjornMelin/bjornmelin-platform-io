import type { ContactFormData } from "@/lib/schemas/contact";
import { getResendClient } from "./resend-client";
import { createContactEmailHtml, createContactEmailText } from "./templates/contact-form";

export interface SendContactEmailOptions {
  /** Contact form submission data */
  data: ContactFormData;
  /** Sender email address (e.g., 'Contact Form <contact@bjornmelin.io>') */
  from: string;
  /** Recipient email address */
  to: string;
}

/**
 * Sends a contact form email using Resend.
 *
 * @param options Email sending options including form data, from, and to addresses.
 * @throws {Error} When email sending fails.
 */
export async function sendContactEmail({ data, from, to }: SendContactEmailOptions): Promise<void> {
  const resend = getResendClient();
  const submittedAt = new Date();

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: data.email,
    subject: `Contact Form: ${data.name}`,
    html: createContactEmailHtml({ data, submittedAt }),
    text: createContactEmailText({ data, submittedAt }),
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
