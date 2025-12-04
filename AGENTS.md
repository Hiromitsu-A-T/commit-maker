# AGENTS ガイド（Commit Maker）
日本語のみで対応すること。

## プロダクト概要
Git の差分からコミットメッセージを生成し、SCM 入力欄へ書き戻す VS Code 拡張。API キーは利用者が用意し SecretStorage に保存する。

### ドキュメントの役割分担
- `README.md`: エンドユーザー向け。機能概要、使い方、主要設定のみを掲載（ストア説明と整合させる）。
- `package.json`: ストア公開用メタ情報（名称・説明・カテゴリ・デフォルト設定）。README 冒頭と意味がずれないように保つ。
- `AGENTS.md`: 開発者向け。構造、配布手順、CI/シークレット運用、開発ポリシーを集約し、README には載せない。

## 設定とシークレット
- 設定キー（`commitMaker.*`）: `provider` / `endpoint` / `endpointGemini` / `endpointClaude` / `model`（デフォルト `gemini-2.5-flash-lite`）/ `reasoningEffort` / `verbosity` / `apiKeySecret*` / `requestTimeoutMs`。旧 `simpleUi.*` は置換して使用。
- ログ出力: `commitMaker.logLlm` を `true` で LLM 呼び出しの試行/リトライを Output チャネルへ記録（デフォルト `false`）。
- シークレット保存先: GitHub Actions → `Settings > Secrets and variables > Actions` に `VSCE_PAT`（Marketplace 用）、`OVSX_PAT`（Open VSX 用）を登録。ローカル開発時は `.env` に置かず、VS Code SecretStorage へ保存。
- `.env` はリポジトリに含めない（`.vscodeignore` で除外済み）。ただし **CI/ローカルで一時利用するトークンを .env に置く場合がある**。その際は `.env` を手元専用にし、必ずコミット・配布対象から除外する（既に ignore 済み）。`VSCE_PAT` / `OVSX_PAT` を .env に置いてもビルド・公開は可能だが、公開リポジトリに絶対含めないこと。

## バージョニング
- 形式: SemVer `MAJOR.MINOR.PATCH`
- ルール: PATCH=バグ修正/Docs/CI、MINOR=後方互換の機能追加やUI改善、MAJOR=破壊的変更（設定キー削除など）。0.x では MINOR/PATCH を基本とし、スキップせず連番で上げる。
 - タグ: `v<version>`（例 `v0.1.4`）。`package.json` と一致させる。

### コミットメッセージルール（テンプレート）
- 変更内容を 50 文字以内の要約タイトルで書く。命令形や主観は使わない。
- タイトル先頭に Conventional Commits の type を付ける（例: `chore: ...`）。
- 必要に応じて本文に箇条書きを追加する。各行 72 文字以内、`- `で開始。
- 破壊的変更や ISSUE/PR 番号があれば本文に追記する。
- AI の意見や謝罪・自信表明は禁止。事実のみを記述。

## CI での自動配信
- 基本方針: 公開は原則このワークフロー経由で行う（手動 CLI は緊急時のみ）。
- 使うワークフロー: `.github/workflows/publish.yml`（トリガー: `workflow_dispatch` と `v*` タグ push）。Node 20 で実行。
- 手順（迷ったらこの順で）
  1. `package.json` の version を上げる。
  2. 変更を commit する。
  3. `v<version>` でタグを切る（例 `v0.1.4`）。
  4. `main` とタグを push する（これでワークフローが自動起動）。
  5. Actions で `Publish Extension` が成功したら Marketplace / Open VSX へ同時反映される。
- 必要シークレット: `VSCE_PAT`, `OVSX_PAT`
- 処理概要: `npm ci` → `npm run compile` → `vsce package --no-rewrite-relative-links` → `vsce publish --packagePath ...` → `ovsx publish --skip-duplicate`。完了後 `vsix/` に成果物を保存。

## 手動配布と整理
- ビルド: `npm run compile`
- パッケージ: `npx vsce package --no-rewrite-relative-links`
- 生成物整理: `mv commit-maker-$(node -p "require('./package.json').version").vsix vsix/`。VSIX は `vsix/` に最新を含む直近 5 個だけ残し、ルート直下の VSIX は置かない。
- 自動整理: `npm run clean:vsix` で上記ルールを自動適用（ルートの stray も削除）。CI publish でも実行済み。
- 公開（CLI）  
  - Marketplace: `VSCE_PAT=<token> npx vsce publish --packagePath vsix/commit-maker-<version>.vsix`  
  - Open VSX: 初回 `npx ovsx create-namespace Hiromitsu`、以降 `OVSX_PAT=<token> npx ovsx publish vsix/commit-maker-<version>.vsix --skip-duplicate`

