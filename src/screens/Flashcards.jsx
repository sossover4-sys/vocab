// מסך "תרגול": בוחרים אילו מילים ואיזה תרגיל – כרטיסיות או משחק התאמה.
// כרטיסיות: רואים אנגלית → לוחצים → הכרטיס מסתובב לעברית → מסמנים אדום/צהוב/ירוק.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import { WORDS, WORDS_BY_ID, LEVELS, TOPICS, displayEn, filterWords } from '../logic/words.js';
import { pickRound, summarize, newToday } from '../logic/srs.js';
import { pickMatch } from '../logic/match.js';
import { streakDays } from '../logic/streak.js';
import { today } from '../logic/dates.js';
import SpeakButton from '../components/SpeakButton.jsx';
import ColorButtons from '../components/ColorButtons.jsx';
import Stepper from '../components/Stepper.jsx';
import Match, { matchMeaning } from './Match.jsx';

const RANK = { red: 0, yellow: 1, green: 2 };

const MODES = [
  { id: 'smart', label: 'חכם', hint: 'קודם מה שצריך לחזור עליו, ואז מילים חדשות' },
  { id: 'new', label: 'רק חדשות', hint: 'מילים שעוד לא תרגלת' },
  { id: 'mixed', label: 'מעורבב', hint: 'מכל המילים, כולל ירוקות' },
];

function greeting(hour) {
  if (hour >= 5 && hour < 12) return 'בוקר טוב';
  if (hour >= 12 && hour < 17) return 'צהריים טובים';
  if (hour >= 17 && hour < 22) return 'ערב טוב';
  return 'לילה טוב';
}

export default function Flashcards() {
  const { progress, updateSettings } = useApp();
  const [round, setRound] = useState(null); // סבב כרטיסיות פעיל
  const [match, setMatch] = useState(null); // משחק התאמה פעיל: רשימת מילים
  const [scope, setScope] = useState({ level: '', topic: '' });
  const s = progress.settings;

  const day = today();
  const poolIds = useMemo(() => filterWords(WORDS, scope, progress).map((w) => w.id), [scope, progress]);

  const startCards = () => {
    const ids = pickRound(poolIds, progress.words, { size: s.roundSize, dailyNew: s.dailyNew, mode: s.wordMode }, day);
    setRound({
      queue: ids,
      index: 0,
      before: Object.fromEntries(ids.map((id) => [id, progress.words[id]?.color || 'new'])),
      results: {},
      repeated: new Set(),
    });
  };

  const startMatch = () => {
    const ids = pickMatch(poolIds, progress.words, { n: s.matchPairs, mode: s.wordMode }, day, (id) =>
      matchMeaning(WORDS_BY_ID[id]),
    );
    setMatch({ ids, key: Date.now() });
  };

  if (match) {
    return <Match key={match.key} ids={match.ids} onAgain={startMatch} onDone={() => setMatch(null)} />;
  }
  if (round && round.index >= round.queue.length) {
    return <Summary round={round} onAgain={startCards} onDone={() => setRound(null)} />;
  }
  if (round) {
    return <Round round={round} setRound={setRound} onQuit={() => setRound(null)} />;
  }

  const counts = summarize(poolIds, progress.words, day);
  const newLeft = Math.min(counts.new, Math.max(0, s.dailyNew - newToday(progress.words, day)));
  const learned = poolIds.length - counts.new;
  const canStart = poolIds.length > 0;
  const doneToday = progress.activity?.[day] || 0;
  const streak = streakDays(progress.activity, day);
  const goalPct = Math.min(100, Math.round((doneToday / s.dailyGoal) * 100));
  const mode = MODES.find((m) => m.id === s.wordMode) || MODES[0];

  return (
    <div className="practice">
      <header className="hello">
        <div>
          <h1>{greeting(new Date().getHours())} 👋</h1>
          <p className="muted">
            {streak > 0 ? (
              <>
                <span className="flame">🔥</span> {streak} {streak === 1 ? 'יום' : 'ימים'} ברצף
              </>
            ) : (
              'בוא נתחיל רצף חדש היום'
            )}
          </p>
        </div>
        <div className="goal-ring" style={{ '--pct': goalPct }} role="img" aria-label={`יעד יומי: ${doneToday} מתוך ${s.dailyGoal}`}>
          <div>
            <strong>{doneToday}</strong>
            <span>/{s.dailyGoal}</span>
          </div>
        </div>
      </header>
      {goalPct >= 100 && <p className="goal-done">🎉 עמדת ביעד היומי!</p>}

      <section className="mode-picker">
        <h2>אילו מילים?</h2>
        <div className="segmented" role="radiogroup" aria-label="אילו מילים לתרגל">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={s.wordMode === m.id}
              className={s.wordMode === m.id ? 'on' : ''}
              onClick={() => updateSettings({ wordMode: m.id })}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="muted hint">{mode.hint}</p>
      </section>

      <section className="exercise cards-ex">
        <div className="ex-head">
          <span className="ex-icon" aria-hidden="true">🃏</span>
          <div>
            <h2>כרטיסיות</h2>
            <p>רואים מילה, הופכים, ומסמנים כמה ידעת</p>
          </div>
        </div>
        {s.wordMode === 'smart' && (
          <div className="ex-stats">
            <span><strong>{counts.due}</strong> לחזרה</span>
            <span><strong>{newLeft}</strong> חדשות להיום</span>
          </div>
        )}
        <div className="ex-actions">
          <Stepper label="כמה מילים" value={s.roundSize} min={4} max={20} onChange={(v) => updateSettings({ roundSize: v })} />
          <button type="button" className="btn ex-start" onClick={startCards} disabled={!canStart}>
            התחל ←
          </button>
        </div>
      </section>

      <section className="exercise match-ex">
        <div className="ex-head">
          <span className="ex-icon" aria-hidden="true">🧩</span>
          <div>
            <h2>משחק התאמה</h2>
            <p>מחברים כל מילה באנגלית לפירוש שלה, ובודקים בסוף</p>
          </div>
        </div>
        {s.wordMode === 'smart' && learned < s.matchPairs && (
          <div className="ex-stats">
            <span>עוד מעט מילים שתרגלת – המשחק יוסיף גם חדשות</span>
          </div>
        )}
        <div className="ex-actions">
          <Stepper label="כמה זוגות" value={s.matchPairs} min={4} max={10} onChange={(v) => updateSettings({ matchPairs: v })} />
          <button type="button" className="btn ex-start" onClick={startMatch} disabled={poolIds.length < 4}>
            שחק ←
          </button>
        </div>
      </section>

      <details className="scope" open={Boolean(scope.topic || scope.level)}>
        <summary>
          🎯 לפי נושא או רמה {(scope.topic || scope.level) && <span className="muted">· {poolIds.length} מילים</span>}
        </summary>
        <div className="tag-edit">
          <select value={scope.topic} onChange={(e) => setScope((x) => ({ ...x, topic: e.target.value }))} aria-label="נושא">
            <option value="">כל הנושאים</option>
            {Object.entries(TOPICS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={scope.level} onChange={(e) => setScope((x) => ({ ...x, level: e.target.value }))} aria-label="רמה">
            <option value="">כל הרמות</option>
            {Object.entries(LEVELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </details>
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
