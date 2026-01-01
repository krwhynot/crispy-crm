# Authentication Foundation - Manual E2E Test

Comprehensive authentication testing for Crispy CRM. This is TEST 1 of the progressive 6-test RBAC suite and must pass completely before any other RBAC tests can be executed. All authentication flows, session management, and protected route access patterns are validated here.

## Test Environment Setup

**Environment Selection:**
| Environment | Base URL | Credentials |
|-------------|----------|-------------|
| Local | ${BASE_URL} | admin@test.com / password123 |
| Production | https://crm.kjrcloud.com | [production credentials] |

## Prerequisites

- [ ] Development server running at ${BASE_URL} (local) or production URL accessible
- [ ] Supabase local instance running (`npx supabase start`) - local only
- [ ] Test database seeded with E2E data (`just seed-e2e`) - local only
- [ ] Browser DevTools accessible (F12)
- [ ] Test user accounts exist in database:
  - Admin: admin@test.com / password123 (local) or [production credentials]
  - Manager: manager@mfbroker.com / password123 (local) or [production credentials]
  - Rep: rep@mfbroker.com / password123 (local) or [production credentials]
- [ ] Incognito/private browser window available for clean session testing
- [ ] Second browser tab or window available for multi-tab tests

---

## Section A: Login Flow Validation

### Test A1: Admin Login with Valid Credentials

**Objective:** Verify that an admin user can successfully log in with valid credentials and access the dashboard.

#### Steps

1. Open a new incognito/private browser window
2. Press F12 to open browser DevTools
3. Click on the "Console" tab in DevTools
4. Click on the "Network" tab in DevTools and ensure "Preserve log" is checked
5. Navigate to ${BASE_URL}
6. Wait for the login page to fully load (observe Network tab for requests completing)
7. Verify the login form is displayed with Email and Password fields
8. Click into the Email input field
9. Type `admin@test.com` into the Email field
10. Click into the Password input field
11. Type `password123` into the Password field
12. Verify the "Sign In" button is now enabled (not grayed out)
13. Click the "Sign In" button
14. Observe the Network tab for the authentication request to `/auth/v1/token`
15. Wait for the page to redirect (URL changes from `/#/login` to `/#/`)

#### Expected Results

- [ ] Login page renders within 5 seconds of navigation
- [ ] Email input field accepts text input without errors
- [ ] Password input field masks characters as dots/bullets
- [ ] Authentication request returns HTTP 200 status code
- [ ] Page redirects to dashboard (`/#/`) within 10 seconds
- [ ] Dashboard content is visible (not a blank page)
- [ ] User name or email is displayed somewhere in the UI (header/sidebar)
- [ ] Check browser console for errors - no red error messages should appear
- [ ] No RLS (Row-Level Security) errors in console (pattern: "permission denied", "42501")
- [ ] No uncaught promise rejections in console

#### Pass/Fail: [ ]

---

### Test A2: Manager Login with Valid Credentials

**Objective:** Verify that a manager user can successfully log in with valid credentials and access the dashboard.

#### Steps

1. Open a new incognito/private browser window (or clear existing session)
2. Press F12 to open browser DevTools
3. Click on the "Console" tab in DevTools
4. Clear the console (Ctrl+L or right-click > Clear console)
5. Navigate to ${BASE_URL}
6. Wait for the login page to fully load
7. Verify the URL contains `/#/login` or shows the login form
8. Locate the Email input field on the login form
9. Click into the Email input field
10. Type `manager@mfbroker.com` into the Email field
11. Press Tab key to move focus to Password field
12. Type `password123` into the Password field
13. Verify both fields contain the entered values
14. Locate the "Sign In" button at the bottom of the form
15. Click the "Sign In" button
16. Watch the button for a loading state (spinner or disabled state)
17. Wait for the authentication to complete

#### Expected Results

- [ ] Login form is accessible and all fields are visible
- [ ] Tab navigation works correctly between Email and Password fields
- [ ] Sign In button shows loading state during authentication
- [ ] Authentication request completes successfully (200 status)
- [ ] Page redirects to dashboard (`/#/`) after successful login
- [ ] Dashboard displays manager-appropriate content
- [ ] Check browser console for errors - no red error messages
- [ ] No network errors (check Network tab for failed requests - red entries)
- [ ] Session is established (check Application > Storage > Local Storage for tokens)

#### Pass/Fail: [ ]

