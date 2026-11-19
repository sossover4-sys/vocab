import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { requestPersist } from './logic/storage.js';
import { unlockAudio } from './logic/sound.js';
import '@fontsource-variable/rubik/wght.css';
import './styles/global.css';
import './styles/words.css';
import './styles/flashcards.css';
import './styles/progress.css';
import './styles/settings.css';
import './styles/match.css';
import './styles/celebrate.css';
import './styles/sentence.css';

requestPersist();
unlockAudio();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
