import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import * as tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Il codebase usa spesso `any` (tipi Supabase/RPC, payload realtime, ecc.)
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',

      // Pattern attuale del progetto: file che esportano hook/context + componenti
      'react-refresh/only-export-components': 'off',

      // Noise su codice esistente
      'prefer-const': 'off',
      'no-useless-escape': 'off',

      // Evita exit code != 0 per warning su deps in codebase esistente
      'react-hooks/exhaustive-deps': 'off',
    },
  },
])
