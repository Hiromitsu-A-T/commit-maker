# Commit Maker（コミットメーカー） – コミットメッセージ自動生成 / Commit Message Generator  
![VS Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/Hiromitsu.commit-maker?label=Marketplace&logo=visualstudiocode) ![VS Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/Hiromitsu.commit-maker?logo=visualstudiocode&color=0aa6ff) ![Open VSX Downloads](https://img.shields.io/open-vsx/dt/Hiromitsu/commit-maker?logo=visualstudiocode&color=00c7b7)

Git の差分を読み取り、最適なコミットメッセージを自動生成して SCM 入力欄へ反映する VS Code 拡張（コミットメーカー / commit message generator）です。日本語・英語どちらでも生成できます。キーはすべてローカルの SecretStorage に保存され、サーバー側に記録を残しません。
(English) VS Code extension that reads your Git diff and auto-fills the SCM commit box with a generated message. Works in Japanese/English. API keys stay in local SecretStorage; nothing is sent to the server side.
SecretStorage は VS Code が提供するローカル暗号化ストレージで、APIキーはPCをまたいで同期されません（Settings Sync も無効）。API キーはこの領域からのみ読み書きします。
(English) SecretStorage is VS Code’s local encrypted store; API keys are not synced across machines (Settings Sync disabled) and are read/written only from there.

## レジュメ / Overview（コミット自動生成の要点）
- **BYOK 完全ローカル**: API キーは SecretStorage に暗号化保存。PC 内のみで共有され、Settings Sync には乗りません。（English: Keys are encrypted in VS Code SecretStorage, stay on the machine, not synced.)
- **プロンプトプリセットを GUI で複数保存/切替**: プロンプト本体・プリセット・アクティブ選択は全ワークスペース共通（globalState）。上限文字数も指定でき、超過時は先頭20%＋末尾80%を残して中央を省略。（English: Save and switch multiple prompt presets globally; you can set a max length and it keeps the first 20% + last 80% when truncating.)
- **差分を丸ごと扱う**: Staged / Unstaged / 未追跡 / バイナリを選択して連結取得（見出し付き）。デフォルトで未ステージ・未追跡も含めるため、コミット漏れを防止。（English: Collect staged/unstaged/untracked/binary diffs with headings; unstaged & untracked included by default to avoid missing files.)
- **コミットメッセージ自動生成**: Git の差分からワンクリックでコミット文を生成し、SCM 入力欄へ即反映。（English: One click generates the commit message from the diff and fills the SCM box.)
- **操作は二通り**: メインパネルで一連の操作を完結。SCM タイトルバーの杖アイコンからはパネルを開かず生成→反映。（English: Use the main panel flow or the SCM toolbar wand for one-click generate/apply.)
- **速くて安く試せるモデル構成**: 自分の API キーを持ち込む前提なので、既定はコスパ重視の Gemini `gemini-2.5-flash-lite` を推奨。必要に応じて OpenAI / Claude も同じ UI から即切替できます。※利用料は各プロバイダーの課金に従います。（English: BYOK only, so we default to the cost/latency-friendly Gemini `gemini-2.5-flash-lite`; you can switch to OpenAI or Claude instantly in the same UI. Usage is billed by each provider.)
- **UI 多言語対応 (19 言語)**: ja / en / zh / ko / es / fr / de / vi / th / my / hi / pt-BR / ru / ar / tr / id / it / pl / tl をワンクリック切替。選択は自動保存。（English: One-click switch among 19 languages; selection is remembered.)

## できること / What it does
- ステージ済み/未ステージ/未追跡の変更をまとめて読み込み、ワンクリックでコミット文を提案。
  (English) Load staged/unstaged/untracked changes together and propose a commit in one click.
- プロバイダー選択（Gemini / OpenAI / Claude）とモデル指定に対応。コストと速度から **Gemini `gemini-2.5-flash-lite` 推奨**（デフォルト）。
  (English) Supports Gemini/OpenAI/Claude with model selection; default is fast & low-cost `gemini-2.5-flash-lite`.
- 追加指示欄に「英語で短く」「絵文字なし」などチームのルールに合わせて自由に書ける。
  (English) Add custom instructions like "short in English" or "no emojis" to fit team rules.
