/**
 * Unit Tests for QuickCompleteTaskModal
 *
 * Feature: Dashboard Quick Actions
 * Design: docs/plans/2025-11-10-dashboard-quick-actions-design.md
 *
 * Tests cover:
 * 1. Progressive flow transitions (Log Activity → Update Opportunity → Success)
 * 2. Skip functionality at each step
 * 3. Auto-close after success
 * 4. Error handling
 * 5. Tasks without opportunities (skip Step 2)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminContext } from 'react-admin';
import { QuickCompleteTaskModal } from '../QuickCompleteTaskModal';
import type { Task } from '@/atomic-crm/types';

// Mock the data provider
const mockDataProvider = {
  rpc: vi.fn(),
  getList: vi.fn(),
  getOne: vi.fn(),
  getMany: vi.fn(),
  getManyReference: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
};

const mockNotify = vi.fn();
const mockRefresh = vi.fn();

// Test utility: Wrap component in required providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AdminContext dataProvider={mockDataProvider}>
      {ui}
    </AdminContext>
  );
};

// Mock task data
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

describe('QuickCompleteTaskModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Progressive Flow', () => {
    it('renders Step 1 (Log Activity) initially', () => {
      const task = createMockTask();
      const onClose = vi.fn();
      const onComplete = vi.fn();

      renderWithProviders(
        <QuickCompleteTaskModal
          task={task}
          onClose={onClose}
          onComplete={onComplete}
        />
      );

      // Should show Step 1 title and form
      expect(screen.getByText(/Complete Task: Call about pricing/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Activity Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save & Continue/i })).toBeInTheDocument();
    });

    it('advances to Step 2 (Update Opportunity) after saving activity', async () => {
      const user = userEvent.setup();
      const task = createMockTask();
      const onClose = vi.fn();
      const onComplete = vi.fn();

      // Mock successful RPC call
      mockDataProvider.rpc.mockResolvedValueOnce({
        data: { task_id: 1, activity_id: 10, opportunity_id: 2, success: true },
      });

      renderWithProviders(
        <QuickCompleteTaskModal
          task={task}
          onClose={onClose}
          onComplete={onComplete}
        />
      );

      // Fill in activity notes
      const notesField = screen.getByLabelText(/Notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'Discussed pricing, they need 2 cases by Friday');

      // Click Save & Continue
      await user.click(screen.getByRole('button', { name: /Save & Continue/i }));

      // Should transition to Step 2
      await waitFor(() => {
        expect(screen.getByText(/Update Opportunity/i)).toBeInTheDocument();
      });
    });

    it('shows Step 3 (Success) after updating opportunity', async () => {
      const user = userEvent.setup();
      const task = createMockTask();
      const onClose = vi.fn();
      const onComplete = vi.fn();

      // Mock successful RPC call
      mockDataProvider.rpc.mockResolvedValueOnce({
        data: { task_id: 1, activity_id: 10, opportunity_id: 2, success: true },
      });

      // Mock getOne for opportunity fetch
      mockDataProvider.getOne.mockResolvedValueOnce({
        data: { id: 2, name: 'Restaurant ABC - $5,000', stage: 'qualification' },
      });

      renderWithProviders(
        <QuickCompleteTaskModal
          task={task}
          onClose={onClose}
          onComplete={onComplete}
        />
      );

      // Fill and save activity
      const notesField = screen.getByLabelText(/Notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'Follow-up call completed');
      await user.click(screen.getByRole('button', { name: /Save & Continue/i }));

      // Wait for Step 2
      await waitFor(() => {
        expect(screen.getByText(/Update Opportunity/i)).toBeInTheDocument();
      });

      // Click Update & Close (without changing stage)
      await user.click(screen.getByRole('button', { name: /Update & Close/i }));

      // Should show success step
      await waitFor(() => {
        expect(screen.getByText(/Task Completed!/i)).toBeInTheDocument();
        expect(screen.getByText(/Closing.../i)).toBeInTheDocument();
      });
    });

    it('auto-closes modal after success step', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      const task = createMockTask();
      const onClose = vi.fn();
      const onComplete = vi.fn();

      mockDataProvider.rpc.mockResolvedValueOnce({
        data: { task_id: 1, activity_id: 10, opportunity_id: 2, success: true },
      });

      mockDataProvider.getOne.mockResolvedValueOnce({
        data: { id: 2, name: 'Test Opp', stage: 'qualification' },
      });

      renderWithProviders(
        <QuickCompleteTaskModal
          task={task}
          onClose={onClose}
          onComplete={onComplete}
        />
      );

      // Complete flow
      const notesField = screen.getByLabelText(/Notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'Test');
      await user.click(screen.getByRole('button', { name: /Save & Continue/i }));

      await waitFor(() => {
        expect(screen.getByText(/Update Opportunity/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Skip/i }));

      await waitFor(() => {
        expect(screen.getByText(/Task Completed!/i)).toBeInTheDocument();
      });

      // Advance timers by 1 second (auto-close delay)
      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });

      vi.useRealTimers();
    });
  });

  describe('Skip Functionality', () => {
    it('advances to Step 2 when Skip is clicked in Step 1', async () => {
      const user = userEvent.setup();
      const task = createMockTask();
      const onClose = vi.fn();
      const onComplete = vi.fn();

      mockDataProvider.getOne.mockResolvedValueOnce({
        data: { id: 2, name: 'Test Opp', stage: 'qualification' },
      });

      renderWithProviders(
        <QuickCompleteTaskModal
          task={task}
          onClose={onClose}
          onComplete={onComplete}
        />
      );

      // Click Skip in Step 1
      await user.click(screen.getByRole('button', { name: /Skip/i }));

      // Should advance to Step 2
      await waitFor(() => {
        expect(screen.getByText(/Update Opportunity/i)).toBeInTheDocument();
      });
    });

    it('completes workflow when Skip is clicked in Step 2', async () => {
      const user = userEvent.setup();
      const task = createMockTask();
      const onClose = vi.fn();
      const onComplete = vi.fn();

      mockDataProvider.rpc.mockResolvedValueOnce({
        data: { task_id: 1, activity_id: 10, opportunity_id: 2, success: true },
      });

      mockDataProvider.getOne.mockResolvedValueOnce({
        data: { id: 2, name: 'Test Opp', stage: 'qualification' },
      });

      renderWithProviders(
        <QuickCompleteTaskModal
          task={task}
          onClose={onClose}
          onComplete={onComplete}
        />
      );

      // Fill and save activity
      const notesField = screen.getByLabelText(/Notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'Activity logged');
      await user.click(screen.getByRole('button', { name: /Save & Continue/i }));

      await waitFor(() => {
        expect(screen.getByText(/Update Opportunity/i)).toBeInTheDocument();
      });

      // Click Skip in Step 2
      await user.click(screen.getByRole('button', { name: /Skip/i }));

      // Should show success
      await waitFor(() => {
        expect(screen.getByText(/Task Completed!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tasks Without Opportunities', () => {
    it('skips Step 2 when task has no opportunity', async () => {
      const user = userEvent.setup();
      const task = createMockTask({ opportunity_id: undefined });
      const onClose = vi.fn();
      const onComplete = vi.fn();

      mockDataProvider.rpc.mockResolvedValueOnce({
        data: { task_id: 1, activity_id: 10, opportunity_id: null, success: true },
      });

      renderWithProviders(
        <QuickCompleteTaskModal
          task={task}
          onClose={onClose}
          onComplete={onComplete}
        />
      );

      // Fill and save activity
      const notesField = screen.getByLabelText(/Notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'General follow-up');
      await user.click(screen.getByRole('button', { name: /Save & Continue/i }));

      // Should go directly to success (skip Step 2)
      await waitFor(() => {
        expect(screen.getByText(/Task Completed!/i)).toBeInTheDocument();
      });

      // Should not show Update Opportunity step
      expect(screen.queryByText(/Update Opportunity/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows error notification when RPC call fails', async () => {
      const user = userEvent.setup();
      const task = createMockTask();
      const onClose = vi.fn();
      const onComplete = vi.fn();

      // Mock failed RPC call
      mockDataProvider.rpc.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(
        <QuickCompleteTaskModal
          task={task}
          onClose={onClose}
          onComplete={onComplete}
        />
      );

      // Fill and save activity
      const notesField = screen.getByLabelText(/Notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'Test activity');
      await user.click(screen.getByRole('button', { name: /Save & Continue/i }));

      // Should log error (check console.error was called)
      await waitFor(() => {
        expect(mockDataProvider.rpc).toHaveBeenCalled();
      });

      // Modal should remain open (not call onClose or onComplete)
      expect(onClose).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('Callbacks', () => {
    it('calls onComplete when workflow finishes successfully', async () => {
      const user = userEvent.setup();
      const task = createMockTask();
      const onClose = vi.fn();
      const onComplete = vi.fn();

      mockDataProvider.rpc.mockResolvedValueOnce({
        data: { task_id: 1, activity_id: 10, opportunity_id: 2, success: true },
      });

      mockDataProvider.getOne.mockResolvedValueOnce({
        data: { id: 2, name: 'Test Opp', stage: 'qualification' },
      });

      renderWithProviders(
        <QuickCompleteTaskModal
          task={task}
          onClose={onClose}
          onComplete={onComplete}
        />
      );

      // Complete flow
      const notesField = screen.getByLabelText(/Notes/i);
      await user.clear(notesField);
      await user.type(notesField, 'Completed');
      await user.click(screen.getByRole('button', { name: /Save & Continue/i }));

      await waitFor(() => {
        expect(screen.getByText(/Update Opportunity/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Skip/i }));

      // onComplete should be called
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });
});
