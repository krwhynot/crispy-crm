/**
 * Unit Tests for LogActivityStep
 *
 * Feature: Dashboard Quick Actions
 * Design: docs/plans/2025-11-10-dashboard-quick-actions-design.md
 *
 * Tests cover:
 * 1. Auto-detection of activity type from task title
 * 2. Pre-population of notes from task description
 * 3. Form validation (notes required)
 * 4. Keyboard shortcuts (Ctrl+Enter to save, Esc to skip)
 * 5. Auto-focus on notes field
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogActivityStep } from '../LogActivityStep';
import type { Task } from '@/atomic-crm/types';

// Mock task factory
const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: 1,
  title: 'Call about pricing',
  description: 'Discuss pricing options for Brand A',
  contact_id: 100,
  type: 'Call',
  due_date: '2025-11-11',
  priority: 'high',
  completed: false,
  opportunity_id: 2,
  sales_id: 1,
  created_at: '2025-11-10T10:00:00Z',
  updated_at: '2025-11-10T10:00:00Z',
  ...overrides,
});

describe('LogActivityStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Auto-Detection of Activity Type', () => {
    it('detects "Call" from task title containing "call"', () => {
      const task = createMockTask({ title: 'Call about pricing' });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      // Should show "Auto-detected" hint
      expect(screen.getByText(/Auto-detected from task title/i)).toBeInTheDocument();

      // Activity Type dropdown should show "Call" (shadcn Select shows label, not value)
      expect(screen.getByRole('combobox', { name: /Activity Type/i })).toHaveTextContent('Call');
    });

    it('detects "Email" from task title containing "email"', () => {
      const task = createMockTask({ title: 'Send email proposal' });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      expect(screen.getByRole('combobox', { name: /Activity Type/i })).toHaveTextContent('Email');
    });

    it('detects "Meeting" from task title containing "meeting"', () => {
      const task = createMockTask({ title: 'Schedule meeting with chef' });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      expect(screen.getByRole('combobox', { name: /Activity Type/i })).toHaveTextContent('Meeting');
    });

    it('detects "Meeting" from task title containing "demo"', () => {
      const task = createMockTask({ title: 'Product demo for buyer' });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      expect(screen.getByRole('combobox', { name: /Activity Type/i })).toHaveTextContent('Meeting');
    });

    it('defaults to "Check-in" for generic task titles', () => {
      const task = createMockTask({ title: 'Follow up on proposal' });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      expect(screen.getByRole('combobox', { name: /Activity Type/i })).toHaveTextContent('Check-in');
    });
  });

  describe('Pre-Population of Notes', () => {
    it('pre-fills notes with task description', () => {
      const task = createMockTask({
        description: 'Discuss pricing options for Brand A',
      });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      const notesField = screen.getByLabelText(/Notes/i);
      expect(notesField).toHaveValue('Discuss pricing options for Brand A');
    });

    it('shows empty notes field when task has no description', () => {
      const task = createMockTask({ description: null });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      const notesField = screen.getByLabelText(/Notes/i);
      expect(notesField).toHaveValue('');
    });

    it('allows user to edit pre-filled notes', async () => {
      const user = userEvent.setup();
      const task = createMockTask({
        description: 'Original description',
      });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      const notesField = screen.getByLabelText(/Notes/i);

      // Clear and type new text
      await user.clear(notesField);
      await user.type(notesField, 'Updated notes after call');

      expect(notesField).toHaveValue('Updated notes after call');
    });
  });

  describe('Form Validation', () => {
    it('disables Save button when notes are empty', () => {
      const task = createMockTask({ description: null });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      const saveButton = screen.getByRole('button', { name: /Save & Continue/i });
      expect(saveButton).toBeDisabled();
    });

    it('enables Save button when notes are filled', async () => {
      const user = userEvent.setup();
      const task = createMockTask({ description: null });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      const notesField = screen.getByLabelText(/Notes/i);
      await user.type(notesField, 'Some notes');

      const saveButton = screen.getByRole('button', { name: /Save & Continue/i });
      expect(saveButton).toBeEnabled();
    });

    it('shows validation message when notes are empty', () => {
      const task = createMockTask({ description: null });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      expect(screen.getByText(/Activity notes are required/i)).toBeInTheDocument();
    });

    it('shows character count when notes have content', async () => {
      const user = userEvent.setup();
      const task = createMockTask({ description: null });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      const notesField = screen.getByLabelText(/Notes/i);
      await user.type(notesField, 'Test notes');

      expect(screen.getByText(/10 characters/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('saves when Ctrl+Enter is pressed (with valid notes)', async () => {
      const user = userEvent.setup();
      const task = createMockTask();
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      const notesField = screen.getByLabelText(/Notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'Test activity notes');

      // Press Ctrl+Enter
      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(onSave).toHaveBeenCalledWith({
        type: 'call', // Auto-detected from "Call about pricing"
        description: 'Test activity notes',
        subject: 'Call about pricing',
        activity_date: expect.any(String),
      });
    });

    it('saves when Cmd+Enter is pressed on Mac (with valid notes)', async () => {
      const user = userEvent.setup();
      const task = createMockTask();
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      const notesField = screen.getByLabelText(/Notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'Mac test notes');

      // Press Cmd+Enter
      await user.keyboard('{Meta>}{Enter}{/Meta}');

      expect(onSave).toHaveBeenCalled();
    });

    it('does not save when Ctrl+Enter is pressed with empty notes', async () => {
      const user = userEvent.setup();
      const task = createMockTask({ description: null });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      // Press Ctrl+Enter with empty notes
      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(onSave).not.toHaveBeenCalled();
    });

    it('calls onSkip when Escape is pressed', async () => {
      const user = userEvent.setup();
      const task = createMockTask();
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      // Press Escape
      await user.keyboard('{Escape}');

      expect(onSkip).toHaveBeenCalled();
    });
  });

  describe('Auto-Focus', () => {
    it('auto-focuses the notes field on mount', () => {
      const task = createMockTask();
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      const notesField = screen.getByLabelText(/Notes/i);
      expect(notesField).toHaveFocus();
    });
  });

  describe('Button Actions', () => {
    it('calls onSave with correct data when Save button is clicked', async () => {
      const user = userEvent.setup();
      const task = createMockTask({
        title: 'Send email proposal',
        description: 'Include pricing tiers',
      });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      // Modify notes
      const notesField = screen.getByLabelText(/Notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'Sent proposal with 3 tier pricing');

      // Click Save
      await user.click(screen.getByRole('button', { name: /Save & Continue/i }));

      expect(onSave).toHaveBeenCalledWith({
        type: 'email', // Auto-detected
        description: 'Sent proposal with 3 tier pricing',
        subject: 'Send email proposal',
        activity_date: expect.any(String),
      });
    });

    it('calls onSkip when Skip button is clicked', async () => {
      const user = userEvent.setup();
      const task = createMockTask();
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      await user.click(screen.getByRole('button', { name: /Skip/i }));

      expect(onSkip).toHaveBeenCalled();
    });

    it('disables buttons while submitting', async () => {
      const user = userEvent.setup();
      const task = createMockTask();
      // This onSave mock will never resolve, simulating a pending API call
      const onSave = vi.fn(() => new Promise(() => {}));
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      const notesField = screen.getByLabelText(/Notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'Test');

      const saveButton = screen.getByRole('button', { name: /Save & Continue/i });
      await user.click(saveButton);

      // After the click, wait for the UI to reflect the "submitting" state
      await waitFor(() => {
        // Check for the text change AND the disabled state
        const submittingButton = screen.getByRole('button', { name: /Saving.../i });
        expect(submittingButton).toBeDisabled();
        expect(screen.getByRole('button', { name: /Skip/i })).toBeDisabled();
      });
    });
  });

  describe('Context Display', () => {
    it('displays related task information', () => {
      const task = createMockTask({
        title: 'Follow up on contract',
        opportunity_id: 5,
        contact_id: 10,
      });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      // Should show task title
      expect(screen.getByText(/Task: Follow up on contract/i)).toBeInTheDocument();

      // Should show opportunity reference
      expect(screen.getByText(/Opportunity \(ID: 5\)/i)).toBeInTheDocument();

      // Should show contact reference
      expect(screen.getByText(/Contact \(ID: 10\)/i)).toBeInTheDocument();
    });

    it('does not show opportunity when task has no opportunity', () => {
      const task = createMockTask({ opportunity_id: undefined });
      const onSave = vi.fn();
      const onSkip = vi.fn();

      render(<LogActivityStep task={task} onSave={onSave} onSkip={onSkip} />);

      expect(screen.queryByText(/Opportunity/i)).not.toBeInTheDocument();
    });
  });
});
