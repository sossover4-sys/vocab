// מצב בהיר / כהה. 'auto' = לפי הגדרות הטלפון.

const BAR_COLORS = { light: '#f4f5fb', dark: '#0b0c16' };

function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** איזה מצב רואים בפועל עכשיו */
export function effectiveTheme(theme) {
  return theme === 'light' || theme === 'dark' ? theme : systemTheme();
}

/** מחיל את הבחירה על הדף: data-theme על <html> וצבע שורת הסטטוס בטלפון */
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  else delete root.dataset.theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    // בבחירה ידנית – אותו צבע לשני המצבים של הטלפון; ב"אוטומטי" – כל meta לפי המצב שלו
    const forMedia = m.media?.includes('dark') ? 'dark' : 'light';
    m.content = BAR_COLORS[theme === 'light' || theme === 'dark' ? theme : forMedia];
  });
}
