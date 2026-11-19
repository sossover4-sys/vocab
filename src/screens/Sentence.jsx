// משחק "השלמת משפט": משפט באנגלית עם מילה חסרה, ובוחרים אחת מ-4 אפשרויות.
// תשובה שגויה לא משנה צבע – המילה רק חוזרת לחזרה מחר (כמו במשחק ההתאמה).

import { useMemo, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import { makeQuestion, splitSentence } from '../logic/sentences.js';
import { displayEn } from '../logic/words.js';
import SpeakButton from '../components/SpeakButton.jsx';
import { speakWithGap } from '../logic/speech.js';
import { playSound } from '../logic/sound.js';
import { useVoices } from '../logic/useVoices.js';

export default function Sentence({ ids, onAgain, onDone }) {
  const { wordsById, matchResult, celebrate, progress } = useApp();
  const { speechRate, voiceEn } = progress.settings;
  const enVoices = useVoices('en');
  const questions = useMemo(() => ids.map((id) => makeQuestion(id)), [ids]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [wrong, setWrong] = useState([]);

  if (index >= questions.length) {
    const right = questions.length - wrong.length;
    return (
      <div className="summary">
        <div className="summary-emoji" aria-hidden="true">{wrong.length === 0 ? '🏆' : right >= wrong.length ? '💪' : '🌱'}</div>
        <h1>
          {right} מתוך {questions.length} נכון
        </h1>
        {wrong.length > 0 && (
          <>
            <p className="muted">המילים שטעית בהן יחזרו לחזרה מחר (הצבע לא משתנה):</p>
            <ul className="summary-list">
              {wrong.map((id) => (
                <li key={id}>
                  <span className="dot red" />
                  <span dir="ltr" lang="en">{displayEn(wordsById[id])}</span>
                  <span className="muted">{wordsById[id].he[0]}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <button type="button" className="btn primary big" onClick={onAgain}>
          עוד משפטים
        </button>
        <button type="button" className="btn big ghost" onClick={onDone}>
          סיום
        </button>
      </div>
    );
  }

  const q = questions[index];
  const word = wordsById[q.id];
  const [before, after] = splitSentence(q.sentence);
  const answered = picked !== null;
  const correct = picked === q.id;

  const choose = (id) => {
    if (answered) return;
    setPicked(id);
    const isWrong = id !== q.id;
    if (isWrong) setWrong((w) => [...w, q.id]);
    if (progress.settings.sound) playSound(isWrong ? 'wrong' : 'right');
    matchResult(1, isWrong ? [q.id] : []);
    const last = index === questions.length - 1;
    if (last && !isWrong && wrong.length === 0) celebrate('perfect');
  };

  const next = () => {
    setPicked(null);
    setIndex((i) => i + 1);
  };

  return (
    <div className="sentence-game">
      <div className="round-top">
        <button type="button" className="link-btn" onClick={onDone}>
          ✕ יציאה
        </button>
        <span className="round-count" dir="ltr">
          {index + 1} / {questions.length}
        </span>
      </div>
      <div className="round-progress">
        <div style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>

      <p className="muted hint">בחר את המילה שמשלימה את המשפט בצורה הטובה ביותר:</p>
      <div className="sentence-card" key={index}>
        <p className="sentence" dir="ltr" lang="en">
          {before}
          <span className={`blank ${answered ? 'right' : ''}`}>{answered ? word.en : ' '}</span>
          {after}
        </p>
        {answered ? (
          <SpeakButton text={q.sentence.replace('___', word.en)} lang="en" />
        ) : (
          // לפני תשובה: מקריא עד המילה החסרה, תו פסנתר שקט ועצירה קצרה, וממשיך
          enVoices.length > 0 && (
            <button
              type="button"
              className="speak-btn"
              aria-label="השמע את המשפט"
              onClick={() => speakWithGap(before, after, { rate: speechRate, voiceName: voiceEn }, () => playSound('gap'))}
            >
              🔊
            </button>
          )
        )}
      </div>

      <div className="options" dir="ltr">
        {q.options.map((id, i) => {
          const w = wordsById[id];
          const letter = <span className="option-letter">{String.fromCharCode(65 + i)}</span>;
          if (!answered) {
            return (
              <button key={id} type="button" className="option" onClick={() => choose(id)}>
                {letter}
                <span lang="en">{w.en}</span>
              </button>
            );
          }
          // אחרי תשובה: לכל אפשרות – תרגום ורמקול
          const cls = id === q.id ? 'right' : id === picked ? 'wrong' : 'other';
          return (
            <div key={id} className={`option answered ${cls}`}>
              {letter}
              <span className="option-en" lang="en">
                {w.en}
                <SpeakButton text={displayEn(w)} lang="en" className="mini-speak" />
              </span>
              <span className="option-he" dir="rtl" lang="he">
                {w.he.slice(0, 2).join(', ')}
              </span>
            </div>
          );
        })}
      </div>

      {answered && (
        <div className="sentence-feedback">
          <p className={correct ? 'good' : 'bad'}>{correct ? '✓ נכון!' : `✗ התשובה: ${word.en} – ${word.he.join(', ')}`}</p>
          <button type="button" className="btn primary big" onClick={next} autoFocus>
            {index === questions.length - 1 ? 'לסיכום' : 'הבא ←'}
          </button>
        </div>
      )}
    </div>
  );
}
