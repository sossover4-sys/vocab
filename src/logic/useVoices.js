import { useEffect, useState } from 'react';
import { getVoices, onVoicesChanged } from './speech.js';

/** רשימת הקולות לשפה, מתעדכנת כשהדפדפן מסיים לטעון קולות */
export function useVoices(lang) {
  const [voices, setVoices] = useState(() => getVoices(lang));
  useEffect(() => {
    setVoices(getVoices(lang));
    return onVoicesChanged(() => setVoices(getVoices(lang)));
  }, [lang]);
  return voices;
}
