// מסך "מילים": כל המילים עם חיפוש וסינון לפי רמה, נושא וצבע.

import { useMemo, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import { WORDS, LEVELS, TOPICS, displayEn, filterWords } from '../logic/words.js';
import { COLOR_LABELS } from '../components/ColorButtons.jsx';

export default function Words() {
  const { progress, openWord } = useApp();
  const [filters, setFilters] = useState({ query: '', level: '', topic: '', color: '' });
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  const list = useMemo(() => filterWords(WORDS, filters, progress), [filters, progress]);
  const hasFilter = filters.level || filters.topic || filters.color || filters.query;

  return (
    <>
      <h1>מילים</h1>
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
          <button type="button" className="link-btn" onClick={() => setFilters({ query: '', level: '', topic: '', color: '' })}>
            נקה סינון
          </button>
        )}
      </p>

      <WordList words={list} progress={progress} onOpen={openWord} />
    </>
  );
}

export function WordList({ words, progress, onOpen }) {
  if (!words.length) return <p className="muted empty">לא נמצאו מילים.</p>;
  return (
    <ul className="word-list">
      {words.map((w) => {
        const color = progress.words[w.id]?.color || 'new';
        return (
          <li key={w.id}>
            <button type="button" className={`word-row ${color}`} onClick={() => onOpen(w.id)}>
              <span className="word-en" dir="ltr" lang="en">{displayEn(w)}</span>
              <span className="word-he" dir="rtl" lang="he">{w.he.join(', ')}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
