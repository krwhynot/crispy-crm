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
   */
  async loginAsAdmin(): Promise<void> {
    await this.goto('/');

    // Wait for login form to be visible
    await expect(this.getTextInput(/email/i)).toBeVisible({ timeout: 30000 });

    await this.login('admin@test.com', 'password123');
  }
}
