import Icon from './Icon.jsx';

export const TABS = [
  { id: 'cards', label: 'תרגול', icon: 'practice' },
  { id: 'words', label: 'מילים', icon: 'words' },
  { id: 'progress', label: 'התקדמות', icon: 'progress' },
  { id: 'settings', label: 'הגדרות', icon: 'settings' },
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
          <Icon name={t.icon} className="nav-icon" />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
