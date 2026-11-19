import { describe, it, expect } from 'vitest';
import { rate, reviewSoon } from './srs.js';

describe('a mistake in a game', () => {
  const day = '2026-11-19';

  it('keeps the color and streak, and brings the word back tomorrow', () => {
    const green = rate(rate(undefined, 'green', '2026-11-10', 1), 'green', '2026-11-18', 2); // due 2026-11-26
    const after = reviewSoon(green, day, 3);
    expect(after.color).toBe('green');
    expect(after.streak).toBe(green.streak);
    expect(after.seen).toBe(green.seen);
    expect(after.due).toBe('2026-11-20');
  });

  it('does not push a word that is already due sooner', () => {
    const red = rate(undefined, 'red', '2026-11-18', 1); // due 2026-11-19
    expect(reviewSoon(red, day, 5)).toBe(red);
  });

  it('leaves a new word new', () => {
    expect(reviewSoon(undefined, day)).toBeUndefined();
  });
});
