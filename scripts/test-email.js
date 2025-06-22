#!/usr/bin/env node

/**
 * Quick script to test email configuration
 * Run with: node scripts/test-email.js
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Resend } from "resend";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    console.log("🚀 Testing email configuration...\n");

    const { data, error } = await resend.emails.send({
      from: `Test <${process.env.RESEND_FROM_EMAIL}>`,
      to: process.env.CONTACT_EMAIL,
      subject: "Test Email from bjornmelin.io",
      text: "This is a test email to verify your Resend configuration is working correctly.",
      html: "<p>This is a test email to verify your <strong>Resend configuration</strong> is working correctly.</p>",
    });

    if (error) {
      console.error("❌ Error sending email:", error);
      return;
    }

    console.log("✅ Email sent successfully!");
    console.log("📧 Email ID:", data.id);
    console.log("\nCheck your inbox at:", process.env.CONTACT_EMAIL);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

testEmail();
