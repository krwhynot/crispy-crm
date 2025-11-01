/**
 * INTEGRATION GUIDE: Rate Limit Handling in unifiedDataProvider
 *
 * This file shows how to integrate RateLimitService into the unifiedDataProvider.
 * Copy the marked sections into unifiedDataProvider.ts
 *
 * CHANGES REQUIRED:
 * 1. Add import for RateLimitService (see SECTION_1)
 * 2. Initialize rateLimitService singleton (see SECTION_2)
 * 3. Wrap key operations with executeWithRetry (see SECTION_3)
 */

// ============================================================================
// SECTION_1: Add to imports at top of unifiedDataProvider.ts
// ============================================================================
// After the existing imports, add:
//
// import { rateLimitService } from "./services";
//

// ============================================================================
// SECTION_2: Initialize service (already done with singleton pattern)
// ============================================================================
// The rateLimitService is imported as a singleton, no initialization needed.
// It's ready to use immediately.
//

// ============================================================================
// SECTION_3: Wrap operations with rate limit handling
// ============================================================================
// Apply to: create(), update(), and other mutation operations
//
// BEFORE (current code in unifiedDataProvider.ts):
// ============================================================================
// async create(
//   resource: string,
//   params: CreateParams,
// ): Promise<any> {
//   return wrapMethod("create", resource, params, async () => {
//     const dbResource = getResourceName(resource);
//     // ... rest of logic
//     const result = await baseDataProvider.create(dbResource, {
//       ...params,
//       data: processedData as any,
//     });
//     return result;
//   });
// }
//
// ============================================================================
// AFTER (with rate limit handling):
// ============================================================================
//
// async create(
//   resource: string,
//   params: CreateParams,
// ): Promise<any> {
//   return wrapMethod("create", resource, params, async () => {
//     const dbResource = getResourceName(resource);
//
//     // Validate and process data
//     const processedData = await processForDatabase(
//       resource,
//       params.data,
//       "create",
//     );
//
//     // Check for preview/dry-run mode
//     if (params.meta?.dryRun === true) {
//       return {
//         data: {
//           ...processedData,
//           id: 'dry-run-provisional-id',
//         },
//       };
//     }
//
//     // Special handling for segments - use RPC for get_or_create
//     if (resource === "segments") {
//       // WRAP RPC CALL WITH RATE LIMIT HANDLING
//       const { data, error } = await rateLimitService.executeWithRetry(
//         () => supabase.rpc('get_or_create_segment', { p_name: processedData.name }),
//         { resourceName: resource, operation: "get_or_create_segment" }
//       );
//
//       if (error) throw error;
//       return { data: data[0] };
//     }
//
//     // Special handling for opportunities
//     if (resource === "opportunities") {
//       if (processedData.products_to_sync) {
//         const products = processedData.products_to_sync;
//         delete processedData.products_to_sync;
//
//         console.log('[RPC sync_opportunity_with_products] Calling with:', {
//           opportunity_data: processedData,
//           products_to_create: products,
//           products_to_update: [],
//           product_ids_to_delete: [],
//         });
//
//         // WRAP RPC CALL WITH RATE LIMIT HANDLING
//         const { data, error } = await rateLimitService.executeWithRetry(
//           () => supabase.rpc("sync_opportunity_with_products", {
//             opportunity_data: processedData,
//             products_to_create: products,
//             products_to_update: [],
//             product_ids_to_delete: [],
//           }),
//           { resourceName: resource, operation: "sync_opportunity_with_products" }
//         );
//
//         if (error) {
//           console.error('[RPC sync_opportunity_with_products] Error:', error);
//           handleRpcError(error);
//         }
//
//         console.log('[RPC sync_opportunity_with_products] Success:', data);
//         return formatRpcResponse(data);
//       }
//     }
//
//     // WRAP BASE PROVIDER CREATE WITH RATE LIMIT HANDLING
//     const result = await rateLimitService.executeWithRetry(
//       () => baseDataProvider.create(dbResource, {
//         ...params,
//         data: processedData as any,
//       }),
//       { resourceName: resource, operation: "create" }
//     );
//
//     return result;
//   });
// }
//

