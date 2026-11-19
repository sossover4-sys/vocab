// חלונית שעולה מלמטה עם פרטי מילה: פירושים, הקראה, צבע, עריכת תגים, והוספת פירושים משלך.

import { useEffect, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import { LEVELS, TOPICS, displayEn, getTags, originalTags, parseMeanings } from '../logic/words.js';
import SpeakButton from './SpeakButton.jsx';
import ColorButtons from './ColorButtons.jsx';
import Icon from './Icon.jsx';

const HEBREW = /[֐-׿]/;

export default function WordSheet() {
  const { openWordId, openWord, wordsById, progress, rateWord, resetWord, setTagOverride, addMeanings, removeMeaning, removeCustomWord } =
    useApp();
  const word = openWordId && wordsById[openWordId];
  const [newMeaning, setNewMeaning] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setAdding(false);
    setNewMeaning('');
  }, [openWordId]);

  useEffect(() => {
    if (!word) return;
    const onKey = (e) => e.key === 'Escape' && openWord(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [word, openWord]);

  if (!word) return null;
  const state = progress.words[word.id];
  const t = getTags(word.id, progress.tagOverrides);
  const orig = originalTags(word.id);
  const overridden = Boolean(progress.tagOverrides[word.id]);
  const extra = word.extra || [];
  const fresh = parseMeanings(newMeaning).filter((m) => HEBREW.test(m) && !word.he.includes(m));

  const saveMeaning = (e) => {
    e.preventDefault();
    if (!fresh.length) return;
    addMeanings(word.id, fresh);
    setNewMeaning('');
    setAdding(false);
  };

  const deleteWord = () => {
    if (window.confirm(`למחוק את "${displayEn(word)}" מהרשימה שלך?`)) {
      removeCustomWord(word.id);
      openWord(null);
    }
  };

  return (
    <div className="sheet-backdrop" onClick={() => openWord(null)}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sheet-close" aria-label="סגור" onClick={() => openWord(null)}>
          <Icon name="close" />
        </button>

        <div className="sheet-en">
          <span dir="ltr" lang="en">{displayEn(word)}</span>
          <SpeakButton text={displayEn(word)} lang="en" />
        </div>
        {word.custom && <p className="mine-note">✏️ מילה שהוספת</p>}

        <ul className="sheet-meanings">
          {word.he.map((m) => (
            <li key={m} className={extra.includes(m) ? 'extra' : ''}>
              {m}
              {extra.includes(m) && (
                <button type="button" className="chip-x" aria-label={`מחק את הפירוש ${m}`} onClick={() => removeMeaning(word.id, m)}>
                  <Icon name="close" />
                </button>
              )}
            </li>
          ))}
        </ul>
        <SpeakButton text={word.he.join(', ')} lang="he" className="speak-he" />

        {adding ? (
          <form className="meaning-form" onSubmit={saveMeaning}>
            <input
              type="text"
              dir="rtl"
              lang="he"
              value={newMeaning}
              onChange={(e) => setNewMeaning(e.target.value)}
              placeholder="פירוש נוסף בעברית"
              aria-label="פירוש נוסף"
              autoFocus
            />
            <button type="submit" className="btn primary" disabled={!fresh.length}>
              הוסף
            </button>
          </form>
        ) : (
          <button type="button" className="link-btn add-meaning" onClick={() => setAdding(true)}>
            ＋ הוספת פירוש משלי
          </button>
        )}

        <h3>כמה אני יודע</h3>
        <ColorButtons current={state?.color} onPick={(c) => rateWord(word.id, c)} />
        {state && (
          <button type="button" className="link-btn" onClick={() => resetWord(word.id)}>
            החזר למילה חדשה
          </button>
        )}

        <h3>תגים</h3>
        <div className="tag-edit">
          <label>
            רמה
            <select value={t.level} onChange={(e) => setTagOverride(word.id, { level: Number(e.target.value) })}>
              {Object.entries(LEVELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            נושא
            <select value={t.topic} onChange={(e) => setTagOverride(word.id, { topic: e.target.value })}>
              {Object.entries(TOPICS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </label>
        </div>
        {overridden && (
          <button type="button" className="link-btn" onClick={() => setTagOverride(word.id, null)}>
            החזר לתיוג המקורי ({LEVELS[orig.level]}, {TOPICS[orig.topic]})
          </button>
        )}

        {word.custom && (
          <button type="button" className="btn danger delete-word" onClick={deleteWord}>
            מחק את המילה
          </button>
        )}
      </div>
    </div>
  );
}
