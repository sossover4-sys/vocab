// מסך "כרטיסיות": סבב של כמה מילים לפי אלגוריתם החזרות.
// רואים אנגלית → לוחצים → הכרטיס מסתובב לעברית → מסמנים אדום/צהוב/ירוק.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import { WORDS, WORDS_BY_ID, LEVELS, TOPICS, displayEn, filterWords } from '../logic/words.js';
import { pickRound, summarize, newToday } from '../logic/srs.js';
import { today } from '../logic/dates.js';
import SpeakButton from '../components/SpeakButton.jsx';
import ColorButtons from '../components/ColorButtons.jsx';

const RANK = { red: 0, yellow: 1, green: 2 };

export default function Flashcards() {
  const { progress } = useApp();
  const [round, setRound] = useState(null); // null = מסך פתיחה
  const [scope, setScope] = useState({ level: '', topic: '' });

  const day = today();
  const poolIds = useMemo(() => filterWords(WORDS, scope, progress).map((w) => w.id), [scope, progress]);

  const start = () => {
    const ids = pickRound(poolIds, progress.words, progress.settings, day);
    setRound({
      queue: ids,
      index: 0,
      before: Object.fromEntries(ids.map((id) => [id, progress.words[id]?.color || 'new'])),
      results: {},
      repeated: new Set(),
    });
  };

  if (round && round.index >= round.queue.length) {
    return <Summary round={round} onAgain={start} onDone={() => setRound(null)} />;
  }
  if (round) {
    return <Round round={round} setRound={setRound} onQuit={() => setRound(null)} />;
  }

  const counts = summarize(poolIds, progress.words, day);
  const newLeft = Math.max(0, progress.settings.dailyNew - newToday(progress.words, day));
  const canStart = poolIds.length > 0;

  return (
    <>
      <h1>כרטיסיות</h1>
      <div className="card start-card">
        <div className="start-stats">
          <Stat value={counts.due} label="לחזרה היום" />
          <Stat value={Math.min(newLeft, counts.new)} label="חדשות להיום" />
          <Stat value={counts.green} label="ירוקות" />
        </div>
        <button type="button" className="btn primary big" onClick={start} disabled={!canStart}>
          התחל סבב של {progress.settings.roundSize} מילים
        </button>
        {counts.due === 0 && newLeft === 0 && canStart && (
          <p className="muted hint">סיימת את החזרות וגם את המילים החדשות של היום 🎉 אפשר להמשיך לתרגל בכל זאת.</p>
        )}
      </div>

      <h3>לתרגל רק חלק מהמילים (לא חובה)</h3>
      <div className="tag-edit">
        <select value={scope.topic} onChange={(e) => setScope((s) => ({ ...s, topic: e.target.value }))} aria-label="נושא">
          <option value="">כל הנושאים</option>
          {Object.entries(TOPICS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={scope.level} onChange={(e) => setScope((s) => ({ ...s, level: e.target.value }))} aria-label="רמה">
          <option value="">כל הרמות</option>
          {Object.entries(LEVELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      {(scope.topic || scope.level) && <p className="muted hint">{poolIds.length} מילים בבחירה הזו.</p>}
    </>
  );
}

function Stat({ value, label }) {
  return (
    <div className="stat">
      <strong>{value.toLocaleString('he-IL')}</strong>
      <span>{label}</span>
    </div>
  );
}

function Round({ round, setRound, onQuit }) {
  const { rateWord } = useApp();
  const [flipped, setFlipped] = useState(false);
  const id = round.queue[round.index];
  const word = WORDS_BY_ID[id];

  const answer = useCallback(
    (color) => {
      rateWord(id, color);
      setFlipped(false);
      setRound((r) => {
        const queue = [...r.queue];
        const repeated = new Set(r.repeated);
        // מילה אדומה חוזרת פעם אחת בסוף הסבב
        if (color === 'red' && !repeated.has(id)) {
          queue.push(id);
          repeated.add(id);
        }
        return { ...r, queue, repeated, index: r.index + 1, results: { ...r.results, [id]: color } };
      });
    },
    [id, rateWord, setRound],
  );

  // מקלדת במחשב: רווח = הפוך, 1/2/3 = אדום/צהוב/ירוק
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ['1', '2', '3'].includes(e.key)) {
        answer(['red', 'yellow', 'green'][Number(e.key) - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, answer]);

  const total = round.queue.length;
  return (
    <div className="round">
      <div className="round-top">
        <button type="button" className="link-btn" onClick={onQuit}>
          ✕ יציאה
        </button>
        <span className="muted">
          {round.index + 1} / {total}
        </span>
      </div>
      <div className="round-progress">
        <div style={{ width: `${(round.index / total) * 100}%` }} />
      </div>

      <div
        // key חדש לכל כרטיס: הכרטיס הבא מופיע ישר על צד האנגלית, בלי אנימציה שחושפת את הפירוש שלו
        key={round.index}
        className={`flashcard ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        aria-label="הפוך כרטיס"
      >
        <div className="flashcard-inner">
          <div className="face front">
            <span className="fc-en" dir="ltr" lang="en">{displayEn(word)}</span>
            <SpeakButton text={displayEn(word)} lang="en" />
            <span className="muted fc-hint">לחץ כדי לראות פירוש</span>
          </div>
          <div className="face back">
            <span className="fc-en-small" dir="ltr" lang="en">{displayEn(word)}</span>
            <ul className="fc-meanings">
              {word.he.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <SpeakButton text={word.he.join(', ')} lang="he" />
          </div>
        </div>
      </div>

      <div className={`answer-area ${flipped ? 'show' : ''}`}>
        {flipped ? (
          <ColorButtons onPick={answer} />
        ) : (
          <button type="button" className="btn big" onClick={() => setFlipped(true)}>
            הצג פירוש
          </button>
        )}
      </div>
    </div>
  );
}

function Summary({ round, onAgain, onDone }) {
  const results = Object.entries(round.results);
  const count = (c) => results.filter(([, r]) => r === c).length;
  const improved = results.filter(([id, r]) => round.before[id] !== 'new' && RANK[r] > RANK[round.before[id]]).length;
  const allGreen = results.length > 0 && count('green') === results.length;

  return (
    <div className="summary">
      <div className="summary-emoji" aria-hidden="true">{allGreen ? '🏆' : count('green') >= count('red') ? '💪' : '🌱'}</div>
      <h1>סיימת סבב!</h1>
      <div className="summary-counts">
        <span className="pill green">{count('green')} ירוקות</span>
        <span className="pill yellow">{count('yellow')} צהובות</span>
        <span className="pill red">{count('red')} אדומות</span>
      </div>
      {improved > 0 && <p>⬆️ {improved} מילים עלו רמה</p>}
      <ul className="summary-list">
        {results.map(([id, r]) => (
          <li key={id}>
            <span className={`dot ${r}`} />
            <span dir="ltr" lang="en">{displayEn(WORDS_BY_ID[id])}</span>
            <span className="muted">{WORDS_BY_ID[id].he[0]}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="btn primary big" onClick={onAgain}>
        סבב נוסף
      </button>
      <button type="button" className="btn big ghost" onClick={onDone}>
        סיום
      </button>
    </div>
  );
}
