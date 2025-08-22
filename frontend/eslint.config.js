import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import TypeScriptParser from '@typescript-eslint/parser'
import pluginQuery from '@tanstack/eslint-plugin-query'
import tailwind from "eslint-plugin-tailwindcss";



export default tseslint.config(
  { ignores: ['dist'] },

  {
    extends: [
      // Js
      js.configs.recommended,
      // Ts
      ...tseslint.configs.recommended,
      // React
      react.configs.flat.recommended,
      // Prettier
      ...pluginQuery.configs['flat/recommended'],
      ...tailwind.configs["flat/recommended"],
      prettierConfig,
    ],
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'prettier': prettierPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'prettier/prettier': 'error',
      // To avoid the need to import React
      'react/react-in-jsx-scope': 'off',
      // To avoid the need to specify prop types
      'react/prop-types': 'off',
      'tailwindcss/no-custom-classname': 'off',
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
      parser: TypeScriptParser,
    },

    settings: {
      // For eslint-plugin-react to auto detect react version
      react: {
        version: 'detect'
      },
    },

  }
)


