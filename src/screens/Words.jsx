// מסך "מילים": כל המילים עם חיפוש וסינון לפי רמה, נושא וצבע, והוספת מילים אישיות.

import { useMemo, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import { LEVELS, TOPICS, displayEn, filterWords } from '../logic/words.js';
import { COLOR_LABELS } from '../components/ColorButtons.jsx';
import AddWord from '../components/AddWord.jsx';
import { speak } from '../logic/speech.js';
import { useVoices } from '../logic/useVoices.js';

const EMPTY = { query: '', level: '', topic: '', color: '' };

export default function Words() {
  const { progress, words, openWord } = useApp();
  const [filters, setFilters] = useState(EMPTY);
  const [adding, setAdding] = useState(false);
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  const list = useMemo(() => filterWords(words, filters, progress), [words, filters, progress]);
  const hasFilter = filters.level || filters.topic || filters.color || filters.query;

  return (
    <>
      <div className="words-head">
        <h1>מילים</h1>
        <button type="button" className="btn primary add-btn" onClick={() => setAdding(true)}>
          ＋ הוספת מילה
        </button>
      </div>
      <input
        type="search"
        className="search"
        placeholder="חיפוש באנגלית או בעברית"
        value={filters.query}
        onChange={set('query')}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />
      <div className="filters">
        <select value={filters.level} onChange={set('level')} aria-label="רמה">
          <option value="">כל הרמות</option>
          {Object.entries(LEVELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={filters.topic} onChange={set('topic')} aria-label="נושא">
          <option value="">כל הנושאים</option>
          {Object.entries(TOPICS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={filters.color} onChange={set('color')} aria-label="צבע">
          <option value="">כל הצבעים</option>
          {['new', 'red', 'yellow', 'green'].map((c) => (
            <option key={c} value={c}>{COLOR_LABELS[c]}</option>
          ))}
        </select>
      </div>

      <p className="muted count-line">
        {list.length.toLocaleString('he-IL')} מילים
        {hasFilter && (
          <button type="button" className="link-btn" onClick={() => setFilters(EMPTY)}>
            נקה סינון
          </button>
        )}
      </p>

      {/* חיפוש בלי תוצאות → הצעה להוסיף את המילה */}
      {filters.query && !list.length ? (
        <div className="card empty-add">
          <p>
            המילה <strong dir="auto">{filters.query}</strong> לא נמצאה.
          </p>
          <button type="button" className="btn primary" onClick={() => setAdding(true)}>
            ＋ להוסיף אותה
          </button>
        </div>
      ) : (
        <WordList words={list} progress={progress} onOpen={openWord} />
      )}

      {adding && (
        <AddWord
          initial={/[a-z]/i.test(filters.query) ? filters.query : ''}
          onClose={() => setAdding(false)}
          onOpenWord={(id) => {
            setAdding(false);
            openWord(id);
          }}
        />
      )}
    </>
  );
}

export function WordList({ words, progress, onOpen }) {
  // בודקים פעם אחת אם יש קול באנגלית (ולא בכל אחת מ-1,460 השורות)
  const hasVoice = useVoices('en').length > 0;
  const { speechRate, voiceEn } = progress.settings;
  if (!words.length) return <p className="muted empty">לא נמצאו מילים.</p>;
  return (
    <ul className="word-list">
      {words.map((w) => {
        const color = progress.words[w.id]?.color || 'new';
        return (
          <li key={w.id} className={`word-item ${color}`}>
            {hasVoice && (
              <button
                type="button"
                className="row-speak"
                aria-label={`השמע ${displayEn(w)}`}
                onClick={() => speak(displayEn(w), 'en', { rate: speechRate, voiceName: voiceEn })}
              >
                🔊
              </button>
            )}
            <button type="button" className="word-row" onClick={() => onOpen(w.id)}>
              <span className="word-en" dir="ltr" lang="en">
                {displayEn(w)}
                {w.custom && <span className="mine-tag" title="מילה שהוספת">✏️</span>}
              </span>
              <span className="word-he" dir="rtl" lang="he">{w.he.join(', ')}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
