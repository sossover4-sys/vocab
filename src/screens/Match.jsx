// משחק התאמה: אנגלית משמאל, עברית מימין. לוחצים מילה בצד אחד ואז בצד השני – נוצר זוג.
// כשלכל המילים יש זוג, לוחצים "בדיקה" ורואים מה נכון ומה לא.

import { useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import { WORDS_BY_ID, displayEn } from '../logic/words.js';
import { newMatchRound, checkPairs } from '../logic/match.js';

/** הפירוש שמוצג במשחק: הראשון בלבד, כדי שייכנס בכפתור בטלפון */
export function matchMeaning(word) {
  return word.he[0];
}

export default function Match({ ids, onAgain, onDone }) {
  const { matchResult } = useApp();
  const columns = useMemo(() => newMatchRound(ids), [ids]);
  const [selected, setSelected] = useState(null); // { side: 'en' | 'he', id }
  const [pairs, setPairs] = useState([]); // [{ en, he }] לפי סדר יצירה – המספר והצבע של כל זוג
  const [result, setResult] = useState(null); // { correct, wrong } אחרי בדיקה
  const reported = useRef(false);

  const pairOf = (side, id) => pairs.findIndex((p) => p[side] === id);
  const left = ids.length - pairs.length;

  const tap = (side, id) => {
    if (result) return;
    const idx = pairOf(side, id);
    if (idx >= 0) {
      // לחיצה על מילה שכבר בזוג – מפרקת אותו
      setPairs((ps) => ps.filter((_, i) => i !== idx));
      setSelected(null);
      return;
    }
    if (!selected || selected.side === side) {
      setSelected(selected?.id === id && selected.side === side ? null : { side, id });
      return;
    }
    const pair = side === 'en' ? { en: id, he: selected.id } : { en: selected.id, he: id };
    setPairs((ps) => [...ps, pair]);
    setSelected(null);
  };

  const check = () => {
    const r = checkPairs(Object.fromEntries(pairs.map((p) => [p.en, p.he])));
    setResult(r);
    if (!reported.current) {
      reported.current = true;
      matchResult(ids.length, r.wrong);
    }
  };

  const stateOf = (side, id) => {
    const idx = pairOf(side, id);
    if (result) {
      const en = side === 'en' ? id : pairs[idx]?.en;
      return { cls: result.correct.includes(en) ? 'right' : 'wrong', num: idx + 1 };
    }
    if (idx >= 0) return { cls: `paired p${idx % 10}`, num: idx + 1 };
    if (selected?.side === side && selected.id === id) return { cls: 'selected', num: null };
    return { cls: '', num: null };
  };

  return (
    <div className="match">
      <div className="round-top">
        <button type="button" className="link-btn" onClick={onDone}>
          ✕ יציאה
        </button>
        <span className="muted">{result ? 'תוצאות' : left > 0 ? `נשארו ${left} זוגות` : 'אפשר לבדוק!'}</span>
      </div>

      {!result && <p className="muted hint match-help">לוחצים מילה באנגלית ואז את הפירוש שלה (או להפך). לחיצה על זוג מפרקת אותו.</p>}

      <div className="match-grid">
        <div className="match-col" dir="ltr" lang="en">
          {columns.left.map((id) => {
            const st = stateOf('en', id);
            return (
              <button key={id} type="button" className={`match-item ${st.cls}`} onClick={() => tap('en', id)}>
                {st.num && <span className="pair-num">{st.num}</span>}
                <span className="match-text">{displayEn(WORDS_BY_ID[id])}</span>
                {result && st.cls === 'wrong' && (
                  <span className="correct-answer" dir="rtl" lang="he">
                    ✓ {matchMeaning(WORDS_BY_ID[id])}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="match-col">
          {columns.right.map((id) => {
            const st = stateOf('he', id);
            return (
              <button key={id} type="button" className={`match-item ${st.cls}`} onClick={() => tap('he', id)}>
                {st.num && <span className="pair-num">{st.num}</span>}
                <span className="match-text">{matchMeaning(WORDS_BY_ID[id])}</span>
              </button>
            );
          })}
        </div>
      </div>

      {result ? (
        <div className="match-result">
          <p className="match-score">
            {result.wrong.length === 0 ? '🏆 ' : ''}
            {result.correct.length} מתוך {ids.length} נכון
          </p>
          {result.wrong.length > 0 && (
            <p className="muted hint">המילים שטעית בהן ירדו צבע אחד ויחזרו אליך מוקדם יותר.</p>
          )}
          <button type="button" className="btn primary big" onClick={onAgain}>
            משחק נוסף
          </button>
          <button type="button" className="btn big ghost" onClick={onDone}>
            סיום
          </button>
        </div>
      ) : (
        <button type="button" className="btn primary big match-check" onClick={check} disabled={left > 0}>
          בדיקה
        </button>
      )}
    </div>
  );
}
