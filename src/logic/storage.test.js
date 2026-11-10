import { describe, it, expect } from 'vitest';
import { emptyProgress, migrate, merge, parseBackup, VERSION } from './storage.js';

describe('migrate', () => {
  it('נתונים ריקים או פגומים → התקדמות ריקה', () => {
    expect(migrate(null)).toEqual(emptyProgress());
  });
  it('משלים הגדרות חסרות בלי למחוק מילים', () => {
    const out = migrate({ words: { a: { color: 'red' } }, settings: { roundSize: 12 } });
    expect(out.version).toBe(VERSION);
    expect(out.words.a.color).toBe('red');
    expect(out.settings.roundSize).toBe(12);
    expect(out.settings.dailyNew).toBe(10);
  });
});

describe('merge', () => {
  it('לכל מילה נשמר מה שעודכן אחרון', () => {
    const pc = { words: { a: { color: 'green', updatedAt: 200 }, b: { color: 'red', updatedAt: 100 } } };
    const phone = { words: { a: { color: 'red', updatedAt: 100 }, b: { color: 'yellow', updatedAt: 300 }, c: { color: 'red', updatedAt: 50 } } };
    const out = merge(pc, phone);
    expect(out.words.a.color).toBe('green');
    expect(out.words.b.color).toBe('yellow');
    expect(out.words.c.color).toBe('red');
  });
  it('ממזג גם תיקוני תגים והגדרות', () => {
    const a = { words: {}, tagOverrides: { x: { level: 1, updatedAt: 1 } }, settings: { roundSize: 8, updatedAt: 5 } };
    const b = { words: {}, tagOverrides: { x: { level: 3, updatedAt: 2 } }, settings: { roundSize: 12, updatedAt: 1 } };
    const out = merge(a, b);
    expect(out.tagOverrides.x.level).toBe(3);
    expect(out.settings.roundSize).toBe(8);
  });
});

describe('parseBackup', () => {
  it('דוחה קובץ שאינו גיבוי', () => {
    expect(() => parseBackup('{"hello":1}')).toThrow();
    expect(() => parseBackup('not json')).toThrow();
  });
  it('מקבל גיבוי תקין', () => {
    expect(parseBackup(JSON.stringify({ words: { a: { color: 'red' } } })).words.a.color).toBe('red');
  });
});
