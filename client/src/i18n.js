import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import global_en from './Translations/en/global.json';
import global_es from './Translations/es/global.json';
import global_fr from './Translations/fr/global.json';
import global_ar from './Translations/ar/global.json';

i18n.use(LanguageDetector).use(initReactI18next).init({
    debug: true,
    fallbackLng: "en",
    returnObjects: true,
    resources: {
        en: {
            translation: {
                global: global_en,
            }
        },
        es: {
            translation: {
                global: global_es,
            }
        },
        fr: {
            translation: {
                global: global_fr,
            }
        },
        ar: {
            translation: {
                global: global_ar,
            }
        }
    }
})