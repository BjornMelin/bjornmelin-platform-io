import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/api/trpc";
import { contactFormSchema } from "@/lib/schemas/contact";
import { Resend } from "resend";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = "bjornmelin16@gmail.com";

// Log API key presence (not the actual key)
console.log("Resend API Key loaded:", !!process.env.RESEND_API_KEY);

// Simple in-memory rate limiting
const requestLog = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3; // 3 requests per minute

export const contactRouter = router({
  submit: publicProcedure
    .input(contactFormSchema)
    .mutation(async ({ input, ctx }) => {
      const clientIp = ctx.req?.ip || "unknown";
      const now = Date.now();
      const userLog = requestLog.get(clientIp);

      // Check rate limit
      if (userLog) {
        if (now - userLog.timestamp < RATE_LIMIT_DURATION) {
          if (userLog.count >= MAX_REQUESTS) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Please wait before submitting another message",
            });
          }
          requestLog.set(clientIp, {
            count: userLog.count + 1,
            timestamp: userLog.timestamp,
          });
        } else {
          // Reset if time window has passed
          requestLog.set(clientIp, { count: 1, timestamp: now });
        }
      } else {
        requestLog.set(clientIp, { count: 1, timestamp: now });
      }

      try {
        console.log("Attempting to send email...");
        // Send email using Resend
        const result = await resend.emails.send({
          from: "Contact Form <onboarding@resend.dev>",
          to: ADMIN_EMAIL,
          subject: `New Contact Form Submission from ${input.name}`,
          text: `
Name: ${input.name}
Email: ${input.email}
Message: ${input.message}
          `,
          html: `
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${input.name}</p>
<p><strong>Email:</strong> ${input.email}</p>
<p><strong>Message:</strong></p>
<p>${input.message}</p>
          `,
        });

        console.log("Email sent successfully:", result);

        return {
          success: true,
          message: "Message sent successfully",
        };
      } catch (error) {
        console.error("Error sending email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message. Please try again later.",
        });
      }
    }),
});
