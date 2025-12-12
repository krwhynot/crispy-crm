import { test as setup } from "@playwright/test";
import { LoginPage } from "./support/poms/LoginPage";

const authFile = "tests/e2e/.auth/user.json";
const managerAuthFile = "tests/e2e/.auth/manager-user.json";
const repAuthFile = "tests/e2e/.auth/rep-user.json";

/**
 * Authentication setup using Page Object Model
 * Follows playwright-e2e-testing skill requirements:
 * - Uses POM (LoginPage)
 * - Semantic selectors only
 * - Condition-based waiting
 */
setup("authenticate", async ({ page }) => {
  // Increase timeout for initial load
  setup.setTimeout(120000);

  console.log("Starting authentication setup...");

  // Use the LoginPage POM
  const loginPage = new LoginPage(page);
  await loginPage.loginAsAdmin();

  console.log("Dashboard loaded, waiting for Supabase auth tokens...");

  // Wait for Supabase auth tokens in localStorage
  await page.waitForFunction(
    () => {
      // Check for Supabase auth tokens in localStorage
      const keys = Object.keys(localStorage);
      return keys.some(
        (key) =>
          key.includes("supabase.auth.token") ||
          (key.includes("sb-") && key.includes("-auth-token"))
      );
    },
    { timeout: 10000 }
  );

  console.log("Supabase auth tokens found, saving auth state...");

  // Save auth state (includes localStorage for Supabase auth)
  await page.context().storageState({ path: authFile });

  console.log("Auth state saved successfully!");
});

setup("authenticate as manager", async ({ page }) => {
  // Increase timeout for initial load
  setup.setTimeout(120000);

  console.log("Starting manager authentication setup...");

  // Use the LoginPage POM
  const loginPage = new LoginPage(page);
  await loginPage.loginAsManager();

  console.log("Dashboard loaded, waiting for Supabase auth tokens...");

  // Wait for Supabase auth tokens in localStorage
  await page.waitForFunction(
    () => {
      // Check for Supabase auth tokens in localStorage
      const keys = Object.keys(localStorage);
      return keys.some(
        (key) =>
          key.includes("supabase.auth.token") ||
          (key.includes("sb-") && key.includes("-auth-token"))
      );
    },
    { timeout: 10000 }
  );

  console.log("Supabase auth tokens found, saving manager auth state...");

  // Save auth state (includes localStorage for Supabase auth)
  await page.context().storageState({ path: managerAuthFile });

  console.log("Manager auth state saved successfully!");
});

setup("authenticate as rep", async ({ page }) => {
  // Increase timeout for initial load
  setup.setTimeout(120000);

  console.log("Starting rep authentication setup...");

  // Use the LoginPage POM
  const loginPage = new LoginPage(page);
  await loginPage.loginAsRep();

  console.log("Dashboard loaded, waiting for Supabase auth tokens...");

  // Wait for Supabase auth tokens in localStorage
  await page.waitForFunction(
    () => {
      // Check for Supabase auth tokens in localStorage
      const keys = Object.keys(localStorage);
      return keys.some(
        (key) =>
          key.includes("supabase.auth.token") ||
          (key.includes("sb-") && key.includes("-auth-token"))
      );
    },
    { timeout: 10000 }
  );

  console.log("Supabase auth tokens found, saving rep auth state...");

  // Save auth state (includes localStorage for Supabase auth)
  await page.context().storageState({ path: repAuthFile });

  console.log("Rep auth state saved successfully!");
});
