/**
 * Tests for activity type auto-detection logic
 *
 * Feature: Dashboard Quick Actions
 * Design: docs/plans/2025-11-10-dashboard-quick-actions-design.md
 *
 * The auto-detection function infers activity type from task title keywords
 * to pre-populate the activity type dropdown in the quick actions modal.
 */

import { describe, it, expect } from 'vitest';
import { inferActivityTypeFromTaskTitle } from '../activityTypeDetection';

describe('inferActivityTypeFromTaskTitle', () => {
  describe('Call detection', () => {
    it('detects "call" keyword as call activity', () => {
      expect(inferActivityTypeFromTaskTitle('Call about pricing')).toBe('call');
    });

    it('detects "Call" with capital C as call activity', () => {
      expect(inferActivityTypeFromTaskTitle('Call chef John')).toBe('call');
    });

    it('detects "call" in middle of title as call activity', () => {
      expect(inferActivityTypeFromTaskTitle('Follow up call about delivery')).toBe('call');
    });

    it('detects "phone" keyword as call activity', () => {
      expect(inferActivityTypeFromTaskTitle('Phone the buyer')).toBe('call');
    });
  });

  describe('Email detection', () => {
    it('detects "email" keyword as email activity', () => {
      expect(inferActivityTypeFromTaskTitle('Send email about proposal')).toBe('email');
    });

    it('detects "Email" with capital E as email activity', () => {
      expect(inferActivityTypeFromTaskTitle('Email pricing quote')).toBe('email');
    });

    it('detects "e-mail" with hyphen as email activity', () => {
      expect(inferActivityTypeFromTaskTitle('Send e-mail follow-up')).toBe('email');
    });
  });

  describe('Meeting detection', () => {
    it('detects "meeting" keyword as meeting activity', () => {
      expect(inferActivityTypeFromTaskTitle('Schedule meeting with buyer')).toBe('meeting');
    });

    it('detects "demo" keyword as meeting activity', () => {
      expect(inferActivityTypeFromTaskTitle('Product demo for chef')).toBe('meeting');
    });

    it('detects "presentation" keyword as meeting activity', () => {
      expect(inferActivityTypeFromTaskTitle('Give presentation to team')).toBe('meeting');
    });

    it('detects "appointment" keyword as meeting activity', () => {
      expect(inferActivityTypeFromTaskTitle('Appointment with distributor')).toBe('meeting');
    });
  });

  describe('Default behavior', () => {
    it('returns "check_in" for generic task without keywords', () => {
      expect(inferActivityTypeFromTaskTitle('Follow up on proposal')).toBe('check_in');
    });

    it('returns "check_in" for empty string', () => {
      expect(inferActivityTypeFromTaskTitle('')).toBe('check_in');
    });

    it('returns "check_in" for task about deliveries', () => {
      expect(inferActivityTypeFromTaskTitle('Check delivery status')).toBe('check_in');
    });

    it('returns "check_in" for task about paperwork', () => {
      expect(inferActivityTypeFromTaskTitle('Review contract terms')).toBe('check_in');
    });
  });

  describe('Edge cases', () => {
    it('handles title with multiple keywords - first match wins', () => {
      // "call" appears before "email"
      expect(inferActivityTypeFromTaskTitle('Call before sending email')).toBe('call');
    });

    it('is case-insensitive', () => {
      expect(inferActivityTypeFromTaskTitle('CALL ABOUT PRICING')).toBe('call');
      expect(inferActivityTypeFromTaskTitle('send EMAIL')).toBe('email');
      expect(inferActivityTypeFromTaskTitle('MEETING with chef')).toBe('meeting');
    });

    it('handles whitespace around keywords', () => {
      expect(inferActivityTypeFromTaskTitle('  call  ')).toBe('call');
      expect(inferActivityTypeFromTaskTitle('  email  ')).toBe('email');
      expect(inferActivityTypeFromTaskTitle('\tmeeting\t')).toBe('meeting');
    });

    it('does not match partial words', () => {
      // "recall" contains "call" but should not match
      expect(inferActivityTypeFromTaskTitle('Recall product batch')).toBe('check_in');

      // "female" contains "email" but should not match
      expect(inferActivityTypeFromTaskTitle('Contact female buyer')).toBe('check_in');
    });
  });
});
