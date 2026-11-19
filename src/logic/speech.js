// הקראה בעזרת Web Speech API – מובנה בדפדפן וחינמי.

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

export function isSupported() {
  return Boolean(synth);
}

export function getVoices(lang) {
  if (!synth) return [];
  const prefixes = lang === 'he' ? ['he', 'iw'] : ['en'];
  return synth.getVoices().filter((v) => prefixes.some((p) => v.lang.toLowerCase().startsWith(p)));
}

// קולות שבדרך כלל נשמעים טבעיים יותר
const PREFERRED = /natural|enhanced|premium|google|samantha|siri/i;

export function pickVoice(lang, savedName) {
  const voices = getVoices(lang);
  if (!voices.length) return null;
  return (
    voices.find((v) => v.name === savedName) ||
    (lang === 'en' && voices.find((v) => /en-US/i.test(v.lang) && PREFERRED.test(v.name))) ||
    voices.find((v) => PREFERRED.test(v.name)) ||
    (lang === 'en' && voices.find((v) => /en-US/i.test(v.lang))) ||
    voices[0]
  );
}

function utterance(text, lang, voiceName, rate) {
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(lang, voiceName);
  if (voice) u.voice = voice;
  u.lang = voice ? voice.lang : lang === 'he' ? 'he-IL' : 'en-US';
  u.rate = rate;
  return u;
}

// מונה הקראות: כשמתחילה הקראה חדשה, ההמשך של הקודמת (אחרי הצליל) מתבטל
let session = 0;

/** מקריא טקסט. חייב לקרות בתגובה ללחיצה (דרישה של אייפון). */
export function speak(text, lang, { voiceName = '', rate = 0.9 } = {}) {
  if (!synth) return;
  session++;
  synth.cancel();
  synth.speak(utterance(text, lang, voiceName, rate));
}

/**
 * מקריא משפט עם מילה חסרה: החלק שלפני ← צליל עדין ועצירה קצרה (במקום המילה) ← החלק שאחרי.
 * @param {() => void} playGap משמיע את הצליל של המילה החסרה
 */
export function speakWithGap(before, after, { voiceName = '', rate = 0.9 } = {}, playGap = () => {}) {
  if (!synth) return;
  const my = ++session;
  synth.cancel();
  const rest = () => {
    if (my !== session) return; // התחילה הקראה אחרת בינתיים
    setTimeout(() => {
      if (my !== session) return;
      playGap();
      if (after.trim()) {
        setTimeout(() => {
          if (my === session) synth.speak(utterance(after, 'en', voiceName, rate));
        }, 380);
      }
    }, 80);
  };
  if (before.trim()) {
    const u = utterance(before, 'en', voiceName, rate);
    u.onend = rest;
    synth.speak(u);
  } else {
    rest();
  }
}

/** הקולות נטענים באיחור בחלק מהדפדפנים – מאזינים לעדכון */
export function onVoicesChanged(callback) {
  if (!synth) return () => {};
  synth.addEventListener('voiceschanged', callback);
  return () => synth.removeEventListener('voiceschanged', callback);
}
