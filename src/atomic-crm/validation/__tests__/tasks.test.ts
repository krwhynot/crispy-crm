/**
 * Tests for task validation schemas
 * Validates business rules, data integrity, and API boundary integration
 */

import { describe, it, expect } from 'vitest';
import {
  taskSchema,
  createTaskSchema,
  updateTaskSchema,
  taskWithReminderSchema,
  validateCreateTask,
  validateUpdateTask,
  validateTaskWithReminder,
  validateTaskForSubmission,
  transformTaskDate,
  type Task,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '../tasks';
import { z } from 'zod';

describe('Task Validation Schemas', () => {
  describe('taskSchema', () => {
    const validTask = {
      text: 'Follow up with client',
      contact_id: 'contact-123',
      type: 'call',
      due_date: '2024-12-31T10:00:00Z',
      sales_id: 'user-456',
    };

    it('should accept valid task data', () => {
      const result = taskSchema.parse(validTask);
      expect(result).toBeDefined();
      expect(result.text).toBe('Follow up with client');
      expect(result.type).toBe('call');
      expect(result.contact_id).toBe('contact-123');
    });

    it('should reject empty text', () => {
      const invalidData = { ...validTask, text: '' };
      expect(() => taskSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject empty type', () => {
      const invalidData = { ...validTask, type: '' };
      expect(() => taskSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject empty due_date', () => {
      const invalidData = { ...validTask, due_date: '' };
      expect(() => taskSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should require contact_id', () => {
      const withoutContact = {
        text: 'Task without contact',
        type: 'call',
        due_date: '2024-12-31T10:00:00Z',
        sales_id: 'user-456',
      };
      // Missing contact_id should fail
      expect(() => taskSchema.parse(withoutContact)).toThrow(z.ZodError);
    });

    it('should require sales_id', () => {
      const withoutSalesId = {
        text: 'Task without sales',
        contact_id: 'contact-123',
        type: 'call',
        due_date: '2024-12-31T10:00:00Z',
      };
      // Missing sales_id should fail
      expect(() => taskSchema.parse(withoutSalesId)).toThrow(z.ZodError);
    });

    it('should accept both string and number IDs', () => {
      // String IDs
      expect(() => taskSchema.parse(validTask)).not.toThrow();

      // Number IDs
      const withNumberIds = {
        text: 'Task with number IDs',
        contact_id: 123,
        type: 'email',
        due_date: '2024-12-31T10:00:00Z',
        sales_id: 456,
      };
      expect(() => taskSchema.parse(withNumberIds)).not.toThrow();

      // Optional id field
      expect(() => taskSchema.parse({ ...validTask, id: 'task-123' })).not.toThrow();
      expect(() => taskSchema.parse({ ...validTask, id: 789 })).not.toThrow();
    });

    it('should handle done_date field', () => {
      const completedTask = {
        ...validTask,
        done_date: '2024-12-20T10:00:00Z',
      };

      const result = taskSchema.parse(completedTask);
      expect(result.done_date).toBe('2024-12-20T10:00:00Z');

      // done_date can be null
      const taskWithNullDone = {
        ...validTask,
        done_date: null,
      };
      expect(() => taskSchema.parse(taskWithNullDone)).not.toThrow();

      // done_date is optional
      expect(() => taskSchema.parse(validTask)).not.toThrow();
    });

    it('should validate different task types', () => {
      const taskTypes = ['call', 'email', 'meeting', 'todo', 'follow-up', 'reminder'];

      taskTypes.forEach(type => {
        const task = { ...validTask, type };
        expect(() => taskSchema.parse(task)).not.toThrow();
      });
    });
  });

  describe('createTaskSchema', () => {
    it('should require essential fields for creation', () => {
      const validCreate = {
        text: 'New Task',
        contact_id: 'contact-123',
        type: 'call',
        due_date: '2024-12-31T10:00:00Z',
        sales_id: 'user-456',
      };

      expect(() => createTaskSchema.parse(validCreate)).not.toThrow();
    });

    it('should reject creation without required fields', () => {
      expect(() => createTaskSchema.parse({})).toThrow(z.ZodError);

      expect(() => createTaskSchema.parse({
        text: 'Test',
        // Missing other required fields
      })).toThrow(z.ZodError);

      expect(() => createTaskSchema.parse({
        text: 'Test',
        contact_id: 'contact-123',
        type: 'call',
        // Missing due_date and sales_id
      })).toThrow(z.ZodError);
    });

    it('should not allow id field on creation', () => {
      const dataWithId = {
        id: 'should-not-be-here',
        text: 'New Task',
        contact_id: 'contact-123',
        type: 'call',
        due_date: '2024-12-31T10:00:00Z',
        sales_id: 'user-456',
      };

      const result = createTaskSchema.parse(dataWithId);
      expect('id' in result).toBe(false);
    });

    it('should not allow done_date on creation', () => {
      const dataWithDoneDate = {
        text: 'New Task',
        contact_id: 'contact-123',
        type: 'call',
        due_date: '2024-12-31T10:00:00Z',
        sales_id: 'user-456',
        done_date: '2024-12-30T10:00:00Z',
      };

      const result = createTaskSchema.parse(dataWithDoneDate);
      expect('done_date' in result).toBe(false);
    });
  });

  describe('updateTaskSchema', () => {
    it('should require id for updates', () => {
      const validUpdate = {
        id: 'task-123',
        text: 'Updated Text',
      };

      expect(() => updateTaskSchema.parse(validUpdate)).not.toThrow();
    });

    it('should reject updates without id', () => {
      const invalidUpdate = {
        text: 'Updated Text',
      };

      expect(() => updateTaskSchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });

    it('should allow partial updates', () => {
      expect(() => updateTaskSchema.parse({ id: 't-1', text: 'New text' })).not.toThrow();
      expect(() => updateTaskSchema.parse({ id: 't-1', type: 'email' })).not.toThrow();
      expect(() => updateTaskSchema.parse({ id: 't-1', due_date: '2025-01-01T10:00:00Z' })).not.toThrow();
      expect(() => updateTaskSchema.parse({ id: 't-1', done_date: '2024-12-31T10:00:00Z' })).not.toThrow();
      expect(() => updateTaskSchema.parse({ id: 't-1' })).not.toThrow(); // Just id
    });

    it('should allow marking task as done', () => {
      const markAsDone = {
        id: 'task-123',
        done_date: '2024-12-20T10:00:00Z',
      };

      expect(() => updateTaskSchema.parse(markAsDone)).not.toThrow();
    });

    it('should allow clearing done_date', () => {
      const clearDone = {
        id: 'task-123',
        done_date: null,
      };

      expect(() => updateTaskSchema.parse(clearDone)).not.toThrow();
    });
  });

  describe('taskWithReminderSchema', () => {
    it('should validate tasks with future due dates for reminders', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const validTaskWithReminder = {
        text: 'Task with reminder',
        contact_id: 'contact-123',
        type: 'call',
        due_date: futureDate.toISOString(),
        sales_id: 'user-456',
      };

      expect(() => taskWithReminderSchema.parse(validTaskWithReminder)).not.toThrow();
    });

    it('should reject tasks with past due dates for reminders', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7); // 7 days ago

      const invalidTaskWithReminder = {
        text: 'Task with past date',
        contact_id: 'contact-123',
        type: 'call',
        due_date: pastDate.toISOString(),
        sales_id: 'user-456',
      };

      expect(() => taskWithReminderSchema.parse(invalidTaskWithReminder)).toThrow(z.ZodError);
    });

    it('should handle tasks without due dates', () => {
      const taskWithoutDueDate = {
        text: 'Task without date',
        contact_id: 'contact-123',
        type: 'call',
        due_date: '', // Empty due date
        sales_id: 'user-456',
      };

      // Should fail on base validation (due_date required)
      expect(() => taskWithReminderSchema.parse(taskWithoutDueDate)).toThrow(z.ZodError);
    });
  });

  describe('Validation Functions', () => {
    describe('validateCreateTask', () => {
      it('should validate and return parsed data', () => {
        const validData = {
          text: 'New Task',
          contact_id: 'contact-123',
          type: 'email',
          due_date: '2024-12-31T10:00:00Z',
          sales_id: 'user-456',
        };

        const result = validateCreateTask(validData);
        expect(result.text).toBe('New Task');
        expect(result.contact_id).toBe('contact-123');
      });

      it('should throw for invalid creation data', () => {
        const invalidData = {
          text: '',
          contact_id: 'contact-123',
          type: 'call',
          due_date: '2024-12-31T10:00:00Z',
          sales_id: 'user-456',
        };

        expect(() => validateCreateTask(invalidData)).toThrow(z.ZodError);
      });

      it('should reject incomplete creation data', () => {
        const incompleteData = {
          text: 'New Task',
          type: 'meeting',
          // Missing contact_id, due_date, sales_id
        };

        expect(() => validateCreateTask(incompleteData)).toThrow(z.ZodError);
      });
    });

    describe('validateUpdateTask', () => {
      it('should validate and return parsed data', () => {
        const validData = {
          id: 'task-123',
          text: 'Updated Task',
          done_date: '2024-12-20T10:00:00Z',
        };

        const result = validateUpdateTask(validData);
        expect(result.id).toBe('task-123');
        expect(result.text).toBe('Updated Task');
        expect(result.done_date).toBe('2024-12-20T10:00:00Z');
      });

      it('should throw for update without id', () => {
        const invalidData = {
          text: 'Updated Task',
        };

        expect(() => validateUpdateTask(invalidData)).toThrow(z.ZodError);
      });
    });

    describe('validateTaskWithReminder', () => {
      it('should validate tasks with reminders', () => {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1); // 1 month from now

        const validData = {
          text: 'Important reminder',
          contact_id: 'contact-123',
          type: 'follow-up',
          due_date: futureDate.toISOString(),
          sales_id: 'user-456',
        };

        const result = validateTaskWithReminder(validData);
        expect(result.text).toBe('Important reminder');
      });

      it('should reject reminders for past dates', () => {
        const pastData = {
          text: 'Late reminder',
          contact_id: 'contact-123',
          type: 'call',
          due_date: '2020-01-01T10:00:00Z', // Past date
          sales_id: 'user-456',
        };

        expect(() => validateTaskWithReminder(pastData)).toThrow(z.ZodError);
      });
    });

    describe('validateTaskForSubmission', () => {
      it('should validate and transform task data', () => {
        const inputData = {
          text: 'Task for submission',
          contact_id: 'contact-123',
          type: 'meeting',
          due_date: '2024-12-31T15:30:45Z',
          sales_id: 'user-456',
        };

        const result = validateTaskForSubmission(inputData);
        expect(result.text).toBe('Task for submission');
        // Date should be transformed to start of day
        expect(result.due_date).toMatch(/T00:00:00\.000Z$/);
      });

      it('should transform done_date if present', () => {
        const dataWithDoneDate = {
          text: 'Completed task',
          contact_id: 'contact-123',
          type: 'call',
          due_date: '2024-12-31T15:30:00Z',
          sales_id: 'user-456',
          done_date: '2024-12-20T18:45:30Z',
        };

        const result = validateTaskForSubmission(dataWithDoneDate);
        // Both dates should be transformed to start of day
        expect(result.due_date).toMatch(/T00:00:00\.000Z$/);
        expect(result.done_date).toMatch(/T00:00:00\.000Z$/);
      });
    });

    describe('transformTaskDate', () => {
      it('should transform date to start of day', () => {
        const testCases = [
          { input: '2024-12-31T15:30:45Z', expected: '2024-12-31T00:00:00.000Z' },
          { input: '2024-01-15T23:59:59Z', expected: '2024-01-15T00:00:00.000Z' },
          { input: '2024-06-15T12:00:00Z', expected: '2024-06-15T00:00:00.000Z' },
        ];

        testCases.forEach(({ input, expected }) => {
          const result = transformTaskDate(input);
          expect(result).toBe(expected);
        });
      });
    });
  });

  describe('Business Rules', () => {
    it('should enforce required contact association', () => {
      const taskWithoutContact = {
        text: 'Orphan task',
        type: 'call',
        due_date: '2024-12-31T10:00:00Z',
        sales_id: 'user-456',
        // Missing contact_id
      };

      expect(() => taskSchema.parse(taskWithoutContact)).toThrow(z.ZodError);
    });

    it('should enforce sales assignment', () => {
      const unassignedTask = {
        text: 'Unassigned task',
        contact_id: 'contact-123',
        type: 'email',
        due_date: '2024-12-31T10:00:00Z',
        // Missing sales_id
      };

      expect(() => taskSchema.parse(unassignedTask)).toThrow(z.ZodError);
    });

    it('should handle task completion workflow', () => {
      // Create task
      const newTask = {
        text: 'Task to complete',
        contact_id: 'contact-123',
        type: 'todo',
        due_date: '2024-12-31T10:00:00Z',
        sales_id: 'user-456',
      };

      const created = createTaskSchema.parse(newTask);
      expect(created.done_date).toBeUndefined();

      // Mark as complete
      const completeUpdate = {
        id: 'task-123',
        done_date: '2024-12-20T10:00:00Z',
      };

      const completed = updateTaskSchema.parse(completeUpdate);
      expect(completed.done_date).toBe('2024-12-20T10:00:00Z');

      // Reopen task
      const reopenUpdate = {
        id: 'task-123',
        done_date: null,
      };

      const reopened = updateTaskSchema.parse(reopenUpdate);
      expect(reopened.done_date).toBeNull();
    });

    it('should support various task types', () => {
      const taskTypes = [
        'call',
        'email',
        'meeting',
        'todo',
        'follow-up',
        'reminder',
        'deadline',
        'milestone',
        'review',
        'approval',
      ];

      taskTypes.forEach(type => {
        const task = {
          text: `${type} task`,
          contact_id: 'contact-123',
          type,
          due_date: '2024-12-31T10:00:00Z',
          sales_id: 'user-456',
        };

        expect(() => taskSchema.parse(task)).not.toThrow();
      });
    });
  });

  describe('Error Message Formatting', () => {
    it('should provide clear error messages', () => {
      const testCases = [
        {
          data: { text: '', contact_id: 'c-1', type: 'call', due_date: '2024-12-31', sales_id: 'u-1' },
          expectedError: 'Description is required',
        },
        {
          data: { text: 'Test', contact_id: '', type: 'call', due_date: '2024-12-31', sales_id: 'u-1' },
          expectedError: 'Contact is required',
        },
        {
          data: { text: 'Test', contact_id: 'c-1', type: '', due_date: '2024-12-31', sales_id: 'u-1' },
          expectedError: 'Type is required',
        },
        {
          data: { text: 'Test', contact_id: 'c-1', type: 'call', due_date: '', sales_id: 'u-1' },
          expectedError: 'Due date is required',
        },
      ];

      testCases.forEach(({ data, expectedError }) => {
        try {
          taskSchema.parse(data);
          expect.fail('Should have thrown error');
        } catch (error) {
          if (error instanceof z.ZodError) {
            const message = error.errors[0].message;
            expect(message).toBe(expectedError);
          }
        }
      });
    });
  });

  describe('API Boundary Integration', () => {
    it('should validate at creation boundary', () => {
      const apiPayload = {
        text: 'API created task',
        contact_id: 'contact-123',
        type: 'api-call',
        due_date: '2024-12-31T10:00:00Z',
        sales_id: 'user-456',
        extra_field: 'should be ignored',
      };

      const result = validateCreateTask(apiPayload);
      expect(result.text).toBe('API created task');
      expect('extra_field' in result).toBe(false);
    });

    it('should handle type coercion at boundary', () => {
      const apiPayload = {
        text: 'Coerced task',
        contact_id: 123, // Number instead of string
        type: 'call',
        due_date: '2024-12-31T10:00:00Z',
        sales_id: 456, // Number instead of string
      };

      const result = taskSchema.parse(apiPayload);
      expect(result.contact_id).toBe(123);
      expect(result.sales_id).toBe(456);
    });

    it('should validate at update boundary', () => {
      const apiPayload = {
        id: 'task-123',
        text: 'Updated via API',
        done_date: '2024-12-20T10:00:00Z',
        malicious_field: 'should be ignored',
      };

      const result = validateUpdateTask(apiPayload);
      expect(result.id).toBe('task-123');
      expect(result.text).toBe('Updated via API');
      expect('malicious_field' in result).toBe(false);
    });

    it('should handle date transformation at submission', () => {
      const apiPayload = {
        text: 'Task with dates',
        contact_id: 'contact-123',
        type: 'meeting',
        due_date: '2024-12-31T15:30:45.123Z', // With milliseconds and time
        sales_id: 'user-456',
        done_date: '2024-12-20T18:45:30.456Z',
      };

      const result = validateTaskForSubmission(apiPayload);
      // Dates should be normalized to start of day
      expect(result.due_date).toBe('2024-12-31T00:00:00.000Z');
      expect(result.done_date).toBe('2024-12-20T00:00:00.000Z');
    });
  });
});