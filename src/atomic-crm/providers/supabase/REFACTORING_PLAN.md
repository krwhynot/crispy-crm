# Data Provider Refactoring Plan

## Current State
- `unifiedDataProvider.ts`: 932 lines (monolithic)
- Contains: validation, transformation, storage, RPC, edge functions, error handling

## Target State
- `unifiedDataProvider.ts`: <500 lines (orchestrator only)
- `ValidationService`: 129 lines (Zod validation)
- `TransformService`: 127 lines (data mutations)
- `StorageService`: 167 lines (file operations)

## Refactoring Steps

### Phase 1: Wire Up Services (Completed)
✅ Create ValidationService with all Zod schemas
✅ Create TransformService with upload/avatar logic
✅ Create StorageService with file operations
✅ Create shared types file

### Phase 2: Update UnifiedDataProvider (Next)
1. Import the three services
2. Initialize services in constructor/setup
3. Replace inline validation with `validationService.validate()`
4. Replace inline transformations with `transformService.transform()`
5. Replace uploadToBucket with `storageService.uploadToBucket()`
6. Remove duplicate code

### Phase 3: Clean Up
1. Remove the inline validationRegistry (now in ValidationService)
2. Remove the inline transformerRegistry (now in TransformService)
3. Remove the inline uploadToBucket function (now in StorageService)
4. Ensure all imports are updated
5. Update service class constructors to accept services

### Benefits
- **Single Responsibility**: Each service has one clear purpose
- **Testability**: Can unit test each service independently
- **Maintainability**: 129-167 line files vs 932 lines
- **Extensibility**: Easy to add new validators/transformers
- **Industry Standard**: Follows <200 lines per service guideline

### Code Example
```typescript
// Before (monolithic)
const unifiedDataProvider = {
  async create(resource, params) {
    // 50 lines of validation logic
    // 30 lines of transformation logic
    // 20 lines of storage logic
    // 10 lines of database call
  }
}

// After (decomposed)
class UnifiedDataProvider {
  constructor(
    private validation: ValidationService,
    private transform: TransformService,
    private storage: StorageService
  ) {}

  async create(resource, params) {
    await this.validation.validate(resource, 'create', params.data);
    const transformed = await this.transform.transform(resource, params.data);
    // 5 lines of database call
  }
}
```

## Migration Risk
- **Low Risk**: Services are isolated, can be tested independently
- **Rollback Plan**: Keep original file as backup until verified
- **Testing**: Run full test suite after refactoring