import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
	js.configs.recommended,
	{
		files: ['**/*.js'],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
		plugins: {
			prettier,
		},
		rules: {
			...prettierConfig.rules,
			'prettier/prettier': 'error',
		},
	},
	{
		ignores: ['**/node_modules/**', '**/dist/**'],
	},
];
