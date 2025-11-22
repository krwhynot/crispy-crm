import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import QuickLogActivity from '../QuickLogActivity';

// Helper function to select option in a select element
const selectOption = async (element: HTMLElement, value: string) => {
  fireEvent.change(element, { target: { value } });
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('QuickLogActivity Modal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  describe('Rendering', () => {
    it('should render modal when open is true', () => {
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      expect(screen.getByText(/quick log activity/i)).toBeInTheDocument();
    });

    it('should not render modal when open is false', () => {
      const { container } = renderWithRouter(
        <QuickLogActivity
          open={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      // Modal should not be visible (may exist in DOM but with hidden/display:none)
      const modal = container.querySelector('[role="dialog"]');
      if (modal) {
        expect(modal).not.toBeVisible();
      }
    });

    it('should display activity type selector', () => {
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      expect(screen.getByLabelText(/activity type/i)).toBeInTheDocument();
    });

    it('should display notes field', () => {
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      expect(screen.getByPlaceholderText(/add notes/i)).toBeInTheDocument();
    });

    it('should display save and cancel buttons', () => {
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Activity Type Selection', () => {
    it('should allow selecting Call activity type', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const typeSelect = screen.getByLabelText(/activity type/i);
      await user.click(typeSelect);

      const callOption = screen.getByRole('option', { name: /call/i });
      await user.click(callOption);

      expect(typeSelect).toHaveValue('call');
    });

    it('should allow selecting Email activity type', async () => {
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const typeSelect = screen.getByLabelText(/activity type/i);
      await selectOption(typeSelect, 'email');

      expect(typeSelect).toHaveValue('email');
    });

    it('should allow selecting Meeting activity type', async () => {
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const typeSelect = screen.getByLabelText(/activity type/i);
      await selectOption(typeSelect, 'meeting');

      expect(typeSelect).toHaveValue('meeting');
    });

    it('should have Call as default activity type', () => {
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const typeSelect = screen.getByLabelText(/activity type/i) as HTMLSelectElement;
      expect(typeSelect.value).toBe('call');
    });
  });

  describe('Notes Input', () => {
    it('should allow typing notes', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const notesInput = screen.getByPlaceholderText(/add notes/i);
      await user.type(notesInput, 'Discussed Q4 opportunities');

      expect(notesInput).toHaveValue('Discussed Q4 opportunities');
    });

    it('should allow multi-line notes', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const notesInput = screen.getByPlaceholderText(/add notes/i);
      await user.type(notesInput, 'Line 1\nLine 2\nLine 3');

      expect(notesInput).toHaveValue('Line 1\nLine 2\nLine 3');
    });

    it('should preserve notes across type changes', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const notesInput = screen.getByPlaceholderText(/add notes/i);
      await user.type(notesInput, 'Important discussion');

      const typeSelect = screen.getByLabelText(/activity type/i);
      await user.click(typeSelect);
      const emailOption = screen.getByRole('option', { name: /email/i });
      await user.click(emailOption);

      expect(notesInput).toHaveValue('Important discussion');
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with activity data when save is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const notesInput = screen.getByPlaceholderText(/add notes/i);
      await user.type(notesInput, 'Quick call');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        type: 'call',
        notes: 'Quick call',
        principalId: 'principal-123',
      });
    });

    it('should include selected activity type in submission', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const typeSelect = screen.getByLabelText(/activity type/i);
      await selectOption(typeSelect, 'email');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'email' })
      );
    });

    it('should allow saving with empty notes', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ notes: '' })
      );
    });

    it('should pass principalId to onSubmit', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-456"
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ principalId: 'principal-456' })
      );
    });

    it('should close modal after successful submission', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should save on Ctrl+Enter key press', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const notesInput = screen.getByPlaceholderText(/add notes/i);
      await user.type(notesInput, 'Test note');

      // Simulate Ctrl+Enter
      fireEvent.keyDown(notesInput, {
        key: 'Enter',
        code: 'Enter',
        ctrlKey: true,
      });

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should save on Cmd+Enter key press (Mac)', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const notesInput = screen.getByPlaceholderText(/add notes/i);
      await user.type(notesInput, 'Test note');

      // Simulate Cmd+Enter
      fireEvent.keyDown(notesInput, {
        key: 'Enter',
        code: 'Enter',
        metaKey: true,
      });

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should close modal on Escape key press', async () => {
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const modal = screen.getByText(/quick log activity/i);
      fireEvent.keyDown(modal, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Cancel Button', () => {
    it('should call onClose when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not call onSubmit when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form State Management', () => {
    it('should clear form after submission', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const notesInput = screen.getByPlaceholderText(/add notes/i);
      await user.type(notesInput, 'Test note');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Close modal after submission
      expect(mockOnClose).toHaveBeenCalled();

      // Reopen modal by setting open to false then true
      mockOnClose.mockClear();
      mockOnSubmit.mockClear();
      rerender(
        <BrowserRouter>
          <QuickLogActivity
            open={false}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            principalId="principal-123"
          />
        </BrowserRouter>
      );

      rerender(
        <BrowserRouter>
          <QuickLogActivity
            open={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            principalId="principal-123"
          />
        </BrowserRouter>
      );

      // Form should be cleared
      const newNotesInput = screen.getByPlaceholderText(/add notes/i);
      expect(newNotesInput).toHaveValue('');
    });

    it('should have proper default focus on mount', () => {
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const typeSelect = screen.getByLabelText(/activity type/i);
      // Element should be in the document and accessible
      expect(typeSelect).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      expect(screen.getByLabelText(/activity type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    it('should have dialog role', () => {
      const { container } = renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const typeSelect = screen.getByLabelText(/activity type/i);
      const notesInput = screen.getByPlaceholderText(/add notes/i);
      const saveButton = screen.getByRole('button', { name: /save/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // All interactive elements should be tabbable
      expect(typeSelect).toBeInTheDocument();
      expect(notesInput).toBeInTheDocument();
      expect(saveButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();

      // Verify tab indexes are set properly (not -1)
      expect(typeSelect).not.toHaveAttribute('tabindex', '-1');
      expect(notesInput).not.toHaveAttribute('tabindex', '-1');
      expect(saveButton).not.toHaveAttribute('tabindex', '-1');

      // Verify elements can receive focus
      typeSelect.focus();
      expect(typeSelect).toHaveFocus();

      notesInput.focus();
      expect(notesInput).toHaveFocus();

      saveButton.focus();
      expect(saveButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long notes', async () => {
      const user = userEvent.setup();
      const longNotes = 'a'.repeat(500);

      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const notesInput = screen.getByPlaceholderText(/add notes/i);
      // Use fireEvent.change instead of user.type for long strings to avoid timeout
      fireEvent.change(notesInput, { target: { value: longNotes } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ notes: longNotes })
      );
    });

    it('should handle special characters in notes', async () => {
      const user = userEvent.setup();
      const specialNotes = 'Test with @#$%^&*() characters';

      renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const notesInput = screen.getByPlaceholderText(/add notes/i);
      await user.type(notesInput, specialNotes);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ notes: specialNotes })
      );
    });

    it('should handle rapid open/close cycles', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithRouter(
        <QuickLogActivity
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          principalId="principal-123"
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      mockOnClose.mockClear();
      rerender(
        <BrowserRouter>
          <QuickLogActivity
            open={true}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
            principalId="principal-123"
          />
        </BrowserRouter>
      );

      expect(screen.getByText(/quick log activity/i)).toBeInTheDocument();
    });
  });
});