---

### Test A3: Rep Login with Valid Credentials

**Objective:** Verify that a sales rep user can successfully log in with valid credentials and access the dashboard.

#### Steps

1. Close any existing browser windows with the app open
2. Open a fresh incognito/private browser window
3. Open browser DevTools (F12)
4. Navigate to the Console tab and clear any existing messages
5. Navigate to the Network tab and clear existing requests
6. Type ${BASE_URL} in the address bar and press Enter
7. Wait for the page to load completely (watch Network tab for activity to stop)
8. Confirm the login page is displayed
9. Find the Email input field
10. Click the Email field to give it focus
11. Enter the email: `rep@mfbroker.com`
12. Find the Password input field
13. Click the Password field to give it focus
14. Enter the password: `password123`
15. Move mouse to the "Sign In" button
16. Verify the button is clickable (not disabled)
17. Click the "Sign In" button
18. Monitor the Network tab for the authentication POST request

#### Expected Results

- [ ] Login page loads without JavaScript errors
- [ ] Form fields accept input correctly
- [ ] Authentication request is sent to Supabase auth endpoint
- [ ] Authentication returns 200 OK status
- [ ] JWT tokens are returned in the response
- [ ] User is redirected to dashboard within 10 seconds
- [ ] Rep-specific content or views are displayed
- [ ] Check browser console for errors - no critical errors
- [ ] No CORS errors in console
- [ ] No 401 or 403 errors after login

#### Pass/Fail: [ ]

---

### Test A4: Login with Invalid Password

**Objective:** Verify that login fails gracefully with an incorrect password and displays an appropriate error message.

#### Steps

1. Open a new incognito/private browser window
2. Open browser DevTools (F12)
3. Navigate to the Console tab
4. Navigate to ${BASE_URL}
5. Wait for the login page to fully load
6. Click into the Email input field
7. Type `admin@test.com` (a valid email that exists)
8. Click into the Password input field
9. Type `wrongpassword` (an incorrect password)
10. Click the "Sign In" button
11. Wait for the authentication request to complete
12. Observe the form for an error message display
13. Check the Network tab for the authentication response
14. Check the Console tab for any logged errors
15. Verify the page did NOT redirect away from the login form

#### Expected Results

- [ ] Authentication request is sent to server
- [ ] Server returns 400 or 401 status code (not 200)
- [ ] Error message is displayed on the form (e.g., "Invalid credentials", "Invalid login credentials")
- [ ] Error message is visible and readable (proper contrast)
- [ ] Form remains on the login page (URL still contains `/#/login` or login form is visible)
- [ ] Password field is cleared after failed attempt (security best practice)
- [ ] Email field retains the entered value
- [ ] No JavaScript errors in console (error is handled gracefully)
- [ ] User can attempt login again with different credentials
- [ ] No session tokens stored in localStorage

#### Pass/Fail: [ ]

---

### Test A5: Login with Non-Existent Email

**Objective:** Verify that login fails gracefully when attempting to log in with an email that does not exist in the system.

#### Steps

1. Open a new incognito/private browser window
2. Open browser DevTools (F12)
3. Click on the Console tab
4. Click on the Network tab
5. Navigate to ${BASE_URL}
6. Wait for the login page to load completely
7. Verify the Email input field is visible
8. Click into the Email input field
9. Type `nonexistent@example.com` (an email that does not exist)
10. Click into the Password input field
11. Type `password123`
12. Locate and click the "Sign In" button
13. Wait 5 seconds for the authentication attempt to complete
14. Look for an error message on the screen
15. Check Network tab for the response status code

#### Expected Results

- [ ] Authentication request is made to the server
- [ ] Server returns 400 or 401 status (not a 500 error)
- [ ] Error message is displayed to the user
- [ ] Error message does NOT reveal whether the email exists (security: "Invalid credentials" not "User not found")
- [ ] Form stays on the login page
- [ ] No redirect to dashboard or other pages
- [ ] No unhandled exceptions in console
- [ ] User can re-enter different credentials and try again
- [ ] Sign In button becomes clickable again after error
- [ ] No tokens stored in browser storage

#### Pass/Fail: [ ]

---

### Test A6: Login Form Validation (Empty Fields)

**Objective:** Verify that the login form properly validates required fields and prevents submission when fields are empty.

#### Steps

