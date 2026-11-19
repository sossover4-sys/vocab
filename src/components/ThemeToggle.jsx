// כפתור מהיר להחלפה בין בהיר לכהה. הבחירה נשמרת בהגדרות (ואפשר לחזור ל"אוטומטי" במסך ההגדרות).

import { useApp } from '../AppContext.jsx';
import { effectiveTheme } from '../logic/theme.js';
import Icon from './Icon.jsx';

export default function ThemeToggle() {
  const { progress, updateSettings } = useApp();
  const current = effectiveTheme(progress.settings.theme);
  const next = current === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => updateSettings({ theme: next })}
      aria-label={next === 'dark' ? 'מעבר למצב כהה' : 'מעבר למצב בהיר'}
    >
      <Icon name={current === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}