// ============================================================================
// APPLY SAME PATTERN TO update():
// ============================================================================
//
// async update(
//   resource: string,
//   params: UpdateParams,
// ): Promise<any> {
//   return wrapMethod("update", resource, params, async () => {
//     const dbResource = getResourceName(resource);
//
//     const dataToProcess = { ...params.data, id: params.id };
//     const processedData = await processForDatabase(
//       resource,
//       dataToProcess,
//       "update",
//     );
//
//     if (resource === "opportunities") {
//       if (processedData.products_to_sync) {
//         if (!params.previousData?.products) {
//           throw new Error(
//             "Cannot update products: previousData.products is missing. " +
//             "Ensure the form fetches the complete record with meta.select."
//           );
//         }
//
//         const formProducts = processedData.products_to_sync;
//         const originalProducts = params.previousData.products;
//         delete processedData.products_to_sync;
//
//         const { creates, updates, deletes } = diffProducts(originalProducts, formProducts);
//
//         // WRAP RPC CALL WITH RATE LIMIT HANDLING
//         const { data, error } = await rateLimitService.executeWithRetry(
//           () => supabase.rpc("sync_opportunity_with_products", {
//             opportunity_data: { ...processedData, id: params.id },
//             products_to_create: creates,
//             products_to_update: updates,
//             product_ids_to_delete: deletes,
//           }),
//           { resourceName: resource, operation: "sync_opportunity_with_products" }
//         );
//
//         if (error) {
//           handleRpcError(error);
//         }
//
//         return formatRpcResponse(data);
//       }
//     }
//
//     // WRAP BASE PROVIDER UPDATE WITH RATE LIMIT HANDLING
//     const result = await rateLimitService.executeWithRetry(
//       () => baseDataProvider.update(dbResource, {
//         ...params,
//         data: {
//           ...processedData,
//           id: params.id,
//         } as any,
//       }),
//       { resourceName: resource, operation: "update" }
//     );
//
//     return result;
//   });
// }
//

// ============================================================================
// APPLY SAME PATTERN TO delete() and deleteMany():
// ============================================================================
//
// async delete(
//   resource: string,
//   params: DeleteParams,
// ): Promise<any> {
//   return wrapMethod("delete", resource, params, async () => {
//     const dbResource = getResourceName(resource);
//     return rateLimitService.executeWithRetry(
//       () => baseDataProvider.delete(dbResource, params),
//       { resourceName: resource, operation: "delete" }
//     );
//   });
// }
//
// async deleteMany(resource: string, params: DeleteManyParams): Promise<any> {
//   return wrapMethod("deleteMany", resource, params, async () => {
//     const dbResource = getResourceName(resource);
//     return rateLimitService.executeWithRetry(
//       () => baseDataProvider.deleteMany(dbResource, params),
//       { resourceName: resource, operation: "deleteMany" }
//     );
//   });
// }
//

// ============================================================================
// APPLY TO CONTACT IMPORT FLOW:
// ============================================================================
// In useContactImport.tsx, wrap the dataProvider.create() calls:
//
// BEFORE:
// await dataProvider.create("contacts", {
//   data: contactPayload,
// });
//
// AFTER (with rate limit handling):
// import { rateLimitService } from "@/atomic-crm/providers/supabase/services";
//
// await rateLimitService.executeWithRetry(
//   () => dataProvider.create("contacts", {
//     data: contactPayload,
//   }),
//   { resourceName: "contacts", operation: "create" }
// );
//
// This ensures bulk imports don't fail when hitting rate limits.
//

// ============================================================================
// MONITORING & OBSERVABILITY:
// ============================================================================
// Add this to your monitoring/error tracking (Sentry, etc.):
//
// import { rateLimitService } from "@/atomic-crm/providers/supabase/services";
//
// // Add to app initialization or monitoring setup:
// export function setupRateLimitMonitoring() {
//   // Monitor circuit breaker state
//   setInterval(() => {
//     const state = rateLimitService.getCircuitState();
//     if (state.isOpen) {
//       console.warn('[RateLimit] Circuit breaker is open!', state);
//       // Send to error tracking service
//       // Sentry.captureMessage('Rate limit circuit breaker opened', 'warning');
//     }
//   }, 30000); // Check every 30 seconds
// }
//

