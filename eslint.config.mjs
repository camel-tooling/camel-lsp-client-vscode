// eslint.config.mjs

import { defineConfig } from 'eslint-define-config';
import ts from '@typescript-eslint/parser';
import tsEslint from '@typescript-eslint/eslint-plugin';
import stylisticEslint from '@stylistic/eslint-plugin';

export default defineConfig([
  {
    ignores: ['**/*.test.js'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: ts,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'commonjs',
        project: './tsconfig.json',
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
      globals: {
        // declare global variables here
        browser: 'readonly',
        es2024: true,
        mocha: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
      '@stylistic': stylisticEslint,
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off', // allows require statements outside of imports
      'no-async-promise-executor': 'off', // Deactivated for now as I do not know how to fix it safely
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
        },
      ],
      '@stylistic/semi': 'warn',
      curly: 'warn',
      eqeqeq: 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          caughtErrors: 'none', // ignore unused variables in catch blocks
        },
      ],
      'no-throw-literal': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
    },
  },
]);
