// "מוח" האפליקציה: מחזיק את ההתקדמות ושומר אותה אוטומטית אחרי כל שינוי.
// כל מסך מקבל ממנו את הנתונים והפעולות דרך useApp().

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { load, save, merge, emptyProgress } from './logic/storage.js';
import { rate, demote } from './logic/srs.js';
import { addActivity } from './logic/streak.js';
import { today } from './logic/dates.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [progress, setProgress] = useState(load);
  const [openWordId, setOpenWordId] = useState(null);

  useEffect(() => {
    save(progress);
  }, [progress]);

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
      // תוצאת משחק התאמה: טעות מורידה צבע אחד – רק למילים שכבר תרגלת (מילה חדשה נשארת חדשה)
      matchResult(total, wrongIds) {
        const day = today();
        setProgress((p) => {
          const words = { ...p.words };
          for (const id of wrongIds) if (words[id]) words[id] = demote(words[id], day);
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

  const value = useMemo(() => ({ progress, openWordId, ...actions }), [progress, openWordId, actions]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
