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
    it('detects "call" keyword as Call activity', () => {
      expect(inferActivityTypeFromTaskTitle('Call about pricing')).toBe('Call');
    });

    it('detects "Call" with capital C as Call activity', () => {
      expect(inferActivityTypeFromTaskTitle('Call chef John')).toBe('Call');
    });

    it('detects "call" in middle of title as Call activity', () => {
      expect(inferActivityTypeFromTaskTitle('Follow up call about delivery')).toBe('Call');
    });

    it('detects "phone" keyword as Call activity', () => {
      expect(inferActivityTypeFromTaskTitle('Phone the buyer')).toBe('Call');
    });
  });

  describe('Email detection', () => {
    it('detects "email" keyword as Email activity', () => {
      expect(inferActivityTypeFromTaskTitle('Send email about proposal')).toBe('Email');
    });

    it('detects "Email" with capital E as Email activity', () => {
      expect(inferActivityTypeFromTaskTitle('Email pricing quote')).toBe('Email');
    });

    it('detects "e-mail" with hyphen as Email activity', () => {
      expect(inferActivityTypeFromTaskTitle('Send e-mail follow-up')).toBe('Email');
    });
  });

  describe('Meeting detection', () => {
    it('detects "meeting" keyword as Meeting activity', () => {
      expect(inferActivityTypeFromTaskTitle('Schedule meeting with buyer')).toBe('Meeting');
    });

    it('detects "demo" keyword as Meeting activity', () => {
      expect(inferActivityTypeFromTaskTitle('Product demo for chef')).toBe('Meeting');
    });

    it('detects "presentation" keyword as Meeting activity', () => {
      expect(inferActivityTypeFromTaskTitle('Give presentation to team')).toBe('Meeting');
    });

    it('detects "appointment" keyword as Meeting activity', () => {
      expect(inferActivityTypeFromTaskTitle('Appointment with distributor')).toBe('Meeting');
    });
  });

  describe('Default behavior', () => {
    it('returns "Note" for generic task without keywords', () => {
      expect(inferActivityTypeFromTaskTitle('Follow up on proposal')).toBe('Note');
    });

    it('returns "Note" for empty string', () => {
      expect(inferActivityTypeFromTaskTitle('')).toBe('Note');
    });

    it('returns "Note" for task about deliveries', () => {
      expect(inferActivityTypeFromTaskTitle('Check delivery status')).toBe('Note');
    });

    it('returns "Note" for task about paperwork', () => {
      expect(inferActivityTypeFromTaskTitle('Review contract terms')).toBe('Note');
    });
  });

  describe('Edge cases', () => {
    it('handles title with multiple keywords - first match wins', () => {
      // "call" appears before "email"
      expect(inferActivityTypeFromTaskTitle('Call before sending email')).toBe('Call');
    });

    it('is case-insensitive', () => {
      expect(inferActivityTypeFromTaskTitle('CALL ABOUT PRICING')).toBe('Call');
      expect(inferActivityTypeFromTaskTitle('send EMAIL')).toBe('Email');
      expect(inferActivityTypeFromTaskTitle('MEETING with chef')).toBe('Meeting');
    });

    it('handles whitespace around keywords', () => {
      expect(inferActivityTypeFromTaskTitle('  call  ')).toBe('Call');
      expect(inferActivityTypeFromTaskTitle('\\temail\\t')).toBe('Email');
    });

    it('does not match partial words', () => {
      // "recall" contains "call" but should not match
      expect(inferActivityTypeFromTaskTitle('Recall product batch')).toBe('Note');

      // "female" contains "email" but should not match
      expect(inferActivityTypeFromTaskTitle('Contact female buyer')).toBe('Note');
    });
  });
});
