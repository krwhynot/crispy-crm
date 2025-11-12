import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ExportScheduler,
  ExportSchedule,
  ExportFormat,
  ScheduleFrequency,
} from '../exportScheduler';

describe('ExportScheduler', () => {
  let scheduler: ExportScheduler;
  const mockHandler = vi.fn();
  const localStorageMock = new Map<string, string>();

  beforeEach(() => {
    scheduler = new ExportScheduler();
    mockHandler.mockClear();
    localStorageMock.clear();

    // Mock localStorage
    global.localStorage = {
      getItem: (key: string) => localStorageMock.get(key) || null,
      setItem: (key: string, value: string) => localStorageMock.set(key, value),
      removeItem: (key: string) => localStorageMock.delete(key),
      clear: () => localStorageMock.clear(),
      length: localStorageMock.size,
      key: (index: number) => Array.from(localStorageMock.keys())[index] || null,
    } as Storage;

    // Stub Date.now() for deterministic testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    localStorageMock.clear(); // Clear localStorage after each test for isolation
  });

  describe('Schedule Management', () => {
    it('should create a new schedule with default values', () => {
      const schedule = scheduler.createSchedule({
        name: 'Weekly Sales Report',
        frequency: 'weekly',
        format: 'csv',
        recipients: ['admin@test.com'],
      });

      expect(schedule).toBeDefined();
      expect(schedule.id).toBeDefined();
      expect(schedule.name).toBe('Weekly Sales Report');
      expect(schedule.frequency).toBe('weekly');
      expect(schedule.format).toBe('csv');
      expect(schedule.active).toBe(true);
      expect(schedule.createdAt).toBeDefined();
    });

    it('should return the created schedule with all required fields', () => {
      const schedule = scheduler.createSchedule({
        name: 'Monthly Export',
        frequency: 'monthly',
        format: 'excel',
        recipients: ['user1@test.com', 'user2@test.com'],
        dayOfWeek: 1,
        dayOfMonth: 15,
        hour: 14,
      });

      expect(schedule.dayOfWeek).toBe(1);
      expect(schedule.dayOfMonth).toBe(15);
      expect(schedule.hour).toBe(14);
      expect(schedule.recipients.length).toBe(2);
    });

    it('should retrieve a schedule by ID', () => {
      const created = scheduler.createSchedule({
        name: 'Test Schedule',
        frequency: 'daily',
        format: 'pdf',
        recipients: ['test@test.com'],
      });

      const retrieved = scheduler.getSchedule(created.id);
      expect(retrieved).toEqual(created);
    });

    it('should return undefined for non-existent schedule', () => {
      const retrieved = scheduler.getSchedule('non-existent-id');
      expect(retrieved).toBeUndefined();
    });

    it('should list all schedules', () => {
      scheduler.createSchedule({
        name: 'Schedule 1',
        frequency: 'daily',
        format: 'csv',
        recipients: ['a@test.com'],
      });
      scheduler.createSchedule({
        name: 'Schedule 2',
        frequency: 'weekly',
        format: 'excel',
        recipients: ['b@test.com'],
      });

      const schedules = scheduler.listSchedules();
      expect(schedules.length).toBe(2);
      expect(schedules[0].name).toBe('Schedule 1');
      expect(schedules[1].name).toBe('Schedule 2');
    });

    it('should update an existing schedule', () => {
      const created = scheduler.createSchedule({
        name: 'Original Name',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });

      const updated = scheduler.updateSchedule(created.id, {
        name: 'Updated Name',
        frequency: 'weekly',
      });

      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.frequency).toBe('weekly');
      expect(updated!.format).toBe('csv'); // Unchanged fields persist
    });

    it('should delete a schedule', () => {
      const created = scheduler.createSchedule({
        name: 'To Delete',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });

      const deleted = scheduler.deleteSchedule(created.id);
      expect(deleted).toBe(true);
      expect(scheduler.getSchedule(created.id)).toBeUndefined();
    });

    it('should return false when deleting non-existent schedule', () => {
      const deleted = scheduler.deleteSchedule('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('Recipient Management', () => {
    it('should add a recipient to a schedule', () => {
      const schedule = scheduler.createSchedule({
        name: 'Test',
        frequency: 'daily',
        format: 'csv',
        recipients: ['existing@test.com'],
      });

      scheduler.addRecipient(schedule.id, 'new@test.com');
      const updated = scheduler.getSchedule(schedule.id);
      expect(updated!.recipients).toContain('new@test.com');
      expect(updated!.recipients.length).toBe(2);
    });

    it('should not add duplicate recipients', () => {
      const schedule = scheduler.createSchedule({
        name: 'Test',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });

      scheduler.addRecipient(schedule.id, 'test@test.com');
      const updated = scheduler.getSchedule(schedule.id);
      expect(updated!.recipients.length).toBe(1);
    });

    it('should remove a recipient from a schedule', () => {
      const schedule = scheduler.createSchedule({
        name: 'Test',
        frequency: 'daily',
        format: 'csv',
        recipients: ['a@test.com', 'b@test.com'],
      });

      scheduler.removeRecipient(schedule.id, 'a@test.com');
      const updated = scheduler.getSchedule(schedule.id);
      expect(updated!.recipients).not.toContain('a@test.com');
      expect(updated!.recipients.length).toBe(1);
    });
  });

  describe('Schedule Persistence', () => {
    it('should persist schedules to localStorage', () => {
      scheduler.createSchedule({
        name: 'Persistent Schedule',
        frequency: 'weekly',
        format: 'excel',
        recipients: ['test@test.com'],
      });

      const stored = localStorage.getItem('exportSchedules');
      expect(stored).toBeDefined();
      expect(stored).not.toBe('[]');
    });

    it('should load schedules from localStorage', () => {
      const schedule1 = scheduler.createSchedule({
        name: 'Schedule 1',
        frequency: 'daily',
        format: 'csv',
        recipients: ['a@test.com'],
      });

      // Create new scheduler instance
      const scheduler2 = new ExportScheduler();
      const loaded = scheduler2.getSchedule(schedule1.id);
      expect(loaded).toBeDefined();
      expect(loaded!.name).toBe('Schedule 1');
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorageMock.set('exportSchedules', 'invalid json {]');

      // Should not throw
      const scheduler2 = new ExportScheduler();
      const schedules = scheduler2.listSchedules();
      expect(schedules.length).toBe(0);
    });

    it('should persist schedule updates to localStorage', () => {
      const created = scheduler.createSchedule({
        name: 'Original',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });

      scheduler.updateSchedule(created.id, { name: 'Updated' });

      const scheduler2 = new ExportScheduler();
      const loaded = scheduler2.getSchedule(created.id);
      expect(loaded!.name).toBe('Updated');
    });
  });

  describe('Schedule Activation', () => {
    it('should toggle schedule active status', () => {
      const schedule = scheduler.createSchedule({
        name: 'Test',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });

      expect(schedule.active).toBe(true);

      scheduler.toggleScheduleActive(schedule.id);
      let updated = scheduler.getSchedule(schedule.id);
      expect(updated!.active).toBe(false);

      scheduler.toggleScheduleActive(schedule.id);
      updated = scheduler.getSchedule(schedule.id);
      expect(updated!.active).toBe(true);
    });

    it('should return false when toggling non-existent schedule', () => {
      const result = scheduler.toggleScheduleActive('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('Frequency Validation', () => {
    it('should validate daily frequency', () => {
      const schedule = scheduler.createSchedule({
        name: 'Daily Export',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
        hour: 9,
      });

      expect(schedule.frequency).toBe('daily');
      expect(schedule.hour).toBeDefined();
    });

    it('should validate weekly frequency with dayOfWeek', () => {
      const schedule = scheduler.createSchedule({
        name: 'Weekly Export',
        frequency: 'weekly',
        format: 'csv',
        recipients: ['test@test.com'],
        dayOfWeek: 3,
        hour: 14,
      });

      expect(schedule.frequency).toBe('weekly');
      expect(schedule.dayOfWeek).toBe(3);
    });

    it('should validate monthly frequency with dayOfMonth', () => {
      const schedule = scheduler.createSchedule({
        name: 'Monthly Export',
        frequency: 'monthly',
        format: 'csv',
        recipients: ['test@test.com'],
        dayOfMonth: 15,
        hour: 10,
      });

      expect(schedule.frequency).toBe('monthly');
      expect(schedule.dayOfMonth).toBe(15);
    });
  });

  describe('Format Support', () => {
    it('should support CSV format', () => {
      const schedule = scheduler.createSchedule({
        name: 'CSV Export',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });

      expect(schedule.format).toBe('csv');
    });

    it('should support Excel format', () => {
      const schedule = scheduler.createSchedule({
        name: 'Excel Export',
        frequency: 'daily',
        format: 'excel',
        recipients: ['test@test.com'],
      });

      expect(schedule.format).toBe('excel');
    });

    it('should support PDF format', () => {
      const schedule = scheduler.createSchedule({
        name: 'PDF Export',
        frequency: 'daily',
        format: 'pdf',
        recipients: ['test@test.com'],
      });

      expect(schedule.format).toBe('pdf');
    });
  });

  describe('Schedule Filtering', () => {
    it('should filter schedules by frequency', () => {
      scheduler.createSchedule({
        name: 'Daily 1',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });
      scheduler.createSchedule({
        name: 'Weekly 1',
        frequency: 'weekly',
        format: 'csv',
        recipients: ['test@test.com'],
      });
      scheduler.createSchedule({
        name: 'Daily 2',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });

      const dailies = scheduler.listSchedules().filter(s => s.frequency === 'daily');
      expect(dailies.length).toBe(2);
    });

    it('should filter active schedules', () => {
      const s1 = scheduler.createSchedule({
        name: 'Active',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });
      const s2 = scheduler.createSchedule({
        name: 'Inactive',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });

      scheduler.toggleScheduleActive(s2.id);

      const active = scheduler.listSchedules().filter(s => s.active);
      expect(active.length).toBe(1);
      expect(active[0].name).toBe('Active');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty recipient list', () => {
      const schedule = scheduler.createSchedule({
        name: 'No Recipients',
        frequency: 'daily',
        format: 'csv',
        recipients: [],
      });

      expect(schedule.recipients.length).toBe(0);
    });

    it('should handle special characters in schedule name', () => {
      const schedule = scheduler.createSchedule({
        name: 'Test & Report #1 (2025)',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });

      expect(schedule.name).toBe('Test & Report #1 (2025)');
    });

    it('should assign unique IDs to schedules', () => {
      const s1 = scheduler.createSchedule({
        name: 'Schedule 1',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });
      const s2 = scheduler.createSchedule({
        name: 'Schedule 2',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });

      expect(s1.id).not.toBe(s2.id);
    });

    it('should handle rapid creation and deletion', () => {
      const s1 = scheduler.createSchedule({
        name: 'Temp',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });

      scheduler.deleteSchedule(s1.id);

      const s2 = scheduler.createSchedule({
        name: 'New',
        frequency: 'daily',
        format: 'csv',
        recipients: ['test@test.com'],
      });

      expect(scheduler.listSchedules().length).toBe(1);
      expect(scheduler.getSchedule(s2.id)).toBeDefined();
    });
  });
});
