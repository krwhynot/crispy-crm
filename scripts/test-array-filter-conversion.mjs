#!/usr/bin/env node

// Test parseFilters with array values directly
import { parseFilters } from '../node_modules/@raphiniert/ra-data-postgrest/esm/urlBuilder.js';

console.log('Testing PostgREST filter parsing...\n');

// Test 1: Single value filter
const singleFilter = {
  filter: { stage: 'qualified' }
};
console.log('Test 1 - Single value:');
console.log('Input:', JSON.stringify(singleFilter.filter));
const result1 = parseFilters(singleFilter, 'eq');
console.log('Output:', JSON.stringify(result1.filter));
console.log();

// Test 2: Array value filter (what we want for multi-select)
const arrayFilter = {
  filter: { stage: ['qualified', 'proposal', 'negotiation'] }
};
console.log('Test 2 - Array value:');
console.log('Input:', JSON.stringify(arrayFilter.filter));
const result2 = parseFilters(arrayFilter, 'eq');
console.log('Output:', JSON.stringify(result2.filter));
console.log();

// Test 3: Manual IN operator syntax
const manualInFilter = {
  filter: { 'stage@in': '(qualified,proposal,negotiation)' }
};
console.log('Test 3 - Manual @in operator:');
console.log('Input:', JSON.stringify(manualInFilter.filter));
const result3 = parseFilters(manualInFilter, 'eq');
console.log('Output:', JSON.stringify(result3.filter));
console.log();

// Test 4: Multiple filters with arrays
const multiFilter = {
  filter: {
    stage: ['qualified', 'proposal'],
    priority: ['high', 'critical']
  }
};
console.log('Test 4 - Multiple array filters:');
console.log('Input:', JSON.stringify(multiFilter.filter));
const result4 = parseFilters(multiFilter, 'eq');
console.log('Output:', JSON.stringify(result4.filter));