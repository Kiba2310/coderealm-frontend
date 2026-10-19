import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import huTranslation from './locales/hu.json';
import enTranslation from './locales/en.json';

const resources = {
  hu: {
    translation: huTranslation,
  },
  en: {
    translation: enTranslation,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'hu', // Alapértelmezett nyelv
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React már védi az XSS-t
    },
  });

export default i18n;
