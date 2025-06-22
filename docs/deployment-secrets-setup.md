# Deployment Secrets Setup Guide

This guide explains how to securely configure environment variables for the email notification system in production deployments.

## Required Environment Variables

The following environment variables must be set in your deployment environment:

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Your Resend API key for sending emails | `re_123456789...` |
| `RESEND_FROM_EMAIL` | The "from" email address for notifications | `noreply@yourdomain.com` |
| `CONTACT_EMAIL` | Email address where contact form submissions are sent | `contact@yourdomain.com` |

## Security Best Practices

1. **Never commit secrets to version control**
   - The `.env.production` file contains only placeholders
   - Actual values must be set in your deployment platform

2. **Use platform-native environment variable management**
   - This provides encryption at rest
   - Automatic injection at runtime
   - Audit logging capabilities

3. **Rotate API keys regularly**
   - Update your Resend API key every 90 days
   - Keep a secure record of key rotation dates

## Platform-Specific Setup

### Vercel

1. Navigate to your project dashboard
2. Go to Settings → Environment Variables
3. Add each variable with the following settings:
   - Environment: Production
   - Encrypted: Yes (default)

```bash
# Using Vercel CLI
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM_EMAIL production
vercel env add CONTACT_EMAIL production
```

### Netlify

1. Navigate to Site settings → Environment variables
2. Add each variable under "Production" environment
3. Variables are automatically encrypted

```bash
# Using Netlify CLI
netlify env:set RESEND_API_KEY "your_api_key" --scope production
netlify env:set RESEND_FROM_EMAIL "noreply@yourdomain.com" --scope production
netlify env:set CONTACT_EMAIL "contact@yourdomain.com" --scope production
```

### Railway

1. Open your project dashboard
2. Go to Variables tab
3. Add each variable (automatically encrypted)

### Render

1. Navigate to Environment → Environment Variables
2. Add each variable as a "Secret" type
3. Secrets are encrypted and not visible after creation

### AWS Amplify

1. Navigate to App settings → Environment variables
2. Add variables and set "Branch" to your production branch
3. Enable encryption for sensitive values

```bash
# Using AWS CLI
aws amplify update-app --app-id YOUR_APP_ID \
  --environment-variables \
  RESEND_API_KEY=your_api_key \
  RESEND_FROM_EMAIL=noreply@yourdomain.com \
  CONTACT_EMAIL=contact@yourdomain.com
```

### Fly.io

```bash
# Using fly CLI
fly secrets set RESEND_API_KEY="your_api_key"
fly secrets set RESEND_FROM_EMAIL="noreply@yourdomain.com"
fly secrets set CONTACT_EMAIL="contact@yourdomain.com"
```

### Heroku

```bash
# Using Heroku CLI
heroku config:set RESEND_API_KEY="your_api_key"
heroku config:set RESEND_FROM_EMAIL="noreply@yourdomain.com"
heroku config:set CONTACT_EMAIL="contact@yourdomain.com"
```

## Getting Your Resend API Key

1. Sign up for a [Resend account](https://resend.com)
2. Navigate to API Keys in your dashboard
3. Create a new API key with "Send email" permission
4. Copy the key immediately (it won't be shown again)

## Email Configuration

### Domain Verification

For production use, you should verify your domain with Resend:

1. Add your domain in Resend dashboard
2. Configure DNS records as instructed
3. Wait for verification (usually < 1 hour)
4. Update `RESEND_FROM_EMAIL` to use your verified domain

### Testing Your Configuration

After deployment, test your email configuration:

1. Submit a test message through your contact form
2. Check Resend dashboard for delivery status
3. Verify email received at `CONTACT_EMAIL` address

## Monitoring and Alerts

Set up monitoring for your email service:

1. **Resend Dashboard**: Monitor email delivery rates
2. **Application Logs**: Check for ResendEmailError logs
3. **Uptime Monitoring**: Set up alerts for API endpoint `/api/contact`

## Troubleshooting

### Common Issues

1. **"RESEND_API_KEY is not configured"**
   - Ensure the environment variable is set in your deployment platform
   - Restart/redeploy your application after adding variables

2. **"Failed to send email: Invalid API key"**
   - Verify your API key is correct and active
   - Check that the key has "Send email" permission

3. **Rate limit errors**
   - Free tier: 100 emails/day, 10 emails/second
   - Implement retry logic (already included in our service)
   - Consider upgrading your Resend plan

4. **Emails not received**
   - Check spam folder
   - Verify domain DNS configuration
   - Review Resend dashboard for bounce/block reasons

## Security Checklist

- [ ] Environment variables set in deployment platform (not in code)
- [ ] `.env.production` contains only placeholders
- [ ] API key has minimal required permissions
- [ ] Domain properly verified with Resend
- [ ] SPF/DKIM records configured for email deliverability
- [ ] Rate limiting enabled on contact form endpoint
- [ ] Monitoring alerts configured
- [ ] Key rotation schedule documented

## Next Steps

1. Choose your deployment platform from the list above
2. Set up the required environment variables
3. Deploy your application
4. Test the contact form functionality
5. Monitor email delivery in Resend dashboard

For additional help, consult:
- [Resend Documentation](https://resend.com/docs)
- [Next.js Environment Variables Guide](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)