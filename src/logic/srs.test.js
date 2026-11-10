import { describe, it, expect } from 'vitest';
import { rate, demote, pickRound, summarize, newToday } from './srs.js';
import { addDays, daysBetween } from './dates.js';

const DAY = '2026-11-10';
const noShuffle = () => 0.999; // shuffle משאיר את הסדר כמעט קבוע; בודקים קבוצות, לא סדר

describe('dates', () => {
  it('מוסיף ימים גם מעבר לחודש', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(daysBetween('2026-11-10', '2026-11-14')).toBe(4);
  });
});

describe('rate', () => {
  it('אדום חוזר מחר, צהוב בעוד יומיים', () => {
    expect(rate(null, 'red', DAY).due).toBe('2026-11-11');
    expect(rate(null, 'yellow', DAY).due).toBe('2026-11-12');
  });
  it('ירוק ברצף מגדיל את המרווח: 4, 8, 16, 30, 60, 60', () => {
    let s = null;
    const gaps = [];
    for (let i = 0; i < 6; i++) {
      s = rate(s, 'green', DAY);
      gaps.push(daysBetween(DAY, s.due));
    }
    expect(gaps).toEqual([4, 8, 16, 30, 60, 60]);
  });
  it('צהוב או אדום מאפסים את הרצף', () => {
    let s = rate(rate(null, 'green', DAY), 'green', DAY);
    s = rate(s, 'yellow', DAY);
    expect(s.streak).toBe(0);
    expect(daysBetween(DAY, rate(s, 'green', DAY).due)).toBe(4);
  });
  it('שומר מתי המילה נראתה לראשונה וסופר צפיות', () => {
    const s = rate(rate(null, 'red', DAY), 'green', '2026-11-11');
    expect(s.firstSeen).toBe(DAY);
    expect(s.seen).toBe(2);
  });
});

describe('demote', () => {
  it('ירוק → צהוב → אדום → אדום', () => {
    let s = rate(null, 'green', DAY);
    s = demote(s, DAY);
    expect(s.color).toBe('yellow');
    s = demote(s, DAY);
    expect(s.color).toBe('red');
    expect(demote(s, DAY).color).toBe('red');
  });
});

describe('pickRound', () => {
  const ids = ['a', 'b', 'c', 'd', 'e', 'f'];

  it('מתחיל ממילים שהגיע זמנן, אדום לפני ירוק', () => {
    const states = {
      a: { ...rate(null, 'green', '2026-11-01'), due: DAY },
      b: { ...rate(null, 'red', '2026-11-01'), due: DAY },
      c: { ...rate(null, 'green', DAY) }, // עוד לא הגיע זמנה
    };
    const round = pickRound(ids, states, { size: 2, dailyNew: 0 }, DAY, noShuffle);
    expect(round.sort()).toEqual(['a', 'b']);
  });

  it('משלים במילים חדשות עד המכסה היומית', () => {
    const round = pickRound(ids, {}, { size: 8, dailyNew: 3 }, DAY, noShuffle);
    expect(round.sort()).toEqual(['a', 'b', 'c']);
  });

  it('לא עובר את המכסה היומית של חדשות', () => {
    const states = { a: rate(null, 'green', DAY), b: rate(null, 'green', DAY) };
    expect(newToday(states, DAY)).toBe(2);
    const round = pickRound(ids, states, { size: 8, dailyNew: 3 }, DAY, noShuffle);
    // רק מילה חדשה אחת נשארה במכסה, ואז ממלאים במילים שעוד לא הגיע זמנן
    expect(round.filter((id) => !states[id])).toHaveLength(1);
    expect(round).toContain('a');
  });

  it('לא מחזיר יותר מגודל הסבב ולא כפילויות', () => {
    const round = pickRound(ids, {}, { size: 4, dailyNew: 50 }, DAY);
    expect(round).toHaveLength(4);
    expect(new Set(round).size).toBe(4);
  });
});

describe('summarize', () => {
  it('סופר לפי צבע ומילים לחזרה', () => {
    const states = { a: { ...rate(null, 'red', '2026-11-01') }, b: rate(null, 'green', DAY) };
    expect(summarize(['a', 'b', 'c'], states, DAY)).toEqual({ new: 1, red: 1, yellow: 0, green: 1, due: 1 });
  });
});
