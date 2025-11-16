/**
 * Integration Test Setup
 *
 * Minimal setup for integration tests that use real Supabase connections.
 * Unlike unit tests, we don't mock Supabase here.
 */

import { vi } from 'vitest';

// Unmock Supabase for integration tests - we need real database connections
vi.unmock('@supabase/supabase-js');
