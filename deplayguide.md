# Complete Guide to Vercel Deployment for KitchenPantry CRM

  

**Last Updated:** October 2025

**Production URL:** https://crm.kjrcloud.com

**For:** Beginners to deployment concepts and Vercel platform

  

---

  

## Table of Contents

  

1. [What is "Deployment"?](#part-1-what-is-deployment)

2. [What is Vercel?](#part-2-what-is-vercel)

3. [How Web Deployment Works](#part-3-how-web-deployment-works)

4. [Understanding This Project's Build Process](#part-4-understanding-this-projects-build-process)

5. [Vercel Configuration Deep Dive](#part-5-how-this-project-is-configured-for-vercel)

6. [Environment Variables](#part-6-environment-variables)

7. [Complete Deployment Workflow](#part-7-complete-deployment-workflow)

8. [Troubleshooting Common Issues](#part-8-troubleshooting)

  

---

  

## Part 1: What is "Deployment"?

  

Think of deployment like publishing a book:

  

### Development (Local) = Writing your book on your computer

- You run `npm run dev` and see your CRM at `http://localhost:5173`

- **Only YOU can see it**

- It's running on **YOUR computer**

- If you close your laptop, it disappears

  

### Deployment (Production) = Publishing your book so anyone can read it

- Your CRM is live at `https://crm.kjrcloud.com`

- **ANYONE on the internet** can access it 24/7

- It's running on **powerful servers** (not your computer)

- Even if your computer is off, the site works

  

**The deployment process** is taking your code from your local machine and putting it on servers that are always online and accessible worldwide.

  

---

  

## Part 2: What is Vercel?

  

Vercel is a **hosting platform** - think of it as a specialized service that handles everything needed to put your website online.

  

### What Vercel Does:

  

1. **Provides servers** - Powerful computers around the world that run your code

2. **Builds your app** - Takes your React/TypeScript code and converts it to optimized files

3. **Hosts the files** - Makes them available on the internet

4. **Delivers content** - Uses a CDN (Content Delivery Network) to serve your site fast globally

5. **Manages domains** - Connects your site to `crm.kjrcloud.com`

6. **Handles SSL** - Automatically provides HTTPS security

  

### Why Vercel for This Project?

  

- ✅ **Optimized for React/Vite** - It understands your tech stack automatically

- ✅ **Zero configuration** - Works out of the box for most Vite projects

- ✅ **Free tier** - Great for CRM projects like this

- ✅ **Automatic deployments** - Every git push triggers a new deployment

- ✅ **Preview deployments** - Each branch gets its own URL for testing

- ✅ **Global CDN** - Fast loading times worldwide

- ✅ **Automatic HTTPS** - SSL certificates managed for you

  

### Alternatives to Vercel:

  

- **Netlify** (similar to Vercel, great for SPAs)

- **AWS Amplify** (Amazon's service, more complex)

- **Railway, Render** (simpler options, good for beginners)

- **DigitalOcean, AWS EC2** (requires manual server management)

  

---

  

## Part 3: How Web Deployment Works

  

### The Traditional Way (Before Platforms Like Vercel):

  

```

Your Code → Server Setup → Install Dependencies → Build Process →

Configure Web Server → Set Up Domain → SSL Certificates → Monitor → Update Manually

```

  

This required:

- ❌ Renting and configuring a server (VPS)

- ❌ Installing Node.js manually

- ❌ Configuring nginx/Apache web servers

- ❌ Managing SSL certificates (Let's Encrypt)

- ❌ Setting up CI/CD pipelines

- ❌ Monitoring uptime and performance

- ❌ Manual updates and rollbacks

  

**This could take DAYS and requires DevOps knowledge.**

  

### The Modern Way (With Vercel):

  

```

Your Code → Git Push → Vercel Does Everything → Live Site ✅

```

  

Vercel automates 95% of the work. Here's what happens:

  

1. **You push code to GitHub** → `git push origin main`

2. **Vercel detects the change** → Webhook triggers build

3. **Vercel builds your app** → Runs `npm install` and `npm run build`

4. **Vercel optimizes files** → Compresses, minifies, creates cache keys

5. **Vercel deploys globally** → Copies files to servers worldwide

6. **Your site is live** → Accessible at your domain

  

**This takes MINUTES and is mostly automatic.**

  

---

  

## Part 4: Understanding This Project's Build Process

  

Before deployment happens, your code needs to be "built" - converted from development code to production-ready files.

  

### What You Write (Source Code):

  

```typescript

// src/features/contacts/components/ContactsList.tsx

import { useContacts } from '@/features/contacts/hooks'

import { DataTable } from '@/components/data-table'

  

export function ContactsList() {

  const { data: contacts, isLoading } = useContacts()

  

  if (isLoading) return <LoadingSpinner />

  

  return <DataTable data={contacts} columns={contactColumns} />

}

```

  

This code:

- Uses TypeScript (browsers don't understand this natively)

- Has modern JavaScript features (some browsers don't support)

- Imports from multiple files (needs to be bundled)

- Has comments and formatting (wastes bandwidth)

- Includes development tools (not needed in production)

  

### What Gets Deployed (Built Code):

  

After the build process:

  

```javascript

// dist/assets/Contacts-BVv5A5tK.js (minified, 2.1KB)

const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/...

```

  

**Notice the transformations:**

- ✅ All TypeScript → Converted to JavaScript

- ✅ Multiple files → Bundled intelligently

- ✅ Readable code → Minified (compressed)

- ✅ `ContactsList.tsx` → `Contacts-BVv5A5tK.js` (with hash)

- ✅ 150 lines of code → 2.1KB file

- ✅ No comments, no extra spaces

- ✅ Hash in filename (`BVv5A5tK`) enables permanent caching

  

### The Build Process Step-by-Step:

  

When you run `npm run build`, here's what happens:

  

```bash

npm run build

  ↓

scripts/build.sh (custom build script)

  ↓

Step 1: Clean old build artifacts (rm -rf dist/)

Step 2: Run TypeScript compiler (type checking)

Step 3: Execute Vite build process

  ↓

Vite Build Process:

  ↓

Step 4:  Read all source files (src/**)

Step 5:  Resolve imports (@/ paths → actual files)

Step 6:  Transpile TypeScript → JavaScript

Step 7:  Bundle files together (combines 500+ files)

Step 8:  Code splitting into chunks (contacts, products, etc.)

Step 9:  Minify code (removes spaces, shortens names)

Step 10: Optimize CSS (removes unused styles)

Step 11: Generate unique hashes (BVv5A5tK for caching)

Step 12: Remove console.log statements (production mode)

Step 13: Tree-shake unused code (eliminate dead code)

Step 14: Compress with gzip/brotli

Step 15: Validate bundle size (< 3MB threshold)

  ↓

Output: dist/ folder with 65 optimized files (~3.3MB total)

```

  

### Build Output Structure:

  

```

dist/

├── index.html                           # Main HTML file

├── assets/

│   ├── index-a1b2c3d4.js              # Main app bundle

│   ├── react-C9gOViKL.js              # React library chunk

│   ├── react-dom-CmjBw0rk.js          # React DOM chunk

│   ├── query-core-Dk712CxV.js         # TanStack Query chunk

│   ├── supabase-core-Xy9ZpQw2.js      # Supabase client chunk

│   ├── feature-contacts-BVv5A5tK.js   # Contacts feature chunk

│   ├── feature-organizations-ToZ3B0i6.js

│   ├── table-core-Czkd9CFn.js         # DataTable chunk

│   ├── forms-vendor-CRrGYMtp.js       # Form libraries

│   ├── index-xyz.css                   # Bundled styles

│   └── ... (65 total files)

└── stats.html                          # Bundle analysis report

```

  

**Why 65 files instead of 1?**

  

This is called **code splitting**. Instead of one massive 3MB file:

  

- **Initial load:** User downloads only ~500KB (index + react + core UI)

- **Lazy loading:** Additional features load when accessed

- **Parallel downloads:** Browser downloads multiple chunks simultaneously

- **Better caching:** Update one feature, only that chunk changes

  

**Example user journey:**

```

User visits homepage

  → Downloads: index, react, react-dom, ui-core (~500KB)

  → Page loads in 1.2 seconds ⚡

  

User clicks "Contacts"

  → Downloads: feature-contacts, table-core (~150KB)

  → Contacts page loads in 0.3 seconds ⚡

  

User clicks "Organizations"

  → Downloads: feature-organizations (~120KB)

  → Organizations page loads in 0.3 seconds ⚡

```

  

### Key Build Insights:

  

**1. Hash-based Caching:**

Files like `Contacts-BVv5A5tK.js` have unique hashes that change when code changes. This enables:

- **Permanent caching** - Browsers keep files for 1 year

- **Instant updates** - New code = new hash = auto-download

- **No stale content** - Old hash files become irrelevant

  

**2. Code Splitting Magic:**

Your CRM splits into 65 files instead of 1 massive file:

- Users visiting Contacts only download `feature-contacts-BVv5A5tK.js` (2.1KB)

- They don't download Dashboard, Organizations, Products, etc.

- This makes initial load extremely fast (~500KB vs 3MB)

  

**3. TypeScript's Role:**

- TypeScript is **purely a development tool**

- It catches bugs while you code with type checking

- **Browsers can't run TypeScript** - it's not a runtime language

- Build process strips all types and outputs plain JavaScript

- Production bundle contains ZERO TypeScript syntax

  

---

  

## Part 5: How This Project is Configured for Vercel

  

### The `vercel.json` Configuration File

  

This file tells Vercel exactly how to build and deploy your application.

  

```json

{

  "version": 2,

  "buildCommand": "npm run build",

  "outputDirectory": "dist",

  "installCommand": "npm install",

  "framework": "vite",

  "devCommand": "npm run dev",

  "rewrites": [...],

  "headers": [...]

}

```

  

Let me break down each section:

  

---

  

### Basic Configuration

  

#### `"version": 2`

- Tells Vercel which configuration format to use

- Version 2 is the current standard

  

#### `"buildCommand": "npm run build"`

- **This is the magic command** - Vercel runs this to build your app

- Executes `scripts/build.sh` which creates the `dist/` folder

- Think of it as: "Hey Vercel, run THIS command to prepare my app"

  

#### `"outputDirectory": "dist"`

- Tells Vercel: "After building, serve files from the `dist/` folder"

- This is where your 65 optimized files live after build

- **Vercel uploads THIS folder to its servers, not your entire codebase**

  

#### `"installCommand": "npm install"`

- Tells Vercel to install all dependencies first

- Downloads all packages from `package.json` (React, Supabase, TanStack Query, etc.)

- Must happen BEFORE building

  

#### `"framework": "vite"`

- Tells Vercel you're using Vite (your build tool)

- Vercel applies Vite-specific optimizations automatically

- Enables faster builds with caching

  

---

  

### Routing Configuration: The SPA Problem & Solution

  

This solves a **critical problem** with Single Page Applications (SPAs):

  

#### The Problem:

  

Your CRM is a "Single Page App" - there's only ONE HTML file (`index.html`), but it LOOKS like multiple pages:

  

- `crm.kjrcloud.com/` → Home page

- `crm.kjrcloud.com/contacts` → Contacts page

- `crm.kjrcloud.com/organizations` → Organizations page

- `crm.kjrcloud.com/opportunities` → Opportunities page

  

**But here's the issue:**

  

When a user visits `crm.kjrcloud.com/contacts` **directly** (by typing the URL or from a bookmark), the server tries to find a file called `contacts.html`... but **it doesn't exist**! Only `index.html` exists.

  

#### Without this configuration:

  

```

User visits: https://crm.kjrcloud.com/contacts

Server looks for: /contacts.html

Result: 404 ERROR - Page Not Found ❌

```

  

#### With the rewrite rule:

  

```json

"rewrites": [

  {

    "source": "/((?!assets/).*)",     // Match all URLs except /assets/*

    "destination": "/index.html"       // Send them to index.html

  }

]

```

  

**How it works:**

  

```

User visits: https://crm.kjrcloud.com/contacts

Server thinks: "This is NOT an asset file, send index.html"

Server sends: index.html (with all JavaScript)

Browser loads: React app

React Router sees URL: "/contacts"

React Router shows: ContactsList component

Result: Page loads correctly ✅

```

  

#### Why exclude `/assets/`?

  

Your JavaScript and CSS files ARE in `/assets/`:

- `/assets/Contacts-BVv5A5tK.js`

- `/assets/index-xyz.css`

  

These need to be **served directly** (not routed to index.html). Without this exception:

  

```

Browser requests: /assets/Contacts-BVv5A5tK.js

Without exception: Server sends index.html (wrong!)

Browser tries to execute HTML as JavaScript: ERROR ❌

```

  

The regex `(?!assets/)` means "NOT assets/" - it's a negative lookahead that excludes the assets directory.

  

---

  

### Security Headers: Protecting Your Users

  

These are **HTTP headers** sent with every request. Think of them as security instructions to the browser.

  

```json

"headers": [

  {

    "source": "/(.*)",

    "headers": [...]

  }

]

```

  

This applies to all routes `(.*)` - every page in your CRM.

  

#### Header 1: `X-Content-Type-Options: nosniff`

  

```json

{

  "key": "X-Content-Type-Options",

  "value": "nosniff"

}

```

  

**What it does:** Prevents browsers from guessing file types

  

**Why you need it:**

- Without this, a browser might see `evil.txt` and try to execute it as JavaScript

- Attackers could upload an image that's secretly JavaScript

- Browser might execute it, leading to XSS attacks

  

**Attack prevented:** MIME-type confusion attacks

  

---

  

#### Header 2: `X-Frame-Options: DENY`

  

```json

{

  "key": "X-Frame-Options",

  "value": "DENY"

}

```

  

**What it does:** Prevents your site from being embedded in an `<iframe>`

  

**Why you need it:**

- Attackers could embed your CRM in a fake page

- They overlay invisible elements on top

- Users think they're clicking "Save Contact" but actually clicking "Transfer Money"

  

**Attack prevented:** Clickjacking

  

**Example attack scenario:**

```html

<!-- Attacker's malicious site -->

<iframe src="https://crm.kjrcloud.com"></iframe>

<div style="position: absolute; top: 0;">

  Click here to win an iPhone!

  <!-- This button is positioned over your CRM's "Delete All Data" button -->

</div>

```

  

With `X-Frame-Options: DENY`, the browser refuses to load your CRM in the iframe.

  

---

  

#### Header 3: `X-XSS-Protection: 1; mode=block`

  

```json

{

  "key": "X-XSS-Protection",

  "value": "1; mode=block"

}

```

  

**What it does:** Enables browser's built-in XSS filter

  

**Why you need it:** Extra layer of protection against cross-site scripting

  

**Attack prevented:** Reflected XSS attacks

  

**Example attack:**

```

https://crm.kjrcloud.com/search?q=<script>stealCookies()</script>

```

  

The XSS filter detects the `<script>` tag and blocks page rendering.

  

---

  

#### Header 4: `Referrer-Policy: strict-origin-when-cross-origin`

  

```json

{

  "key": "Referrer-Policy",

  "value": "strict-origin-when-cross-origin"

}

```

  

**What it does:** Controls what information is sent in the `Referer` header

  

**Breaking down the value:**

- **`strict-origin`** - Only send origin (domain), not full URL

- **`when-cross-origin`** - Only for requests to other domains

  

**Example:**

  

```

User on: https://crm.kjrcloud.com/contacts/sensitive-client-123

Clicks link to: https://example.com

  

Without this header:

  Referer: https://crm.kjrcloud.com/contacts/sensitive-client-123

  ❌ Leaks sensitive information!

  

With this header:

  Referer: https://crm.kjrcloud.com

  ✅ Only sends domain, no sensitive path

```

  

---

  

#### Header 5: `Permissions-Policy`

  

```json

{

  "key": "Permissions-Policy",

  "value": "camera=(), microphone=(), geolocation=()"

}

```

  

**What it does:** Disables browser features you don't use

  

**Breaking down the policy:**

- `camera=()` - No one can access camera (empty list)

- `microphone=()` - No one can access microphone

- `geolocation=()` - No one can access location

  

**Why you need it:**

- Your CRM doesn't need camera/microphone/location

- Prevents third-party scripts from requesting these permissions

- Reduces attack surface

  

---

  

#### Header 6: `Content-Security-Policy` (CSP) - THE BIG ONE

  

```json

{

  "key": "Content-Security-Policy",

  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ..."

}

```

  

This is the **most important security header**. It defines what resources can be loaded and from where.

  

Let me break down each directive:

  

##### `default-src 'self'`

**Default policy for all resource types**

  

```

default-src 'self'

```

  

- By default, only load resources from your own domain

- Applies to: images, fonts, scripts, styles, etc.

- `'self'` means `https://crm.kjrcloud.com`

  

##### `script-src 'self' 'unsafe-inline' 'unsafe-eval'`

**Where JavaScript can come from**

  

```

script-src 'self' 'unsafe-inline' 'unsafe-eval'

```

  

- `'self'` - Your own JavaScript files

- `'unsafe-inline'` - Inline `<script>` tags (needed for Vite)

- `'unsafe-eval'` - `eval()` statements (needed for some libraries)

  

⚠️ **Security Note:** `'unsafe-inline'` and `'unsafe-eval'` reduce security but are required for Vite to work. This is a trade-off for development convenience.

  

##### `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`

**Where CSS can come from**

  

```

style-src 'self' 'unsafe-inline' https://fonts.googleapis.com

```

  

- `'self'` - Your own CSS files

- `'unsafe-inline'` - Inline styles (needed for React inline styles)

- `https://fonts.googleapis.com` - Google Fonts CSS

  

##### `font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com`

**Where fonts can come from**

  

```

font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com

```

  

- `'self'` - Your own font files

- `data:` - Data URLs (base64 encoded fonts)

- Google Fonts domains

  

##### `connect-src 'self' https://*.supabase.co wss://*.supabase.co`

**Where network connections can go**

  

```

connect-src 'self' https://*.supabase.co wss://*.supabase.co

```

  

This is **critical for your CRM**:

  

- `'self'` - API calls to your own domain

- `https://*.supabase.co` - HTTPS connections to Supabase database

- `wss://*.supabase.co` - WebSocket connections for real-time updates

  

**What happens if you remove this:**

  

```

User tries to load contacts

Browser tries: fetch('https://xyzabc.supabase.co/rest/v1/contacts')

CSP blocks: "Refused to connect to 'https://xyzabc.supabase.co'"

Result: Your CRM can't access the database ❌

```

  

The wildcard `*` allows any Supabase subdomain (your project ID is the subdomain).

  

##### `img-src 'self' data: https:`

**Where images can come from**

  

```

img-src 'self' data: https:

```

  

- `'self'` - Your own images

- `data:` - Base64 encoded images

- `https:` - Any HTTPS URL (permissive for user avatars, external images)

  

##### `frame-ancestors 'none'`

**Who can embed your site in an iframe**

  

```

frame-ancestors 'none'

```

  

- `'none'` - No one can embed your CRM

- Similar to `X-Frame-Options: DENY`

- CSP version is more modern and secure

  

---

  

### Caching Strategy: Making Your Site BLAZING Fast

  

```json

{

  "source": "/assets/(.*)",

  "headers": [{

    "key": "Cache-Control",

    "value": "public, max-age=31536000, immutable"

  }]

}

```

  

This applies to all files in the `/assets/` directory.

  

#### Breaking Down the Cache-Control Header:

  

`"Cache-Control": "public, max-age=31536000, immutable"`

  

**`public`**

- Anyone (browsers, CDNs, proxies) can cache this file

- Not private to one user

  

**`max-age=31536000`**

- Cache for **31,536,000 seconds**

- That's **365 days** = **1 YEAR**

- Browser won't request this file again for a year

  

**`immutable`**

- File will **NEVER change**

- Don't bother checking if it's updated

- This works because of hash-based filenames

  

#### How This Makes Your Site Insanely Fast:

  

**First visit:**

```

User visits: https://crm.kjrcloud.com

Browser downloads: Contacts-BVv5A5tK.js (2.1KB)

Server sends header: Cache-Control: public, max-age=31536000, immutable

Browser saves to cache: ✅ (will keep for 1 year)

Time: 50ms download

```

  

**Second visit (1 minute later):**

```

User visits: https://crm.kjrcloud.com/contacts

Browser checks: Do I have Contacts-BVv5A5tK.js in cache?

Cache says: Yes! Saved 1 minute ago, valid for 365 days

Browser uses: Cached file

Server request: ZERO

Time: 0ms (instant) ⚡

```

  

**Second visit (6 months later):**

```

User visits: https://crm.kjrcloud.com/contacts

Browser checks: Do I have Contacts-BVv5A5tK.js in cache?

Cache says: Yes! Saved 6 months ago, still valid for 6 more months

Browser uses: Cached file

Server request: ZERO

Time: 0ms (instant) ⚡

```

  

**After you deploy new code with changes:**

```

New build creates: Contacts-Xy9ZpQw2.js (different hash!)

HTML now references: <script src="/assets/Contacts-Xy9ZpQw2.js">

Browser checks: Do I have Contacts-Xy9ZpQw2.js in cache?

Cache says: No (different filename)

Browser downloads: New file (50ms)

Old cache file: Contacts-BVv5A5tK.js becomes irrelevant (different name, never requested)

```

  

#### Why This Strategy is Brilliant:

  

✅ **Instant loads for returning users** - 0ms download time

✅ **Updates work immediately** - New hash = new file = auto-download

✅ **No "hard refresh" needed** - Users automatically get new code

✅ **Saves bandwidth** - Millions of cached requests = no server load

✅ **Works globally** - Vercel's CDN caches in 100+ locations

✅ **No stale content issues** - Can't serve old code with new HTML

  

#### Additional Cache Headers:

  

```json

{

  "source": "/assets/(.*).js",

  "headers": [

    {

      "key": "Content-Type",

      "value": "application/javascript; charset=utf-8"

    }

  ]

}

```

  

**Why this is needed:**

- Ensures JavaScript files are served with correct MIME type

- Some servers might serve `.js` as `text/plain` without this

- Browsers won't execute JavaScript with wrong content type

  

---

  

## Part 6: Environment Variables

  

Your app needs secrets (database credentials, API keys) but you **CAN'T** put them in code.

  

### ❌ NEVER Do This:

  

```typescript

// src/lib/supabase.ts - WRONG!

const supabaseUrl = "https://xyzabc.supabase.co"  // EXPOSED IN BUILD!

const supabaseKey = "eyJhbGciOiJIUzI1..."         // PUBLIC! INSECURE!

  

export const supabase = createClient(supabaseUrl, supabaseKey)

```

  

**Why this is terrible:**

- These values are **compiled into your JavaScript bundle**

- Anyone can view source and see them

- Your database credentials are **PUBLIC**

- Attackers can access your database directly

  

### ✅ Instead, Use Environment Variables:

  

```typescript

// src/lib/supabase.ts - CORRECT!

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  

export const supabase = createClient(supabaseUrl, supabaseKey)

```

  

**How this works:**

- Values are **NOT in your code**

- They're **injected at build time** from environment variables

- Different values for local dev vs. production

- Secrets stay secret

  

### Environment Variable Configuration:

  

This project uses a `.env.example` file as a template:

  

```bash

# .env.example - Template (committed to git)

  

# Supabase Configuration

VITE_SUPABASE_URL=your_supabase_project_url_here

VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

  

# Backend Testing (Optional)

SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

  

# OpenAI Configuration (Optional)

VITE_OPENAI_API_KEY=your_openai_api_key_here

  

# Environment

NODE_ENV=development

VITE_APP_ENV=development

```

  

### Local Development Setup:

  

**Step 1:** Copy the template

```bash

cp .env.example .env.local

```

  

**Step 2:** Fill in your actual values

```bash

# .env.local - Your secrets (NOT committed to git)

  

VITE_SUPABASE_URL=https://xyzabc.supabase.co

VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

VITE_OPENAI_API_KEY=sk-proj-abc123...

```

  

**Step 3:** Use in code

```typescript

// Vite automatically loads from .env.local

const url = import.meta.env.VITE_SUPABASE_URL  // "https://xyzabc.supabase.co"

```

  

### Vercel Production Setup:

  

**In Vercel Dashboard:**

  

1. Go to your project settings

2. Navigate to "Environment Variables"

3. Add each variable:

  

```

VITE_SUPABASE_URL = https://xyzabc.supabase.co

VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1...

VITE_OPENAI_API_KEY = sk-proj-abc123...

```

  

4. Select environments: `Production`, `Preview`, `Development`

5. Save

  

**During Vercel build:**

```bash

# Vercel injects these values automatically

npm run build

  ↓

Vite reads: VITE_SUPABASE_URL from Vercel environment

Vite replaces: import.meta.env.VITE_SUPABASE_URL → "https://xyzabc.supabase.co"

Build output: Contains hardcoded production URL (not the env var name)

```

  

### Important Rules for Vite Environment Variables:

  

**1. Must be prefixed with `VITE_`**

  

```bash

✅ VITE_SUPABASE_URL=https://...        # Exposed to client

✅ VITE_API_KEY=abc123                  # Exposed to client

  

❌ SUPABASE_URL=https://...             # NOT exposed (Vite ignores it)

❌ API_KEY=abc123                       # NOT exposed (Vite ignores it)

```

  

**2. Only `VITE_*` variables are bundled**

  

```typescript

console.log(import.meta.env.VITE_SUPABASE_URL)  // Works ✅

console.log(import.meta.env.DATABASE_URL)        // undefined ❌

```

  

**3. Non-`VITE_` variables are for build scripts only**

  

```bash

# .env

NODE_ENV=production              # Used by Node.js (server-side)

SUPABASE_SERVICE_ROLE_KEY=...    # Used by backend tests (server-side)

  

# These are NOT included in the browser bundle

# They're only available to Node.js scripts

```

  

### Security Best Practices:

  

**1. Never commit `.env.local`**

  

```bash

# .gitignore

.env.local

.env.*.local

```

  

**2. Use different keys for dev vs. production**

  

```

Development: VITE_SUPABASE_URL=http://localhost:54321

Production:  VITE_SUPABASE_URL=https://xyzabc.supabase.co

```

  

**3. Rotate keys periodically**

- Change Supabase anon key every 90 days

- Update in both Vercel and `.env.local`

  

**4. Use Supabase anon key, not service role key**

  

```bash

✅ VITE_SUPABASE_ANON_KEY=...     # Safe (limited permissions)

❌ VITE_SERVICE_ROLE_KEY=...      # DANGEROUS (full admin access)

```

  

The anon key has **Row Level Security (RLS)** policies applied. Even if leaked, attackers can't bypass database security.

  

---

  

## Part 7: Complete Deployment Workflow

  

Here's exactly what happens when you deploy to Vercel:

  

### Automatic Deployment (Git-based):

  

```

┌─────────────────────────────────────────────────────┐

│ Step 1: You Make Code Changes                       │

└─────────────────────────────────────────────────────┘

         │

         │ git add .

         │ git commit -m "Add new contact form validation"

         │ git push origin main

         ↓

┌─────────────────────────────────────────────────────┐

│ Step 2: GitHub Receives Push                        │

└─────────────────────────────────────────────────────┘

         │

         │ GitHub webhook triggers Vercel

         ↓

┌─────────────────────────────────────────────────────┐

│ Step 3: Vercel Detects Changes                      │

│ - Clones your repository                            │

│ - Checks out main branch                            │

│ - Reads vercel.json configuration                   │

└─────────────────────────────────────────────────────┘

         │

         ↓

┌─────────────────────────────────────────────────────┐

│ Step 4: Vercel Installs Dependencies                │

│ $ npm install                                        │

│ - Downloads 500+ packages from npm registry         │

│ - Creates node_modules/ (150MB+)                    │

│ - Takes ~30 seconds                                  │

└─────────────────────────────────────────────────────┘

         │

         ↓

┌─────────────────────────────────────────────────────┐

│ Step 5: Vercel Injects Environment Variables        │

│ - VITE_SUPABASE_URL=https://xyzabc.supabase.co     │

│ - VITE_SUPABASE_ANON_KEY=eyJhbGci...                │

│ - NODE_ENV=production                                │

└─────────────────────────────────────────────────────┘

         │

         ↓

┌─────────────────────────────────────────────────────┐

│ Step 6: Vercel Runs Build Command                   │

│ $ npm run build                                      │

│   ↓                                                  │

│ $ ./scripts/build.sh                                 │

│   ↓                                                  │

│ Step 6a: TypeScript Compilation                     │

│   - Checks all types                                 │

│   - Fails if errors found                            │

│   - Takes ~15 seconds                                │

│                                                      │

│ Step 6b: Vite Build                                  │

│   - Bundles 500+ files → 65 chunks                  │

│   - Minifies code                                    │

│   - Generates hashes                                 │

│   - Tree-shakes unused code                          │

│   - Takes ~45 seconds                                │

│                                                      │

│ Step 6c: Bundle Validation                           │

│   - Checks size < 3MB                                │

│   - Validates critical files exist                   │

│   - Generates build report                           │

│   - Takes ~5 seconds                                 │

│                                                      │

│ Total build time: ~90 seconds                        │

└─────────────────────────────────────────────────────┘

         │

         ↓

┌─────────────────────────────────────────────────────┐

│ Step 7: Vercel Validates Output                     │

│ - Checks dist/ folder exists                        │

│ - Verifies index.html is present                    │

│ - Validates asset file integrity                    │

└─────────────────────────────────────────────────────┘

         │

         ↓

┌─────────────────────────────────────────────────────┐

│ Step 8: Vercel Uploads to CDN                       │

│ - Compresses files (gzip/brotli)                    │

│ - Uploads to global edge network                    │

│ - Distributes to 100+ locations worldwide:          │

│   • San Francisco, USA                               │

│   • New York, USA                                    │

│   • London, UK                                       │

│   • Tokyo, Japan                                     │

│   • Sydney, Australia                                │

│   • ... and 95+ more                                 │

│ - Takes ~20 seconds                                  │

└─────────────────────────────────────────────────────┘

         │

         ↓

┌─────────────────────────────────────────────────────┐

│ Step 9: Vercel Applies Configuration                │

│ - Sets security headers (CSP, X-Frame-Options)      │

│ - Configures caching rules (1 year for assets)      │

│ - Sets up rewrites (SPA routing)                    │

└─────────────────────────────────────────────────────┘

         │

         ↓

┌─────────────────────────────────────────────────────┐

│ Step 10: Vercel Updates DNS                         │

│ - Points crm.kjrcloud.com to new deployment         │

│ - Updates SSL certificates (automatic)              │

│ - Atomic swap (zero downtime)                       │

└─────────────────────────────────────────────────────┘

         │

         ↓

┌─────────────────────────────────────────────────────┐

│ Step 11: Deployment Complete! 🎉                    │

│ - URL: https://crm.kjrcloud.com                     │

│ - Build time: ~2 minutes                             │

│ - Status: Live                                       │

└─────────────────────────────────────────────────────┘

```

  

### Preview Deployments (Feature Branches):

  

When you push to a **non-main branch**, Vercel creates a **preview deployment**:

  

```bash

# Create feature branch

git checkout -b feature/new-dashboard

  

# Make changes

# ... edit code ...

  

# Push to GitHub

git push origin feature/new-dashboard

```

  

**Vercel automatically:**

1. Builds this branch

2. Deploys to a unique URL: `https://crm-git-feature-new-dashboard-yourteam.vercel.app`

3. Comments on your PR with the preview URL

4. Lets you test before merging to main

  

**Benefits:**

- ✅ Test features before production

- ✅ Share work-in-progress with team

- ✅ Each PR gets its own environment

- ✅ No conflicts with production

  

### Manual Deployment via CLI:

  

You can also deploy manually:

  

```bash

# Install Vercel CLI

npm i -g vercel

  

# Login

vercel login

  

# Deploy

vercel --prod

```

  

This is useful for:

- Testing deployment process locally

- Deploying from CI/CD pipelines

- Manual rollbacks

  

---

  

## Part 8: Troubleshooting

  

### Common Deployment Issues:

  

#### Issue 1: Build Fails - "Module not found"

  

**Error:**

```

Error: Cannot find module '@/components/data-table'

```

  

**Cause:**

- Import path is wrong

- File doesn't exist

- TypeScript path alias not configured

  

**Solution:**

```bash

# Check file exists

ls src/components/data-table/index.ts

  

# Verify tsconfig.json has path alias

{

  "compilerOptions": {

    "paths": {

      "@/*": ["./src/*"]

    }

  }

}

  

# Verify vite.config.ts has alias

{

  resolve: {

    alias: {

      '@': path.resolve(__dirname, './src')

    }

  }

}

```

  

---

  

#### Issue 2: Bundle Size Exceeds Limit

  

**Error:**

```

❌ Bundle size (3.5MB) exceeds limit (3.0MB)

```

  

**Cause:**

- Too many dependencies

- Large images in bundle

- Not using code splitting

  

**Solution:**

```bash

# Analyze bundle

npm run build -- --analyze --open

  

# Look for:

# - Large vendor chunks (optimize imports)

# - Duplicate dependencies (dedupe)

# - Large images (use CDN instead)

  

# Example fixes:

# 1. Dynamic import for large features

const Dashboard = lazy(() => import('./features/dashboard'))

  

# 2. Optimize images (use external hosting)

# Move images to Supabase Storage instead of bundling

  

# 3. Check for duplicate packages

npm dedupe

```

  

---

  

#### Issue 3: Environment Variables Not Working

  

**Error:**

```

TypeError: Cannot read property 'VITE_SUPABASE_URL' of undefined

```

  

**Cause:**

- Environment variable not set in Vercel

- Missing `VITE_` prefix

- Using wrong environment (production vs preview)

  

**Solution:**

```bash

# 1. Check Vercel dashboard

# Settings → Environment Variables → Verify all variables

  

# 2. Ensure VITE_ prefix

# ❌ SUPABASE_URL

# ✅ VITE_SUPABASE_URL

  

# 3. Check environment scope

# Make sure variable is enabled for "Production"

  

# 4. Redeploy after adding variables

# Vercel → Deployments → Three dots → Redeploy

```

  

---

  

#### Issue 4: 404 Errors on Direct Navigation

  

**Error:**

```

User visits: https://crm.kjrcloud.com/contacts

Result: 404 Not Found

```

  

**Cause:**

- Missing `rewrites` configuration in `vercel.json`

  

**Solution:**

```json

// vercel.json

{

  "rewrites": [

    {

      "source": "/((?!assets/).*)",

      "destination": "/index.html"

    }

  ]

}

```

  

Push this change and redeploy.

  

---

  

#### Issue 5: CSP Blocks Supabase Connections

  

**Error in console:**

```

Refused to connect to 'https://xyzabc.supabase.co' because it violates CSP

```

  

**Cause:**

- `connect-src` directive doesn't include Supabase

  

**Solution:**

```json

// vercel.json

{

  "headers": [{

    "key": "Content-Security-Policy",

    "value": "... connect-src 'self' https://*.supabase.co wss://*.supabase.co; ..."

  }]

}

```

  

---

  

#### Issue 6: Slow Build Times

  

**Problem:**

Build takes 5+ minutes

  

**Causes:**

- Too many dependencies

- Not using build cache

- Running unnecessary scripts

  

**Solutions:**

```bash

# 1. Use Vercel's build cache

# (Enabled by default, but check Vercel dashboard settings)

  

# 2. Optimize package.json scripts

# Remove slow postinstall scripts

  

# 3. Use npm ci instead of npm install

# vercel.json

{

  "installCommand": "npm ci"

}

  

# 4. Reduce TypeScript strictness for builds

# tsconfig.json (separate tsconfig.build.json)

{

  "compilerOptions": {

    "skipLibCheck": true  // Faster builds

  }

}

```

  

---

  

#### Issue 7: Old Code Showing After Deployment

  

**Problem:**

Deployed new code but users see old version

  

**Causes:**

- Browser caching `index.html`

- CDN not purged

- User needs to hard refresh

  

**Solutions:**

```bash

# 1. Check deployment status

# Vercel dashboard → Ensure deployment is "Ready"

  

# 2. Check index.html cache headers

# Should NOT be cached long-term

# Only /assets/* should have 1-year cache

  

# 3. Hard refresh browser

# Ctrl+Shift+R (Windows/Linux)

# Cmd+Shift+R (Mac)

  

# 4. Verify hash changed

# View source → Check script src="/assets/index-[hash].js"

# Hash should be different after deployment

```

  

---

  

### Getting Help:

  

**Vercel Documentation:**

- https://vercel.com/docs

- Comprehensive guides and tutorials

  

**Vercel Support:**

- Free tier: Community support (GitHub discussions)

- Paid tier: Email support

  

**Project-specific:**

- Check `CLAUDE.md` for architecture notes

- Review `scripts/build.sh` for build process

- Check GitHub issues for known problems

  

---

  

## Summary: Key Takeaways

  

### What Vercel Does for You:

  

1. ✅ **Automatic builds** - Every git push triggers deployment

2. ✅ **Global CDN** - Fast loading worldwide

3. ✅ **HTTPS/SSL** - Automatic security certificates

4. ✅ **Preview deploys** - Test branches before merging

5. ✅ **Environment variables** - Secure secret management

6. ✅ **Zero downtime** - Atomic deployments

7. ✅ **Rollbacks** - Instant revert to previous version

  

### Your Deployment Checklist:

  

- [ ] Code changes committed to git

- [ ] `npm run build` works locally

- [ ] Environment variables set in Vercel

- [ ] `vercel.json` configured correctly

- [ ] Push to GitHub (triggers deployment)

- [ ] Check Vercel dashboard for build status

- [ ] Verify deployment at production URL

- [ ] Test critical features (login, database access)

  

### Files That Control Deployment:

  

```

vercel.json           → Vercel configuration

vite.config.ts        → Build optimization

package.json          → Dependencies and scripts

scripts/build.sh      → Custom build process

.env.example          → Environment variable template

tsconfig.json         → TypeScript settings

```

  

---

  

**Production URL:** https://crm.kjrcloud.com

**Platform:** Vercel Edge Network

**Framework:** Vite + React + TypeScript

**Database:** Supabase (PostgreSQL)

**Deployment:** Automatic via GitHub integration

  

**Last Updated:** October 2025