// תאריכים נשמרים כטקסט "YYYY-MM-DD" לפי השעון המקומי – פשוט להשוואה ולשמירה.

export function today(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(day, n) {
  // צהריים, כדי ששינוי שעון קיץ/חורף לא יזיז יום
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + n);
  return today(date);
}

export function daysBetween(fromDay, toDay) {
  const a = new Date(`${fromDay}T12:00:00`);
  const b = new Date(`${toDay}T12:00:00`);
  return Math.round((b - a) / 86400000);
}
