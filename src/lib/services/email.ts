import { type SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { env } from "@/env.mjs";
import { createSESClient } from "@/lib/aws/ses";
import type { ContactFormData } from "@/lib/schemas/contact";

export class EmailService {
  private static instance: EmailService;
  private sesClient: SESClient;

  private constructor() {
    this.sesClient = createSESClient();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendContactFormEmail(data: ContactFormData): Promise<void> {
    const command = new SendEmailCommand({
      Source: `no-reply@${env.NEXT_PUBLIC_APP_URL}`,
      Destination: {
        ToAddresses: [env.CONTACT_EMAIL],
      },
      Message: {
        Subject: {
          Data: `New Contact Form Submission from ${data.name}`,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: this.createTextContent(data),
            Charset: "UTF-8",
          },
          Html: {
            Data: this.createHtmlContent(data),
            Charset: "UTF-8",
          },
        },
      },
    });

    await this.sesClient.send(command);
  }

  private createTextContent(data: ContactFormData): string {
    return `
Name: ${data.name}
Email: ${data.email}
Message: ${data.message}
Time: ${new Date().toISOString()}
    `.trim();
  }

  private createHtmlContent(data: ContactFormData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 20px auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 15px; border-radius: 5px; }
    .content { margin: 20px 0; }
    .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Contact Form Submission</h2>
    </div>
    <div class="content">
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Message:</strong></p>
      <p>${data.message}</p>
    </div>
    <div class="footer">
      <p>Submitted at: ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
