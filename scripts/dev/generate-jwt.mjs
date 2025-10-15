#!/usr/bin/env node
/**
 * Generate Service Role JWT
 * Uses the jwt_secret from config.toml to generate a valid service_role JWT
 */

import { createHmac } from 'crypto';

const JWT_SECRET = 'sHbpum5xlg1QpejKLTKDfcsbaWF32fjX62+B9TPw/KiKZ1wcP7WkLuq2jorwNCTcRYbBK+hgE7A9q9oNkujZ4Q==';

// Helper to base64url encode
function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// JWT Header
const header = {
  alg: 'HS256',
  typ: 'JWT'
};

// JWT Payload - service role with far-future expiry
const payload = {
  iss: 'http://127.0.0.1:54321/auth/v1',
  role: 'service_role',
  exp: 1983812996  // Year 2032
};

// Create JWT
const headerB64 = base64url(JSON.stringify(header));
const payloadB64 = base64url(JSON.stringify(payload));
const signatureInput = `${headerB64}.${payloadB64}`;

// Sign with HMAC-SHA256
const signature = createHmac('sha256', JWT_SECRET)
  .update(signatureInput)
  .digest('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

const jwt = `${signatureInput}.${signature}`;

console.log('Generated Service Role JWT:');
console.log(jwt);
