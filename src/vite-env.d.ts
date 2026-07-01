/// <reference types="vite/client" />

// Fontsource packages ship CSS only (no type declarations); allow side-effect imports.
declare module '@fontsource-variable/*';

// Injected at build time by vite.config.ts (short git SHA, or 'dev' locally).
declare const __BUILD_ID__: string;
