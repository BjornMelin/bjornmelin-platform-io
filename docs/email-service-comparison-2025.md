# Email Service Comparison: AWS SNS/SES vs Resend API (June 2025)

## Executive Comparison

| Criteria | AWS SNS/SES | Resend API | Winner |
|----------|-------------|------------|---------|
| Setup Time | 30-60 minutes | 5-10 minutes | **Resend** |
| Developer Experience | Complex, AWS-centric | Excellent, Next.js-focused | **Resend** |
| Free Tier | 1,000 emails/month | 3,000 emails/month | **Resend** |
| Maintenance | High (IAM, domains, Lambda) | Low (API key only) | **Resend** |
| TypeScript Support | Via AWS SDK v3 | Native, first-class | **Resend** |
| Email Templates | DIY or use SES templates | React Email support | **Resend** |
| Local Development | Complex with LocalStack | Simple with API key | **Resend** |
| Monitoring | CloudWatch (complex) | Built-in dashboard | **Resend** |
| Cost at Scale | Cheaper at >500k/month | Competitive pricing | **AWS** (high volume only) |

## Detailed Analysis

### 1. Implementation Complexity

#### AWS SES Setup Requirements:
- Create and verify domain in SES
- Set up DNS records (SPF, DKIM, DMARC)
- Create IAM roles and policies
- Deploy Lambda function for email handling
- Configure API Gateway
- Set up CloudWatch logging
- Handle sandbox restrictions

#### Resend Setup Requirements:
- Sign up and get API key
- Add environment variable
- Install SDK: `pnpm add resend`
- Start sending emails

### 2. Code Comparison

#### AWS SES Implementation:
```typescript
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const client = new SESClient({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export async function sendEmail(to: string, subject: string, body: string) {
  const command = new SendEmailCommand({
    Destination: { ToAddresses: [to] },
    Message: {
      Body: {
        Html: { Charset: "UTF-8", Data: body },
        Text: { Charset: "UTF-8", Data: body }
      },
      Subject: { Charset: "UTF-8", Data: subject }
    },
    Source: process.env.FROM_EMAIL!,
  });

  try {
    const response = await client.send(command);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error("SES Error:", error);
    throw error;
  }
}
```

#### Resend Implementation:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, body: string) {
  const { data, error } = await resend.emails.send({
    from: 'Contact Form <noreply@yourdomain.com>',
    to,
    subject,
    html: body
  });

  if (error) throw error;
  return { success: true, messageId: data.id };
}
```

### 3. Cost Analysis

#### For Low Volume (<3,000 emails/month):
- **AWS SES**: $0 (within free tier of 1,000) + Lambda costs
- **Resend**: $0 (within free tier of 3,000)
- **Winner**: Resend (3x larger free tier)

#### For Medium Volume (10,000 emails/month):
- **AWS SES**: $1.00 + Lambda costs (~$0.50)
- **Resend**: $20/month
- **Winner**: AWS SES

#### For High Volume (100,000 emails/month):
- **AWS SES**: $10.00 + Lambda costs (~$5)
- **Resend**: $65/month
- **Winner**: AWS SES

#### For Very High Volume (1,000,000 emails/month):
- **AWS SES**: $100 + Lambda costs (~$50)
- **Resend**: Custom pricing (likely ~$300-500)
- **Winner**: AWS SES

### 4. Developer Experience Features

#### Resend Advantages:
- **Email Preview**: See exactly how emails look before sending
- **Analytics Dashboard**: Track opens, clicks, bounces in real-time
- **React Email Support**: Write emails as React components
- **Webhook Support**: Real-time delivery notifications
- **Batch Sending**: Send up to 100 emails in one API call
- **Scheduling**: Schedule emails for future delivery
- **Domain Reputation**: Automatic monitoring and alerts

#### AWS SES Limitations:
- No built-in email preview
- Analytics require CloudWatch setup
- No native React component support
- Webhooks via SNS (complex setup)
- Batch sending requires custom implementation
- No built-in scheduling
- Reputation monitoring via CloudWatch

### 5. Next.js Integration

#### Resend + Next.js App Router:
```typescript
// app/api/contact/route.ts
import { Resend } from 'resend';
import { ContactEmail } from '@/emails/contact';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { name, email, message } = await request.json();
  
  const { data, error } = await resend.emails.send({
    from: 'Contact <contact@yourdomain.com>',
    to: 'you@example.com',
    subject: `New message from ${name}`,
    react: ContactEmail({ name, email, message }) // React component!
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ id: data.id });
}
```

#### AWS SES + Next.js (More Complex):
- Requires Lambda function deployment
- API Gateway configuration
- CORS setup
- Environment-specific configurations
- No React component support

### 6. Testing and Development

#### Resend Testing:
```typescript
// Easy to mock
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'test-id' } })
    }
  }))
}));
```

#### AWS SES Testing:
- Requires AWS SDK mocks
- Complex Lambda testing
- LocalStack setup for integration tests
- Sandbox limitations in development

### 7. Common Use Cases

#### Choose Resend When:
- Building modern Next.js applications
- Need quick implementation
- Want excellent developer experience
- Sending <50,000 emails/month
- Need email analytics without complexity
- Want to use React for email templates

#### Choose AWS SES When:
- Already heavily invested in AWS
- Sending >500,000 emails/month
- Need multi-region redundancy
- Require fine-grained IAM controls
- Building enterprise applications
- Need to integrate with other AWS services

### 8. Migration Path

#### From AWS SES to Resend:
1. Sign up for Resend account
2. Add Resend SDK to project
3. Update email sending code
4. Test with small batch
5. Update environment variables
6. Remove AWS SES infrastructure

#### From Resend to AWS SES:
1. Set up AWS SES domain verification
2. Create Lambda functions
3. Deploy infrastructure
4. Update email sending code
5. Configure monitoring
6. Migrate in batches

## 2025 Market Insights

Based on current trends and developer feedback:

1. **Resend is gaining rapid adoption** in the Next.js community
2. **Developer experience is paramount** for small to medium projects
3. **Serverless email** (like Resend) aligns with edge computing trends
4. **React Email** is becoming the standard for email templates
5. **AWS SES remains dominant** for enterprise and high-volume senders

## Recommendation

For the bjornmelin-platform-io project:
- **Use Resend API exclusively**
- Remove AWS SES infrastructure
- Leverage React Email for templates
- Monitor usage and costs
- Consider AWS SES only if email volume exceeds 50,000/month

This provides the best balance of developer experience, cost, and maintainability for a modern Next.js application in 2025.