1. Open a new incognito/private browser window
2. Open browser DevTools (F12)
3. Navigate to ${BASE_URL}
4. Wait for the login page to load
5. DO NOT enter anything in the Email field
6. DO NOT enter anything in the Password field
7. Look at the "Sign In" button - observe its state
8. If the button is enabled, click it
9. Observe the form for validation messages
10. Now click into the Email field
11. Type one character and then delete it (to trigger touched state)
12. Click into the Password field
13. Click back into the Email field (to trigger blur on Password)
14. Observe for validation error messages
15. Check if form prevented network request (Network tab)

#### Expected Results

- [ ] Sign In button is either disabled when fields are empty OR
- [ ] Clicking Sign In with empty fields shows validation errors
- [ ] Validation message appears for empty Email field (e.g., "Email is required")
- [ ] Validation message appears for empty Password field (e.g., "Password is required")
- [ ] No network request is made when form is invalid
- [ ] Validation messages are visible (not hidden behind elements)
- [ ] Validation messages have proper contrast for readability
- [ ] Form fields show error state styling (red border or similar)
- [ ] Check browser console for errors - no critical errors
- [ ] Focus moves to the first invalid field when attempting to submit

#### Pass/Fail: [ ]

---

## Section B: Session Management

### Test B1: Session Persists After Page Refresh

**Objective:** Verify that a logged-in user's session persists after refreshing the browser page.

#### Steps

1. Open a new incognito/private browser window
2. Navigate to ${BASE_URL}
3. Log in with valid credentials (admin@test.com / password123)
4. Wait for successful login and dashboard to load
5. Verify you are on the dashboard page (`/#/`)
6. Open browser DevTools (F12)
7. Click on the Application tab
8. Expand "Local Storage" in the left sidebar
9. Click on ${BASE_URL}
10. Look for Supabase auth tokens (keys containing "supabase" or "sb-")
11. Note the token values (or confirm they exist)
12. Press F5 or Ctrl+R to refresh the page
13. Wait for the page to reload completely
14. Observe the current page after reload

#### Expected Results

- [ ] Before refresh: User is logged in and viewing dashboard
- [ ] Auth tokens are present in localStorage before refresh
- [ ] After refresh: Page reloads without showing login form
- [ ] After refresh: User remains on dashboard (`/#/`)
- [ ] After refresh: Dashboard content loads normally
- [ ] After refresh: User identity is maintained (same user shown in header)
- [ ] Auth tokens are still present in localStorage after refresh
- [ ] Check browser console for errors - no auth-related errors
- [ ] No redirect loop between login and dashboard
- [ ] API calls after refresh succeed (200 status codes)

#### Pass/Fail: [ ]

---

### Test B2: Session Persists After Browser Tab Close/Reopen

**Objective:** Verify that a logged-in user's session persists after closing and reopening the browser tab.

#### Steps

1. Open a new browser window (not incognito for this test)
2. Navigate to ${BASE_URL}
3. Log in with valid credentials (admin@test.com / password123)
4. Wait for dashboard to load completely
5. Open browser DevTools (F12)
6. Navigate to Application tab > Local Storage
7. Confirm auth tokens exist for ${BASE_URL}
8. Note the access_token expiration time if visible
9. Close the browser tab (Ctrl+W or click X)
10. DO NOT close the entire browser window
11. Open a new tab (Ctrl+T)
12. Navigate to ${BASE_URL}
13. Wait for the page to load
14. Observe which page appears

#### Expected Results

- [ ] After reopening tab: App loads directly to dashboard (not login)
- [ ] After reopening tab: User is still authenticated
- [ ] After reopening tab: Dashboard displays user's data
- [ ] After reopening tab: No login form is shown
- [ ] After reopening tab: Auth tokens still exist in localStorage
- [ ] Check browser console for errors - no auth session errors
- [ ] User can interact with the app normally (create, edit, view)
- [ ] API calls succeed without 401 errors
- [ ] User identity is consistent with original login
- [ ] No flash of login page before dashboard

#### Pass/Fail: [ ]

---

### Test B3: Logout Clears Session Completely

**Objective:** Verify that logging out completely clears the user session and all stored tokens.

#### Steps

