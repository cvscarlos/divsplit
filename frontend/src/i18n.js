import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import pt from './locales/pt.json';

/** @type {import('i18next').PluginOptions} */
const detection = {
	order: ['querystring', 'localStorage', 'navigator'],
	lookupQuerystring: 'lang',
	lookupLocalStorage: 'i18nLang',
	caches: ['localStorage'],
};

/** @type {import('i18next').InitOptions} */
const options = {
	fallbackLng: 'en',
	interpolation: { escapeValue: false },
	detection,
	load: 'languageOnly',
	resources: {
		en: { translation: en },
		pt: { translation: pt },
	},
};

i18n.use(LanguageDetector).use(initReactI18next).init(options);

export default i18n;
