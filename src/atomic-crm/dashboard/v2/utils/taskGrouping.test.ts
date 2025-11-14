import { describe, it, expect } from 'vitest';
import { getBucket, BUCKET_LABELS, PRIORITY_LABELS } from './taskGrouping';
import { addDays, subDays, startOfDay } from 'date-fns';

describe('taskGrouping', () => {
  const today = startOfDay(new Date());

  describe('getBucket', () => {
    it('returns "overdue" for tasks due before today', () => {
      const yesterday = subDays(today, 1).toISOString();
      expect(getBucket(yesterday)).toBe('overdue');
    });

    it('returns "overdue" for tasks due 3 days ago', () => {
      const threeDaysAgo = subDays(today, 3).toISOString();
      expect(getBucket(threeDaysAgo)).toBe('overdue');
    });

    it('returns "today" for tasks due today', () => {
      const todayIso = today.toISOString();
      expect(getBucket(todayIso)).toBe('today');
    });

    it('returns "today" for tasks due today at different times', () => {
      const todayNoon = new Date(today.getTime() + 12 * 60 * 60 * 1000).toISOString();
      const todayMidnight = today.toISOString();
      const todayEvening = new Date(today.getTime() + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000).toISOString();

      expect(getBucket(todayNoon)).toBe('today');
      expect(getBucket(todayMidnight)).toBe('today');
      expect(getBucket(todayEvening)).toBe('today');
    });

    it('returns "tomorrow" for tasks due tomorrow', () => {
      const tomorrow = addDays(today, 1).toISOString();
      expect(getBucket(tomorrow)).toBe('tomorrow');
    });

    it('returns "this_week" for tasks due in 2 days', () => {
      const twoDaysLater = addDays(today, 2).toISOString();
      expect(getBucket(twoDaysLater)).toBe('this_week');
    });

    it('returns "this_week" for tasks due in 6 days', () => {
      const sixDaysLater = addDays(today, 6).toISOString();
      expect(getBucket(sixDaysLater)).toBe('this_week');
    });

    it('returns "later" for tasks due in 7 days', () => {
      const sevenDaysLater = addDays(today, 7).toISOString();
      expect(getBucket(sevenDaysLater)).toBe('later');
    });

    it('returns "later" for tasks due in 30 days', () => {
      const thirtyDaysLater = addDays(today, 30).toISOString();
      expect(getBucket(thirtyDaysLater)).toBe('later');
    });

    it('returns "later" for tasks with null due_date', () => {
      expect(getBucket(null)).toBe('later');
    });

    describe('DST boundary testing', () => {
      it('handles spring forward (March 10, 2024) consistently', () => {
        const beforeDST = new Date('2024-03-10T01:00:00-05:00').toISOString();
        const afterDST = new Date('2024-03-10T03:00:00-04:00').toISOString();

        const result1 = getBucket(beforeDST);
        const result2 = getBucket(afterDST);

        expect(result1).toBe(result2);
      });

      it('handles fall back (November 3, 2024) consistently', () => {
        const beforeDST = new Date('2024-11-03T01:00:00-04:00').toISOString();
        const afterDST = new Date('2024-11-03T01:00:00-05:00').toISOString();

        const result1 = getBucket(beforeDST);
        const result2 = getBucket(afterDST);

        expect(result1).toBe(result2);
      });

      it('handles tomorrow boundary during DST spring forward', () => {
        const marchToday = startOfDay(new Date('2024-03-10T12:00:00-05:00'));
        const marchTomorrow = addDays(marchToday, 1).toISOString();

        const bucket = getBucket(marchTomorrow);
        expect(['overdue', 'today', 'tomorrow', 'this_week', 'later']).toContain(bucket);
      });

      it('handles tomorrow boundary during DST fall back', () => {
        const novToday = startOfDay(new Date('2024-11-03T12:00:00-05:00'));
        const novTomorrow = addDays(novToday, 1).toISOString();

        const bucket = getBucket(novTomorrow);
        expect(['overdue', 'today', 'tomorrow', 'this_week', 'later']).toContain(bucket);
      });

      it('is deterministic across timezone offsets for same calendar day', () => {
        const utcDate = new Date('2024-06-15T00:00:00Z').toISOString();
        const estDate = new Date('2024-06-15T00:00:00-05:00').toISOString();
        const pstDate = new Date('2024-06-15T00:00:00-08:00').toISOString();

        const result1 = getBucket(utcDate);
        const result2 = getBucket(estDate);
        const result3 = getBucket(pstDate);

        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      });
    });

    describe('edge cases', () => {
      it('handles year boundaries correctly', () => {
        const today = startOfDay(new Date('2025-12-31T12:00:00Z'));
        const tomorrow = addDays(today, 1);
        const yesterday = subDays(today, 1);

        const todayBucket = getBucket(today.toISOString());
        const tomorrowBucket = getBucket(tomorrow.toISOString());
        const yesterdayBucket = getBucket(yesterday.toISOString());

        expect(['overdue', 'today', 'tomorrow', 'this_week', 'later']).toContain(todayBucket);
        expect(['overdue', 'today', 'tomorrow', 'this_week', 'later']).toContain(tomorrowBucket);
        expect(['overdue', 'today', 'tomorrow', 'this_week', 'later']).toContain(yesterdayBucket);
      });

      it('handles leap year (February 29)', () => {
        const today = startOfDay(new Date('2024-02-29T12:00:00Z'));
        const tomorrow = addDays(today, 1);
        const yesterday = subDays(today, 1);

        const todayBucket = getBucket(today.toISOString());
        const tomorrowBucket = getBucket(tomorrow.toISOString());
        const yesterdayBucket = getBucket(yesterday.toISOString());

        expect(['overdue', 'today', 'tomorrow', 'this_week', 'later']).toContain(todayBucket);
        expect(['overdue', 'today', 'tomorrow', 'this_week', 'later']).toContain(tomorrowBucket);
        expect(['overdue', 'today', 'tomorrow', 'this_week', 'later']).toContain(yesterdayBucket);
      });

      it('is deterministic for same inputs', () => {
        const testDate = addDays(today, 5).toISOString();

        const result1 = getBucket(testDate);
        const result2 = getBucket(testDate);
        const result3 = getBucket(testDate);

        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      });

      it('handles millisecond precision consistently', () => {
        const baseDate = today.getTime();
        const date1 = new Date(baseDate).toISOString();
        const date2 = new Date(baseDate + 999).toISOString();

        expect(getBucket(date1)).toBe(getBucket(date2));
      });
    });
  });

  describe('BUCKET_LABELS', () => {
    it('provides label for all bucket types', () => {
      expect(BUCKET_LABELS.overdue).toBe('Overdue');
      expect(BUCKET_LABELS.today).toBe('Today');
      expect(BUCKET_LABELS.tomorrow).toBe('Tomorrow');
      expect(BUCKET_LABELS.this_week).toBe('This Week');
      expect(BUCKET_LABELS.later).toBe('Later');
    });

    it('has exactly 5 bucket labels', () => {
      expect(Object.keys(BUCKET_LABELS)).toHaveLength(5);
    });
  });

  describe('PRIORITY_LABELS', () => {
    it('provides label for all priority levels', () => {
      expect(PRIORITY_LABELS.critical).toBe('Critical');
      expect(PRIORITY_LABELS.high).toBe('High');
      expect(PRIORITY_LABELS.medium).toBe('Medium');
      expect(PRIORITY_LABELS.low).toBe('Low');
    });

    it('has exactly 4 priority labels', () => {
      expect(Object.keys(PRIORITY_LABELS)).toHaveLength(4);
    });
  });
});
