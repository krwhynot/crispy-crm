import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object Model
 * Handles authentication interactions
 *
 * Required by playwright-e2e-testing skill
 */
export class LoginPage extends BasePage {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<void> {
    await this.getTextInput(/email/i).fill(email);
    await this.getTextInput(/password/i).fill(password);
    await this.getButton(/sign in|login/i).click();

    // Wait for redirect to dashboard
    await this.waitForURL(/\/#\//, 15000);
  }

  /**
   * Login as admin test user
   * Handles case where user might already be logged in
   */
  async loginAsAdmin(): Promise<void> {
    await this.goto('/');

    // Wait for app to load (check for either login form or dashboard)
    await this.page.waitForFunction(
      () => {
        // Check if we're already logged in (dashboard visible)
        if (window.location.hash.includes('#/')) return true;
        // Or if login form is ready
        const emailLabel = Array.from(document.querySelectorAll('label')).find(
          (el) => el.textContent?.toLowerCase().includes('email')
        );
        return emailLabel !== undefined;
      },
      { timeout: 60000 }
    );

    // If already logged in, we're done
    if (this.page.url().includes('/#/')) {
      console.log('Already logged in, skipping login');
      return;
    }

    // Otherwise, perform login
    await expect(this.getTextInput(/email/i)).toBeVisible({ timeout: 5000 });
    await this.login('admin@test.com', 'password123');
  }
}
