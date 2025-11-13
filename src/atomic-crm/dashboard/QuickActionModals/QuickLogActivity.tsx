/**
 * QuickLogActivity Modal Component
 *
 * Lightweight modal for quick activity logging (call, email, meeting)
 * Features:
 * - Activity type selector with Call as default
 * - Notes textarea with Ctrl+Enter save shortcut
 * - Escape key to close
 * - Minimal form state for quick data entry
 *
 * @example
 * const [open, setOpen] = useState(false);
 *
 * <QuickLogActivity
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   onSubmit={(data) => {
 *     console.log(`Logging ${data.type} for principal ${data.principalId}`);
 *     // Handle submission...
 *   }}
 *   principalId="principal-123"
 * />
 */

import React, { useState, useEffect, useRef } from 'react';

export type ActivityType = 'call' | 'email' | 'meeting';

export interface QuickLogActivityData {
  type: ActivityType;
  notes: string;
  principalId: string;
}

export interface QuickLogActivityProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: QuickLogActivityData) => void;
  principalId: string;
}

/**
 * QuickLogActivity Modal Component
 */
const QuickLogActivity: React.FC<QuickLogActivityProps> = ({
  open,
  onClose,
  onSubmit,
  principalId,
}) => {
  const [activityType, setActivityType] = useState<ActivityType>('call');
  const [notes, setNotes] = useState('');
  const notesInputRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setActivityType('call');
      setNotes('');
      // Focus on notes input for quick data entry
      setTimeout(() => notesInputRef.current?.focus(), 100);
    }
  }, [open]);

  /**
   * Handle form submission
   */
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    onSubmit({
      type: activityType,
      notes: notes.trim(),
      principalId,
    });

    // Close modal after submission
    onClose();
  };

  /**
   * Handle keyboard shortcuts in the notes field
   * - Ctrl+Enter or Cmd+Enter: Save
   * - Escape: Close
   */
  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }

    // Escape to close
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  /**
   * Handle keyboard shortcuts on modal container
   * - Escape: Close
   */
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  /**
   * Close modal without saving
   */
  const handleCancel = () => {
    onClose();
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-labelledby="quick-log-title"
      onKeyDown={handleModalKeyDown}
    >
      <div className="bg-white rounded-lg shadow-elevation-2 max-w-md w-full mx-4 p-widget space-y-section">
        {/* Header */}
        <h2 id="quick-log-title" className="text-lg font-semibold">
          Quick Log Activity
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-section">
          {/* Activity Type Selector */}
          <div className="space-y-2">
            <label htmlFor="activity-type" className="block text-sm font-medium">
              Activity Type
            </label>
            <select
              id="activity-type"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityType)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
            </select>
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <label htmlFor="activity-notes" className="block text-sm font-medium">
              Notes
            </label>
            <textarea
              id="activity-notes"
              ref={notesInputRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={handleTextAreaKeyDown}
              placeholder="Add notes... (Ctrl+Enter to save)"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Tip: Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Enter</kbd> to save
            </p>
          </div>

          {/* Buttons - Save first so Tab order is correct */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickLogActivity;
