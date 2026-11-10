// שלושת כפתורי הידיעה: אדום / צהוב / ירוק

export const COLOR_LABELS = {
  red: 'לא ידעתי',
  yellow: 'בערך',
  green: 'ידעתי',
  new: 'חדשה',
};

export default function ColorButtons({ onPick, current, labels = COLOR_LABELS }) {
  return (
    <div className="color-buttons">
      {['red', 'yellow', 'green'].map((c) => (
        <button
          key={c}
          type="button"
          className={`color-btn ${c} ${current === c ? 'selected' : ''}`}
          onClick={() => onPick(c)}
        >
          {labels[c]}
        </button>
      ))}
    </div>
  );
}
