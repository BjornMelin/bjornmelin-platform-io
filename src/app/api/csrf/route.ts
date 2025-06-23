import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { generateCSRFToken } from "@/lib/security/csrf-modern";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Generate CSRF token
    const token = generateCSRFToken();

    // Generate session ID for this request
    const sessionId = `${Date.now()}-${randomBytes(16).toString("hex")}`;

    return NextResponse.json(
      {
        token,
        expiresIn: 3600, // 1 hour in seconds
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "X-Session-ID": sessionId,
        },
      },
    );
  } catch (error) {
    console.error("CSRF token generation error:", error);
    return NextResponse.json({ error: "Failed to generate CSRF token" }, { status: 500 });
  }
}
