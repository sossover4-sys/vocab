import { describe, it, expect } from 'vitest';
import { SENTENCES, BLANK, makeQuestion, pickSentences, sentenceIds, splitSentence } from './sentences.js';
import { WORDS_BY_ID } from './words.js';

describe('sentence data', () => {
  const entries = Object.entries(SENTENCES);

  it('every sentence belongs to a real word', () => {
    for (const [id] of entries) expect(WORDS_BY_ID[id], id).toBeTruthy();
  });

  it('every sentence has exactly one blank and a known part of speech', () => {
    for (const [id, q] of entries) {
      expect(q.s.split(BLANK).length - 1, id).toBe(1);
      expect(['v', 'n', 'a', 'd'], id).toContain(q.p);
    }
  });

  it('there are enough words of each part of speech for 3 distractors', () => {
    for (const [id] of entries) expect(makeQuestion(id).options, id).toHaveLength(4);
  });

  it('exclusion lists point to real sentence words', () => {
    for (const [id, q] of entries) for (const x of q.x || []) expect(SENTENCES[x], `${id} → ${x}`).toBeTruthy();
  });
});

describe('sentence game', () => {
  it('a question has the answer, no excluded words, and the same part of speech', () => {
    for (let i = 0; i < 30; i++) {
      const q = makeQuestion('despair');
      expect(q.options).toContain('despair');
      expect(q.options).not.toContain('grief');
      for (const o of q.options) expect(SENTENCES[o].p).toBe('n');
      expect(new Set(q.options).size).toBe(4);
    }
  });

  it('picks only words that have sentences', () => {
    const pool = ['account', 'abolish', 'absorb'];
    expect(sentenceIds(pool)).toEqual(['abolish', 'absorb']);
    const ids = pickSentences(pool, {}, { n: 5, mode: 'mixed' }, '2026-11-18');
    expect(ids.sort()).toEqual(['abolish', 'absorb']);
  });

  it('splits around the blank', () => {
    expect(splitSentence('I ___ you.')).toEqual(['I ', ' you.']);
  });
});
