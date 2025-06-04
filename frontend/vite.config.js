import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslintPlugin from 'vite-plugin-eslint';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
	plugins: [
		react(),
		eslintPlugin({
			cache: false,
			include: ['./src/**/*.js', './src/**/*.jsx'],
			exclude: [],
			failOnError: false,
			fix: true,
		}),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@components': fileURLToPath(new URL('./src/components', import.meta.url)),
			'@context': fileURLToPath(new URL('./src/context', import.meta.url)),
			'@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
			'@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
			'@routes': fileURLToPath(new URL('./src/routes', import.meta.url)),
			'@locales': fileURLToPath(new URL('./src/locales', import.meta.url)),
		},
	},
});
