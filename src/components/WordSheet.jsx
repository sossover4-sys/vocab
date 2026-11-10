// חלונית שעולה מלמטה עם פרטי מילה: פירושים, הקראה, צבע ועריכת תגים.

import { useEffect } from 'react';
import { useApp } from '../AppContext.jsx';
import { WORDS_BY_ID, LEVELS, TOPICS, displayEn, getTags } from '../logic/words.js';
import SpeakButton from './SpeakButton.jsx';
import ColorButtons from './ColorButtons.jsx';
import tags from '../data/tags.json';

export default function WordSheet() {
  const { openWordId, openWord, progress, rateWord, resetWord, setTagOverride } = useApp();
  const word = openWordId && WORDS_BY_ID[openWordId];

  useEffect(() => {
    if (!word) return;
    const onKey = (e) => e.key === 'Escape' && openWord(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [word, openWord]);

  if (!word) return null;
  const state = progress.words[word.id];
  const t = getTags(word.id, progress.tagOverrides);
  const overridden = Boolean(progress.tagOverrides[word.id]);

  return (
    <div className="sheet-backdrop" onClick={() => openWord(null)}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sheet-close" aria-label="סגור" onClick={() => openWord(null)}>
          ✕
        </button>

        <div className="sheet-en">
          <span dir="ltr" lang="en">{displayEn(word)}</span>
          <SpeakButton text={displayEn(word)} lang="en" />
        </div>

        <ul className="sheet-meanings">
          {word.he.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <SpeakButton text={word.he.join(', ')} lang="he" className="speak-he" />

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
            החזר לתיוג המקורי ({LEVELS[tags[word.id].level]}, {TOPICS[tags[word.id].topic]})
          </button>
        )}
      </div>
    </div>
  );
}
