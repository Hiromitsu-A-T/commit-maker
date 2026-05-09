# Contributing to Commit Maker / Commit Maker への貢献

Commit Maker is a non-commercial open-source VS Code extension for generating
commit messages from Git diffs.

Commit Maker は、Git の差分からコミットメッセージを生成する
非商用のオープンソース VS Code 拡張です。

日本語・英語のどちらでの Issue / Pull Request も歓迎します。
English and Japanese issues and pull requests are both welcome.

## Before You Start / 始める前に

- 既存の Issue / Pull Request を確認し、重複を避けてください。
- 大きな仕様変更、プロバイダー追加、UI 変更、リリースフロー変更は、
  先に Issue で相談してください。
- API キー、Personal Access Token、非公開リポジトリの差分、秘密情報を
  Issue、Pull Request、スクリーンショット、ログ、テストデータに含めないでください。
- 公開 commit では GitHub noreply address を使用し、会社・個人メールを commit
  metadata に含めないでください。
- 変更範囲はできるだけ小さく保ち、無関係なリファクタリングは分けてください。

- Check existing issues and pull requests to avoid duplicate work.
- Open an issue first for large behavior changes, provider changes, UI changes,
  or release workflow changes.
- Do not include API keys, personal access tokens, private repository diffs, or
  other secrets in issues, pull requests, screenshots, logs, or test fixtures.
- Use a GitHub noreply address for public commits. Do not include company or
  personal email addresses in commit metadata.
- Keep changes focused and separate unrelated refactors.

## Development Setup / 開発環境

Requirements:

- Node.js 20
- npm
- VS Code 1.94 or later

Install dependencies:

```bash
npm ci
```

Compile:

```bash
npm run compile
```

Run tests:

```bash
npm test
```

Optional smoke checks:

```bash
npm run smoke:local:runtime
npm run smoke:gemini:matrix
npm run smoke:openai:matrix
npm run smoke:claude:matrix
```

クラウド provider の smoke check には、利用者自身の認証情報が必要です。
認証情報はローカル環境または CI secrets のみに保存し、絶対にコミットしないでください。

Cloud provider smoke checks require your own credentials. Store credentials only
locally or in CI secrets. Never commit them.

## Pull Request Guidelines / Pull Request の方針

- 解決する問題とユーザーに見える挙動の変更を説明してください。
- バグ修正や共有ロジックの変更では、可能な範囲でテストを追加してください。
- ユーザーに見える機能を変えた場合は、README や package metadata も更新してください。
- Pull Request 前に `npm run compile` と `npm test` を実行してください。
- 生成物、ローカル VSIX、ログ、個人メモはリポジトリに含めないでください。

- Explain the problem and the user-facing behavior change.
- Add focused tests for bug fixes and shared behavior when practical.
- Update README or package metadata when user-visible features change.
- Run `npm run compile` and `npm test` before opening a pull request.
- Keep generated artifacts, local VSIX files, logs, and private notes out of the
  repository.

## Commit Messages / コミットメッセージ

Use Conventional Commits where possible.
可能な範囲で Conventional Commits を使ってください。

```text
feat: add a local model profile
fix: prevent stale generation results
docs: clarify SecretStorage behavior
chore: update release workflow
```

## Security Reports / セキュリティ報告

脆弱性は public Issue では報告しないでください。
報告方法は [`SECURITY.md`](SECURITY.md) を確認してください。

Please do not report vulnerabilities in public issues. Follow
[`SECURITY.md`](SECURITY.md) for private reporting guidance.
