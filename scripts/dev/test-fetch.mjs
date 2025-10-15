#!/usr/bin/env node
/**
 * Minimal fetch() test for debugging JWT signature issue
 */

const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiZXhwIjoxOTgzODEyOTk2fQ.U0zvx3STRzPjpTCJk6YPwJovSK9XYb_bZNeRVNyoBMA';

console.log('Testing fetch() with JWT...');
console.log('JWT:', JWT);
console.log('');

const url = 'http://127.0.0.1:54321/auth/v1/admin/users';
const body = JSON.stringify({
  email: 'fetchtest@test.local',
  password: 'TestPass123',
  email_confirm: true
});

console.log('URL:', url);
console.log('Body:', body);
console.log('');

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JWT}`,
    'apikey': JWT
  },
  body: body
});

console.log('Status:', response.status);
console.log('Headers:', Object.fromEntries(response.headers));
console.log('');

const text = await response.text();
console.log('Response:', text);
