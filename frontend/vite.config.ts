import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		// Installable, fully-offline PWA: precache the app shell so it launches and
		// reloads with no network (data is already local in IndexedDB).
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.svg', 'logo.png'],
			manifest: {
				name: 'DivSplit',
				short_name: 'DivSplit',
				description: 'Split shared expenses with your group — offline, no account, no spreadsheets.',
				theme_color: '#ff2d78',
				background_color: '#0f0f1a',
				display: 'standalone',
				start_url: '/',
				icons: [
					{ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
					{ src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,woff2,woff,png,svg,ico}'],
				navigateFallback: '/index.html',
				maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
			},
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
