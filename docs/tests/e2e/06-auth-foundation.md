# Authentication Foundation - Manual E2E Test

Foundational authentication tests that verify login flows, session management, and protected route access. This is TEST 1 of the progressive RBAC suite and MUST pass before any other RBAC tests can run.

## Prerequisites

- [ ] Application is running locally at http://localhost:5173
- [ ] **Pre-flight health check passes** (see below)
- [ ] Browser DevTools is accessible (F12)
- [ ] Test user accounts exist in the database:
  - Admin: admin@test.com / password123
  - Manager: manager@mfbroker.com / password123
  - Rep: rep@mfbroker.com / password123
- [ ] Browser is in a clean state (clear cookies/localStorage for localhost)
- [ ] Network tab is open in DevTools to monitor auth requests

### Pre-Flight Health Check

Before starting any tests, verify the application loads correctly:

1. Navigate to http://localhost:5173
2. Open DevTools Console (F12 > Console tab)
3. Wait for page to finish loading (watch Network tab)
4. **Verify NO red JavaScript errors** in Console
5. **Verify login page appears** (not stuck on "Loading..." screen)
6. Verify you see email and password input fields

**If health check fails:** See [Troubleshooting](#troubleshooting) section at the end of this document.

---

## Section A: Login Flow Validation

### Test A1: Admin Login with Valid Credentials

**Objective:** Verify that an admin user can successfully authenticate and access the application.

#### Steps

1. Open a new browser window (not incognito for now)
2. Press F12 to open browser DevTools
3. Click on the "Console" tab in DevTools
4. Click on the "Network" tab in DevTools (keep both visible if possible)
5. Clear the console by clicking the "Clear console" button (circle with line)
6. Navigate to http://localhost:5173 in the address bar
7. Wait for the page to fully load (watch Network tab for requests to complete)
8. Verify the login page is displayed with email and password fields
9. Click inside the "Email" input field
10. Type: admin@test.com
11. Press Tab key to move to the "Password" field
12. Type: password123
13. Verify both fields show the entered values correctly
14. Locate the "Sign In" button (or equivalent login button)
15. Click the "Sign In" button
16. Watch the Network tab for the authentication request to /auth/v1/token
17. Wait for the page to redirect (observe URL change in address bar)
18. Verify the URL has changed to http://localhost:5173/#/ (or dashboard route)
19. Confirm the dashboard or main application view is now visible
20. Check the Console tab for any red error messages

#### Expected Results

- The login page renders with email and password fields within 5 seconds
- The /auth/v1/token request returns HTTP 200 status
- The page redirects to /#/ (dashboard) within 10 seconds after clicking Sign In
- The dashboard content is visible (navigation, main content area)
- No red console errors appear (warnings are acceptable)
- User identity is confirmed (e.g., user menu shows admin email or name)

#### Pass/Fail: [ ]

---

### Test A2: Manager Login with Valid Credentials

**Objective:** Verify that a manager user can successfully authenticate and access the application.

#### Steps

1. If logged in from previous test, log out first (see Test B3 for logout steps)
2. Open browser DevTools if not already open (F12)
3. Navigate to the Console tab and clear any existing messages
4. Navigate to the Network tab to monitor requests
5. Navigate to http://localhost:5173/#/login (or refresh if on login page)
6. Wait for the login page to fully load
7. Verify the login form is displayed with empty input fields
8. Click inside the "Email" input field
9. Type: manager@mfbroker.com
10. Click inside the "Password" input field (or press Tab)
11. Type: password123
12. Double-check the email field shows exactly "manager@mfbroker.com"
13. Double-check the password field shows bullet points indicating entered text
14. Click the "Sign In" button
15. Watch the Network tab for the POST request to /auth/v1/token
16. Observe the response status code (should be 200)
17. Wait for the redirect to complete
18. Verify the URL is now http://localhost:5173/#/
19. Verify the dashboard or main application content is visible
20. Check Console tab - confirm no red error messages

#### Expected Results

- Login page accepts manager@mfbroker.com credentials
- Authentication request returns HTTP 200 status
- User is redirected to the dashboard (/#/) after successful login
- Dashboard renders correctly with expected content
- No console errors related to authentication or authorization
- Manager user session is established

#### Pass/Fail: [ ]

---

### Test A3: Rep Login with Valid Credentials

**Objective:** Verify that a rep (sales representative) user can successfully authenticate and access the application.

#### Steps

1. If logged in from previous test, log out first
2. Clear browser localStorage to ensure clean state:
   - Open DevTools (F12)
   - Go to Application tab (or Storage in Firefox)
   - Expand "Local Storage" in left sidebar
   - Right-click on http://localhost:5173 and select "Clear"
3. Refresh the page or navigate to http://localhost:5173
4. Wait for the login page to load completely
5. Verify the login form is empty and ready for input
6. Click into the "Email" input field
7. Type: rep@mfbroker.com
8. Press Tab to move to password field
9. Type: password123
10. Switch to the Network tab in DevTools
11. Click the "Sign In" button
12. Observe the network request to /auth/v1/token being made
13. Verify the response status is 200 OK
14. Wait for the page redirect to complete
15. Verify the URL changes to http://localhost:5173/#/
16. Verify the main application interface loads
17. Check for the presence of sidebar navigation
18. Check for the presence of main content area
19. Look for any indication of logged-in user (profile menu, username display)
20. Check Console tab for any authentication-related errors

#### Expected Results

- Rep user credentials are accepted
- /auth/v1/token request succeeds with HTTP 200
- Page redirects to dashboard within 10 seconds
- Application interface is fully rendered
- No RLS (Row-Level Security) errors in console
- No "permission denied" messages in console or on screen
- Rep user session is active

#### Pass/Fail: [ ]

---

### Test A4: Login with Invalid Password

**Objective:** Verify that login fails gracefully when an incorrect password is provided.

#### Steps

1. Ensure you are logged out (clear localStorage or complete logout flow)
2. Navigate to http://localhost:5173/#/login
3. Wait for the login page to load
4. Open DevTools Console tab and clear existing messages
5. Open DevTools Network tab
6. Click into the "Email" input field
7. Type: admin@test.com (valid email)
8. Press Tab to move to password field
9. Type: wrongpassword123 (invalid password)
10. Click the "Sign In" button
11. Observe the Network tab for the authentication request
12. Note the HTTP status code of the /auth/v1/token request
13. Wait for the page response (2-3 seconds)
14. Look for an error message on the login form
15. Verify the error message text (e.g., "Invalid credentials", "Invalid login credentials")
16. Confirm the page did NOT redirect away from login
17. Check that the URL is still http://localhost:5173/#/login
18. Verify the email field still contains admin@test.com
19. Check that the password field is either cleared or still contains the entered text
20. Verify no crash or unhandled exception occurred (check Console)

#### Expected Results

- Authentication request returns HTTP 400 or 401 status
- An error message is displayed to the user
- Error message is clear and user-friendly (not technical)
- Page remains on the login route (no redirect)
- Email field value is preserved (user does not have to re-enter)
- No console errors beyond the expected auth failure response
- No browser crash or frozen UI

#### Pass/Fail: [ ]

---

### Test A5: Login with Non-Existent Email

**Objective:** Verify that login fails gracefully when a non-existent email is provided.

#### Steps

1. Ensure you are logged out and on the login page
2. Clear browser DevTools Console
3. Open Network tab in DevTools
4. Navigate to http://localhost:5173/#/login if not already there
5. Wait for the login page to load completely
6. Click into the "Email" input field
7. Type: nonexistent@fakeemail.com
8. Press Tab to move to the password field
9. Type: anypassword123
10. Click the "Sign In" button
11. Watch the Network tab for the POST request to /auth/v1/token
12. Note the HTTP status code returned
13. Wait 2-3 seconds for the response to be processed
14. Look for an error message displayed on the form
15. Read the error message text carefully
16. Verify the message does NOT reveal whether the email exists (security best practice)
17. Confirm the URL is still on the login page
18. Check that no redirect occurred
19. Verify the form is still usable (not frozen or disabled)
20. Check Console for any unexpected errors or warnings

#### Expected Results

- Authentication request returns HTTP 400 or 401 status
- Error message is displayed (e.g., "Invalid credentials" or similar)
- Error message does NOT say "email not found" (security: prevent user enumeration)
- Page remains on login route
- Form remains functional for retry
- No console errors beyond expected auth failure
- No information leakage about valid vs invalid emails

#### Pass/Fail: [ ]

---

### Test A6: Login Form Validation (Empty Fields)

**Objective:** Verify that the login form validates empty fields before submitting to the server.

#### Steps

1. Navigate to http://localhost:5173/#/login
2. Ensure you are logged out
3. Clear Console and open Network tab in DevTools
4. Wait for login page to load completely
5. Do NOT enter anything in the email field (leave it empty)
6. Do NOT enter anything in the password field (leave it empty)
7. Click the "Sign In" button
8. Observe what happens immediately (before any network request)
9. Look for validation error messages on or near the input fields
10. Check if the email field shows a required field error
11. Check if the password field shows a required field error
12. Check the Network tab - verify NO request was made to /auth/v1/token
13. Now click into the email field
14. Type: admin@test.com
15. Leave password field empty
16. Click "Sign In" button again
17. Look for password field validation error
18. Check Network tab - should still be no auth request
19. Verify the form indicates which field is missing
20. Check Console for any errors or React warnings

#### Expected Results

- Clicking Sign In with empty fields does NOT trigger a network request
- Validation errors appear for empty required fields
- Email field shows "required" or similar error when empty
- Password field shows "required" or similar error when empty
- Error messages are visible and accessible (check for role="alert")
- Form remains on login page
- User can correct errors and retry
- No console errors related to the validation
- Validation is client-side (no server round-trip needed)

#### Pass/Fail: [ ]

---

## Section B: Session Management

### Test B1: Session Persists After Page Refresh

**Objective:** Verify that an authenticated session survives a page refresh.

#### Steps

1. Start from a logged-out state
2. Navigate to http://localhost:5173/#/login
3. Enter credentials: admin@test.com / password123
4. Click "Sign In" and wait for redirect to dashboard
5. Verify you are on the dashboard (URL: /#/)
6. Open DevTools Application tab (or Storage in Firefox)
7. Expand "Local Storage" in the left sidebar
8. Click on http://localhost:5173
9. Look for Supabase auth-related keys (e.g., sb-*-auth-token or similar)
10. Note the presence of the auth token stored in localStorage
11. Now press F5 (or Cmd+R on Mac) to refresh the page
12. Wait for the page to reload completely
13. Observe the URL after reload completes
14. Verify the URL is still /#/ (dashboard), NOT /#/login
15. Verify the dashboard content is displayed
16. Verify you are still logged in (check for user profile indicator)
17. Check DevTools Console for any auth-related errors
18. Check localStorage again - verify the auth token still exists
19. Navigate to another route (e.g., /#/contacts)
20. Verify navigation works and you remain authenticated

#### Expected Results

- Auth token is stored in localStorage after login
- After page refresh, user remains logged in
- User is NOT redirected to login page
- Dashboard or previously visited page loads correctly
- Auth token persists in localStorage after refresh
- No re-authentication is required
- No console errors related to session restoration
- Application state is properly restored

#### Pass/Fail: [ ]

---

### Test B2: Session Persists After Browser Tab Close/Reopen

**Objective:** Verify that an authenticated session persists when closing and reopening a browser tab.

#### Steps

1. Start from a logged-out state
2. Navigate to http://localhost:5173
3. Log in with: admin@test.com / password123
4. Wait for redirect to dashboard
5. Verify you are logged in and on the dashboard
6. Open DevTools (F12) > Application tab > Local Storage
7. Verify the auth token exists for localhost:5173
8. Note down or remember the dashboard URL (http://localhost:5173/#/)
9. Close the current browser TAB (not the entire browser window)
10. Open a new browser tab (Ctrl+T or Cmd+T)
11. Type http://localhost:5173 in the address bar
12. Press Enter to navigate
13. Wait for the page to load completely
14. Observe what page loads (login page or dashboard?)
15. If dashboard loads, verify you are still authenticated
16. Check for user profile indicator or menu
17. Open DevTools > Application > Local Storage
18. Verify the auth token is still present
19. Check Console for any session-related errors
20. Navigate to a protected route (e.g., /#/opportunities) to confirm auth

#### Expected Results

- Auth token persists across tab close/reopen
- Opening new tab and navigating to app does NOT require re-login
- User lands on dashboard (or their last location), not login page
- All application functionality remains accessible
- No console errors about invalid or missing session
- localStorage data survives tab close
- User can continue working without interruption

#### Pass/Fail: [ ]

---

### Test B3: Logout Clears Session Completely

**Objective:** Verify that logging out completely clears the user session and auth tokens.

#### Steps

1. Log in with: admin@test.com / password123
2. Verify you are on the dashboard and logged in
3. Open DevTools > Application > Local Storage
4. Expand localhost:5173 and note the auth-related keys present
5. Look for a logout button (often in user menu, profile dropdown, or sidebar)
6. Click on the user profile menu or avatar (if present)
7. Look for "Logout", "Sign Out", or similar option
8. Click the logout option
9. Wait for the logout process to complete
10. Observe the URL change (should redirect to login page)
11. Verify the URL is now http://localhost:5173/#/login
12. Verify the login page is displayed with empty form fields
13. Open DevTools > Application > Local Storage
14. Click on localhost:5173
15. Check if the auth-related keys have been removed
16. The auth token should be gone or cleared
17. Try navigating directly to http://localhost:5173/#/ (dashboard)
18. Verify you are redirected back to the login page
19. Check Console for any errors during logout process
20. Attempt to access /#/contacts - should redirect to login

#### Expected Results

- Logout button/option is accessible and visible
- Clicking logout redirects to login page (/#/login)
- Auth tokens are removed from localStorage
- Attempting to access protected routes redirects to login
- Session cookies (if any) are cleared
- No console errors during logout
- Login page shows clean state (no pre-filled credentials)
- User must re-enter credentials to log back in

#### Pass/Fail: [ ]

---

### Test B4: Cannot Access Protected Route After Logout

**Objective:** Verify that protected routes are inaccessible after logging out.

#### Steps

1. Log in with any valid credentials (e.g., admin@test.com / password123)
2. Navigate to several protected routes to build browser history:
   - http://localhost:5173/#/contacts
   - http://localhost:5173/#/opportunities
   - http://localhost:5173/#/organizations
3. Return to dashboard: http://localhost:5173/#/
4. Log out using the logout button/menu
5. Verify you are now on the login page
6. Open DevTools > Console and clear it
7. Open DevTools > Network tab
8. In the address bar, type: http://localhost:5173/#/contacts
9. Press Enter to navigate
10. Wait for the page to process the request
11. Observe where you end up (should be login page)
12. Verify the URL is /#/login, NOT /#/contacts
13. Check Console for any errors or redirect messages
14. Try the browser Back button
15. Verify you do NOT get back to a protected route while logged out
16. Try typing http://localhost:5173/#/opportunities directly
17. Verify redirect to login page
18. Try http://localhost:5173/#/ (dashboard root)
19. Verify redirect to login page
20. Confirm all protected routes consistently redirect to login

#### Expected Results

- All protected routes redirect to login when not authenticated
- Typing protected URLs directly does not bypass auth check
- Browser history back button does not expose protected content
- No flash of protected content before redirect
- Console may show controlled redirect, no errors
- Consistent behavior across all protected routes
- Auth guard runs before any protected route renders

#### Pass/Fail: [ ]

---

### Test B5: Multiple Tabs Share Same Session

**Objective:** Verify that multiple browser tabs share the same authentication session.

#### Steps

1. Open browser DevTools in current tab
2. Navigate to http://localhost:5173 and log in with: admin@test.com / password123
3. Verify you are logged in and on the dashboard
4. Note the user indicator (name, email, or avatar) if visible
5. Right-click on any link in the app and select "Open in New Tab"
6. Alternatively, press Ctrl+T (or Cmd+T) to open new tab
7. In the new tab, navigate to http://localhost:5173
8. Observe what loads - should be dashboard, NOT login page
9. Verify the same user is logged in (same user indicator)
10. Open DevTools in the second tab
11. Go to Application > Local Storage
12. Verify the same auth token is present as in the first tab
13. In the second tab, navigate to /#/contacts
14. Verify the protected route loads without requiring login
15. Go back to the first tab
16. Navigate to /#/opportunities
17. Verify both tabs can access protected routes
18. In Tab 2, perform a logout
19. Switch to Tab 1
20. Refresh Tab 1 and verify you are now logged out there too

#### Expected Results

- New tabs automatically pick up existing auth session
- Both tabs show the same logged-in user
- Protected routes are accessible in all tabs
- LocalStorage auth token is shared across tabs
- Logging out in one tab affects all tabs (after refresh)
- No session conflicts or errors
- Consistent user experience across tabs
- No need to log in again in new tabs

#### Pass/Fail: [ ]

---

## Section C: Protected Route Access

### Test C1: Unauthenticated Access Redirects to Login

**Objective:** Verify that accessing the application without authentication redirects to login.

#### Steps

1. Close all browser tabs with the application
2. Clear browser data for localhost:
   - Open DevTools > Application > Local Storage
   - Right-click localhost:5173 > Clear
   - Also clear Session Storage if present
3. Close DevTools
4. Open a fresh browser tab
5. Type http://localhost:5173 in the address bar
6. Press Enter to navigate
7. Watch the URL bar carefully for any redirects
8. Wait for the page to fully load
9. Observe the final URL (should be /#/login)
10. Verify the login page is displayed
11. Open DevTools > Network tab
12. Check if there was a redirect (3xx status or client-side redirect)
13. Try navigating to http://localhost:5173/#/
14. Verify redirect to login page
15. Try navigating to http://localhost:5173/#/contacts
16. Verify redirect to login page
17. Try navigating to http://localhost:5173/#/organizations
18. Verify redirect to login page
19. Check Console for any error messages
20. Verify no protected content is ever displayed before redirect

#### Expected Results

- Root URL (/) redirects to login when not authenticated
- All protected routes redirect to login
- No flash of protected content before redirect
- Login page renders correctly
- URL changes to /#/login consistently
- No console errors (controlled redirect is expected)
- No sensitive data exposed in Network requests before auth
- Clean user experience with immediate redirect

#### Pass/Fail: [ ]

---

### Test C2: Deep Link Preserved After Login

**Objective:** Verify that attempting to access a deep link before login redirects to login, then returns to the original URL after successful authentication.

#### Steps

1. Ensure you are completely logged out (clear localStorage)
2. Close all app tabs and open a fresh tab
3. Open DevTools > Console and Network tabs
4. Type this deep link in the address bar: http://localhost:5173/#/opportunities
5. Press Enter to navigate
6. Wait for any redirects to complete
7. Verify you land on the login page (/#/login)
8. Check the URL - it may contain a redirect parameter (e.g., ?redirect=/opportunities)
9. Note: Some apps store the intended destination in sessionStorage or state
10. Enter login credentials: admin@test.com / password123
11. Click the "Sign In" button
12. Wait for authentication to complete
13. Watch the URL bar carefully after login
14. Observe where you are redirected
15. Verify the URL is http://localhost:5173/#/opportunities (the original deep link)
16. If redirected to dashboard instead, check if the app supports deep link preservation
17. Verify the opportunities page content loads correctly
18. Check Console for any errors during the redirect flow
19. Try the same test with another deep link: /#/contacts/123 (if such route exists)
20. Document whether deep link preservation works or needs implementation

#### Expected Results

- Unauthenticated access to deep link redirects to login
- After successful login, user is returned to original deep link
- Original URL parameters are preserved (if any)
- No double redirects or redirect loops
- Protected content loads correctly after auth
- Console shows no errors during the flow
- Note: If deep link preservation is NOT implemented, document this as a finding

#### Pass/Fail: [ ]

---

### Test C3: Auth Token Stored Correctly in localStorage

**Objective:** Verify that the authentication token is properly stored in localStorage with correct structure.

#### Steps

1. Ensure you are logged out (clear localStorage)
2. Open DevTools > Application > Local Storage
3. Expand localhost:5173 - should be empty or have no auth keys
4. Navigate to http://localhost:5173
5. Enter credentials: admin@test.com / password123
6. Click "Sign In" and wait for successful login
7. With DevTools still open, refresh the localStorage view (right-click > Refresh)
8. Look for Supabase auth keys (typically prefixed with "sb-" or "supabase")
9. Click on the auth token key to see its value
10. Verify the token value is a valid JSON string or JWT
11. If JWT, it should have three parts separated by dots (header.payload.signature)
12. Check for additional auth-related keys (refresh token, user data)
13. Verify no sensitive data like raw passwords is stored
14. Check that the token has an expiration (exp claim in JWT)
15. Note the key name(s) used for auth storage
16. Verify the token is accessible via JavaScript (not HttpOnly)
17. Check Session Storage too - some apps split storage
18. Document the structure of stored auth data
19. Verify no console errors about token storage
20. Check that the token enables subsequent authenticated API calls

#### Expected Results

- Auth token is stored in localStorage after login
- Token follows expected format (JWT or opaque token)
- Token key name follows Supabase conventions (sb-*-auth-token or similar)
- Token can be inspected in DevTools
- No raw passwords or overly sensitive data in storage
- Token structure includes necessary claims (if JWT)
- Storage persists across page refreshes
- Console shows no token-related errors
- Token enables authenticated API requests

#### Pass/Fail: [ ]

---

### Test C4: Expired Token Redirects to Login

**Objective:** Verify that an expired authentication token properly redirects the user to login.

#### Steps

1. Log in with valid credentials: admin@test.com / password123
2. Verify you are on the dashboard and authenticated
3. Open DevTools > Application > Local Storage
4. Find the auth token for localhost:5173
5. Copy the current token value for reference
6. We will simulate token expiration by modifying the stored token
7. Click on the auth token key in localStorage
8. Modify the token value to something invalid (e.g., "expired-token-test")
9. Press Enter to save the modified value
10. Alternatively, if JWT: change the expiration claim to a past date (advanced)
11. Refresh the page (F5)
12. Wait for the application to load
13. Observe the behavior - app should detect invalid token
14. Watch for redirect to login page
15. Verify the URL changes to /#/login
16. Check Console for authentication error messages
17. Note: Some apps may show an error message before redirecting
18. Verify the login page loads correctly
19. Verify you can log in again with valid credentials
20. After re-login, verify new valid token is stored

#### Expected Results

- Application detects invalid/expired token
- User is redirected to login page
- No access to protected content with invalid token
- Console may show auth error (expected behavior)
- Login page loads correctly after redirect
- New login creates fresh valid token
- No security bypass with tampered tokens
- Clean recovery flow for expired sessions

#### Pass/Fail: [ ]

---

## Pass Criteria

**All 15 tests in Sections A, B, and C must pass** for the Authentication Foundation to be considered complete.

**Section Breakdown:**
- Section A (Login Flow Validation): 6 tests - ALL MUST PASS
- Section B (Session Management): 5 tests - ALL MUST PASS
- Section C (Protected Route Access): 4 tests - ALL MUST PASS

**If any test fails:**
1. Document the specific failure with screenshots
2. Note the expected vs actual behavior
3. Capture relevant console errors
4. File an issue with severity level:
   - **Critical:** A1-A3 failures (cannot login at all)
   - **High:** B3, B4, C1, C4 failures (security concerns)
   - **Medium:** B1, B2, B5, C2, C3 failures (user experience)
   - **Low:** A4-A6 failures (edge case handling)
5. **DO NOT proceed with RBAC tests** until all Auth Foundation tests pass

---

## Test Execution Log

| Test ID | Test Name | Status | Tester | Date | Notes |
|---------|-----------|--------|--------|------|-------|
| A1 | Admin login valid | [ ] | | | |
| A2 | Manager login valid | [ ] | | | |
| A3 | Rep login valid | [ ] | | | |
| A4 | Invalid password | [ ] | | | |
| A5 | Non-existent email | [ ] | | | |
| A6 | Empty field validation | [ ] | | | |
| B1 | Session after refresh | [ ] | | | |
| B2 | Session after tab close | [ ] | | | |
| B3 | Logout clears session | [ ] | | | |
| B4 | Protected route after logout | [ ] | | | |
| B5 | Multi-tab session | [ ] | | | |
| C1 | Unauth redirects to login | [ ] | | | |
| C2 | Deep link preserved | [ ] | | | |
| C3 | Token in localStorage | [ ] | | | |
| C4 | Expired token redirect | [ ] | | | |

**Overall Status:** [ ] PASS / [ ] FAIL

**Tested By:** ____________________

**Date:** ____________________

---

## Notes

- This is TEST 1 of the progressive RBAC test suite
- All tests in this file must pass before proceeding to role-based access control tests
- Tests assume a clean Supabase database with seed data loaded
- For Supabase-specific behavior, auth tokens follow the sb-*-auth-token format
- Console errors related to ResizeObserver can be ignored (known browser quirk)
- Some tests may behave differently in incognito mode (no localStorage persistence)
- JWT tokens can be decoded at jwt.io for inspection (do not share production tokens)
