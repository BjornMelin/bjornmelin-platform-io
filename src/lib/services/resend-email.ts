import { Resend } from "resend";
import { env } from "@/env.mjs";
import type { ContactFormData } from "@/lib/schemas/contact";

// Template for the contact form email
const ContactEmailTemplate = ({
  name,
  email,
  message,
  timestamp,
}: ContactFormData & { timestamp: string }) => ({
  from: `Contact Form <${env.RESEND_FROM_EMAIL || "no-reply@bjornmelin.io"}>`,
  to: env.CONTACT_EMAIL || "bjornmelin16@gmail.com",
  subject: `New Contact Form Submission from ${name}`,
  text: `
Name: ${name}
Email: ${email}
Message: ${message}
Time: ${timestamp}
  `.trim(),
  html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container { 
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background: #ffffff;
    }
    .header { 
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #0070f3;
    }
    .header h2 {
      margin: 0;
      color: #0070f3;
      font-size: 24px;
    }
    .content { 
      margin: 20px 0;
      background: #fafafa;
      padding: 20px;
      border-radius: 8px;
    }
    .field {
      margin-bottom: 15px;
    }
    .field-label {
      font-weight: 600;
      color: #555;
      margin-bottom: 5px;
      display: block;
    }
    .field-value {
      color: #333;
      word-wrap: break-word;
    }
    .message-content {
      white-space: pre-wrap;
      background: #ffffff;
      padding: 15px;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }
    .footer { 
      font-size: 12px;
      color: #666;
      border-top: 1px solid #eee;
      padding-top: 20px;
      margin-top: 30px;
      text-align: center;
    }
    .warning {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 10px;
      border-radius: 4px;
      margin-top: 20px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Contact Form Submission</h2>
    </div>
    
    <div class="content">
      <div class="field">
        <span class="field-label">Name:</span>
        <span class="field-value">${name}</span>
      </div>
      
      <div class="field">
        <span class="field-label">Email:</span>
        <span class="field-value"><a href="mailto:${email}">${email}</a></span>
      </div>
      
      <div class="field">
        <span class="field-label">Message:</span>
        <div class="message-content">${message}</div>
      </div>
    </div>
    
    <div class="warning">
      <strong>Note:</strong> This email was sent from the contact form on bjornmelin.io. 
      Please verify the sender's email address before responding.
    </div>
    
    <div class="footer">
      <p>Submitted at: ${timestamp}</p>
      <p>This is an automated message from bjornmelin.io</p>
    </div>
  </div>
</body>
</html>
  `.trim(),
  replyTo: email,
});

export class ResendEmailService {
  private static instance: ResendEmailService;
  private resend: Resend;

  private constructor() {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  public static getInstance(): ResendEmailService {
    if (!ResendEmailService.instance) {
      ResendEmailService.instance = new ResendEmailService();
    }
    return ResendEmailService.instance;
  }

  public async sendContactFormEmail(data: ContactFormData): Promise<{ id: string }> {
    try {
      const timestamp = new Date().toLocaleString("en-US", {
        timeZone: "America/Denver",
        dateStyle: "full",
        timeStyle: "long",
      });

      const emailData = ContactEmailTemplate({ ...data, timestamp });

      const { data: response, error } = await this.resend.emails.send(emailData);

      if (error) {
        console.error("Resend API error:", error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      if (!response?.id) {
        throw new Error("Failed to send email: No email ID returned");
      }

      console.log(`Email sent successfully with ID: ${response.id}`);
      return { id: response.id };
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email. Please try again later.");
    }
  }

  // Method to send a test email (useful for development/testing)
  public async sendTestEmail(): Promise<{ id: string }> {
    const testData: ContactFormData = {
      name: "Test User",
      email: "test@example.com",
      message: "This is a test message from the contact form.",
      honeypot: "",
      gdprConsent: true,
    };

    return this.sendContactFormEmail(testData);
  }

  // Method to verify the Resend configuration
  public async verifyConfiguration(): Promise<boolean> {
    try {
      // Attempt to send a test email to verify configuration
      const testEmail = {
        from: env.RESEND_FROM_EMAIL || "no-reply@bjornmelin.io",
        to: env.CONTACT_EMAIL || "bjornmelin16@gmail.com",
        subject: "Resend Configuration Test",
        text: "This is a test email to verify Resend configuration.",
      };

      const { error } = await this.resend.emails.send(testEmail);

      if (error) {
        console.error("Resend configuration error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to verify Resend configuration:", error);
      return false;
    }
  }
}