// ============================================================================
// ERROR HANDLING IN UI:
// ============================================================================
// React Admin will receive errors with these codes:
//
// 1. Normal rate limit (will retry automatically):
//    - User sees a brief loading state while retrying
//    - If succeeds, operation completes normally
//
// 2. Max retries exceeded (RATE_LIMIT_MAX_RETRIES_EXCEEDED):
//    - Error message: "Rate limit error persisted after N retries..."
//    - Show user: "The system is temporarily overloaded. Please try again in a few moments."
//
// 3. Circuit breaker open (RATE_LIMIT_CIRCUIT_OPEN):
//    - Error message: "Rate limit circuit breaker is open..."
//    - Show user: "Too many requests. Please wait 1-2 minutes before trying again."
//
// Example UI handling in ContactCreate or form error display:
//
// const handleCreateError = (error: any) => {
//   if (error?.code === 'RATE_LIMIT_CIRCUIT_OPEN') {
//     return 'Too many requests. Please wait 1-2 minutes before trying again.';
//   }
//   if (error?.code === 'RATE_LIMIT_MAX_RETRIES_EXCEEDED') {
//     return 'The system is temporarily overloaded. Please try again in a few moments.';
//   }
//   return error?.message || 'An error occurred';
// };
//

// ============================================================================
// TESTING RATE LIMIT HANDLING:
// ============================================================================
// Create src/atomic-crm/providers/supabase/services/RateLimitService.test.ts
//
// import { describe, it, expect, beforeEach, vi } from 'vitest';
// import { RateLimitService } from './RateLimitService';
//
// describe('RateLimitService', () => {
//   let service: RateLimitService;
//
//   beforeEach(() => {
//     service = new RateLimitService({
//       maxRetries: 2,
//       initialDelayMs: 10,
//       maxDelayMs: 100,
//       jitterFactor: 0,
//       respectRetryAfter: true,
//       circuitBreakerThreshold: 3,
//     });
//   });
//
//   it('should retry on 429 errors', async () => {
//     let attemptCount = 0;
//     const operation = async () => {
//       attemptCount++;
//       if (attemptCount < 2) {
//         const error = new Error('Too Many Requests');
//         (error as any).status = 429;
//         throw error;
//       }
//       return { data: 'success' };
//     };
//
//     const result = await service.executeWithRetry(operation);
//     expect(result).toEqual({ data: 'success' });
//     expect(attemptCount).toBe(2);
//   });
//
//   it('should fail if max retries exceeded', async () => {
//     const operation = async () => {
//       const error = new Error('Too Many Requests');
//       (error as any).status = 429;
//       throw error;
//     };
//
//     await expect(service.executeWithRetry(operation)).rejects.toThrow(
//       'Rate limit error persisted after 2 retries'
//     );
//   });
//
//   it('should open circuit breaker after consecutive failures', async () => {
//     const operation = async () => {
//       const error = new Error('Too Many Requests');
//       (error as any).status = 429;
//       throw error;
//     };
//
//     // Trigger 3 consecutive failures to open circuit
//     for (let i = 0; i < 3; i++) {
//       try {
//         await service.executeWithRetry(operation);
//       } catch (error) {
//         // Circuit opens on 3rd failure
//         if (i === 2) {
//           expect((error as any).code).toBe('RATE_LIMIT_CIRCUIT_OPEN');
//         }
//       }
//     }
//
//     // Next operation should fail immediately with circuit open
//     await expect(service.executeWithRetry(operation)).rejects.toThrow(
//       'circuit breaker is open'
//     );
//   });
//
//   it('should not retry on non-429 errors', async () => {
//     let attemptCount = 0;
//     const operation = async () => {
//       attemptCount++;
//       throw new Error('Validation error');
//     };
//
//     await expect(service.executeWithRetry(operation)).rejects.toThrow(
//       'Validation error'
//     );
//     expect(attemptCount).toBe(1); // No retries
//   });
//
//   it('should respect Retry-After header', async () => {
//     const startTime = Date.now();
//     let attemptCount = 0;
//
//     const operation = async () => {
//       attemptCount++;
//       if (attemptCount < 2) {
//         const error = new Error('Too Many Requests');
//         (error as any).status = 429;
//         (error as any).headers = { 'retry-after': '1' }; // 1 second
//         throw error;
//       }
//       return { data: 'success' };
//     };
//
//     const result = await service.executeWithRetry(operation);
//     const duration = Date.now() - startTime;
//
//     expect(result).toEqual({ data: 'success' });
//     // Should have waited approximately 1 second
//     expect(duration).toBeGreaterThanOrEqual(900);
//   });
// });
//
