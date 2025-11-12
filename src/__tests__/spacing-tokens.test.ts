import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Desktop spacing tokens', () => {
  it('should have desktop-optimized spacing values', () => {
    // Read the CSS file directly since jsdom doesn't fully support CSS custom properties
    const cssPath = resolve(__dirname, '../index.css');
    const cssContent = readFileSync(cssPath, 'utf-8');

    // Desktop edge padding should be 24px (not 120px)
    expect(cssContent).toMatch(/--spacing-edge-desktop:\s*24px/);

    // Widget padding should be 12px (not 20px)
    expect(cssContent).toMatch(/--spacing-widget-padding:\s*12px/);

    // Compact row height should be defined
    expect(cssContent).toMatch(/--row-height-compact:\s*32px/);
  });
});