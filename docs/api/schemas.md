# Data Schemas

Data schemas used throughout the application.

## API Schemas

### Contact Form Schema

Located in `src/lib/schemas/contact.ts`:

```typescript
import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
});
```

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | string | 2-50 characters |
| `email` | string | Valid email format |
| `message` | string | 10-1000 characters |

## Data Models

### Project Type

Located in `src/types/project.ts`:

```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  link?: string;
  github?: string;
  tags: string[];
}
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
    AWS_REGION: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    CONTACT_EMAIL: z.string().email(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
```

### Required Variables

| Variable | Type | Description |
|----------|------|-------------|
| `AWS_REGION` | string | AWS region for SES (e.g., `us-east-1`) |
| `CONTACT_EMAIL` | string | Destination email for contact form |
| `NEXT_PUBLIC_APP_URL` | string | Public URL of the application |

### Optional Variables

| Variable | Type | Description |
|----------|------|-------------|
| `AWS_ACCESS_KEY_ID` | string | AWS access key (uses instance role if not set) |
| `AWS_SECRET_ACCESS_KEY` | string | AWS secret key (uses instance role if not set) |
| `SKIP_ENV_VALIDATION` | boolean | Skip validation during build |

### Build-Time Validation

Set `SKIP_ENV_VALIDATION=true` during static export builds where server-side
environment variables are not available.