## ローカル VSIX インストール
- 生成: `npm run compile` → `npx vsce package` → `vsix/commit-maker-<version>.vsix`
- インストール: `code --install-extension vsix/commit-maker-<version>.vsix`  
  (macOS で PATH に `code` が無い場合 `/Applications/Visual\\ Studio\\ Code.app/Contents/Resources/app/bin/code --install-extension ...`)
- 旧版は VS Code の拡張一覧からアンインストールしてから新しい VSIX を入れると安全。

## マーケットプレイス表示（README / 画像）
- 画像は `https` で直接参照できる PNG/JPEG/GIF を使う。SVG は非推奨（許可されたバッジ提供元のみ）。`data:`/`http:` は不可。
- 公開用 README ではリポジトリの raw URL など絶対 URL を使うと表示が安定。`vsce package --no-rewrite-relative-links` で相対リンクを維持する。
- アイコンは `media/commit-maker.png`（128px 正方形、透過推奨）。

## テスト
- 型チェック: `npm run compile`
- ユニットテスト（軽量）: `npm test` で ts-node 実行（`src/testRunner.ts` が一括実行）
- スモーク（実API最小トークン検証）
  - OpenAI 全許容組合せ: `npm run smoke:openai:matrix`
  - Gemini 2.5 系（pro/flash/flash-lite）: `npm run smoke:gemini:matrix`
  - Claude 4 系以降（haiku/sonnet/opus 4.x/4.5）: `npm run smoke:claude:matrix`

## チェックリスト
- `npm run compile` が通ること
- README のスクリーンショット/機能リストが最新版
- `package.json` の `engines.vscode` とカテゴリが要件を満たす
- `vsix/` に 5 個超の VSIX が残っていないか確認
- `AGENTS.md` を VSIX に含めない（`.vscodeignore` 済み）

## 開発メモ
- Webview CSP は nonce 付き。スタイル/スクリプトは同梱のみ。
- プロバイダー並びとデフォルト: 「Gemini → OpenAI → Claude」。
- 差分取得は Git API 優先、フォールバックで `git diff` / `git status --porcelain`。
- API キー未保存時はプレースホルダー表示し、Reasoning/Verbosity を非表示。保存済みプロバイダーのみ選択可。
- Webview スクリプトはプレーン JS。`as` 型アサーションは禁止（ビルド後 JS でエラーを防ぐ）。
- LLM 呼び出しは `services/llm/` に分割済み。新規プロバイダー追加時は `PROVIDER_CAPABILITIES` を更新し、各サービスを追加する。

## OpenAI GPT-5 系モデル仕様メモ（2025-12-03時点）
UI/実装の整合性確認用。Chat/Responses 両APIの必須パラメータ・許可値を下表に整理。

