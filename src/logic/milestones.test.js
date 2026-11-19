import { describe, it, expect } from 'vitest';
import { countGreen, milestoneFor, newMilestone, goalReached } from './milestones.js';
import { migrate } from './storage.js';

describe('milestones', () => {
  it('counts green words', () => {
    expect(countGreen({ a: { color: 'green' }, b: { color: 'red' }, c: { color: 'green' } })).toBe(2);
    expect(countGreen()).toBe(0);
  });

  it('finds the highest milestone reached', () => {
    expect(milestoneFor(0)).toBe(0);
    expect(milestoneFor(24)).toBe(0);
    expect(milestoneFor(25)).toBe(25);
    expect(milestoneFor(130)).toBe(100);
  });

  it('celebrates only when crossing a new milestone', () => {
    expect(newMilestone(99, 100, 50)).toBe(100);
    expect(newMilestone(100, 101, 100)).toBeNull(); // כבר עברנו
    expect(newMilestone(100, 99, 50)).toBeNull(); // ירידה
    // ירדנו מתחת ל-100 ועלינו שוב – לא חוגגים פעמיים
    expect(newMilestone(99, 100, 100)).toBeNull();
  });

  it('daily goal fires once a day', () => {
    expect(goalReached(19, 20, 20, '', '2026-11-18')).toBe(true);
    expect(goalReached(20, 21, 20, '', '2026-11-18')).toBe(false);
    expect(goalReached(19, 20, 20, '2026-11-18', '2026-11-18')).toBe(false);
  });

  it('existing users do not get a celebration for milestones they already passed', () => {
    const words = Object.fromEntries(Array.from({ length: 120 }, (_, i) => [`w${i}`, { color: 'green' }]));
    const p = migrate({ version: 2, words });
    expect(p.celebrated.greens).toBe(100);
  });
});
