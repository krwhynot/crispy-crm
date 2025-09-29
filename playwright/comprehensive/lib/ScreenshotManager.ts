import { Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * ScreenshotManager - Smart screenshot capture with context
 *
 * Captures screenshots only at meaningful moments:
 * - Module entry
 * - Before/after CRUD operations
 * - When errors occur
 * - At test completion
 */

export class ScreenshotManager {
  private page: Page;
  private outputDir: string;
  private counter: number = 0;
  private lastScreenshotHash: string = '';

  constructor(page: Page, outputDir: string) {
    this.page = page;
    this.outputDir = path.join(outputDir, 'screenshots');

    // Ensure screenshots directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Capture screenshot with descriptive name
   */
  async capture(context: string): Promise<string> {
    this.counter++;
    const filename = `${String(this.counter).padStart(2, '0')}-${this.sanitizeFilename(context)}.png`;
    const filepath = path.join(this.outputDir, filename);

    await this.page.screenshot({
      path: filepath,
      fullPage: true,
    });

    return filename;
  }

  /**
   * Capture screenshot only if page content has changed
   */
  async captureIfChanged(context: string): Promise<string | null> {
    const currentHash = await this.getPageHash();

    if (currentHash === this.lastScreenshotHash) {
      return null; // Skip redundant screenshot
    }

    this.lastScreenshotHash = currentHash;
    return await this.capture(context);
  }

  /**
   * Capture error screenshot with full context
   */
  async captureError(errorContext: string): Promise<string> {
    return await this.capture(`error-${errorContext}`);
  }

  /**
   * Get simple hash of page content to detect changes
   */
  private async getPageHash(): Promise<string> {
    try {
      const url = this.page.url();
      const title = await this.page.title();
      return `${url}-${title}`;
    } catch {
      return String(Date.now());
    }
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }
}