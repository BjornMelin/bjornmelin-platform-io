/**
 * Contact form email templates and validation constants.
 *
 * This module is shared between:
 * - Frontend (Next.js API routes)
 * - Lambda (AWS infrastructure contact form handler)
 *
 * Keep this module free of Next.js-specific imports to ensure Lambda compatibility.
 */

/**
 * Validation limits for contact form fields.
 * Used by both Zod schemas (frontend) and Lambda validation.
 */
export const CONTACT_FORM_LIMITS = {
  name: { min: 2, max: 50 },
  message: { min: 10, max: 1000 },
} as const;

/**
 * Contact form data structure.
 */
export type ContactFormData = import("../../schemas/contact").ContactFormData;

/**
 * Options for email template generation.
 */
export interface EmailTemplateOptions {
  data: ContactFormData;
  submittedAt?: Date;
  /** Domain for the email footer. Defaults to bjornmelin.io if not provided. */
  domain?: string;
}

const DEFAULT_DOMAIN = "bjornmelin.io";

function resolveDomain(domain?: string): string {
  return domain || DEFAULT_DOMAIN;
}

/**
 * Creates the plain text version of the contact form email.
 *
 * @param options Template options including form data and optional timestamp/domain.
 * @returns Plain text email content.
 */
export function createContactEmailText(options: EmailTemplateOptions): string {
  const { data, submittedAt: rawSubmittedAt, domain } = options;
  const submittedAt = rawSubmittedAt instanceof Date ? rawSubmittedAt : new Date();
  const siteDomain = resolveDomain(domain);
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
  const { data, submittedAt: rawSubmittedAt, domain } = options;
  const submittedAt = rawSubmittedAt instanceof Date ? rawSubmittedAt : new Date();
  const siteDomain = resolveDomain(domain);
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
 * Exported for use in Lambda and other contexts.
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

/**
 * Result of contact form validation.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  field?: string;
}

/**
 * Validates contact form data without Zod dependency.
 * Used by Lambda where Zod may add unnecessary bundle size.
 *
 * @param data Partial contact form data to validate.
 * @returns Validation result with error details if invalid.
 */
export function validateContactForm(data: {
  name?: unknown;
  email?: unknown;
  message?: unknown;
}): ValidationResult {
  const { name, email, message } = data;
  const { name: nameLimits, message: msgLimits } = CONTACT_FORM_LIMITS;

  if (!name || typeof name !== "string") {
    return {
      valid: false,
      error: `Name must be at least ${nameLimits.min} characters`,
      field: "name",
    };
  }

  const normalizedName = name.trim();
  if (normalizedName.length < nameLimits.min) {
    return {
      valid: false,
      error: `Name must be at least ${nameLimits.min} characters`,
      field: "name",
    };
  }
  if (normalizedName.length > nameLimits.max) {
    return {
      valid: false,
      error: `Name must be less than ${nameLimits.max} characters`,
      field: "name",
    };
  }

  if (/[\r\n]/.test(normalizedName)) {
    return { valid: false, error: "Invalid name", field: "name" };
  }

  if (!email || typeof email !== "string") {
    return { valid: false, error: "Invalid email address", field: "email" };
  }

  const normalizedEmail = email.trim();
  if (/[\r\n]/.test(normalizedEmail)) {
    return { valid: false, error: "Invalid email address", field: "email" };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { valid: false, error: "Invalid email address", field: "email" };
  }

  if (!message || typeof message !== "string") {
    return {
      valid: false,
      error: `Message must be at least ${msgLimits.min} characters`,
      field: "message",
    };
  }

  const normalizedMessage = message.trim();
  if (normalizedMessage.length < msgLimits.min) {
    return {
      valid: false,
      error: `Message must be at least ${msgLimits.min} characters`,
      field: "message",
    };
  }
  if (normalizedMessage.length > msgLimits.max) {
    return {
      valid: false,
      error: `Message must be less than ${msgLimits.max} characters`,
      field: "message",
    };
  }

  return { valid: true };
}
