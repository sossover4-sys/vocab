// מסך "התקדמות": טבעת צבעים גדולה, רצף ימים, פעילות של השבוע, ורשימת המילים לפי צבע.

import { useMemo, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import { summarize } from '../logic/srs.js';
import { streakDays, lastDays } from '../logic/streak.js';
import { today, addDays } from '../logic/dates.js';
import { COLOR_LABELS } from '../components/ColorButtons.jsx';
import { WordList } from './Words.jsx';

const ORDER = ['green', 'yellow', 'red', 'new'];
const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const fmt = (n) => n.toLocaleString('he-IL');

export default function Progress() {
  const { progress, words, openWord } = useApp();
  const [color, setColor] = useState('red');
  const [info, setInfo] = useState(false);
  const day = today();
  const ids = useMemo(() => words.map((w) => w.id), [words]);
  const counts = summarize(ids, progress.words, day);
  const dueTomorrow = summarize(ids, progress.words, addDays(day, 1)).due;
  const total = words.length;
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
    () => words.filter((w) => (progress.words[w.id]?.color || 'new') === color),
    [words, progress.words, color],
  );

  return (
    <>
      <h1>התקדמות</h1>

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
        <button type="button" className="mini" onClick={() => setInfo((v) => !v)} aria-expanded={info}>
          <span aria-hidden="true">📅</span>
          <strong>{dueTomorrow}</strong>
          <small>מילים יחזרו מחר ⓘ</small>
        </button>
      </div>
      {info && (
        <p className="mini-info">
          כל מילה שסימנת חוזרת אליך אחרי זמן מסוים: אדומה – מחר, צהובה – בעוד יומיים, ירוקה – בעוד 4
          ימים ויותר (וכל פעם שוב ירוק – הזמן מתארך). זה המספר של המילים שיגיעו לחזרה מחר בתרגול ה"חכם".
        </p>
      )}

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
