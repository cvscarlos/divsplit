import daisyui from 'daisyui';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,jsx}'],
	theme: {
		extend: {
			typography: { DEFAULT: { css: { maxWidth: '100%' } } },
		},
		container: {
			center: true,
		},
	},
	plugins: [typography, daisyui],
	daisyui: {
		themes: ['light', 'dark'],
	},
};
