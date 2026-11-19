// כפתורי − / + לבחירת מספר (גודל סבב, מספר זוגות וכו')
// הסימנים הם אייקוני SVG ולא תווים, כדי שיישבו בדיוק באמצע גם באייפון.

import Icon from './Icon.jsx';

export default function Stepper({ value, min, max, step = 1, onChange, label }) {
  const clamp = (v) => Math.min(max, Math.max(min, v));
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" aria-label="פחות" onClick={() => onChange(clamp(value - step))} disabled={value <= min}>
        <Icon name="minus" />
      </button>
      <strong aria-live="polite">{value}</strong>
      <button type="button" aria-label="יותר" onClick={() => onChange(clamp(value + step))} disabled={value >= max}>
        <Icon name="plus" />
      </button>
    </div>
  );
}
