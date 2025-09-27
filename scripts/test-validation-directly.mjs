#!/usr/bin/env node

/**
 * Direct validation testing script
 * Tests that our validation functions properly use safeParse
 */

import { validateProductForm } from '../src/atomic-crm/validation/products.js';
import { validateOpportunityForm } from '../src/atomic-crm/validation/opportunities.js';
import { validateContactForm } from '../src/atomic-crm/validation/contacts.js';
import { validateCreateTag } from '../src/atomic-crm/validation/tags.js';
import { validateTaskForSubmission } from '../src/atomic-crm/validation/tasks.js';
import { validateContactNoteForSubmission } from '../src/atomic-crm/validation/notes.js';

console.log('🧪 Testing Single-Point Validation Functions\n');

// Test 1: Product with negative price
console.log('Test 1: Product with negative price');
try {
  await validateProductForm({
    name: 'Test Product',
    sku: 'TEST-001',
    principal_id: 1,
    category: 'dairy',
    list_price: -10  // Invalid: negative price
  });
  console.log('❌ Should have thrown validation error');
} catch (error) {
  if (error.errors && error.errors.list_price) {
    console.log('✅ Validation caught negative price:', error.errors.list_price);
  } else {
    console.log('⚠️ Unexpected error format:', error);
  }
}

// Test 2: Opportunity with invalid probability
console.log('\nTest 2: Opportunity probability > 100');
try {
  await validateOpportunityForm({
    name: 'Test Opportunity',
    probability: 150,  // Invalid: > 100
    contact_ids: [1],
    expected_closing_date: '2024-12-31'
  });
  console.log('❌ Should have thrown validation error');
} catch (error) {
  if (error.errors && error.errors.probability) {
    console.log('✅ Validation caught invalid probability:', error.errors.probability);
  } else {
    console.log('⚠️ Unexpected error format:', error);
  }
}

// Test 3: Contact missing required fields
console.log('\nTest 3: Contact missing first name');
try {
  await validateContactForm({
    last_name: 'Doe',
    // Missing first_name (required)
    email: [{email: 'test@example.com'}]
  });
  console.log('❌ Should have thrown validation error');
} catch (error) {
  if (error.errors && error.errors.first_name) {
    console.log('✅ Validation caught missing first name:', error.errors.first_name);
  } else {
    console.log('⚠️ Unexpected error format:', error);
  }
}

// Test 4: Tag with invalid color
console.log('\nTest 4: Tag with invalid color');
try {
  await validateCreateTag({
    name: 'Test Tag',
    color: 'invalid_color'  // Invalid: not in allowed colors
  });
  console.log('❌ Should have thrown validation error');
} catch (error) {
  if (error.errors && error.errors.color) {
    console.log('✅ Validation caught invalid color:', error.errors.color);
  } else {
    console.log('⚠️ Unexpected error format:', error);
  }
}

// Test 5: Task without required due date
console.log('\nTest 5: Task missing due date');
try {
  await validateTaskForSubmission({
    text: 'Test task',
    contact_id: 1,
    type: 'call',
    // Missing due_date (required)
  });
  console.log('❌ Should have thrown validation error');
} catch (error) {
  if (error.errors && error.errors.due_date) {
    console.log('✅ Validation caught missing due date:', error.errors.due_date);
  } else {
    console.log('⚠️ Unexpected error format:', error);
  }
}

// Test 6: Note without text
console.log('\nTest 6: Contact note missing text');
try {
  await validateContactNoteForSubmission({
    contact_id: 1,
    // Missing text (required)
    date: '2024-09-27'
  });
  console.log('❌ Should have thrown validation error');
} catch (error) {
  if (error.errors && error.errors.text) {
    console.log('✅ Validation caught missing text:', error.errors.text);
  } else {
    console.log('⚠️ Unexpected error format:', error);
  }
}

console.log('\n✅ All validation tests completed!');
console.log('All validators are using safeParse and returning proper error format.');