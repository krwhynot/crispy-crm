import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotify } from 'ra-core';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that enables global keyboard shortcuts
 *
 * Shortcuts:
 * - Ctrl/Cmd + S: Save form (triggers form submit)
 * - Ctrl/Cmd + N: Navigate to create page for current resource
 * - Ctrl/Cmd + K or /: Focus search bar
 * - Escape: Cancel/close modal
 * - Enter: Submit form (not in textarea)
 * - Delete: Delete selected (with confirmation)
 */
export const KeyboardShortcutsProvider = ({ children }: KeyboardShortcutsProviderProps) => {
  const navigate = useNavigate();
  const notify = useNotify();

  const handleSave = useCallback(() => {
    // Find the submit button in the current form and click it
    const submitButton = document.querySelector<HTMLButtonElement>(
      'form button[type="submit"]'
    );

    if (submitButton) {
      submitButton.click();
    } else {
      // Fallback: trigger form submit event
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    }
  }, []);

  const handleNew = useCallback(() => {
    // Get current resource from URL path
    const path = window.location.pathname;
    const resourceMatch = path.match(/\/(contacts|organizations|opportunities|products|tasks)/);

    if (resourceMatch) {
      const resource = resourceMatch[1];
      navigate(`/${resource}/create`);
    } else {
      // If not on a resource page, show notification
      notify('Navigate to a resource to create a new record', { type: 'info' });
    }
  }, [navigate, notify]);

  const handleSearch = useCallback(() => {
    // Search focus is handled in the hook directly
    // This callback is for any additional search-related actions
  }, []);

  const handleCancel = useCallback(() => {
    // Check if there's a dialog/modal open
    const dialog = document.querySelector('[role="dialog"][data-state="open"]');

    if (dialog) {
      // Find and click the close button
      const closeButton = dialog.querySelector<HTMLButtonElement>(
        'button[aria-label*="close" i], button[aria-label*="cancel" i]'
      );
      closeButton?.click();
    }
  }, []);

  const handleSubmit = useCallback(() => {
    // Let the browser's default Enter behavior handle form submission
    // This callback is for any additional submit-related actions
  }, []);

  const handleDelete = useCallback(() => {
    // Find if we're on a list view with selected items
    const selectedCheckboxes = document.querySelectorAll<HTMLInputElement>(
      'table input[type="checkbox"]:checked'
    );

    if (selectedCheckboxes.length > 0) {
      // Trigger bulk delete action if available
      const bulkDeleteButton = document.querySelector<HTMLButtonElement>(
        'button[aria-label*="delete" i], button[title*="delete" i]'
      );

      if (bulkDeleteButton) {
        bulkDeleteButton.click();
      } else {
        notify('Select items and use the delete button in the toolbar', { type: 'info' });
      }
    }
  }, [notify]);

  useKeyboardShortcuts({
    onSave: handleSave,
    onNew: handleNew,
    onSearch: handleSearch,
    onCancel: handleCancel,
    onSubmit: handleSubmit,
    onDelete: handleDelete,
  });

  return <>{children}</>;
};
