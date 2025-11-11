import type { Page, Locator } from "@playwright/test";

/**
 * Base Page Object Model
 * All POMs should extend this class
 *
 * Required by playwright-e2e-testing skill
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a URL
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  /**
   * Wait for a specific URL pattern
   */
  async waitForURL(pattern: string | RegExp, timeout = 10000): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  /**
   * Wait for a successful API response
   */
  async waitForAPIResponse(urlPattern: string, timeout = 10000): Promise<void> {
    await this.page.waitForResponse(
      (resp) => resp.url().includes(urlPattern) && resp.status() === 200,
      { timeout }
    );
  }

  /**
   * Get a button by its accessible name
   */
  getButton(name: string | RegExp): Locator {
    return this.page.getByRole("button", { name });
  }

  /**
   * Get a link by its accessible name
   */
  getLink(name: string | RegExp): Locator {
    return this.page.getByRole("link", { name });
  }

  /**
   * Get a text input by its label
   */
  getTextInput(label: string | RegExp): Locator {
    return this.page.getByLabel(label);
  }

  /**
   * Get text content
   */
  getText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  /**
   * Get a row in a table/grid
   */
  getRow(): Locator {
    return this.page.getByRole("row");
  }
}