1. Open a browser window
2. Navigate to ${BASE_URL}
3. Log in with valid credentials (admin@test.com / password123)
4. Wait for dashboard to load
5. Open browser DevTools (F12)
6. Navigate to Application tab > Local Storage
7. Confirm auth tokens exist (expand and view)
8. Look for the logout button/link in the app UI
9. Common locations: user menu dropdown, sidebar, header
10. Click on the user menu or profile area
11. Find and click the "Logout" or "Sign Out" button
12. Wait for the logout process to complete
13. Observe the page after logout
14. Check localStorage again in DevTools

#### Expected Results

- [ ] Logout button/link is visible and accessible
- [ ] Clicking logout initiates the sign-out process
- [ ] Page redirects to login page after logout
- [ ] Login form is displayed after logout
- [ ] Auth tokens are REMOVED from localStorage
- [ ] All Supabase-related storage items are cleared
- [ ] Check browser console for errors - no errors during logout
- [ ] No residual session data remains in storage
- [ ] Refresh after logout still shows login page (not dashboard)
- [ ] User cannot access protected routes after logout

#### Pass/Fail: [ ]

---

### Test B4: Cannot Access Protected Route After Logout

**Objective:** Verify that protected routes are not accessible after logging out.

#### Steps

1. Open a browser window
2. Navigate to ${BASE_URL}
3. Log in with valid credentials (admin@test.com / password123)
4. Navigate to a protected route: ${BASE_URL}/#/contacts
5. Verify the contacts list loads successfully
6. Note the URL: `/#/contacts`
7. Perform logout (find logout button, click it)
8. Wait for redirect to login page
9. Confirm you are on the login page
10. Type ${BASE_URL}/#/contacts directly in the address bar
11. Press Enter to navigate
12. Wait for the page to load
13. Observe the result
14. Try other protected routes: `/#/opportunities`, `/#/organizations`

#### Expected Results

- [ ] After logout: Navigating to `/#/contacts` does NOT show contacts list
- [ ] After logout: Protected route redirects to login page
- [ ] After logout: URL changes to `/#/login` or login form appears
- [ ] After logout: No sensitive data is visible on the page
- [ ] After logout: Attempting `/#/opportunities` also redirects to login
- [ ] After logout: Attempting `/#/organizations` also redirects to login
- [ ] Check browser console for errors - expect 401 if API called, but should be handled
- [ ] No flash of protected content before redirect
- [ ] Login form is functional and accepts new login
- [ ] No cached data visible from previous session

#### Pass/Fail: [ ]

---

### Test B5: Multiple Tabs Share Same Session

**Objective:** Verify that multiple browser tabs share the same authentication session and logout affects all tabs.

#### Steps

1. Open a browser window
2. Navigate to ${BASE_URL}
3. Log in with valid credentials (admin@test.com / password123)
4. Wait for dashboard to load
5. Open a new browser tab (Ctrl+T)
6. In the new tab, navigate to ${BASE_URL}/#/contacts
7. Verify the contacts list loads (user is authenticated)
8. Open another new tab (Tab 3)
9. Navigate to ${BASE_URL}/#/opportunities
10. Verify opportunities list loads
11. Now go back to Tab 1 (dashboard)
12. Perform logout
13. Wait for logout to complete in Tab 1
14. Switch to Tab 2 (contacts)
15. Refresh the page (F5) in Tab 2

#### Expected Results

- [ ] Tab 2 initially loads contacts while Tab 1 is logged in (session shared)
- [ ] Tab 3 initially loads opportunities while Tab 1 is logged in (session shared)
- [ ] All tabs use the same auth tokens from localStorage
- [ ] After logout in Tab 1: Refreshing Tab 2 shows login page
- [ ] After logout in Tab 1: Refreshing Tab 3 shows login page
- [ ] Logout in one tab invalidates session for all tabs
- [ ] Check browser console for errors - auth session cleared messages are OK
- [ ] No data leakage between sessions
- [ ] Login from any tab re-authenticates all tabs on refresh
- [ ] Storage events properly propagate between tabs (if applicable)

#### Pass/Fail: [ ]

---

## Section C: Protected Route Access

### Test C1: Unauthenticated Access Redirects to Login

**Objective:** Verify that attempting to access protected routes without authentication redirects to the login page.

#### Steps

1. Open a new incognito/private browser window
2. Open browser DevTools (F12)
3. Navigate to the Application tab
4. Expand Local Storage > ${BASE_URL}
5. Confirm NO auth tokens are present (should be empty or no Supabase keys)
6. In the address bar, type: ${BASE_URL}/#/contacts
7. Press Enter to navigate
8. Wait for the page to load
9. Observe the final URL in the address bar
10. Observe the content displayed on the page
11. Try another protected route: ${BASE_URL}/#/opportunities
12. Wait and observe the result
13. Try the dashboard: ${BASE_URL}/#/
14. Wait and observe the result