| model（モデルID）        | 利用可能API                                    | エンドポイント                                                         | 必須ボディ                                                | 推論パラメータ名                                                                          | 推論：可否/許可値                                          | 詳細度パラメータ名/許可値                                                                      | 出力上限パラメータ                                                                              | 特記事項                                                                                                                                             | ヘッダー（必須/任意）                                                                                                      |
| ------------------- | ------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| gpt-5.1             | Responses / Chat（両方）                       | `/v1/responses`<br>`/v1/chat/completions`                       | Responses：`model`,`input`<br>Chat：`model`,`messages` | Responses：`reasoning.effort`（`reasoning:{effort:...}`）<br>Chat：`reasoning_effort` | 対応：`none/low/medium/high`（`minimal`非対応、既定：`none`） | Responses：`text.verbosity`=`low/medium/high`<br>Chat：`verbosity`=`low/medium/high` | Responses：`max_output_tokens`<br>Chat：`max_completion_tokens`（`max_tokens`はdeprecated） | `gpt-5`を置換。`reasoning.effort`の最低設定が`none`で既定も`none`。また `temperature/top_p/logprobs` は **`reasoning.effort:none` のときのみ**対応（それ以外や他のGPT-5系に送るとエラー）。 | 必須：`Authorization: Bearer ...` / `Content-Type: application/json`<br>任意：`OpenAI-Organization` / `OpenAI-Project` |
| gpt-5-mini          | Responses / Chat（両方）                       | `/v1/responses`<br>`/v1/chat/completions`                       | Responses：`model`,`input`<br>Chat：`model`,`messages` | Responses：`reasoning.effort`<br>Chat：`reasoning_effort`                           | 対応：`minimal/low/medium/high`（`none`非対応、既定`medium`） | Responses：`text.verbosity`=`low/medium/high`<br>Chat：`verbosity`=`low/medium/high` | Responses：`max_output_tokens`<br>Chat：`max_completion_tokens`（`max_tokens`deprecated）  | GPT-5系の新パラメータ（verbosity等）に対応し、両APIで利用可能（ただしResponses推奨の旨あり）。                                                                                     | 必須：`Authorization` / `Content-Type`<br>任意：`OpenAI-Organization` / `OpenAI-Project`                               |
| gpt-5-nano          | Responses / Chat（両方）                       | `/v1/responses`<br>`/v1/chat/completions`                       | Responses：`model`,`input`<br>Chat：`model`,`messages` | Responses：`reasoning.effort`<br>Chat：`reasoning_effort`                           | 対応：`minimal/low/medium/high`（`none`非対応、既定`medium`） | Responses：`text.verbosity`=`low/medium/high`<br>Chat：`verbosity`=`low/medium/high` | Responses：`max_output_tokens`<br>Chat：`max_completion_tokens`（`max_tokens`deprecated）  | GPT-5系の新パラメータ（verbosity等）に対応し、両APIで利用可能（ただしResponses推奨の旨あり）。                                                                                     | 必須：`Authorization` / `Content-Type`<br>任意：`OpenAI-Organization` / `OpenAI-Project`                               |
| gpt-5               | Responses / Chat（両方）                       | `/v1/responses`<br>`/v1/chat/completions`                       | Responses：`model`,`input`<br>Chat：`model`,`messages` | Responses：`reasoning.effort`<br>Chat：`reasoning_effort`                           | 対応：`minimal/low/medium/high`（`none`非対応、既定`medium`） | Responses：`text.verbosity`=`low/medium/high`<br>Chat：`verbosity`=`low/medium/high` | Responses：`max_output_tokens`<br>Chat：`max_completion_tokens`（`max_tokens`deprecated）  | 旧フラッグシップで、`gpt-5.1`に置換される位置づけ。                                                                                                                   | 必須：`Authorization` / `Content-Type`<br>任意：`OpenAI-Organization` / `OpenAI-Project`                               |
| gpt-5.1-chat-latest | Responses（実測）                              | `/v1/responses`                                                | Responses：`model`,`input`                            | Responses：`reasoning.effort`                                                      | 対応：`medium` のみ（none/low/high は400）                     | Responses：`text.verbosity`=`medium` のみ                                      | Responses：`max_output_tokens`                                                          | 実測で reasoning/verbosity とも `medium` 以外は 400。Chat API は未検証。                                       | 必須：`Authorization` / `Content-Type`                                              |
| gpt-5-chat-latest   | **Responses 非対応（全組み合わせで400）**       | `/v1/responses`                                                | Responses：`model`,`input`                            | (非対応)                                                                            | (非対応)                                         | (非対応)                                                                             | (到達前に400)                                                                          | Chat API 専用の可能性。UI から外すか警告表示が必要。                                                       | 必須：`Authorization` / `Content-Type`                                              |
| gpt-5-pro           | Responsesのみ                                | `/v1/responses`                                                 | Responses：`model`,`input`                            | Responses：`reasoning.effort`                                                      | 対応：**`high`のみ**（固定）                                | Responses：`text.verbosity`=`low/medium/high`                                       | Responses：`max_output_tokens`                                                          | Responses専用。高難度向けで数分かかる場合があり、タイムアウト回避にbackground mode推奨。`reasoning.effort`は`high`固定。さらに **code interpreter非対応**。                                 | 必須：`Authorization` / `Content-Type`<br>任意：`OpenAI-Organization` / `OpenAI-Project`                               |
| gpt-5.1-codex       | Responsesのみ                                | `/v1/responses`                                                 | Responses：`model`,`input`                            | Responses：`reasoning.effort`                                                      | 対応：`low/medium/high`（`none`/`minimal`非対応、既定`medium`推奨） | Responses：`text.verbosity`=`medium` のみ                                      | Responses：`max_output_tokens`                                                          | Codex等の「エージェント的コーディング用途」向け。実計測で `reasoning:none` や `verbosity:low` は 400 エラー。Responses APIのみ。                                                                      | 必須：`Authorization` / `Content-Type`<br>任意：`OpenAI-Organization` / `OpenAI-Project`                               |
| gpt-5-codex         | Responsesのみ                                | `/v1/responses`                                                 | Responses：`model`,`input`                            | Responses：`reasoning.effort`                                                      | 対応：`low/medium/high`（`minimal/none`非対応）               | Responses：`text.verbosity`=`medium` のみ                                      | Responses：`max_output_tokens`                                                          | 実測: reasoning=minimal で400、verbosity=low/high で400。                                                     | 必須：`Authorization` / `Content-Type`<br>任意：`OpenAI-Organization` / `OpenAI-Project`                               |
| gpt-5.1-codex-mini  | Responsesのみ（実測）                        | `/v1/responses`                                                 | Responses：`model`,`input`                            | Responses：`reasoning.effort`                                                      | 対応：`low/medium/high`（`none/minimal`非対応）               | Responses：`text.verbosity`=`medium` のみ                                      | Responses：`max_output_tokens`                                                          | 実測: reasoning=none/minimal で400、verbosity=low/high で400。                                                | 必須：`Authorization` / `Content-Type`<br>任意：`OpenAI-Organization` / `OpenAI-Project`                               |
