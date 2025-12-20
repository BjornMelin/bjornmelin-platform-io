import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Resend } from "resend";
import { getParameter } from "../../utils/ssm";

/**
 * Retrieves a required environment variable or throws when missing.
 */
const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const domain = requireEnv("DOMAIN_NAME");
let cachedRecipientEmail: string | null = null;
let resend: Resend | null = null;

/**
 * Resolves the contact recipient email from AWS SSM Parameter Store.
 */
async function resolveRecipientEmail(): Promise<string> {
  if (cachedRecipientEmail) return cachedRecipientEmail;
  const paramName = requireEnv("SSM_RECIPIENT_EMAIL_PARAM");
  const value = await getParameter(paramName, true);
  if (!value) throw new Error(`Recipient email missing from SSM parameter: ${paramName}`);
  cachedRecipientEmail = value;
  return value;
}

/**
 * Gets or creates a Resend client with API key from SSM.
 */
async function getResendClient(): Promise<Resend> {
  if (resend) return resend;
  const paramName = requireEnv("SSM_RESEND_API_KEY_PARAM");
  const apiKey = await getParameter(paramName, true);
  if (!apiKey) throw new Error(`Resend API key missing from SSM parameter: ${paramName}`);
  resend = new Resend(apiKey);
  return resend;
}

const parseAllowedOrigins = (): string[] => {
  const origins = new Set<string>();
  const csvOrigins = process.env.ALLOWED_ORIGINS;
  if (csvOrigins) {
    for (const origin of csvOrigins.split(",")) {
      const trimmed = origin.trim();
      if (trimmed) {
        origins.add(trimmed);
      }
    }
  }

  const singleOrigin = process.env.ALLOWED_ORIGIN;
  if (singleOrigin) {
    origins.add(singleOrigin);
  }

  const domainName = process.env.DOMAIN_NAME;
  if (domainName) {
    origins.add(`https://${domainName}`);
    origins.add(`https://www.${domainName}`);
    origins.add(`https://api.${domainName}`);
  }

  return Array.from(origins);
};

const allowedOrigins = parseAllowedOrigins();

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

function validateInput(data: ContactFormData): string | null {
  if (!data.name || typeof data.name !== "string" || data.name.length < 2) {
    return "Name must be at least 2 characters long";
  }
  if (!data.email || !data.email.includes("@")) {
    return "Invalid email address";
  }
  if (!data.message || typeof data.message !== "string" || data.message.length < 10) {
    return "Message must be at least 10 characters long";
  }
  return null;
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

/**
 * Creates HTML email content for contact form submission.
 */
function createHtmlContent(data: ContactFormData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 20px auto; padding: 20px; background: #fff; border-radius: 8px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }
    .header h2 { color: #fff; margin: 0; }
    .field { margin-bottom: 16px; }
    .field-label { font-weight: 600; color: #555; font-size: 14px; text-transform: uppercase; }
    .field-value { margin-top: 4px; }
    .message-box { background: #f9fafb; padding: 16px; border-radius: 6px; border-left: 4px solid #667eea; margin-top: 8px; }
    .footer { font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 16px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h2>New Contact Form Submission</h2></div>
    <div class="field"><div class="field-label">Name</div><div class="field-value">${escapeHtml(data.name)}</div></div>
    <div class="field"><div class="field-label">Email</div><div class="field-value"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></div></div>
    <div class="field"><div class="field-label">Message</div><div class="message-box">${escapeHtml(data.message).replace(/\n/g, "<br>")}</div></div>
    <div class="footer"><p>Submitted at: ${new Date().toISOString()}</p><p>This email was sent from the contact form on ${domain}</p></div>
  </div>
</body>
</html>`.trim();
}

/**
 * Creates plain text email content for contact form submission.
 */
function createTextContent(data: ContactFormData): string {
  return `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}

Message:
${data.message}

---
Submitted at: ${new Date().toISOString()}
`.trim();
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const origin = event.headers.origin || event.headers.Origin;

  const corsHeaders: {
    "Access-Control-Allow-Headers": string;
    "Access-Control-Allow-Methods": string;
    "Access-Control-Allow-Origin"?: string;
  } = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (origin) {
    if (allowedOrigins.includes(origin)) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    } else {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Forbidden" }),
      };
    }
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    if (!event.body) {
      throw new Error("Missing request body");
    }

    const data: ContactFormData = JSON.parse(event.body);
    const validationError = validateInput(data);

    if (validationError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: validationError }),
      };
    }

    // Get email recipient and Resend client
    const recipientEmail = await resolveRecipientEmail();
    const resendClient = await getResendClient();

    // Send email via Resend
    const { error } = await resendClient.emails.send({
      from: `Contact Form <contact@${domain}>`,
      to: recipientEmail,
      replyTo: data.email,
      subject: `Contact Form: ${data.name}`,
      html: createHtmlContent(data),
      text: createTextContent(data),
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Error processing contact form:", error);

    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Invalid request format",
          message: "The request body must be valid JSON",
        }),
      };
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Failed to send email",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
