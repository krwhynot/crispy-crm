# Code Style and Conventions

## TypeScript
- Use `interface` over `type` for object shapes
- Strict mode enabled
- Prefer explicit return types on exported functions

## React Patterns
- Functional components with hooks
- React Admin framework patterns
- Lazy-loaded resource modules
- Error boundaries for resilience

## Naming Conventions
- **Components:** PascalCase (`ContactList.tsx`)
- **Hooks:** camelCase with `use` prefix (`useContacts.ts`)
- **Utilities:** camelCase (`formatDate.ts`)
- **Constants:** UPPER_SNAKE_CASE
- **Files:** Match export name or kebab-case for utilities

## Import Order
1. React/framework imports
2. Third-party libraries
3. Internal components/hooks
4. Types
5. Styles

## Form State Pattern
```typescript
// ✅ CORRECT: Derive defaults from Zod schema
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: schema.partial().parse({}),  // Zod generates defaults
});

// ❌ WRONG: Hardcoded defaults
defaultValues: { name: '', email: '' }
```

## CSS/Tailwind
- **Tailwind CSS v4** with CSS variables
- **Semantic colors only** - never use color-### classes
- Use CSS variables: `--primary`, `--brand-700`, `--destructive`
- Validate with: `npm run validate:colors`

### Banned Patterns
```typescript
// ❌ BANNED
className="text-green-600 bg-gray-200"

// ✅ CORRECT  
className="text-primary bg-muted"
```

## Data Validation
- **Zod schemas** at API boundary
- **Single source of truth** for validation
- JSONB arrays for multi-value fields

## Error Handling
- **Fail fast** - no circuit breakers or retry logic
- Use `Promise.allSettled()` for bulk operations
- No over-engineering

## File Structure per Resource
```
src/atomic-crm/<resource>/
├── index.ts         # Lazy-loaded exports
├── List.tsx         # <ResourceList>
├── Show.tsx         # <ResourceShow>
├── Edit.tsx         # <ResourceEdit>
├── Create.tsx       # <ResourceCreate>
└── components/      # Resource-specific components
```