- SCM ビューのタイトルバーにある杖アイコン（Generate）からも実行可能。パネルを開かなくても生成→適用まで完了。
  (English) Run from the SCM toolbar wand icon without opening the panel; generate and apply in one shot.
- プロンプトの保存・上書き・削除が可能。PC 内の全ワークスペースで共通（Settings Sync を除く）で保持し、デフォルトプリセットは常に残ります。
  (English) Save/overwrite/delete prompt presets shared across local workspaces (except Settings Sync); default presets always remain.

## よくある課題
- Copilot は個人向けに API キーを出さず、BYOK もエンタープライズのプレビューのみで手軽に自前キーを持ち込めない。
  (English) Copilot doesn’t provide personal API keys; BYOK is limited to enterprise preview.
- Cursor は自前キー（BYOK）を入れても Agent/Composer など主要機能が Pro/Business 向けに制限されるケースがある。
  (English) In Cursor, even with BYOK, Agent/Composer features can be restricted to paid plans.
- 多くの IDE 拡張はプロンプトが固定されており、GUI で複数プリセットを保存・切替できない。
  (English) Many IDE extensions have fixed prompts and no GUI to save/switch multiple presets.
- モデル／プロバイダーの変更が手間で、コスト・速度の最適化をすぐ試せない（高速モデルを選べず生成が遅くなる）。
  (English) Switching models/providers is cumbersome, so you can’t easily try faster/cheaper options.

## なぜ Commit Maker なのか（課題に対する解決策）
- **課題: 自前キーを使えない / 共有したくない**  
  → Commit Maker はユーザーの OpenAI / Gemini / Claude キーのみで動作し、SecretStorage にローカル保存。
  (English) Uses your own OpenAI/Gemini/Claude keys only; stored locally in SecretStorage.
- **課題: プロンプトを GUI で切替できない**  
  → プリセットの保存・上書き・削除をパネルで完結。PC 内全ワークスペース共通でワンクリック適用。
  (English) Save/overwrite/delete prompts in the panel; one-click apply across local workspaces.
- **課題: モデル／プロバイダー変更が面倒**  
  → 同じ UI で高速モデル（`flash-lite` など）と高精度モデルを即切替し、速度とコストを調整。
  (English) Switch fast/precise models in the same UI to balance speed and cost.
- **課題: ステージ済みだけ／差分が限定される**  
  → Staged / Unstaged / 未追跡 / バイナリを見出し付きで連結し、漏れを防止。長い差分は自動で中央省略。
  (English) Combine staged/unstaged/untracked/binary diffs with headings; long diffs auto-center-ellipsized.
- **課題: 作業フローが中断する**  
  → SCM タイトルバーの杖アイコンで「差分取得→生成→SCM 反映」を一発実行。画面遷移なしで完結。
  (English) Wand icon in SCM toolbar runs fetch diff → generate → apply without leaving SCM.

## 使い方（インストール済み前提）
1. アクティビティバーの **Commit Maker** を開く。
   (English) Open **Commit Maker** from the Activity Bar.
2. 上部の API キー欄で使いたいプロバイダーを選び、キーを保存（SecretStorage に暗号化保存）。
   (English) Choose a provider, save its API key (stored encrypted in SecretStorage).
   ※ すべて自分の API キーを持ち込む BYOK 方式です。利用料は各プロバイダーの課金体系に従います。  
   (English) BYOK only: you bring your own keys, and usage is billed by each provider.
3. パネル内の設定でプロバイダー/モデルを選択（推奨: Gemini → `gemini-2.5-flash-lite`）。必要なら追加指示を入力。
   (English) Pick provider/model (recommended: Gemini `gemini-2.5-flash-lite`) and add extra instructions if needed.
4. 「変更を読み込んで提案」で候補を生成。
   (English) Click “Load changes & propose” to generate candidates.
5. 気に入ったら「SCM へ反映」でコミットメッセージ欄へ自動入力。
   (English) Press “Apply to SCM” to fill the commit box.
   - SCM ビューのタイトルバーにある杖のボタンからも、同じ処理を一発で実行できます。
     (English) The wand icon in the SCM title bar runs the same one-click flow.

