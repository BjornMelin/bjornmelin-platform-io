import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const region = requireEnv("REGION");
const senderEmail = requireEnv("SENDER_EMAIL");
const recipientEmail = requireEnv("RECIPIENT_EMAIL");

const ses = new SESClient({ region });

// Allowed origins (replace with your actual domains)
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN,
  process.env.DOMAIN_NAME ? `https://${process.env.DOMAIN_NAME}` : undefined,
  process.env.DOMAIN_NAME ? `https://www.${process.env.DOMAIN_NAME}` : undefined,
].filter((origin): origin is string => typeof origin === "string" && origin.length > 0);

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
