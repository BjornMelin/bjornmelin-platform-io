# Data Schemas

Data schemas used throughout the application.

## API Schemas

### Contact Form Schema

Located in `src/lib/schemas/contact.ts`:

```typescript
import { z } from "zod";

export const contactFormSchema = z.looseObject({
  name: z.string().min(2).max(50),
  email: z.email(),
  message: z.string().min(10).max(1000),
});
```

Server-side validation adds abuse prevention fields:

```typescript
export const contactFormWithSecuritySchema = z.strictObject({
  name: z.string().min(2).max(50),
  email: z.email(),
  message: z.string().min(10).max(1000),
  honeypot: z.string().length(0).optional(),
  formLoadTime: z.number().int().optional(),
});
```

| Field | Type | Constraints |
| ------- | ------ | ------------- |
| `name` | string | 2-50 characters |
| `email` | string | Valid email format |
| `message` | string | 10-1000 characters |

## Data Models

### Project Type

Located in `src/types/project.ts`:

```typescript
type Project = {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  category: string;
  image: string;
  links: {
    github?: string;
    live?: string;
    demo?: string;
  };
  featured?: boolean;
};
```

### Project Schema (runtime validation)

Located in `src/lib/schemas/project.ts`:

```typescript
import { z } from "zod";

export const projectSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  technologies: z.array(z.string().min(1)).min(1),
  category: z.string().min(1),
  image: z.string().min(1),
  links: z.strictObject({
    github: z.url().optional(),
    live: z.url().optional(),
    demo: z.url().optional(),
  }),
  featured: z.boolean().optional(),
});
```

## Static Data Types

Located in `src/data/`:

### Certifications

```typescript
interface Certification {
  title: string;
  issuer: string;
  date: string;
  image: string;
}
```

### Experience

```typescript
interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  description: string[];
  technologies: string[];
}
```

### Education

```typescript
interface Education {
  school: string;
  degree: string;
  field: string;
  graduationDate: string;
}
```

### Skills

```typescript
interface Skill {
  category: string;
  items: string[];
}
```

## Environment Variables

Type-safe environment variables are defined in `src/env.mjs` using `@t3-oss/env-nextjs`:

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    AWS_REGION: z.string().min(1).optional(),
    AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    CONTACT_EMAIL: z.email(),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.url(),
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    NEXT_PUBLIC_BASE_URL: z.url(),
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
```

### Required Variables

| Variable | Type | Description |
| ---------- | ------ | ------------- |
| `CONTACT_EMAIL` | string | Destination email for contact form |
| `NEXT_PUBLIC_APP_URL` | string | Public URL of the application |
| `NEXT_PUBLIC_BASE_URL` | string | Public base URL |
| `NEXT_PUBLIC_API_URL` | string | Public API URL |

### Optional Variables

| Variable | Type | Description |
| ---------- | ------ | ------------- |
| `AWS_REGION` | string | AWS region (used by infrastructure tooling) |
| `AWS_ACCESS_KEY_ID` | string | AWS access key (uses instance role if not set) |
| `AWS_SECRET_ACCESS_KEY` | string | AWS secret key (uses instance role if not set) |
| `RESEND_API_KEY` | string | Resend API key (local dev only) |
| `EMAIL_FROM` | string | Optional sender address override |
| `SKIP_ENV_VALIDATION` | boolean | Skip validation during build |

### Build-Time Validation

Set `SKIP_ENV_VALIDATION=true` during static export builds where server-side
environment variables are not available.
