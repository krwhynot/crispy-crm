import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MigrationNotification } from '../MigrationNotification';

describe('MigrationNotification XSS Prevention', () => {
  it('should sanitize malicious HTML in custom messages', () => {
    const maliciousMessage = `
      <p>Regular content</p>
      <script>alert('XSS Attack!')</script>
      <img src="x" onerror="steal_cookies()">
      <div onclick="malicious_function()">Click me</div>
    `;

    render(
      <MigrationNotification
        type="custom"
        customMessage={maliciousMessage}
        previewOnly={true}
      />
    );

    // The rendered content should contain safe text but no dangerous scripts
    const previewElement = screen.getByText(/Regular content/);
    const container = previewElement.closest('.bg-background.border.rounded');

    expect(container).toBeTruthy();
    expect(container?.innerHTML).toContain('Regular content');

    // Dangerous elements should be stripped out
    expect(container?.innerHTML).not.toContain('<script>');
    expect(container?.innerHTML).not.toContain('alert');
    expect(container?.innerHTML).not.toContain('onerror');
    expect(container?.innerHTML).not.toContain('onclick');
    expect(container?.innerHTML).not.toContain('steal_cookies');
    expect(container?.innerHTML).not.toContain('malicious_function');
  });

  it('should preserve safe HTML formatting in email templates', () => {
    render(
      <MigrationNotification
        type="completion"
        previewOnly={true}
      />
    );

    // Find the preview container specifically
    const previewLabel = screen.getByText('Preview:');
    const container = previewLabel.parentElement?.querySelector('.bg-background.border.rounded');

    expect(container).toBeTruthy();

    // Safe HTML should be preserved
    expect(container?.innerHTML).toContain('<h2');
    expect(container?.innerHTML).toContain('<strong>');
    expect(container?.innerHTML).toContain('<ul>');
    expect(container?.innerHTML).toContain('<li>');
    expect(container?.innerHTML).toContain('<a href=');

    // But no dangerous elements
    expect(container?.innerHTML).not.toContain('<script');
    expect(container?.innerHTML).not.toContain('javascript:');
    expect(container?.innerHTML).not.toContain('onerror');
    expect(container?.innerHTML).not.toContain('onclick');
  });

  it('should handle edge cases safely', () => {
    // Test with empty/null content
    render(
      <MigrationNotification
        type="custom"
        customMessage=""
        previewOnly={true}
      />
    );

    expect(screen.getByText(/Custom migration notification/)).toBeInTheDocument();
  });
});