## カスタマイズ（主なポイントだけ）
- プロンプトプリセット: 保存/上書き/削除に対応。PC 内ワークスペース共通（Settings Sync は除外）。
  (English) Prompt presets can be saved/overwritten/deleted; shared across local workspaces (no Settings Sync).
- 差分の取り込み範囲: Staged / Unstaged / 未追跡 / バイナリを個別にオン・オフ。未追跡は未ステージとセットで取り込み。
  (English) Toggle staged/unstaged/untracked/binary inclusion; untracked is paired with unstaged.
- モデルと上限: 推奨モデルをプルダウンで選択、独自モデル名も入力可。プロンプト長は無制限/任意文字数で制御し、超過時は中央省略。
  (English) Choose recommended models or type custom; set prompt length limit with center-ellipsis truncation.
- OpenAI 追加設定: `reasoningEffort`, `verbosity` を UI から切替可能。
  (English) Switch OpenAI `reasoningEffort` and `verbosity` from the UI.
- 既定値と保存範囲: 初期プロバイダーは Gemini、モデルは `gemini-2.5-flash-lite`。未ステージ=オン / 未追跡=オン / バイナリ=オン がデフォルト。プロンプト本体・プリセット類は PC 内共通（globalState）に保存し、プロバイダーやモデル選択・差分範囲はワークスペース単位で保持。
  (English) Defaults: provider Gemini, model `gemini-2.5-flash-lite`; unstaged/untracked/binary on. Prompts/presets saved globally; provider/model/diff scope saved per workspace.
- プロンプト長の省略方法: 上限を超えると先頭20% + 末尾80%を残し、中央を `[..., <省略文字数> chars omitted...]` で省略します。
  (English) If prompt exceeds the limit, keep first 20% + last 80% and center-ellipsis the rest.

## 設定キー（主要なもの）
- `commitMaker.provider` / `model` / `endpoint*` … プロバイダーとモデル設定。
  (English) Provider/model and endpoint settings.
- `commitMaker.apiKeySecret*` … SecretStorage に保存するキー名。
  (English) SecretStorage key names for API keys.
- `commitMaker.reasoningEffort` / `verbosity` … OpenAI Responses の追加パラメータ。
  (English) Extra parameters for OpenAI Responses.
- `commitMaker.requestTimeoutMs` … LLM 呼び出しタイムアウト (ms)。
  (English) LLM request timeout in ms.
- `commitMaker.logLlm` … LLM リクエスト/リトライを Output チャネルへ記録（デフォルト off）。
  (English) Log LLM requests/retries to Output (default off).
※ プロンプト本体・プリセット類は PC 内で共通保存（globalState）、その他はワークスペース単位。
  (English) Prompts/presets are saved globally (local machine); other settings are per workspace.

## スクリーンショット
メインパネル（プロバイダー選択・差分読み込み・生成結果までを表示）
![Commit Maker パネル / Commit message generator panel](https://raw.githubusercontent.com/Hiromitsu-A-T/commit-maker/main/media/panel.png)

上部でプロバイダー別 API キーを保存・マスク表示。プロンプトは複数プリセットを保存/切替でき、生成結果をその場で確認できます。

SCM ビューのタイトルバーにある Generate（杖アイコン）ショートカット
![SCM タイトルバーのショートカット / SCM toolbar button](https://raw.githubusercontent.com/Hiromitsu-A-T/commit-maker/main/media/scm-toolbar.png)

パネルを開かなくても、常にこのアイコンから差分取得→生成→SCM 反映まで実行できます。

## 設定の場所
- ほとんどの設定はパネル内で完結します。より細かな既定値は VS Code の設定 (`⌘,` →「Commit Maker」) から変更できます。
  (English) Most settings live in the panel; advanced defaults are in VS Code settings (⌘, → "Commit Maker").

## 動作環境とプライバシー
- VS Code 1.94 以降、Git リポジトリ上で動作。
  (English) Requires VS Code 1.94+ on a Git repo.
- API キーは SecretStorage にのみ保存。差分は選択した LLM プロバイダーへ送信されますが、拡張自体はログを外部送信しません。
  (English) API keys stay in SecretStorage; diffs go to the chosen LLM provider; the extension sends no external logs.

## ライセンス
Apache-2.0
