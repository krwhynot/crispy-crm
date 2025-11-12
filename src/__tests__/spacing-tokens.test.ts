import { describe, it, expect } from 'vitest';

describe('Desktop spacing tokens', () => {
  it('should have desktop-optimized spacing values', () => {
    const styles = getComputedStyle(document.documentElement);

    // Desktop edge padding should be 24px (not 120px)
    const edgeValue = styles.getPropertyValue('--spacing-edge-desktop').trim();
    console.log('Edge value:', edgeValue);
    expect(edgeValue).toBe('24px');

    // Widget padding should be 12px (not 20px)
    const widgetValue = styles.getPropertyValue('--spacing-widget-padding').trim();
    console.log('Widget value:', widgetValue);
    expect(widgetValue).toBe('12px');

    // Compact row height should be defined
    const rowValue = styles.getPropertyValue('--row-height-compact').trim();
    console.log('Row value:', rowValue);
    expect(rowValue).toBe('32px');
  });
});