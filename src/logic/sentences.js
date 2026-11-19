// משחק השלמת משפט (כמו בפסיכומטרי): משפט עם ___ וארבע אפשרויות באנגלית.
// המסיחים (התשובות השגויות) נבחרים ממילים מאותו חלק דיבר, כדי שכולן "יישמעו" נכון דקדוקית.

import data from '../data/sentences.json';
import { pickRound, shuffle } from './srs.js';

const { _info, ...SENTENCES } = data;
export { SENTENCES };

export const BLANK = '___';

/** המילים שיש להן משפט, מתוך המאגר הנבחר */
export function sentenceIds(poolIds) {
  return poolIds.filter((id) => SENTENCES[id]);
}

/** בוחר מילים למשחק לפי אותו "מצב" כמו הכרטיסיות (חכם / רק חדשות / מעורבב) */
export function pickSentences(poolIds, wordStates, { n = 10, dailyNew = 10, mode = 'smart' } = {}, day, random = Math.random) {
  return pickRound(sentenceIds(poolIds), wordStates, { size: n, dailyNew, mode }, day, random);
}

/** שאלה אחת: המשפט, והאפשרויות (התשובה הנכונה + 3 מסיחים) בסדר אקראי */
export function makeQuestion(id, random = Math.random) {
  const q = SENTENCES[id];
  const banned = new Set([id, ...(q.x || [])]);
  const candidates = Object.keys(SENTENCES).filter(
    (other) => !banned.has(other) && SENTENCES[other].p === q.p && !(SENTENCES[other].x || []).includes(id),
  );
  const distractors = shuffle(candidates, random).slice(0, 3);
  return { id, sentence: q.s, options: shuffle([id, ...distractors], random) };
}

/** מחלק את המשפט לחלק שלפני ואחרי המילה החסרה */
export function splitSentence(sentence) {
  const i = sentence.indexOf(BLANK);
  return [sentence.slice(0, i), sentence.slice(i + BLANK.length)];
}
