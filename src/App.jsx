import { useState } from 'react';
import { AppProvider } from './AppContext.jsx';
import BottomNav from './components/BottomNav.jsx';
import WordSheet from './components/WordSheet.jsx';
import Flashcards from './screens/Flashcards.jsx';
import Words from './screens/Words.jsx';
import Progress from './screens/Progress.jsx';
import Settings from './screens/Settings.jsx';

const SCREENS = { cards: Flashcards, words: Words, progress: Progress, settings: Settings };

function loadTab() {
  try {
    return SCREENS[localStorage.getItem('vocab-tab')] ? localStorage.getItem('vocab-tab') : 'cards';
  } catch {
    return 'cards';
  }
}

export default function App() {
  const [tab, setTab] = useState(loadTab);
  const Screen = SCREENS[tab];

  const changeTab = (t) => {
    setTab(t);
    try {
      localStorage.setItem('vocab-tab', t);
    } catch {
      /* לא קריטי */
    }
    window.scrollTo(0, 0);
  };

  return (
    <AppProvider>
      <main className="screen">
        <Screen onNavigate={changeTab} />
      </main>
      <BottomNav tab={tab} onChange={changeTab} />
      <WordSheet />
    </AppProvider>
  );
}
