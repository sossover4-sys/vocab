// צלילים קצרים שנוצרים בקוד (Web Audio API) – בלי קבצי שמע ובלי ספרייה.
// באייפון: אפשר לנגן רק אחרי שהמשתמש נגע במסך פעם אחת, ולכן unlockAudio נקרא בנגיעה הראשונה.
// שים לב: מתג השקט של האייפון משתיק את הצלילים.

let ctx = null;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** "מעיר" את מערכת השמע בנגיעה הראשונה במסך (דרישה של אייפון) */
export function unlockAudio() {
  const onFirst = () => {
    const c = getCtx();
    if (c?.state === 'suspended') c.resume();
    window.removeEventListener('pointerdown', onFirst);
  };
  window.addEventListener('pointerdown', onFirst);
}

function tone(c, freq, start, dur, volume = 0.18, type = 'sine') {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  // עלייה מהירה ודעיכה רכה – נשמע כמו פעמון ולא כמו צפצוף
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

// תווים (הרץ): דו, מי, סול, דו גבוה, מי גבוה
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5;

const SOUNDS = {
  // אבן דרך: ארפג'ו עולה חגיגי
  milestone: [[C5, 0], [E5, 0.1], [G5, 0.2], [C6, 0.3], [E6, 0.42, 0.7]],
  // יעד יומי: שני צלילים נעימים
  goal: [[G5, 0], [C6, 0.13, 0.5]],
  // משחק מושלם: נצנוץ קצר
  perfect: [[E6, 0, 0.25, 0.1], [C6, 0.07, 0.25, 0.1], [E6, 0.14, 0.4, 0.12]],
  // מקום המילה החסרה בהקראת משפט: תו פסנתר אחד, שקט (בלי "ברק" נוסף – ראה PURE)
  gap: [[C5, 0, 0.9, 0.1], [C6, 0, 0.5, 0.035], [1569.8, 0, 0.3, 0.015]],
  // תשובה נכונה: "דינג-דינג" – שני צלילים עולים
  right: [[G5, 0, 0.2, 0.15], [1174.7, 0.11, 0.4, 0.15]],
  // תשובה שגויה: שני צלילים נמוכים ויורדים – ברור אבל לא צורם
  wrong: [[E5 / 2, 0, 0.18, 0.2, 'triangle'], [C5 / 2.3, 0.14, 0.32, 0.2, 'triangle']],
};

const PURE = new Set(['gap']);

export function playSound(kind) {
  const c = getCtx();
  const notes = SOUNDS[kind];
  if (!c || !notes) return;
  if (c.state === 'suspended') c.resume();
  const t = c.currentTime + 0.02;
  for (const [freq, at, dur = 0.35, vol, type] of notes) {
    tone(c, freq, t + at, dur, vol, type);
    // צליל עליון שקט מוסיף "ברק" (לא בצלילים "טבעיים" כמו תו הפסנתר)
    if (!PURE.has(kind)) tone(c, freq * 2, t + at, dur * 0.6, (vol ?? 0.18) * 0.25, 'triangle');
  }
}
