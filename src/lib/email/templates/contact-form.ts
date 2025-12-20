import { env } from "@/env.mjs";
import type { ContactFormData } from "@/lib/schemas/contact";

interface EmailTemplateOptions {
  data: ContactFormData;
  submittedAt?: Date;
  domain?: string;
}

const DEFAULT_DOMAIN = "bjornmelin.io";

function getDomain(domain?: string): string {
  return domain ?? env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? DEFAULT_DOMAIN;
}

/**
 * Creates the plain text version of the contact form email.
 *
 * @param options Template options including form data and optional timestamp/domain.
 * @returns Plain text email content.
 */
export function createContactEmailText(options: EmailTemplateOptions): string {
  const { data, submittedAt = new Date(), domain } = options;
  const siteDomain = getDomain(domain);
  return `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}

Message:
${data.message}

---
Submitted at: ${submittedAt.toISOString()}
Sent from: ${siteDomain}
  `.trim();
}

/**
 * Creates the HTML version of the contact form email.
 *
 * @param options Template options including form data and optional timestamp/domain.
 * @returns HTML email content.
 */
export function createContactEmailHtml(options: EmailTemplateOptions): string {
  const { data, submittedAt = new Date(), domain } = options;
  const siteDomain = getDomain(domain);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      border-radius: 8px 8px 0 0;
      margin: -20px -20px 20px -20px;
    }
    .header h2 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
    }
    .content {
      margin: 20px 0;
    }
    .field {
      margin-bottom: 16px;
    }
    .field-label {
      font-weight: 600;
      color: #555;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .field-value {
      margin-top: 4px;
      color: #333;
    }
    .message-box {
      background: #f9fafb;
      padding: 16px;
      border-radius: 6px;
      border-left: 4px solid #667eea;
      margin-top: 8px;
    }
    .footer {
      font-size: 12px;
      color: #888;
      border-top: 1px solid #eee;
      padding-top: 16px;
      margin-top: 24px;
    }
    a {
      color: #667eea;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
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
        <div class="field-label">Name</div>
        <div class="field-value">${escapeHtml(data.name)}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value">
          <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>
        </div>
      </div>
      <div class="field">
        <div class="field-label">Message</div>
        <div class="message-box">${escapeHtml(data.message).replace(/\n/g, "<br>")}</div>
      </div>
    </div>
    <div class="footer">
      <p>Submitted at: ${submittedAt.toISOString()}</p>
      <p>This email was sent from the contact form on ${siteDomain}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Escapes HTML special characters to prevent XSS.
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] ?? char);
}
