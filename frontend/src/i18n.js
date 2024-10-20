import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import pt from './locales/pt.json';

/** @type {import('i18next').InitOptions} */
const detection = {
	order: ['querystring', 'localStorage', 'navigator'],
	lookupQuerystring: 'lang',
	lookupLocalStorage: 'i18nLang',
	caches: ['localStorage'],
};

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		fallbackLng: 'en',
		debug: true,
		interpolation: { escapeValue: false },
		detection,
		resources: {
			en: { translation: en },
			pt: { translation: pt },
		},
	});

export default i18n;
