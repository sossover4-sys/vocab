// חלונית "הוספת מילה": כותבים מילה באנגלית, ותוך כדי רואים אם היא כבר קיימת.
// קיימת → אפשר להוסיף לה פירוש נוסף. לא קיימת → מוסיפים אותה עם הפירושים.

import { useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import Icon from './Icon.jsx';
import { displayEn, findWord, normalizeEn, parseMeanings, similarWords } from '../logic/words.js';

const HEBREW = /[֐-׿]/;

export default function AddWord({ initial = '', onClose, onOpenWord }) {
  const { words, addCustomWord, addMeanings } = useApp();
  const [en, setEn] = useState(initial);
  const [he, setHe] = useState('');
  const [done, setDone] = useState('');
  const enRef = useRef(null);

  useEffect(() => {
    enRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const norm = normalizeEn(en);
  const existing = findWord(words, en);
  const similar = existing ? [] : similarWords(words, en);
  const meanings = parseMeanings(he);
  const fresh = existing ? meanings.filter((m) => !existing.he.includes(m)) : meanings;
  const enValid = /^[a-z][a-z\s'-]*$/.test(norm.en) && norm.en.length <= 40;
  const heValid = meanings.length > 0 && meanings.every((m) => HEBREW.test(m) && m.length <= 40);
  const canSave = enValid && heValid && fresh.length > 0;

  const save = (e) => {
    e.preventDefault();
    if (!canSave) return;
    if (existing) {
      addMeanings(existing.id, fresh);
      setDone(`✅ נוסף פירוש ל-${displayEn(existing)}`);
    } else {
      addCustomWord(en, meanings);
      setDone(`✅ ${displayEn(norm)} נוספה לרשימה שלך`);
    }
    setEn('');
    setHe('');
    enRef.current?.focus();
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="sheet add-word" role="dialog" aria-modal="true" aria-label="הוספת מילה" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <button type="button" className="sheet-close" aria-label="סגור" onClick={onClose}>
          <Icon name="close" />
        </button>
        <h2>הוספת מילה</h2>
        <p className="muted small">ראית מילה שאין באפליקציה? הוסף אותה – היא תיכנס לתרגול כמו כל מילה אחרת.</p>

        <label className="field">
          <span>באנגלית</span>
          <input
            ref={enRef}
            type="text"
            dir="ltr"
            lang="en"
            value={en}
            onChange={(e) => {
              setEn(e.target.value);
              setDone('');
            }}
            placeholder="for example: resilient"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
          />
        </label>
        {en && !enValid && <p className="field-hint bad">רק אותיות באנגלית (אפשר "to" בהתחלה לפועל).</p>}

        {existing && (
          <div className="exists">
            <div>
              <strong>המילה כבר קיימת 👍</strong>
              <p>
                <span dir="ltr" lang="en">{displayEn(existing)}</span> – {existing.he.join(', ')}
              </p>
            </div>
            <button type="button" className="link-btn" onClick={() => onOpenWord(existing.id)}>
              פתח
            </button>
          </div>
        )}
        {similar.length > 0 && (
          <p className="field-hint">
            מילים דומות שכבר יש:{' '}
            {similar.map((w, i) => (
              <span key={w.id}>
                {i > 0 && ', '}
                <button type="button" className="link-btn inline" onClick={() => onOpenWord(w.id)} dir="ltr">
                  {displayEn(w)}
                </button>
              </span>
            ))}
          </p>
        )}

        <label className="field">
          <span>{existing ? 'פירוש נוסף בעברית' : 'פירוש בעברית'}</span>
          <input
            type="text"
            dir="rtl"
            lang="he"
            value={he}
            onChange={(e) => {
              setHe(e.target.value);
              setDone('');
            }}
            placeholder="אפשר כמה פירושים, עם פסיק ביניהם"
            autoComplete="off"
          />
        </label>
        {existing && meanings.length > 0 && fresh.length === 0 && (
          <p className="field-hint bad">הפירוש הזה כבר קיים למילה.</p>
        )}
        {he && !heValid && <p className="field-hint bad">הפירוש צריך להיות בעברית.</p>}

        <button type="submit" className="btn primary big" disabled={!canSave}>
          {existing ? '＋ הוסף פירוש' : '＋ הוסף מילה'}
        </button>
        {done && (
          <p className="add-done" role="status">
            {done}
          </p>
        )}
      </form>
    </div>
  );
}
