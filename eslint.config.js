import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
	{ ignores: ['dist', 'node_modules'] },
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		plugins: {
			react,
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
			'jsx-a11y': jsxA11y,
			prettier,
		},
		rules: {
			...react.configs.recommended.rules,
			...react.configs['jsx-runtime'].rules,
			...jsxA11y.configs.recommended.rules,
			...prettierConfig.rules,
			// eslint-plugin-react-hooks v7's "recommended" preset now bundles the
			// React Compiler ruleset (immutability, set-state-in-effect, purity, ...).
			// Adopting those is a separate, deliberate effort; for now keep only the
			// two long-standing rules this project already relied on.
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			'prettier/prettier': 'error',
			'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
			'react/react-in-jsx-scope': 'off',
			'react/jsx-uses-react': 'off',
			// Prop typing is handled by TypeScript, not prop-types.
			'react/prop-types': 'off',
			// Pragmatic migration: `any` is allowed in targeted spots but flagged.
			'@typescript-eslint/no-explicit-any': 'warn',
		},
		settings: {
			react: {
				// eslint-plugin-react 7.37.x's 'detect' path calls the removed
				// context.getFilename() and crashes on ESLint 10; pin the version instead.
				version: '19.2',
			},
		},
	},
	{
		// shadcn/ui primitives export their cva variants next to the component by
		// design; the fast-refresh rule doesn't apply to these generated files.
		files: ['**/components/ui/**'],
		rules: {
			'react-refresh/only-export-components': 'off',
		},
	},
);
