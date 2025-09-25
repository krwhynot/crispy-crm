/**
 * Tests for task validation schemas
 * Validates business rules, data integrity, and API boundary integration
 */

import { describe, it, expect } from 'vitest';
import {
  taskSchema,
  createTaskSchema,
  updateTaskSchema,
  validateTaskForm,
  validateCreateTask,
  validateUpdateTask,
  taskTypeSchema,
  taskStatusSchema,
  taskPrioritySchema,
  type Task,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '../tasks';
import { z } from 'zod';

describe('Task Validation Schemas', () => {
  describe('Enum Schemas', () => {
    describe('taskTypeSchema', () => {
      it('should accept valid task types', () => {
        const validTypes = ['call', 'email', 'meeting', 'todo', 'deadline', 'milestone'];

        validTypes.forEach(type => {
          expect(() => taskTypeSchema.parse(type)).not.toThrow();
        });
      });

      it('should reject invalid task types', () => {
        const invalidTypes = ['', 'phone', 'appointment', 'task', 'reminder'];

        invalidTypes.forEach(type => {
          expect(() => taskTypeSchema.parse(type)).toThrow(z.ZodError);
        });
      });
    });

    describe('taskStatusSchema', () => {
      it('should accept valid statuses', () => {
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'deferred'];

        validStatuses.forEach(status => {
          expect(() => taskStatusSchema.parse(status)).not.toThrow();
        });
      });

      it('should reject invalid statuses', () => {
        expect(() => taskStatusSchema.parse('done')).toThrow(z.ZodError);
        expect(() => taskStatusSchema.parse('open')).toThrow(z.ZodError);
        expect(() => taskStatusSchema.parse('closed')).toThrow(z.ZodError);
      });
    });

    describe('taskPrioritySchema', () => {
      it('should accept valid priorities', () => {
        const validPriorities = ['low', 'medium', 'high', 'urgent'];

        validPriorities.forEach(priority => {
          expect(() => taskPrioritySchema.parse(priority)).not.toThrow();
        });
      });

      it('should reject invalid priorities', () => {
        expect(() => taskPrioritySchema.parse('critical')).toThrow(z.ZodError);
        expect(() => taskPrioritySchema.parse('normal')).toThrow(z.ZodError);
      });
    });
  });

  describe('taskSchema', () => {
    const validTask = {
      title: 'Follow up with client',
      type: 'call',
      status: 'pending',
      priority: 'medium',
      due_date: '2024-12-31T10:00:00Z',
      description: 'Discuss project requirements',
    };

    it('should accept valid task data', () => {
      const result = taskSchema.parse(validTask);
      expect(result).toBeDefined();
      expect(result.title).toBe('Follow up with client');
      expect(result.type).toBe('call');
      expect(result.status).toBe('pending');
    });

    it('should provide default values', () => {
      const minimalTask = {
        title: 'Minimal Task',
        type: 'todo',
        due_date: '2024-12-31T10:00:00Z',
      };

      const result = taskSchema.parse(minimalTask);
      expect(result.status).toBe('pending');
      expect(result.priority).toBe('medium');
    });

    it('should reject empty title', () => {
      const invalidData = { ...validTask, title: '' };
      expect(() => taskSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should validate reminder is before due date', () => {
      // Valid: reminder before due date
      const validReminder = {
        ...validTask,
        due_date: '2024-12-31T10:00:00Z',
        reminder_date: '2024-12-30T10:00:00Z',
      };
      expect(() => taskSchema.parse(validReminder)).not.toThrow();

      // Invalid: reminder after due date
      const invalidReminder = {
        ...validTask,
        due_date: '2024-12-31T10:00:00Z',
        reminder_date: '2025-01-01T10:00:00Z',
      };
      expect(() => taskSchema.parse(invalidReminder)).toThrow(z.ZodError);

      // Invalid: reminder same as due date
      const sameTimeReminder = {
        ...validTask,
        due_date: '2024-12-31T10:00:00Z',
        reminder_date: '2024-12-31T10:00:00Z',
      };
      expect(() => taskSchema.parse(sameTimeReminder)).toThrow(z.ZodError);
    });

    it('should handle assigned user relationship', () => {
      const taskWithAssignee = {
        ...validTask,
        assigned_to_id: 'user-123',
      };

      const result = taskSchema.parse(taskWithAssignee);
      expect(result.assigned_to_id).toBe('user-123');

      // Should accept both string and number IDs
      expect(() => taskSchema.parse({
        ...validTask,
        assigned_to_id: 123
      })).not.toThrow();
    });

    it('should handle entity relationships', () => {
      const taskWithRelations = {
        ...validTask,
        contact_id: 'contact-123',
        company_id: 'company-456',
        opportunity_id: 'opp-789',
      };

      const result = taskSchema.parse(taskWithRelations);
      expect(result.contact_id).toBe('contact-123');
      expect(result.company_id).toBe('company-456');
      expect(result.opportunity_id).toBe('opp-789');
    });

    it('should handle nullable fields', () => {
      const dataWithNulls = {
        ...validTask,
        completed_date: null,
        reminder_date: null,
        notes: null,
        deleted_at: null,
      };

      expect(() => taskSchema.parse(dataWithNulls)).not.toThrow();
    });

    it('should handle optional fields', () => {
      const minimalData = {
        title: 'Simple Task',
        type: 'todo',
        due_date: '2024-12-31T10:00:00Z',
      };

      const result = taskSchema.parse(minimalData);
      expect(result.description).toBeUndefined();
      expect(result.assigned_to_id).toBeUndefined();
      expect(result.contact_id).toBeUndefined();
    });

    it('should validate completed_date when status is completed', () => {
      const completedTask = {
        ...validTask,
        status: 'completed',
        completed_date: '2024-12-15T10:00:00Z',
      };

      expect(() => taskSchema.parse(completedTask)).not.toThrow();
    });

    it('should handle recurrence pattern', () => {
      const recurringTask = {
        ...validTask,
        recurrence_pattern: 'weekly',
        recurrence_end_date: '2025-12-31T10:00:00Z',
      };

      expect(() => taskSchema.parse(recurringTask)).not.toThrow();
    });

    it('should accept both string and number IDs', () => {
      expect(() => taskSchema.parse({ ...validTask, id: 'string-id' })).not.toThrow();
      expect(() => taskSchema.parse({ ...validTask, id: 12345 })).not.toThrow();
      expect(() => taskSchema.parse({ ...validTask, created_by_id: 'user-1' })).not.toThrow();
      expect(() => taskSchema.parse({ ...validTask, created_by_id: 100 })).not.toThrow();
    });
  });

  describe('createTaskSchema', () => {
    it('should require essential fields for creation', () => {
      const validCreate = {
        title: 'New Task',
        type: 'call',
        due_date: '2024-12-31T10:00:00Z',
      };

      expect(() => createTaskSchema.parse(validCreate)).not.toThrow();
    });

    it('should reject creation without required fields', () => {
      expect(() => createTaskSchema.parse({})).toThrow(z.ZodError);
      expect(() => createTaskSchema.parse({ title: 'Test' })).toThrow(z.ZodError);
      expect(() => createTaskSchema.parse({
        title: 'Test',
        type: 'call'
      })).toThrow(z.ZodError); // Missing due_date
    });

    it('should not allow id field on creation', () => {
      const dataWithId = {
        id: 'should-not-be-here',
        title: 'New Task',
        type: 'call',
        due_date: '2024-12-31T10:00:00Z',
      };

      const result = createTaskSchema.parse(dataWithId);
      expect('id' in result).toBe(false);
    });

    it('should not include system fields on creation', () => {
      const dataWithSystemFields = {
        title: 'New Task',
        type: 'call',
        due_date: '2024-12-31T10:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = createTaskSchema.parse(dataWithSystemFields);
      expect('created_at' in result).toBe(false);
      expect('updated_at' in result).toBe(false);
    });

    it('should apply defaults on creation', () => {
      const minimalCreate = {
        title: 'New Task',
        type: 'todo',
        due_date: '2024-12-31T10:00:00Z',
      };

      const result = createTaskSchema.parse(minimalCreate);
      expect(result.status).toBe('pending');
      expect(result.priority).toBe('medium');
    });

    it('should validate reminder on creation', () => {
      // Valid reminder
      const withValidReminder = {
        title: 'Task with Reminder',
        type: 'call',
        due_date: '2024-12-31T10:00:00Z',
        reminder_date: '2024-12-30T10:00:00Z',
      };
      expect(() => createTaskSchema.parse(withValidReminder)).not.toThrow();

      // Invalid reminder (after due date)
      const withInvalidReminder = {
        title: 'Task with Bad Reminder',
        type: 'call',
        due_date: '2024-12-31T10:00:00Z',
        reminder_date: '2025-01-01T10:00:00Z',
      };
      expect(() => createTaskSchema.parse(withInvalidReminder)).toThrow(z.ZodError);
    });
  });

  describe('updateTaskSchema', () => {
    it('should require id for updates', () => {
      const validUpdate = {
        id: 'task-123',
        title: 'Updated Title',
      };

      expect(() => updateTaskSchema.parse(validUpdate)).not.toThrow();
    });

    it('should reject updates without id', () => {
      const invalidUpdate = {
        title: 'Updated Title',
      };

      expect(() => updateTaskSchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });

    it('should allow partial updates', () => {
      expect(() => updateTaskSchema.parse({ id: 't-1', title: 'New Title' })).not.toThrow();
      expect(() => updateTaskSchema.parse({ id: 't-1', status: 'completed' })).not.toThrow();
      expect(() => updateTaskSchema.parse({ id: 't-1', priority: 'high' })).not.toThrow();
      expect(() => updateTaskSchema.parse({ id: 't-1', description: 'Updated desc' })).not.toThrow();
      expect(() => updateTaskSchema.parse({ id: 't-1' })).not.toThrow(); // Just id
    });

    it('should validate updated fields', () => {
      expect(() => updateTaskSchema.parse({
        id: 't-1',
        type: 'invalid_type'
      })).toThrow(z.ZodError);

      expect(() => updateTaskSchema.parse({
        id: 't-1',
        status: 'invalid_status'
      })).toThrow(z.ZodError);

      expect(() => updateTaskSchema.parse({
        id: 't-1',
        priority: 'invalid_priority'
      })).toThrow(z.ZodError);
    });

    it('should validate reminder update', () => {
      // Can't validate without due_date in partial update
      const validUpdate = {
        id: 't-1',
        reminder_date: '2024-12-30T10:00:00Z',
      };
      // This should pass schema validation (business logic validation happens elsewhere)
      expect(() => updateTaskSchema.parse(validUpdate)).not.toThrow();
    });
  });

  describe('Validation Functions', () => {
    describe('validateTaskForm', () => {
      it('should validate and pass valid data', async () => {
        const validData = {
          title: 'Test Task',
          type: 'call',
          due_date: '2024-12-31T10:00:00Z',
        };

        await expect(validateTaskForm(validData)).resolves.toBeUndefined();
      });

      it('should format errors for React Admin', async () => {
        const invalidData = {
          title: '',
          type: 'invalid_type',
          status: 'invalid_status',
          priority: 'invalid_priority',
          due_date: '',
        };

        try {
          await validateTaskForm(invalidData);
          expect.fail('Should have thrown validation error');
        } catch (error: any) {
          expect(error.message).toBe('Validation failed');
          expect(error.errors).toBeDefined();
          expect(error.errors.title).toBe('Task title is required');
          expect(error.errors.type).toBeDefined();
          expect(error.errors.status).toBeDefined();
          expect(error.errors.priority).toBeDefined();
          expect(error.errors.due_date).toBe('Due date is required');
        }
      });

      it('should validate reminder business rule', async () => {
        const invalidData = {
          title: 'Task',
          type: 'call',
          due_date: '2024-12-31T10:00:00Z',
          reminder_date: '2025-01-01T10:00:00Z', // After due date
        };

        try {
          await validateTaskForm(invalidData);
          expect.fail('Should have thrown validation error');
        } catch (error: any) {
          expect(error.errors.reminder_date).toBe('Reminder must be before due date');
        }
      });
    });

    describe('validateCreateTask', () => {
      it('should validate creation data', async () => {
        const validData = {
          title: 'New Task',
          type: 'email',
          due_date: '2024-12-31T10:00:00Z',
        };

        await expect(validateCreateTask(validData)).resolves.toBeUndefined();
      });

      it('should reject incomplete creation data', async () => {
        const incompleteData = {
          title: 'New Task',
          type: 'meeting',
          // Missing due_date
        };

        try {
          await validateCreateTask(incompleteData);
          expect.fail('Should have thrown validation error');
        } catch (error: any) {
          expect(error.message).toBe('Validation failed');
          expect(error.errors.due_date).toBeDefined();
        }
      });
    });

    describe('validateUpdateTask', () => {
      it('should validate update data', async () => {
        const validData = {
          id: 'task-123',
          title: 'Updated Task',
          status: 'completed',
        };

        await expect(validateUpdateTask(validData)).resolves.toBeUndefined();
      });

      it('should reject update without id', async () => {
        const invalidData = {
          title: 'Updated Task',
        };

        try {
          await validateUpdateTask(invalidData);
          expect.fail('Should have thrown validation error');
        } catch (error: any) {
          expect(error.message).toBe('Validation failed');
          expect(error.errors.id).toBeDefined();
        }
      });
    });
  });

  describe('Business Rules', () => {
    it('should enforce reminder before due date rule', () => {
      const testCases = [
        {
          due_date: '2024-12-31T10:00:00Z',
          reminder_date: '2024-12-30T10:00:00Z',
          shouldPass: true,
        },
        {
          due_date: '2024-12-31T10:00:00Z',
          reminder_date: '2024-12-31T09:00:00Z',
          shouldPass: true,
        },
        {
          due_date: '2024-12-31T10:00:00Z',
          reminder_date: '2024-12-31T10:00:00Z',
          shouldPass: false, // Same time
        },
        {
          due_date: '2024-12-31T10:00:00Z',
          reminder_date: '2025-01-01T10:00:00Z',
          shouldPass: false, // After
        },
      ];

      testCases.forEach(({ due_date, reminder_date, shouldPass }) => {
        const data = {
          title: 'Test Task',
          type: 'call',
          due_date,
          reminder_date,
        };

        if (shouldPass) {
          expect(() => taskSchema.parse(data)).not.toThrow();
        } else {
          expect(() => taskSchema.parse(data)).toThrow(z.ZodError);
        }
      });
    });

    it('should handle task status transitions', () => {
      const statusTransitions = [
        { from: 'pending', to: 'in_progress' },
        { from: 'in_progress', to: 'completed' },
        { from: 'in_progress', to: 'deferred' },
        { from: 'pending', to: 'cancelled' },
        { from: 'deferred', to: 'pending' },
      ];

      // Schema should accept all valid statuses
      statusTransitions.forEach(({ to }) => {
        const task = {
          title: 'Test Task',
          type: 'call',
          due_date: '2024-12-31T10:00:00Z',
          status: to,
        };

        expect(() => taskSchema.parse(task)).not.toThrow();
      });
    });

    it('should validate priority levels', () => {
      const priorities = ['low', 'medium', 'high', 'urgent'];

      priorities.forEach(priority => {
        const task = {
          title: 'Priority Task',
          type: 'todo',
          due_date: '2024-12-31T10:00:00Z',
          priority,
        };

        expect(() => taskSchema.parse(task)).not.toThrow();
      });
    });

    it('should handle task associations with entities', () => {
      const taskWithMultipleAssociations = {
        title: 'Multi-Entity Task',
        type: 'meeting',
        due_date: '2024-12-31T10:00:00Z',
        contact_id: 'contact-123',
        company_id: 'company-456',
        opportunity_id: 'opp-789',
        assigned_to_id: 'user-999',
      };

      const result = taskSchema.parse(taskWithMultipleAssociations);
      expect(result.contact_id).toBe('contact-123');
      expect(result.company_id).toBe('company-456');
      expect(result.opportunity_id).toBe('opp-789');
      expect(result.assigned_to_id).toBe('user-999');
    });

    it('should handle recurring tasks', () => {
      const recurringTask = {
        title: 'Weekly Meeting',
        type: 'meeting',
        due_date: '2024-12-31T10:00:00Z',
        recurrence_pattern: 'weekly',
        recurrence_end_date: '2025-12-31T10:00:00Z',
      };

      expect(() => taskSchema.parse(recurringTask)).not.toThrow();
    });
  });

  describe('Error Message Formatting', () => {
    it('should provide clear error messages', async () => {
      const testCases = [
        {
          data: { title: '', type: 'call', due_date: '2024-12-31T10:00:00Z' },
          expectedError: 'Task title is required',
          field: 'title'
        },
        {
          data: { title: 'Test', type: 'call', due_date: '' },
          expectedError: 'Due date is required',
          field: 'due_date'
        },
        {
          data: {
            title: 'Test',
            type: 'call',
            due_date: '2024-12-31T10:00:00Z',
            reminder_date: '2025-01-01T10:00:00Z'
          },
          expectedError: 'Reminder must be before due date',
          field: 'reminder_date'
        },
      ];

      for (const { data, expectedError, field } of testCases) {
        try {
          await validateTaskForm(data);
          if (expectedError) {
            expect.fail(`Should have thrown error for field: ${field}`);
          }
        } catch (error: any) {
          expect(error.errors[field]).toBe(expectedError);
        }
      }
    });
  });
});