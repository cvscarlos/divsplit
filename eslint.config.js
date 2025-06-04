import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
	js.configs.recommended,
	{
		files: ['**/*.js'],
		plugins: {
			prettier,
		},
		rules: {
			...prettierConfig.rules,
			'prettier/prettier': 'error',
		},
	},
	{
		ignores: ['**/node_modules/**', '**/dist/**', 'frontend/**', 'backend/**'],
	},
];
