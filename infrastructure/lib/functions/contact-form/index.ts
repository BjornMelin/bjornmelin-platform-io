import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getParameter } from "../../utils/ssm";

/**
 * Retrieves a required environment variable or throws when missing.
 *
 * @param name Environment variable key to read.
 * @returns Non-empty environment variable value.
 * @throws {Error} When the environment variable is not defined.
 */
const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const region = requireEnv("REGION");
const senderEmail = requireEnv("SENDER_EMAIL");
let cachedRecipientEmail: string | null = null;
/**
 * Resolves the contact recipient email strictly from AWS SSM Parameter Store.
 *
 * @returns Recipient email address retrieved and decrypted from SSM.
 * @throws {Error} When the SSM parameter name is absent or the value is empty.
 */
export async function resolveRecipientEmail(): Promise<string> {
  if (cachedRecipientEmail) return cachedRecipientEmail;
  const paramName = requireEnv("SSM_RECIPIENT_EMAIL_PARAM");
  const value = await getParameter(paramName, true);
  if (!value) throw new Error(`Recipient email missing from SSM parameter: ${paramName}`);
  cachedRecipientEmail = value;
  return value;
}

const ses = new SESClient({ region });

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

// Types
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

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const origin = event.headers.origin || event.headers.Origin;

  // CORS headers
  const corsHeaders: {
    "Access-Control-Allow-Headers": string;
    "Access-Control-Allow-Methods": string;
    "Access-Control-Allow-Origin"?: string;
  } = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Validate the origin
  if (origin) {
    if (allowedOrigins.includes(origin)) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    } else {
      // Optionally, you can return an error response for disallowed origins
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Forbidden" }),
      };
    }
  }

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    // Parse and validate input
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

    // Send email
    const recipientEmail = await resolveRecipientEmail();
    await ses.send(
      new SendEmailCommand({
        Source: senderEmail,
        Destination: {
          ToAddresses: [recipientEmail],
        },
        Message: {
          Subject: {
            Data: `New Contact Form Submission from ${data.name}`,
            Charset: "UTF-8",
          },
          Body: {
            Text: {
              Data: `
Name: ${data.name}
Email: ${data.email}
Message: ${data.message}
Time: ${new Date().toISOString()}
              `,
              Charset: "UTF-8",
            },
            Html: {
              Data: `
<!DOCTYPE html>
<html>
<body>
  <h2>New Contact Form Submission</h2>
  <p><strong>Name:</strong> ${data.name}</p>
  <p><strong>Email:</strong> ${data.email}</p>
  <p><strong>Message:</strong></p>
  <p>${data.message}</p>
  <hr>
  <p><small>Time: ${new Date().toISOString()}</small></p>
</body>
</html>
              `,
              Charset: "UTF-8",
            },
          },
        },
      }),
    );

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