#### Expected Results

- [ ] Navigating to `/#/contacts` without auth redirects to login
- [ ] Navigating to `/#/opportunities` without auth redirects to login
- [ ] Navigating to `/#/` (dashboard) without auth redirects to login
- [ ] Login form is displayed after redirect
- [ ] No protected content is briefly visible before redirect
- [ ] URL changes to `/#/login` or similar login route
- [ ] Check browser console for errors - handled 401s are OK, no unhandled errors
- [ ] No network requests return sensitive data
- [ ] All API calls return 401 (unauthorized) before redirect
- [ ] Login form is fully functional after redirect

#### Pass/Fail: [ ]

---

### Test C2: Deep Link Preserved After Login

**Objective:** Verify that when a user logs in after being redirected from a protected route, they are redirected back to the original route.

#### Steps

1. Open a new incognito/private browser window
2. Ensure no authentication tokens exist (fresh incognito)
3. Navigate directly to: ${BASE_URL}/#/contacts/create
4. Wait for redirect to login page
5. Confirm you are on the login page
6. Note if the URL contains a return path or the original route is preserved somehow
7. Enter valid credentials:
   - Email: admin@test.com
   - Password: password123
8. Click the "Sign In" button
9. Wait for authentication to complete
10. Observe the URL after successful login
11. Observe the content displayed after login
12. Check if you landed on the contacts create page

#### Expected Results

- [ ] Initial navigation to protected route redirects to login
- [ ] Login page loads without errors
- [ ] After successful login: URL is `/#/contacts/create` (original destination)
- [ ] After successful login: Contacts create form is displayed
- [ ] User does NOT land on generic dashboard first
- [ ] Deep link is preserved through the authentication flow
- [ ] Check browser console for errors - no redirect errors
- [ ] Form on contacts/create is functional
- [ ] User can complete the action they originally intended
- [ ] Back button navigation works correctly

#### Pass/Fail: [ ]

---

### Test C3: Auth Token Stored Correctly in localStorage

**Objective:** Verify that authentication tokens are correctly stored in localStorage with proper structure and values.

#### Steps

1. Open a new incognito/private browser window
2. Open browser DevTools (F12)
3. Navigate to Application tab
4. Expand Local Storage in the left sidebar
5. Click on ${BASE_URL} (may need to navigate first to create entry)
6. Confirm localStorage is empty or has no Supabase auth keys
7. Navigate to ${BASE_URL}
8. Log in with valid credentials (admin@test.com / password123)
9. Wait for dashboard to load
10. Go back to DevTools Application tab > Local Storage
11. Refresh the storage view if needed
12. Look for keys containing "supabase" or "sb-"
13. Click on the auth-related key to view its value
14. Examine the stored JSON structure

#### Expected Results

- [ ] Auth token key exists after login (e.g., `sb-<project-ref>-auth-token`)
- [ ] Token value is a valid JSON object (not malformed)
- [ ] Token contains `access_token` field with a JWT string
- [ ] Token contains `refresh_token` field
- [ ] Token contains `expires_at` or `expires_in` timestamp
- [ ] Token contains `user` object with user details
- [ ] User object includes `email` matching logged-in user
- [ ] User object includes `id` (UUID)
- [ ] Check browser console for errors - no token storage errors
- [ ] Token values are not visible in plain text (they are, but should be handled securely by app)

#### Pass/Fail: [ ]

---

### Test C4: Expired Token Redirects to Login

**Objective:** Verify that when an auth token expires, the user is redirected to the login page and cannot access protected routes.

#### Steps

1. Open a browser window (not incognito - we need to manipulate storage)
2. Navigate to ${BASE_URL}
3. Log in with valid credentials (admin@test.com / password123)
4. Wait for dashboard to load
5. Open browser DevTools (F12)
6. Navigate to Application tab > Local Storage
7. Find the Supabase auth token key
8. Click on the key to view its value
9. Copy the value to a text editor
10. Modify the `expires_at` value to a past timestamp (e.g., `1000000000`)
11. Paste the modified JSON back into localStorage (right-click > Edit Value)
12. Navigate to ${BASE_URL}/#/contacts
13. Wait for the page to load
14. Observe the result
15. Check if app attempts token refresh or redirects to login

