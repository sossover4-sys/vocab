// מסך "הגדרות": גודל סבב, מילים חדשות ביום, הקראה, וגיבוי/ייבוא.

import { useRef, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import { parseBackup } from '../logic/storage.js';
import { speak, isSupported } from '../logic/speech.js';
import { useVoices } from '../logic/useVoices.js';
import { today } from '../logic/dates.js';
import Stepper from '../components/Stepper.jsx';

export default function Settings() {
  const { progress, updateSettings, importBackup, markBackedUp, resetAll } = useApp();
  const s = progress.settings;
  const fileRef = useRef(null);
  const [message, setMessage] = useState('');
  const enVoices = useVoices('en');
  const heVoices = useVoices('he');

  const exportBackup = async () => {
    const name = `vocab-backup-${today()}.json`;
    const blob = new Blob([JSON.stringify(progress)], { type: 'application/json' });
    const file = new File([blob], name, { type: 'application/json' });
    try {
      // באייפון: פותח את חלון השיתוף (שמירה בקבצים, וואטסאפ, מייל...)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'גיבוי אוצר מילים' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      markBackedUp();
      setMessage('✅ הגיבוי נשמר.');
    } catch (e) {
      if (e.name !== 'AbortError') setMessage('❌ הגיבוי נכשל: ' + e.message);
    }
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = parseBackup(await file.text());
      importBackup(data);
      setMessage(`✅ יובאו ${Object.keys(data.words).length} מילים ומוזגו עם ההתקדמות כאן.`);
    } catch (err) {
      setMessage('❌ ' + err.message);
    }
  };

  const onReset = () => {
    if (window.confirm('למחוק את כל ההתקדמות במכשיר הזה? אי אפשר לבטל. מומלץ לגבות קודם.')) {
      resetAll();
      setMessage('ההתקדמות נמחקה.');
    }
  };

  return (
    <>
      <h1>הגדרות</h1>

      <h2>לימוד</h2>
      <div className="card settings-card">
        <SettingStepper label="מילים בכל סבב כרטיסיות" value={s.roundSize} min={4} max={20} onChange={(v) => updateSettings({ roundSize: v })} />
        <SettingStepper label="זוגות במשחק התאמה" value={s.matchPairs} min={4} max={10} onChange={(v) => updateSettings({ matchPairs: v })} />
        <SettingStepper label="מילים חדשות ביום" value={s.dailyNew} min={0} max={50} step={5} onChange={(v) => updateSettings({ dailyNew: v })} />
        <SettingStepper label="יעד יומי (תרגולים)" value={s.dailyGoal} min={10} max={100} step={5} onChange={(v) => updateSettings({ dailyGoal: v })} />
      </div>

      <h2>הקראה</h2>
      <div className="card settings-card">
        {!isSupported() && <p className="muted">הדפדפן הזה לא תומך בהקראה.</p>}
        <label className="setting-row">
          <span>מהירות: {s.speechRate.toFixed(1)}</span>
          <input
            type="range"
            min="0.5"
            max="1.3"
            step="0.1"
            value={s.speechRate}
            onChange={(e) => updateSettings({ speechRate: Number(e.target.value) })}
          />
        </label>
        <VoicePicker
          label="קול באנגלית"
          voices={enVoices}
          value={s.voiceEn}
          onChange={(v) => updateSettings({ voiceEn: v })}
          onTest={() => speak('Hello, this is a test.', 'en', { voiceName: s.voiceEn, rate: s.speechRate })}
        />
        <VoicePicker
          label="קול בעברית"
          voices={heVoices}
          value={s.voiceHe}
          onChange={(v) => updateSettings({ voiceHe: v })}
          onTest={() => speak('שלום, זו בדיקה.', 'he', { voiceName: s.voiceHe, rate: s.speechRate })}
          emptyText="אין קול עברי במכשיר הזה. במחשב, בדפדפן Edge יש קולות עבריים טובים."
        />
        <p className="muted small">באייפון אפשר להוריד קולות איכותיים יותר: הגדרות ← נגישות ← תוכן מוקרא ← קולות.</p>
      </div>

      <h2>גיבוי והעברה בין מכשירים</h2>
      <div className="card settings-card">
        <p className="small">
          כדי שהצבעים יהיו זהים במחשב ובאייפון: מייצאים גיבוי במכשיר אחד ומייבאים אותו בשני. בייבוא שום דבר לא נמחק –
          לכל מילה נשמר הסימון העדכני ביותר.
        </p>
        <p className="muted small">גיבוי אחרון: {progress.lastBackup || 'עדיין לא'}</p>
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={exportBackup}>
            ייצא גיבוי
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            ייבא גיבוי
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onImport} />
        </div>
        {message && <p className="small" role="status">{message}</p>}
      </div>

      <h2>אזור מסוכן</h2>
      <div className="card settings-card">
        <button type="button" className="btn danger" onClick={onReset}>
          מחק את כל ההתקדמות
        </button>
      </div>
    </>
  );
}

function SettingStepper({ label, ...props }) {
  return (
    <div className="setting-row">
      <span>{label}</span>
      <Stepper label={label} {...props} />
    </div>
  );
}

function VoicePicker({ label, voices, value, onChange, onTest, emptyText = 'אין קול לשפה הזו במכשיר.' }) {
  if (!voices.length) return <p className="muted small">{label}: {emptyText}</p>;
  return (
    <div className="setting-row voice-row">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">אוטומטי</option>
        {voices.map((v) => (
          <option key={v.name} value={v.name}>
            {v.name}
          </option>
        ))}
      </select>
      <button type="button" className="speak-btn" aria-label={`בדיקת ${label}`} onClick={onTest}>
        🔊
      </button>
    </div>
  );
}
