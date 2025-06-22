#!/usr/bin/env node

/**
 * Quick script to test email configuration
 * Run with: node scripts/test-email.mjs
 */

import { config } from 'dotenv';
import { Resend } from 'resend';

// Load environment variables
config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    console.log('🚀 Testing email configuration...\n');
    console.log('From:', process.env.RESEND_FROM_EMAIL);
    console.log('To:', process.env.CONTACT_EMAIL);
    console.log('API Key:', process.env.RESEND_API_KEY.substring(0, 10) + '...\n');
    
    const { data, error } = await resend.emails.send({
      from: `Test <${process.env.RESEND_FROM_EMAIL}>`,
      to: process.env.CONTACT_EMAIL,
      subject: 'Test Email from bjornmelin.io',
      text: 'This is a test email to verify your Resend configuration is working correctly.',
      html: '<p>This is a test email to verify your <strong>Resend configuration</strong> is working correctly.</p>'
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      
      // Provide helpful error messages
      if (error.message?.includes('domain')) {
        console.log('\n💡 Tip: Your domain may not be verified. Try using:');
        console.log('   RESEND_FROM_EMAIL=onboarding@resend.dev');
      }
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('📧 Email ID:', data.id);
    console.log('\n✉️  Check your inbox at:', process.env.CONTACT_EMAIL);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testEmail();