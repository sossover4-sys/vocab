// "מוח" האפליקציה: מחזיק את ההתקדמות ושומר אותה אוטומטית אחרי כל שינוי.
// כל מסך מקבל ממנו את הנתונים והפעולות דרך useApp().

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { load, save, merge, emptyProgress } from './logic/storage.js';
import { rate, reviewSoon } from './logic/srs.js';
import { addActivity } from './logic/streak.js';
import { today } from './logic/dates.js';
import { applyTheme } from './logic/theme.js';
import { countGreen, newMilestone, goalReached } from './logic/milestones.js';
import { playSound } from './logic/sound.js';
import { buildWords, normalizeEn, customId } from './logic/words.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [progress, setProgress] = useState(load);
  const [openWordId, setOpenWordId] = useState(null);

  useEffect(() => {
    save(progress);
  }, [progress]);

  const theme = progress.settings.theme;
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // חגיגות: משווים למצב הקודם – רק שינוי שקרה עכשיו (לא פתיחת האפליקציה) מפעיל חגיגה
  const [celebration, setCelebration] = useState(null); // { kind, value, key }
  const soundOn = progress.settings.sound;
  const celebrate = useCallback(
    (kind, value) => {
      setCelebration({ kind, value, key: Date.now() });
      if (soundOn) playSound(kind);
    },
    [soundOn],
  );
  const prev = useRef(null);
  useEffect(() => {
    const day = today();
    const now = { greens: countGreen(progress.words), done: progress.activity[day] || 0, day };
    const before = prev.current;
    prev.current = now;
    if (!before || before.day !== day) return;
    const done = progress.celebrated || {};
    const m = newMilestone(before.greens, now.greens, done.greens || 0);
    const goal = goalReached(before.done, now.done, progress.settings.dailyGoal, done.goalDay, day);
    if (!m && !goal) return;
    // אם שניהם קרו יחד – חוגגים את הגדול (אבן הדרך), ומסמנים ששניהם נחגגו
    if (m) celebrate('milestone', m);
    else celebrate('goal', progress.settings.dailyGoal);
    setProgress((p) => ({
      ...p,
      celebrated: { ...p.celebrated, ...(m && { greens: m }), ...(goal && { goalDay: day }) },
    }));
  }, [progress.words, progress.activity, progress.celebrated, progress.settings.dailyGoal, celebrate]);

  const actions = useMemo(
    () => ({
      rateWord(id, color) {
        const day = today();
        setProgress((p) => ({
          ...p,
          words: { ...p.words, [id]: rate(p.words[id], color, day) },
          activity: addActivity(p.activity, day),
        }));
      },
      // תוצאת משחק (התאמה / משפט): טעות לא משנה צבע – המילה רק חוזרת לחזרה מחר. מילה חדשה נשארת חדשה.
      matchResult(total, wrongIds) {
        const day = today();
        setProgress((p) => {
          const words = { ...p.words };
          for (const id of wrongIds) if (words[id]) words[id] = reviewSoon(words[id], day);
          return { ...p, words, activity: addActivity(p.activity, day, total) };
        });
      },
      resetWord(id) {
        setProgress((p) => {
          const words = { ...p.words };
          delete words[id];
          return { ...p, words };
        });
      },
      setTagOverride(id, patch) {
        setProgress((p) => {
          const tagOverrides = { ...p.tagOverrides };
          if (patch === null) delete tagOverrides[id];
          else tagOverrides[id] = { ...tagOverrides[id], ...patch, updatedAt: Date.now() };
          return { ...p, tagOverrides };
        });
      },
      // מילה אישית חדשה. מחזיר את המזהה שלה.
      addCustomWord(text, meanings) {
        const { en, isVerb } = normalizeEn(text);
        const id = customId(en);
        const now = Date.now();
        setProgress((p) => ({
          ...p,
          customWords: {
            ...p.customWords,
            [id]: { id, en, isVerb, he: meanings, createdAt: p.customWords[id]?.createdAt || now, updatedAt: now },
          },
        }));
        return id;
      },
      removeCustomWord(id) {
        setProgress((p) => {
          const words = { ...p.words };
          delete words[id];
          // "מצבה" במקום מחיקה – כדי שבמיזוג גיבויים המילה לא תחזור
          const w = p.customWords[id];
          return { ...p, words, customWords: { ...p.customWords, [id]: { ...w, deleted: true, updatedAt: Date.now() } } };
        });
      },
      // פירושים נוספים למילה קיימת (מהוורד או אישית)
      addMeanings(id, meanings) {
        setProgress((p) => {
          const prev = p.extraMeanings[id]?.he || [];
          const he = [...new Set([...prev, ...meanings])];
          return { ...p, extraMeanings: { ...p.extraMeanings, [id]: { he, updatedAt: Date.now() } } };
        });
      },
      removeMeaning(id, meaning) {
        setProgress((p) => {
          const he = (p.extraMeanings[id]?.he || []).filter((m) => m !== meaning);
          return { ...p, extraMeanings: { ...p.extraMeanings, [id]: { he, updatedAt: Date.now() } } };
        });
      },
      updateSettings(patch) {
        setProgress((p) => ({ ...p, settings: { ...p.settings, ...patch, updatedAt: Date.now() } }));
      },
      importBackup(data) {
        setProgress((p) => merge(p, data));
      },
      markBackedUp() {
        setProgress((p) => ({ ...p, lastBackup: today() }));
      },
      resetAll() {
        setProgress(emptyProgress());
      },
      openWord: setOpenWordId,
    }),
    [],
  );

  // כל המילים: מהוורד + אישיות + פירושים נוספים
  const words = useMemo(
    () => buildWords(progress.customWords, progress.extraMeanings),
    [progress.customWords, progress.extraMeanings],
  );
  const wordsById = useMemo(() => Object.fromEntries(words.map((w) => [w.id, w])), [words]);

  const value = useMemo(
    () => ({
      progress,
      words,
      wordsById,
      openWordId,
      celebration,
      celebrate,
      clearCelebration: () => setCelebration(null),
      ...actions,
    }),
    [progress, words, wordsById, openWordId, celebration, celebrate, actions],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
