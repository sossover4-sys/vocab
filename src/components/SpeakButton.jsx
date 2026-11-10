import { speak } from '../logic/speech.js';
import { useVoices } from '../logic/useVoices.js';
import { useApp } from '../AppContext.jsx';

/** כפתור רמקול. אם אין במכשיר קול לשפה – לא מוצג בכלל. */
export default function SpeakButton({ text, lang, className = '' }) {
  const voices = useVoices(lang);
  const { progress } = useApp();
  if (!voices.length) return null;
  const { speechRate, voiceEn, voiceHe } = progress.settings;

  return (
    <button
      type="button"
      className={`speak-btn ${className}`}
      aria-label={lang === 'he' ? 'השמע בעברית' : 'השמע באנגלית'}
      onClick={(e) => {
        e.stopPropagation(); // כדי שלחיצה על הרמקול לא תהפוך את הכרטיס
        speak(text, lang, { rate: speechRate, voiceName: lang === 'he' ? voiceHe : voiceEn });
      }}
    >
      🔊
    </button>
  );
}
