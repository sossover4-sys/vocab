// מסך "התקדמות": טבעת צבעים גדולה, רצף ימים, פעילות של השבוע, ורשימת המילים לפי צבע.

import { useMemo, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import { WORDS } from '../logic/words.js';
import { summarize } from '../logic/srs.js';
import { streakDays, lastDays } from '../logic/streak.js';
import { today, daysBetween, addDays } from '../logic/dates.js';
import { COLOR_LABELS } from '../components/ColorButtons.jsx';
import { WordList } from './Words.jsx';

const ORDER = ['green', 'yellow', 'red', 'new'];
const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const fmt = (n) => n.toLocaleString('he-IL');

export default function Progress({ onNavigate }) {
  const { progress, openWord } = useApp();
  const [color, setColor] = useState('red');
  const day = today();
  const ids = useMemo(() => WORDS.map((w) => w.id), []);
  const counts = summarize(ids, progress.words, day);
  const dueTomorrow = summarize(ids, progress.words, addDays(day, 1)).due;
  const total = WORDS.length;
  const learned = total - counts.new;
  const greenPct = Math.round((counts.green / total) * 100);
  const streak = streakDays(progress.activity, day);
  const week = lastDays(progress.activity, day, 7);
  const weekMax = Math.max(1, ...week.map((d) => d.count));

  // הטבעת: כל צבע תופס חלק לפי כמות המילים בו
  let acc = 0;
  const stops = ORDER.map((c) => {
    const from = acc;
    acc += (counts[c] / total) * 100;
    // מילים חדשות = "מסלול ריק" בהיר, שמתמלא בצבעים ככל שלומדים
    return `var(--${c === 'new' ? 'new-soft' : c}) ${from}% ${acc}%`;
  }).join(', ');

  const list = useMemo(
    () => WORDS.filter((w) => (progress.words[w.id]?.color || 'new') === color),
    [progress.words, color],
  );

  const needsBackup =
    learned > 0 && (!progress.lastBackup || daysBetween(progress.lastBackup, day) >= 7);

  return (
    <>
      <h1>התקדמות</h1>

      {needsBackup && (
        <div className="banner">
          <span>{progress.lastBackup ? 'עבר שבוע מהגיבוי האחרון.' : 'עוד לא גיבית את ההתקדמות.'}</span>
          <button type="button" className="btn" onClick={() => onNavigate('settings')}>
            לגיבוי
          </button>
        </div>
      )}

      <div className="card hero">
        <div className="big-ring" style={{ background: `conic-gradient(${stops})` }} role="img"
          aria-label={`${counts.green} מילים ירוקות מתוך ${total}`}>
          <div>
            <strong>{fmt(counts.green)}</strong>
            <span>ירוקות מתוך {fmt(total)}</span>
            <em>{greenPct}%</em>
          </div>
        </div>
        <ul className="legend">
          {ORDER.map((c) => (
            <li key={c}>
              <span className={`dot ${c}`} /> {COLOR_LABELS[c]} <strong>{fmt(counts[c])}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="mini-stats">
        <div className="mini">
          <span aria-hidden="true">🔥</span>
          <strong>{streak}</strong>
          <small>ימים ברצף</small>
        </div>
        <div className="mini">
          <span aria-hidden="true">✅</span>
          <strong>{progress.activity?.[day] || 0}</strong>
          <small>תרגולים היום</small>
        </div>
        <div className="mini">
          <span aria-hidden="true">📅</span>
          <strong>{dueTomorrow}</strong>
          <small>לחזרה מחר</small>
        </div>
      </div>

      <div className="card week">
        <h2>7 הימים האחרונים</h2>
        <div className="week-bars">
          {week.map((d) => (
            <div key={d.day} className={`week-day ${d.day === day ? 'today' : ''}`}>
              <span className="week-count">{d.count || ''}</span>
              <div className="week-bar">
                <div style={{ height: `${(d.count / weekMax) * 100}%` }} />
              </div>
              <span className="week-name">{DAY_NAMES[new Date(`${d.day}T12:00:00`).getDay()]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="color-tabs" role="tablist">
        {ORDER.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={color === c}
            className={`color-tab ${c} ${color === c ? 'active' : ''}`}
            onClick={() => setColor(c)}
          >
            <strong>{fmt(counts[c])}</strong>
            <span>{COLOR_LABELS[c]}</span>
          </button>
        ))}
      </div>

      <p className="muted small">לחיצה על מילה פותחת אותה, ושם אפשר לשנות את הצבע.</p>
      <WordList words={list} progress={progress} onOpen={openWord} />
    </>
  );
}
