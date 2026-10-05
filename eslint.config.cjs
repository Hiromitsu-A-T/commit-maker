const js = require('@eslint/js');
const ts = require('typescript-eslint');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/**', 'out/**', 'media/ui/**', 'output/**', '.local/**', '.vscode-test/**'] },
  {
    files: ['scripts/**/*.{js,cjs}', '*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    rules: js.configs.recommended.rules
  },
  {
    files: ['media/panel.js'],
    languageOptions: { sourceType: 'script', globals: { ...globals.browser, acquireVsCodeApi: 'readonly' } },
    rules: js.configs.recommended.rules
  },
  {
    files: ['src/**/*.ts', 'scripts/**/*.ts', 'media/src/**/*.ts'],
    languageOptions: { parser: ts.parser },
    plugins: { '@typescript-eslint': ts.plugin },
    rules: {
      ...js.configs.recommended.rules,
      // 識別子とファイル間の宣言は TypeScript の型検査で確認する。
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }]
    }
  },
  {
    files: ['media/src/types.ts'],
    // このファイルの型は同梱画面スクリプト間で共有する。
    rules: { '@typescript-eslint/no-unused-vars': 'off' }
  }
];
