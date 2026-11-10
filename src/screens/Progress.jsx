// מסך "התקדמות": כמה מילים בכל צבע, ורשימת המילים של כל צבע.

import { useMemo, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import { WORDS } from '../logic/words.js';
import { summarize } from '../logic/srs.js';
import { today, daysBetween } from '../logic/dates.js';
import { COLOR_LABELS } from '../components/ColorButtons.jsx';
import { WordList } from './Words.jsx';

const ORDER = ['green', 'yellow', 'red', 'new'];

export default function Progress({ onNavigate }) {
  const { progress, openWord } = useApp();
  const [color, setColor] = useState('red');
  const day = today();
  const ids = useMemo(() => WORDS.map((w) => w.id), []);
  const counts = summarize(ids, progress.words, day);
  const total = WORDS.length;
  const learned = total - counts.new;

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

      <div className="card">
        <div className="big-number">
          <strong>{counts.green.toLocaleString('he-IL')}</strong>
          <span className="muted"> / {total.toLocaleString('he-IL')} מילים ירוקות</span>
        </div>
        <div className="stack-bar" aria-hidden="true">
          {ORDER.map((c) => (
            <div key={c} className={c} style={{ flexGrow: counts[c] }} />
          ))}
        </div>
        <p className="muted small">
          ראית {learned.toLocaleString('he-IL')} מילים · {counts.due.toLocaleString('he-IL')} מחכות לחזרה היום
        </p>
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
            <strong>{counts[c].toLocaleString('he-IL')}</strong>
            <span>{COLOR_LABELS[c]}</span>
          </button>
        ))}
      </div>

      <p className="muted small">לחיצה על מילה פותחת אותה, ושם אפשר לשנות את הצבע.</p>
      <WordList words={list} progress={progress} onOpen={openWord} />
    </>
  );
}