#### Expected Results

- [ ] App detects the expired token during route navigation
- [ ] App either attempts token refresh OR redirects to login
- [ ] If refresh fails: User is redirected to login page
- [ ] If refresh succeeds: User remains on requested page (token auto-renewed)
- [ ] User cannot access protected content with expired token
- [ ] Check browser console for errors - token expiration messages are expected
- [ ] No sensitive data is exposed during token validation
- [ ] Login page is functional for re-authentication
- [ ] After re-login: User can access protected routes normally
- [ ] Fresh valid tokens are stored after re-authentication

#### Pass/Fail: [ ]

---

## Pass Criteria

**ALL 15 tests in Sections A, B, and C must pass** for the Authentication Foundation test suite to be considered successful.

### Blocking Issues (Must Fix Before Proceeding)

If any of these tests fail, the issue is critical and blocks further RBAC testing:

- **A1-A3 (Valid Login):** Users cannot log in at all
- **B1-B2 (Session Persistence):** Sessions don't persist across refreshes
- **B3-B4 (Logout/Protected Routes):** Security issue - logout doesn't clear session
- **C1 (Unauthenticated Redirect):** Security issue - protected routes exposed

### Test Execution Summary

| Section | Tests | Status |
|---------|-------|--------|
| A. Login Flow Validation | A1, A2, A3, A4, A5, A6 | [ ] Pass / [ ] Fail |
| B. Session Management | B1, B2, B3, B4, B5 | [ ] Pass / [ ] Fail |
| C. Protected Route Access | C1, C2, C3, C4 | [ ] Pass / [ ] Fail |
| **OVERALL** | **15 tests** | [ ] **Pass** / [ ] **Fail** |

---

## Troubleshooting Guide

### Common Issues

#### Login Fails with Valid Credentials
1. Check if Supabase local instance is running: `npx supabase status`
2. Verify test users exist: `npx supabase db reset` to reseed
3. Check network tab for actual error response from auth endpoint
4. Verify `.env` file has correct Supabase URL and anon key

#### Session Not Persisting
1. Check if localStorage is being blocked (private mode settings)
2. Verify Supabase client is configured with correct storage options
3. Check for JavaScript errors preventing token storage
4. Ensure no browser extensions are clearing storage

#### Protected Routes Not Redirecting
1. Check if auth guard/wrapper is properly configured in router
2. Verify the auth context is wrapping the app correctly
3. Check for race conditions in auth state initialization
4. Look for console errors during navigation

#### Logout Not Clearing Session
1. Verify Supabase `signOut()` is being called correctly
2. Check if all storage items are being cleared (localStorage, sessionStorage)
3. Look for multiple auth providers that might need separate logout
4. Check for auth state listeners that need cleanup

---

## Notes

### Security Considerations

- Never log or display actual password values during testing
- Ensure test credentials are not committed to version control
- Clear browser data after testing in shared environments
- Report any security issues (exposed tokens, missing redirects) immediately

### Browser Compatibility

Test in multiple browsers if possible:
- Chrome (primary)
- Firefox
- Safari (if on macOS)
- Edge

Note any browser-specific differences in test results.

### Related Test Suites

This test suite (06-auth-foundation) must pass before running:
- 07-role-data-access.md - Role-based data access tests
- 08-field-visibility.md - Field-level permission tests
- 09-action-permissions.md - Action/button visibility tests
- 10-navigation-security.md - Navigation and menu permission tests
- 11-rbac-regression.md - Full RBAC regression suite

---

## Production Safety

**Tests Safe for Production (Read-Only):**
| Test | Safe for Production | Notes |
|------|---------------------|-------|
| A1-A3: Login Tests | Yes | Read-only authentication |
| B1-B3: Session Tests | Yes | Read-only session verification |
| C1-C3: Logout Tests | Yes | Read-only, just verifies logout |
| D1-D3: Multi-tab Tests | Yes | Read-only session checks |
| E1-E3: Protected Route Tests | Yes | Read-only navigation tests |
| F1: Login Redirect | Yes | Read-only verification |
| G1: Token Manipulation | NO - LOCAL ONLY | Modifies localStorage directly |

**Local-Only Tests:**
- G1: Token Expiration/Manipulation - This test requires modifying localStorage values directly, which could corrupt production sessions. Only run on local environment.
