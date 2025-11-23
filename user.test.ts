import { describe, it, expect } from 'vitest';
import { formatUserName, type User } from './user';

describe('formatUserName', () => {
  it('should format a user name with first and last names', () => {
    const user: User = {
      firstName: 'John',
      lastName: 'Doe',
    };
    expect(formatUserName(user)).toBe('John Doe');
  });

  it('should include the title when provided', () => {
    const user: User = {
      firstName: 'Jane',
      lastName: 'Smith',
      title: 'Dr.',
    };
    expect(formatUserName(user)).toBe('Dr. Jane Smith');
  });

  it('should return "Unknown User" if first name is missing', () => {
    const user = {
      lastName: 'Doe',
    } as User;
    expect(formatUserName(user)).toBe('Unknown User');
  });

  it('should return "Unknown User" if last name is missing', () => {
    const user = {
      firstName: 'John',
    } as User;
    expect(formatUserName(user)).toBe('Unknown User');
  });
});