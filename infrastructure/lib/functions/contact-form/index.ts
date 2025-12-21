import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Resend } from "resend";
import {
  type ContactFormData,
  createContactEmailHtml,
  createContactEmailText,
  validateContactForm,
} from "../../../../src/lib/email/templates/contact-form";
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
let cachedResendApiKey: string | null = null;
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
 * Extracts the Resend API key from SSM parameter value.
 * Supports both JSON format `{"apiKey":"re_xxx",...}` and plain string.
 */
function extractApiKey(rawValue: string): string {
  try {
    const parsed = JSON.parse(rawValue) as { apiKey?: unknown };
    if (typeof parsed.apiKey === "string" && parsed.apiKey) {
      return parsed.apiKey;
    }
  } catch {
    // Not JSON - fall through to return raw value
  }
  return rawValue;
}

/**
 * Gets or creates a Resend client with API key from SSM.
 */
async function getResendClient(): Promise<Resend> {
  const paramName = requireEnv("SSM_RESEND_API_KEY_PARAM");
  const rawValue = await getParameter(paramName, true);
  if (!rawValue) throw new Error(`Resend API key missing from SSM parameter: ${paramName}`);

  const apiKey = extractApiKey(rawValue);
  if (!apiKey)
    throw new Error(`Resend API key missing 'apiKey' field in SSM parameter: ${paramName}`);

  if (resend && cachedResendApiKey === apiKey) return resend;

  cachedResendApiKey = apiKey;
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

  // Check for missing body before try block (client error, not server error)
  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Invalid request",
        message: "Missing request body",
      }),
    };
  }

  try {
    const data: ContactFormData = JSON.parse(event.body);
    const validationResult = validateContactForm(data);

    if (!validationResult.valid) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: validationResult.error }),
      };
    }

    // Get email recipient and Resend client
    const recipientEmail = await resolveRecipientEmail();
    const resendClient = await getResendClient();

    // Send email via Resend using shared templates
    const { error } = await resendClient.emails.send({
      from: `Contact Form <contact@${domain}>`,
      to: recipientEmail,
      replyTo: data.email,
      subject: `Contact Form: ${data.name}`,
      html: createContactEmailHtml({ data, domain }),
      text: createContactEmailText({ data, domain }),
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
