import i18n from 'i18next';
import type { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import pt from './locales/pt.json';
import { formatMoney } from './utils/money';

const options: InitOptions = {
	fallbackLng: 'en',
	interpolation: { escapeValue: false },
	detection: {
		order: ['querystring', 'localStorage', 'navigator'],
		lookupQuerystring: 'lang',
		lookupLocalStorage: 'i18nLang',
		caches: ['localStorage'],
	},
	load: 'languageOnly',
	resources: {
		en: { translation: en },
		pt: { translation: pt },
	},
};

i18n.use(LanguageDetector).use(initReactI18next).init(options);

// `{{amount, money}}` → currency with the active language's separators.
i18n.services.formatter?.add('money', (value, lng) => formatMoney(Number(value), lng || 'en'));

export default i18n;
