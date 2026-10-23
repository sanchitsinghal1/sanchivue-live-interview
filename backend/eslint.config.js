// Flat ESLint config — works with ESLint 9+.
// Pure JS project; no React/TS-specific rules needed.
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // Useful for a junior-readable codebase: keep console.* for dev logs.
      'no-console': 'off',
      // Allow unused args prefixed with _ (common in Express handlers).
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Don't force consistent-return — handlers like (req, res) => res.json(...) are common.
      'consistent-return': 'off',
      // Permit short-circuit assignments like `a && doThing()`.
      'no-unused-expressions': 'off',
      // Allow function-use-before-define since we group helpers at bottom.
      'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
      // Lenient on `== null` patterns common in our null-checks.
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
  },
];
