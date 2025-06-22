# Feature Flags System

A lightweight, type-safe feature flag implementation for Next.js applications with zero external dependencies (except for Zod for validation).

## Overview

This feature flag system provides:

- 🎯 **Type-safe flag definitions** with TypeScript
- 🔄 **Client and server-side support** for Next.js
- 🎨 **React hooks and components** for easy integration
- 🎯 **Targeting rules** for user segmentation
- 📊 **Percentage rollouts** for gradual feature releases
- 💾 **Multiple storage backends** (Memory, LocalStorage, custom)
- 🚀 **Minimal overhead** with built-in caching
- 🔍 **Event system** for monitoring and analytics

## Quick Start

### Client-Side Usage

```tsx
import { useFeatureFlag, FeatureFlag } from '@/lib/feature-flags';

function MyComponent() {
  // Hook usage
  const { enabled, value } = useFeatureFlag('new-feature');
  
  if (enabled) {
    return <NewFeature />;
  }
  
  // Component usage
  return (
    <FeatureFlag flag="another-feature" fallback={<OldFeature />}>
      <AnotherNewFeature />
    </FeatureFlag>
  );
}
```

### Server-Side Usage

```tsx
import { isServerFeatureEnabled } from '@/lib/feature-flags';

export default async function Page() {
  const showNewUI = await isServerFeatureEnabled('new-ui');
  
  return showNewUI ? <NewUI /> : <OldUI />;
}
```

## Architecture

### Core Components

1. **Types** (`types.ts`): TypeScript interfaces and Zod schemas
2. **Evaluator** (`evaluator.ts`): Core evaluation logic
3. **Client** (`client.ts`): Main client implementation
4. **Stores**: Storage backends (Memory, LocalStorage)
5. **Hooks** (`hooks.tsx`): React integration
6. **Server** (`server.ts`): Next.js server-side utilities

### Feature Flag Structure

```typescript
{
  key: 'feature-name',
  name: 'Human Readable Name',
  description: 'What this feature does',
  defaultValue: true,
  enabled: true,
  rolloutPercentage: 50,
  targetingRules: [
    {
      condition: {
        attribute: 'userRole',
        operator: 'equals',
        value: 'beta-tester'
      },
      value: true
    }
  ]
}
```

## Usage Patterns

### 1. Basic Boolean Flags

```typescript
const { enabled } = useFeatureFlag('dark-mode');
```

### 2. Value Flags

```typescript
const { value } = useFeatureFlag('cta-button-color', 'blue');
const buttonColor = value as string;
```

### 3. Targeting Rules

```typescript
// Define in flag configuration
targetingRules: [
  {
    condition: {
      attribute: 'customAttributes.country',
      operator: 'in',
      value: ['US', 'CA', 'MX']
    },
    value: true
  }
]
```

### 4. Percentage Rollouts

```typescript
{
  key: 'new-feature',
  rolloutPercentage: 25, // 25% of users
  // Uses consistent hashing for stable assignment
}
```

### 5. User Context

```tsx
function App() {
  const { updateUser } = useFeatureFlagUserContext();
  
  useEffect(() => {
    // Set user context for targeting
    updateUser(
      user.id,
      user.email,
      user.role,
      { plan: user.plan, country: user.country }
    );
  }, [user]);
  
  return <YourApp />;
}
```

## Storage Options

### Memory Store (Default)

```typescript
import { MemoryFeatureFlagStore } from '@/lib/feature-flags';

const store = new MemoryFeatureFlagStore(initialFlags);
```

### LocalStorage Store

```typescript
import { LocalStorageFeatureFlagStore } from '@/lib/feature-flags';

const store = new LocalStorageFeatureFlagStore();
```

### Custom Store

```typescript
class CustomStore implements FeatureFlagStore {
  async get(key: string): Promise<FeatureFlag | null> {
    // Your implementation
  }
  // ... other methods
}
```

## Advanced Features

### Event Monitoring

```typescript
const client = new DefaultFeatureFlagClient();

client.addEventListener((event) => {
  switch (event.type) {
    case 'evaluation':
      console.log(`Flag ${event.key} evaluated to ${event.value}`);
      break;
    case 'error':
      console.error(`Flag ${event.key} error:`, event.error);
      break;
  }
});
```

### Server-Side Context

```typescript
// Automatically extracts context from cookies/headers
const context = await getServerContext();
// Returns: { userId, userEmail, environment, country, etc. }
```

### Batch Evaluation

```typescript
// Client-side
const flags = useFeatureFlags(['feature-1', 'feature-2', 'feature-3']);

// Server-side
const evaluations = await evaluateServerFlags(['feature-1', 'feature-2']);
```

## Best Practices

1. **Define flags centrally** in `flags.ts` for type safety
2. **Use targeting rules** instead of hardcoding conditions
3. **Clean up old flags** to prevent technical debt
4. **Monitor flag usage** with the event system
5. **Test both states** of feature flags
6. **Use gradual rollouts** for risky changes
7. **Document flag purpose** and removal timeline

## Environment Configuration

```typescript
// Different behavior per environment
if (process.env.NODE_ENV === 'development') {
  // Enable debug features
  // Disable rate limiting
}
```

## Performance Considerations

- **Caching**: Evaluations are cached for 1 minute by default
- **Batching**: Use batch methods to reduce overhead
- **Storage**: Memory store is fastest, LocalStorage persists
- **Server-side**: Pre-evaluate flags during SSR

## Migration from Other Systems

### From LaunchDarkly

```typescript
// Before
const client = new LaunchDarkly.LDClient(sdkKey);
const flagValue = await client.variation('flag-key', user, false);

// After
const { value } = await client.evaluate('flag-key', { userId: user.id });
```

### From Statsig

```typescript
// Before
const { value } = Statsig.getFeatureGate('gate-name');

// After
const { enabled } = useFeatureFlag('gate-name');
```

## Comparison with Alternatives

| Feature | Our System | LaunchDarkly | Statsig | Custom |
|---------|-----------|--------------|---------|---------|
| Cost | Free | $$$ | $$ | Free |
| Complexity | Low | Medium | Medium | Varies |
| Type Safety | ✅ | ✅ | ✅ | ❓ |
| React Hooks | ✅ | ✅ | ✅ | ❓ |
| SSR Support | ✅ | ✅ | ✅ | ❓ |
| Analytics | Basic | Advanced | Advanced | ❓ |
| External Deps | 0 | Many | Many | Varies |

## Future Enhancements

- [ ] Redis/Database storage backends
- [ ] A/B testing analytics integration
- [ ] Feature flag UI dashboard
- [ ] Webhook support for external updates
- [ ] GraphQL integration
- [ ] More sophisticated targeting operators

## License

MIT