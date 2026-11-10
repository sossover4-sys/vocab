export const TABS = [
  { id: 'cards', label: 'כרטיסיות', icon: '🃏' },
  { id: 'words', label: 'מילים', icon: '📖' },
  { id: 'progress', label: 'התקדמות', icon: '📊' },
  { id: 'settings', label: 'הגדרות', icon: '⚙️' },
];

export default function BottomNav({ tab, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={tab === t.id ? 'active' : ''}
          aria-current={tab === t.id ? 'page' : undefined}
          onClick={() => onChange(t.id)}
        >
          <span className="nav-icon" aria-hidden="true">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
