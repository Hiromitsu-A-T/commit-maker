# Commit Maker 保守レビュー・機能検証記録

検証日: 2026-10-05〜06。対象: 開始時のワークツリーを含む 0.12.2。教材としての責務・構造・命名・コメントも最終コードで見直した。

V / T / L とファイル別の修正数は0.12.2でのレビュー履歴である。公開依頼に基づく統合・配布物・公開後の検証は、末尾のバージョン別記録に示す。0.18.2では実クラウドAPI・実Codexアカウント・実GGUF推論も確認した。

## 範囲と完了条件

開始時の Git 管理ファイル 191 個を一覧化した。手書きの保守対象は 171 個、生成物は 9 個、統計生成物は 2 個、バイナリー資産は 9 個だった。外部ライブラリー（node_modules）と out、NLS の一時コピー、VSIX、ブラウザー出力は生成物として扱う。

開始時から存在した 11 ファイルの変更を基準としてレビューした。モデル説明カードなどの追加内容を維持し、CSS は開始時から追加変更していない。新しい検査コードとこの記録も同じ一覧に含めた。削除・改名した元ファイルも判断を記録し、最後に Git の一覧と照合する。

現行の画面構成、5 provider、32 言語、設定キー・既定値、SecretStorage / Memento の保存契約、Codex の専用 CODEX_HOME、Local の明示ダウンロード、信頼済み workspace 限定の権限を維持した。自動コミットや公開操作は追加していない。既存の課金・契約を拡張側から変更する処理はない。V / T / L の検査では課金認証を使用していない。後述のAでは実接続の確認依頼に基づき、既存の認証を隔離環境で使った。

## 教材としての構造と命名

教材にできるコード品質を判断基準とし、呼び出し順序と状態の所有をコードから追えること、型で前提を示すこと、コメントが実装と一致して判断の理由を説明することを基準に修正した。

| 判断基準 | 最終コードでの対応 |
| --- | --- |
| 操作から結果まで入口をたどれる | 画面のイベント登録を 7 機能へ分け、パネルは 30 種類の要求を型の絞り込みが効く switch で処理する。 |
| 値の計算と副作用を区別できる | buildCommitPrompt を純粋関数へ抽出。controller は順序と状態、services は Git / HTTP / CLI / 保存を担当する。 |
| 同じ前提を二箇所で管理しない | 設定優先順、Local 呼び出し引数、転送進捗型、fetch のテスト復元を共有。単なる委譲関数と不要な closure は除去。 |
| 型と名前で対象が分かる | 復元済み内部状態を必須型にし、DOM の要素型と VS Code fixture の境界を明示。全手書き TS の明示的な any を除去した。 |
| コメントが判断の理由を説明する | draft、世代番号、設定範囲、検証後の置換、classic script の寿命を説明。値の反復、古い方針、誤った例外説明は除去。 |
| 修正の必要性と動作を示せる | 微小な文字数上限の不具合を境界テストで検査。プロンプト 192 ケースと全 runtime 資産の属性を変更前後で比較した。 |


- `extension.ts` は VS Code への登録と認証状態の入口。登録物の寿命は context が管理し、controller の dispose と認証確認の世代番号で終了後の仕事を止める。
- `CommitPanelProvider` は画面との境界。`panelBody` が HTML と bootstrap を作り、`panelMessageGuard` が受信値を検査し、`panelMessages` / `types` が通信契約を示す。CSP と JSON の escape は専用の短い処理に残す。
- `CommitController` は差分取得、プロンプト構築、生成、SCM 反映の順序と状態を管理する。I/O は services にあり、画面の DOM はここへ持ち込まない。世代番号は古い生成・モデル検査を見分けるために使い、SCM の対象と結果を結び付ける。生成開始時にパネルの設定を取得し、接続先・モデルの変更で進行中の生成を中止する。
- `diffCollector` は Git API を優先し、取得できなかった区分だけ CLI へ委譲する。`promptLimit` は文字数と Local digest、`commitPrompt` は言語・指示・差分の純粋な組み立ての責務。テスト名もこの責務と一致させた。
- `services/llm/` は provider ごとの送信・応答の変換を担当し、HTTP の期限・abort・再試行は `shared` を使う。モデル固有の許可値と既定値は能力表に残す。
- Local は「GGUF の保存」「runtime の取得」「server の寿命」を別のファイルで扱う。共通の転送 / hash だけを `fileDownload` にまとめ、sampling と起動調整は `localModelProfiles` に残す。
- `media/panel.js` はプレーン JS の画面入口。DOM の選択は `media/src/elements.ts` に一本化し、TS のヘルパーを classic script として `media/ui/` に生成する。実装と生成物を同時に手編集しない。
- 画面の draft は host の保存済み状態と別に持つ。キーの伏せ字を実キーとして送らないこと、遅い状態更新で入力途中の値を消さないことが目的。カスタムモデルの選択は候補との一致だけで判定しない。
- コメントは起動・キャンセル・保存範囲など「コードだけで分かりにくい理由」に使う。古い Codex 一括説明、抑止コメント、未使用の補助関数・空の blocklist を除去し、機能を増やすための抽象化は追加していない。

## 検証方法と証拠

V1–V11 は最初の保守修正、T1–T8 はその後の教材目的の見直し時点の検証である。L1–L5 は続いて実施した32言語の翻訳レビューと最終文言の検証を示す。T6 / T8 の文言一致は翻訳見直し前の結果であり、今回の翻訳修正は L に記録する。

Node 22.23.2 / npm 10.9.8、macOS ARM64、実 VS Code 1.131.0、headed Chromium で検証した。全検査の利用者可視データは一時 Git・専用 profile・架空 SecretStorage・専用 CODEX_HOME に隔離した。クラウドは HTTP 境界を fixture 応答へ置換し、実際のリクエスト形式、認証ヘッダー、応答、エラー、停止を検査した。Local 生成は実 HTTP 子プロセス、runtime の取得は実公開資産の SHA-256・展開・実行まで検査した。

| ID | 検査 | 結果・根拠 |
| --- | --- | --- |
| V1 | lint / 全手書き TS の型検査 | `npm run lint`、`npm run typecheck` 成功。拡張・画面・scripts を対象に未使用処理も検査。 |
| V2 | 単体テスト | `npm test` 成功。18 テストファイル、全 locale / NLS、HTTP、入力境界、保存、差分、profile、runtime 契約を含む。 |
| V3 | 統合テスト | `npm run test:integration` 成功。8 機能群、実 Git / HTTP / ファイル / 子プロセス、終了後のプロセス・イベント解放。 |
| V4 | 実ブラウザーの機能操作 | `node scripts/webview-smoke.cjs <隔離 URL>` 成功。5 provider、生成・SCM・キー・指示・プリセット・モデル・推論/詳細度・Local 管理。console error / warning 0、pageerror 0。 |
| V5 | 全言語・モデル・画面幅 | 32 言語 × 4 Local モデル × 320 / 480 / 1280px = 384 ケース成功。カード高 122px、横 overflow なし、ID 重複なし。日本語・英語・アラビア語等の画像も目視。 |
| V6 | 実 Extension Host | workspace と生成した VSIX の双方で成功。専用 VS Code profile、CLI の --wait に依存しない完了検出とプロセス解放、標準 Git API、実 SCM 入力欄へ `chore: 実VS Codeの検証` を反映。 |
| V7 | 実 runtime の取得・実行 | `npm run smoke:local:runtime` 成功。darwin-arm64 の b8967 / b9441 を一時領域へ取得し、SHA-256・展開・実行を確認。 |
| V8 | CI / 開発・配布補助 | `actionlint`、全履歴メール検査（146 commits）、stable / preview guard 11 ケース成功。週次の公開成功→main/tag の順序を検査。clean-out / VSIX 整理 / NLS 出し入れも隔離環境で成功。 |
| V9 | クリーン導入・本番ビルド・配布物 | `npm ci` 成功、`npm audit` 0 件。compile / build:media / NLS 生成 / vsce package 成功。VSIX 125 entries・NLS 32 言語・相対 require 解決・開発物 / .env 除外。NLS 一時コピーを掃除し、VSIX 5 個・root の VSIX 0 個を確認。 |
| V10 | 最終一覧の照合・差分 | 全ファイルに判断を記録。追加・削除・改名も照合し、欠け・重複 0、`git diff --check` 成功。 |
| V11 | 前回 VSIX との回帰比較 | 前回成果物で Local の遅い検査による上書き、生成時の設定混入、数値応答の TypeError を再現。修正後は該当単体・統合検査と画面操作が成功。0 / 空欄の上限解除と再試行中の即時中止も検査。 |

実行ログと画像は Git 管理外の `output/` に置く。`output/playwright/verification.json`、`output/native-vscode.json`、`output/package-verification.json`、`output/release-guards.json`、`output/maintenance-scripts.json` が対応する証拠。再監査の比較ログは `output/regression-before.log`、`output/regression-generation-before.log`、`output/regression-response-before.log`、修正結果の対照は `output/regression-verification.json`、最終の実行結果は `output/validation.json` に記録した。各 OS の runtime 選択は単体検査と CI の Ubuntu / macOS / Windows smoke 定義で確認し、実取得の実行結果はこの Mac の上記 2 系列として記録している。

## 教材目的の最終検証

| ID | 対象 | 最終コードでの結果・証拠 |
| --- | --- | --- |
| T1 | 静的検査 | lint / 拡張・画面・scripts の型検査が成功。明示的な any 0、抑止を追加せずに型の境界を表現。`output/teaching-lint.log` / `teaching-types.log`。 |
| T2 | 単体・統合 | 18 テストファイルと 8 統合機能群が成功。上限 1 / 2 / 6、認証、保存、生成、Git、Local、停止・終了を含む。`output/teaching-unit.log` / `teaching-integration.log`。 |
| T3 | 実ブラウザー | 5 provider の操作、不正な状態の拒否、通知の置換・期限、384 表示ケースが成功。console error / warning と pageerror は 0。日本語 320px と英語の画像も目視。`output/playwright/verification.json`。 |
| T4 | 本番ビルド・VSIX | compile / build:media / build:nls / package 成功。126 entries、NLS 32 言語、67 非テスト JS モジュールと生成元が一致。testSupport・秘密情報・開発物なし。root VSIX / 一時 NLS は 0、VSIX は 5 個。`output/teaching-package-verification.json`。 |
| T5 | 実 VS Code | workspace / VSIX とも SCM 反映と終了時の掃除に成功。最初の実行では終了待機が短く掃除判定が失敗したため、期限付き待機を修正して両方を再検証。`output/teaching-native-vscode.json`。 |
| T6 | 変更前後の契約比較 | 32 言語 × 2 指示 × 3 差分 = 192 プロンプトが完全一致。4 モデルの定義・profile、2 runtime 系列の全 12 資産の属性も一致。`output/teaching-prompt-parity.json` / `teaching-local-parity.json`。 |
| T7 | ファイル・説明の照合 | 現存の手書き 184 ファイル、削除済みも含む全 207 パスをレビュー記録と照合。欠け・余り・重複 0、文書のファイル参照と git diff --check が成功。`output/teaching-inventory.json`。 |
| T8 | 保持する契約と隔離 | 教材見直し開始時と package・設定・CSS・全 locale / NLS 等 79 ファイルが byte 一致。利用者の認証・データを使用せず、一時データと専用プロセスを終了。`output/teaching-contract-verification.json` / `teaching-validation.json`。 |

クラウド応答・Codex のログイン・Local 生成は fixture で検証した。課金を伴う実クラウド API、実 Codex アカウントの認証、実 GGUF による推論、Windows / Linux の実画面は今回の確認範囲に含めない。runtime の実取得・実行は V7 の macOS ARM64 の結果であり、T6 はその資産選択が変わっていないことの比較である。384 ケースは表示検証で、全機能の総当たり検証を意味しない。

## 32言語の逐次レビュー

翻訳見直しは上表の V / T の検証後、利用者の依頼により実施した。下表の順に1言語ずつ、Webview 144項目と VS Code NLS 8項目の全文を読み、文法・語法・用語・操作の意味を確認した。32言語で計4,864項目を確認し、UI 1,189項目と NLS 39項目を修正した。自然で正確な既存文言は保持した。

タイトル50文字以内、本文各行72文字以内、箇条書きの開始記号、Conventional Commits、事実のみ、選択言語での出力という条件を保持した。文字数上限の説明は、元の差分の20%／80%ではなく、設定した上限の20%を先頭から、80%を末尾から残す動作を説明する。OpenAI Responses API、Claude Messages API、llama.cpp によるローカル実行、APIキーの Commit Maker 内での保存という実装に合わせ、古い世代・同梱限定・設定画面での保存という記述を直した。

以下の修正数は文言キーの数であり、複数行の既定プロンプトは1項目として数える。すべての言語で144項目と8項目を確認済み。各言語の語順や名詞の性を個別に確認し、Git・SCM・API・モデルIDなどの識別名は保持した。

| 順序 | 言語 | UI修正 | NLS修正 | 主な確認・修正 |
| --- | --- | --- | --- | --- |
| 1 | 日本語（ja） | 33 | 2 | SCM ボタンと説明を一致。バイナリ判定・20/80% の上限説明・認証の助詞・メッセージ生成の用語を修正。古い API 世代・同梱限定の説明を実装に整合。 再確認: ログアウト先を認証方式ではなく専用セッションとして表現。 |
| 2 | 英語（en） | 24 | 1 | 英語の不自然な bullet body / commit box / locked, editable を修正。生成する対象を commit message と明確化。上限説明・API 世代・Local 実行方式を整合。 再確認: Signed out of authentication の不自然さを session へ修正し、省略される中間部分を明記。 |
| 3 | 中国語（簡体字）（zh） | 35 | 2 | 簡体字の提供商・提交消息・差异を統一。「另存为新建」と既定プリセットの説明を自然かつ正確に修正。50/72 は字ではなく字符として契約維持。全144キーとNLS8キーを確認。 |
| 4 | 中国語（繁体字）（zh-TW） | 39 | 1 | 繁体字の產生・提示詞・預設集を統一。暫存檔案（temp file）をステージ済みの変更へ修正。台湾語彙を維持し、字元の上限とプリセットの覆寫制約を明確化。 再確認: 専用の別アカウントが必要と誤解しないよう、帳戶 から 工作階段 へ修正。 |
| 5 | 韓国語（ko） | 42 | 1 | 韓国語の不自然なステージング受動形・疑い表現・動的ラベルの助詞を修正。사용자 지정 と変更内容を統一し、通知を完了文にした。指示の行幅・互換性変更の意味とNLSを確認。 再確認: ログアウト先を認証方式ではなく専用セッションとして表現。 |
| 6 | スペイン語（es） | 39 | 1 | preajuste の表記、生成・結果の見出し、日付を含む通知、破壊的変更の訳、文字数上限の意味を修正。API とローカル実行環境の説明を現行実装に合わせた。 |
| 7 | フランス語（fr） | 40 | 1 | préréglage、制御欄の名称、冠詞と前置詞、日付通知、フランス語の文字数・互換性説明を修正。API と実行環境の古い説明を更新。 |
| 8 | ドイツ語（de） | 37 | 2 | Commit-Nachricht と Vorlage の名称、SCMへの反映表現、丁寧形、複合語、日時通知を修正。文字数上限・API・実行環境の説明を現行動作に合わせた。 再確認: Sicherheit の安全性との曖昧さを除き、Selbstsicherheit で自信の表明を説明。 |
| 9 | オランダ語（nl） | 30 | 1 | 合成語、Generatie、voorinstelling、本文の説明、SCMボタンと説明の一致、日時通知を修正。文字数制限とAPI・実行環境の記述を確認・更新。 |
| 10 | スウェーデン語（sv） | 38 | 1 | Verkställ till の不自然な前置詞、förinställning、名詞見出し、säkerhetsuttryck の誤訳、冠詞、動的ラベルの性一致と日時表現を修正。説明と文字数条件も確認・更新。 |
| 11 | デンマーク語（da） | 39 | 1 | u-sporet の綴り、SCM操作の前置詞、見出し、forudindstilling、信頼表明の誤訳、API応答の冠詞と日時を修正。文字数条件と現行API・実行環境を確認・更新。 |
| 12 | ノルウェー語（ブークモール）（nb） | 33 | 1 | 待機を示す Tomgang、SCM操作、prompt/ledetekst の混在、複合語、信頼表明の訳、冠詞と日時を修正。文字数条件とAPI・実行環境の説明を確認・更新。 |
| 13 | ベトナム語（vi） | 48 | 1 | khóa API・mô hình・tệp の表記を統一し、staging、待機、上限、本文の改行幅の誤訳、通知の完了形を修正。API・実行環境説明も更新。 |
| 14 | タイ語（th） | 31 | 1 | อักขระ による文字数、staging の状態、既定値の上書き制限、完了通知、Conventional Commits の名称を修正。API・実行環境と差分短縮の意味も合わせた。 |
| 15 | ミャンマー語（my） | 47 | 2 | NLSに混在した別言語の文字、命令形の不自然な訳、ခေါင်းစဉ် の綴り、staging、API key、空応答・取り消し・再試行の語順を修正。条件と現行API・実行環境を確認・更新。 |
| 16 | ヒンディー語（hi） | 38 | 2 | API कुंजी の女性形、LLM से の助詞、進行形、प्रीसेट の表記、既定プロンプトの上限と自然な本文表現を修正。API・保存先・実行環境説明も更新。 |
| 17 | ベンガル語（bn） | 35 | 1 | 命令形を述語とした誤訳、বুলেট বডি、所有形、プロバイダーへの保存と誤解する文言、完了形を修正。文字数・互換性・現行API・実行環境を確認・更新。 |
| 18 | タミル語（ta） | 45 | 1 | binary の意味を変えていた「自然」の語、本文を身体とする直訳、staging、reasoning、敬体と助詞、更新時の受動形を修正。文字数条件、API・保存先・実行環境も確認・更新。 |
| 19 | ポルトガル語（ブラジル）（pt-BR） | 42 | 1 | chave と predefinição の女性形、Provedor/Personalizado、ブランド名の前置詞、名詞見出し、ブラジル語指定、日時通知を修正。文字数条件・API・保存先・実行環境説明も更新。 |
| 20 | ロシア語（ru） | 32 | 1 | модель の女性形、шаблон、独立したログインの表現、動的ラベルの性一致、日時と単位の空白を修正。文字数条件、API・実行環境説明も更新。 |
| 21 | ウクライナ語（uk） | 32 | 1 | промпт と шаблон の用語、本文の格・行の性一致、独立した認証の言い方、動的ラベルの性一致、日時を修正。文字数・API・実行環境も確認・更新。 |
| 22 | アラビア語（ar） | 36 | 2 | commit を一般語「義務」とした直訳、المطالبة の用語、動的ラベルの性一致、結果の女性形、ログインセッションと原文表現を修正。文字数・API・保存先・実行環境も更新。 |
| 23 | ヘブライ語（he） | 38 | 1 | ויצור と שמֵר の形、SCM操作の前置詞、上書きの直訳、תבנית の女性形、動的ラベルと日時を修正。文字数条件とAPI・保存先・実行環境も確認・更新。 再確認: ログアウトの完了を、認証やプロセス起動からの退出ではなく Codex からの切断として表現。 |
| 24 | ペルシア語（fa） | 35 | 1 | 提供元を سازنده（作り手）とした不一致、壊れた変更という直訳、پرامپت、敬体、ログイン状態の述語、日時の語順を修正。文字数・API・保存先・実行環境も更新。 |
| 25 | トルコ語（tr） | 33 | 1 | SCM’ye の接続辞、İstem・Ön ayar・İzlenmeyen の用語、kırıcı の直訳、50文字ちょうどとする指示、日時の語順を修正。API・保存先・実行環境も更新。 |
| 26 | インドネシア語（id） | 41 | 2 | kunci API、berkas、staging、Kesalahan、Bawaan を揃え、本文の幅、自然な受動形とHTTPS表現を修正。文字数条件、API・保存先・実行環境も更新。 |
| 27 | イタリア語（it） | 32 | 1 | corpo avvolto の直訳、名詞見出し、SCMへのコピー、冠詞、Conventional Commits の名称、日時を修正。文字数条件、API・保存先・実行環境も確認・更新。 再確認: SCM の冠詞を不自然に付けず、入力欄へのコピーを明記。 |
| 28 | ポーランド語（pl） | 40 | 1 | preset・commit の格、ciało の直訳、生成見出し、再帰動詞、取り消しと発見失敗の受動形、日時を修正。文字数条件とAPI・保存先・実行環境も更新。 |
| 29 | ルーマニア語（ro） | 37 | 1 | 生成前を未記録とした誤訳、cheie と presetare の女性形、本文・箇条書きの表現、diff の格、日時を修正。文字数・API・保存先・実行環境も確認・更新。 |
| 30 | タガログ語（Filipino）（tl） | 43 | 1 | Wala sa ginagawa、nakabalot の直訳、名詞見出し、複数形・連結辞、staging、HTTPSの主語と日時を修正。文字数・API・保存先・実行環境も確認・更新。 |
| 31 | スワヒリ語（sw） | 39 | 1 | ufunguo の名詞クラス一致、vibambo（文字）、mwili・vidokezo の直訳、必要時の条件、取り消しと削除の区別、prefix の説明、日時を修正。API・実行環境も更新。 再確認: キーを保存する命令を明確な直接表現に修正。 |
| 32 | ウルドゥー語（ur） | 36 | 1 | بلٹ باڈی・confidence notes の直訳、トークンと費用の語、所有形、完了・進行・失敗の受動形、SCMへのコピーを修正。文字数条件とAPI・保存先・実行環境も更新。 |

| ID | 検査 | 結果・証拠 |
| --- | --- | --- |
| L1 | 文言・キー・置換契約 | 32言語を逐次レビュー。144 UIキーと8 NLSキー、重複なし、非空、置換文字列の種類と出現数を確認。既定プロンプト7行と50／72文字条件も確認。個別記録は output/translation-review/<言語>.json。 |
| L2 | 静的・単体・統合検査 | lint・typecheck・単体18ファイル・統合8機能群が成功。各ログは output/translation-review/ に保存。 |
| L3 | 本番ビルドと配布物 | compile・build:media・build:nls・VSIX生成が成功。126 entries、32言語のNLSと67個のJSモジュールが生成元と一致。一時NLS・root VSIXは0、保管VSIXは5個。output/translation-review/package-verification.json。 |
| L4 | 最終文言の実画面 | 5 provider の操作と32言語×4モデル×3幅の384ケースが成功。console error / warning と pageerror は0。32言語のSCMボタン・既定プロンプト・モデル説明が辞書と一致。全言語の画像を保存し、ar・he・fa・ur・my・ta・de・plを目視。output/translation-review/browser-final.json / render.json。 |
| L5 | 変更範囲・記録の照合 | 翻訳開始時の202ファイルと比較。変更は64翻訳ファイルとこの記録の計65ファイル、ほか137ファイルはbyte一致。UI文言以外の構文・キー・置換契約を保持。全207パスの記録に欠け・余り・重複なし。output/translation-review/scope.json / inventory-verification.json。 |

検証は一時 Git・架空 SecretStorage・専用 Codex 認証領域を持つ隔離環境で行う。外部の翻訳APIや利用者のクラウド認証・課金は使用していない。VSIXはローカル検証用として更新し、コミット・push・公開は行っていない。

L1–L5の総合結果は output/translation-review/verification.json に記録する。画面の検証は現行の配置・省略表示を含む。自然さの確認は各文言を読んだレビュー結果であり、母語話者による認定を意味しない。

## 機能ごとの確認・修正・検証表

| 機能 | 確認した契約・不具合の根拠 | 対応と結果 |
| --- | --- | --- |
| 起動・provider / model の復元 | 明示したモデルが起動時に候補へ戻されていた。保存済み provider の検査も必要。 | カスタムモデルと設定優先を保持、Local の旧 ID 移行を維持。V1–V3・V6 成功。 教材見直し: 明示設定の優先順と Codex reasoning の復元を共有し、正規化済みの状態を型で示す。T1・T2・T5 成功。 |
| キー保存・削除・状態更新 | render が入力を消し、伏せ字を再保存できた。遅い確認が新しい保存結果を上書きした。 | draft と保存ボタンを制御、認証確認の世代を検査。コマンド保存後も更新。V2–V4 成功。 教材見直し: 認証イベントの購読も拡張終了時に解除。T1・T2・T3・T5 成功。 |
| 画面とカスタムモデル | 「Custom」を選ぶと候補と同じ ID の echo で欄が閉じた。空欄入力にも古い状態が戻った。 | 明示選択と draft を保持。候補選択時は通常表示へ復帰。V4 の回帰操作成功。 教材見直し: イベント入口を機能別に整理し、状態の whitelist を host に一本化。不正な状態で画面を変えない。T1・T3 成功。 |
| 指示・プリセット・言語 | 非同期 render で入力中の指示 / 名前が消える。host 再描画と client 再読込が重複。toast の予約が終了後に動く。 | 入力途中を保持し、保存 / 適用 / 削除で draft を確定。toast を置換時・終了時に解除。V2–V5 成功。 教材見直し: 言語更新を setLanguage へまとめ、同じ通知でタイマーを増やさない。保存結果の共通型と比較の分岐も整理。T1–T3 成功。 |
| 文字数制限 | 文言では 0 / 空欄で解除できるが、入力境界が拒否し以前の上限が残った。 | 0 / null は入力モードを維持して上限だけを解除。認証の状態更新が重なっても空欄の制限へ入力できる。V2–V4 成功。 教材見直し: 上限 1 の slice(-0) による全差分保持も修正。1 / 2 / 6 の保持内容と省略数を追加検査。T1・T2・T3 成功。 |
| Git 差分 | 実 Git API の no-arg diffWithHEAD は Change[]。区分ごとの fallback 不足、引用 path、4MiB buffer で差分欠落。 | repo.diff(cached) を優先、区分ごとに CLI、NUL status。実 Git 5MiB・非 ASCII・空白・..memo を検証。V2・V3・V6 成功。 教材見直し: 取得区分から API / CLI の双方を決め、拡張子の表は一度作る。パスの意味が分かる名前へ変更。T1・T2・T5 成功。 |
| 生成・SCM・キャンセル | 古い生成が別 repo へ結果を適用する競合。差分取得後に新しい provider / 指示を読むため設定が混ざった。 | 自分の生成成功だけを適用。開始時の設定 / signal を保持し、provider / model 切替時に中止。自動コミットなしを検査。V2–V4・V6・V11 成功。 教材見直し: buildCommitPrompt を純粋関数へ抽出。signal を生成開始の戻り値へ持たせ、同じエラー処理を統一。192 プロンプトも一致。T1–T3・T5・T6 成功。 |
| OpenAI / Gemini / Claude | 環境変数関数の重複、OpenAI 事前確認の期限 / cache、不正応答の盲目的な string キャスト、再試行の誤判定を確認。 | 名前を一本化。共通の期限と認証別 cache。JSON を unknown から検査し既存の応答形式を保持。HTTP status と通信 cause.code で再試行し、待機も abort で中止。V1–V4・V11 成功。 教材見直し: 一度だけ使う closure と不要キャストを除去。共通引数と直接の provider 分岐で送信先までたどれる。T1–T3 成功。 |
| Codex 認証・生成 | CLI と専用 CODEX_HOME、reasoning / schema / logout を確認。 | 既存認証方式を保持。架空 CLI の実子プロセスと実 Extension Host で契約を検証。V2–V4・V6 成功。 教材見直し: 互換応答の JSON 検査と一度だけの整形へ整理。送信・CLI・専用認証方式は保持。T1–T3・T5 成功。 |
| GGUF / runtime の取得 | manual stream が 2 箇所に重複。書き込みエラー・中止・SHA 検証の責務を確認。 | pipeline / hash を共有し、404 / EISDIR / 中止を回帰検査。既存 URL・SHA・保存契約を維持。V2–V4・V7 成功。 教材見直し: 進捗型と候補パスを共有し、OS から決まる属性の重複指定を解消。全 12 資産の属性が一致。T1・T2・T6 成功。 |
| Local server・接続確認・モデル管理 | 並行起動、遅いモデル検査の上書き、接続確認 / 削除中の切替、終了後の更新を確認。 | 起動 Promise と検査の世代を管理。接続確認 / 削除中は上下のモデル選択と生成を保護。ready snapshot と abort / timeout を通し、1 PID・終了後 PID 不在を検査。V3・V4・V11 成功。 教材見直し: 接続確認と生成の Local 引数を同じ型・取得処理から渡す。既存の操作と model snapshot を検査。T1–T3・T6 成功。 |
| 能力表・profile・多言語 | 空の blocklist、未使用 render、旧コメント、locale / NLS 登録を確認。 | 無効な分岐だけ除去し許可値と profile を維持。32 言語をファイル単位で静的検査・実表示検査。V1・V2・V5 成功。 教材見直しでは文言を保持して T1–T3・T6・T8 が成功。その後の翻訳見直しでは4,864文言を逐次確認し、用語・語法・操作説明の1,228文言を修正。L1–L5 成功。 |
| CI・配布・文書 | Node と dev dependency、週次 push の順序、実装と説明の不一致。 | Node 22、lint / 全 TS / 統合検査を追加。公開成功後に main / tag を更新。配布物の実起動も成功。V1–V3・V6・V8・V9 成功。 教材見直し: 新しいテスト補助を配布から除外し、レビュー・検証記録を整合。TS の any を禁止し、型付きの検証補助へ整理。T1・T4・T5・T7 成功。 |

## 手書き保守対象のファイル別レビュー

各行をレビュー済みとし、問題がないファイルは変更理由を作らず維持した。教材見直しで変更したファイルは T の検証を併記し、変更のないファイルは既存判断と見直し開始時の内容の一致を照合した。locale と NLS は、その後の32言語の逐次レビューも反映した。用語・語順・文法・操作説明の根拠を言語別に記録し、構造・キー・置換契約を保持した。

| ファイル | 役割 | レビュー結果・根拠 | 検証 |
| --- | --- | --- | --- |
| `.gitattributes` | 既存 CRLF を含む差分検査の指定 | 追加。改行変換をせず、CRLF と Markdown の意図した改行を検査規則で扱う。 | V10 |
| `.githooks/pre-push` | push 前のメール検査 | 変更なし。push 範囲を検査スクリプトへ渡す短い入口。 | V8 |
| `.github/FUNDING.yml` | 支援先の設定 | 変更なし。コードの動作・権限と独立した公開設定。 | 設定レビュー |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | 不具合報告の入力項目 | Codex を既存プロバイダー一覧へ追加し、実装との不一致を修正。 | 設定レビュー |
| `.github/ISSUE_TEMPLATE/config.yml` | Issue の連絡先と作成設定 | 変更なし。既存の公開窓口への参照を維持。 | 設定レビュー |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | 機能要望の入力項目 | プロバイダー選択へ欠けていた Codex を追加。 | 設定レビュー |
| `.github/dependabot.yml` | npm / Actions の更新設定 | 変更なし。更新対象・頻度・PR 設定を維持。 | V8 |
| `.github/pull_request_template.md` | レビュー時の確認項目 | 追加した lint・全 TS 型検査・画面ビルド・統合テストを反映。 | V1–V3 |
| `.github/workflows/_publish-core.yml` | stable / preview 共通の配布処理 | Node 22 と静的・統合検査を追加。権限・公開先・チャネル条件を維持。 | V8・V9 |
| `.github/workflows/ci.yml` | PR / main の検査 | 拡張以外の TS と画面生成、隔離統合検査も CI 対象へ追加。 | V1–V3・V8 |
| `.github/workflows/metadata-guard.yml` | コミットメールの検査 | 開発依存の実行環境に合わせ Node 22 へ更新。 | V8 |
| `.github/workflows/publish-preview.yml` | preview の手動起動入口 | 変更なし。奇数 MINOR・タグ禁止は共通処理で検査。 | V8 |
| `.github/workflows/publish.yml` | stable のタグ起動入口 | 変更なし。タグと package version の一致を共通処理へ委譲。 | V8 |
| `.github/workflows/update-badges.yml` | 公開統計の更新 | Node 22 へ統一。スケジュール・権限・公開成功トリガーを維持。 | V8 |
| `.github/workflows/weekly-patch-publish.yml` | 週次 stable PATCH の配布 | 静的・統合検査を追加。両ストア成功後に main / tag を更新する順序へ修正。 | V8 |
| `.gitignore` | 保守対象とローカル生成物の区分 | ブラウザーのログ・画像を除外。既存の .env / VSIX 除外を維持。 | V9・V10 |
| `.npmignore` | npm パッケージからの開発物除外 | 検証設定・記録・生成物に加え、共有テスト補助 out/testSupport.js も配布から除外。 | V9・T4 |
| `.vscode/launch.json` | Extension Host の開発起動 | 変更なし。workspace の out と拡張開発パスを使用。 | V6 |
| `.vscodeignore` | VSIX からの開発物除外 | 検証設定・記録・秘密情報・テストを除外。共有テスト補助 out/testSupport.js も VSIX に含めない。 | V9・T4 |
| `AGENTS.md` | 開発・配布・設定契約のガイド | 実装・検証・配布手順を整合させ、レビュー・検証記録の参照先を追加。 公開統合: 最新の初期モデルとprovider順を保持。 実接続見直し: Codex の認証方式別の既定モデルと Local 資産確認コマンドを整合。 CLI更新確認: CodexのGPT-6候補を除外する前に現行CLIで検証する方針を明記。 | V1–V11・T7・R1・R2・R3・A2・A3・A5・C1–C4 |
| `CODE_OF_CONDUCT.md` | 参加者の行動指針 | 変更なし。実行コードと独立した既存の運用文書。 | 文書レビュー |
| `CONTRIBUTING.md` | 開発準備と検証の入口 | 開発・隔離検証の入口を整理。構造・配布・検証の詳細は AGENTS.md へ案内。 | V1–V6・T7 |
| `LICENSE` | Apache-2.0 本文 | 変更なし。法的な定型本文は編集しない。 | 文書レビュー |
| `NOTICE` | 著作権表示 | 変更なし。LICENSE / package の表記との関係を確認。 | 文書レビュー |
| `README.md` | 利用者向けの機能・設定説明 | SecretStorage / 環境変数、データ送信、生成ボタン、設定範囲の説明を実装に合わせ修正。 公開統合: 最新のモデル候補・初期設定の説明を保持。 実接続見直し: OpenAI と Codex の初期モデルを分け、公開説明を実装へ整合。 CLI更新確認: CodexのGPT-6 Luna初期選択とCLI 0.157.0以降の条件・更新方法を整合。 | V4–V6・V9・R1・R2・R3・A2・A6・C1–C4 |
| `SECURITY.md` | 脆弱性の連絡・公開方針 | 変更なし。公開窓口と秘密情報の扱いを維持。 | 文書レビュー |
| `SUPPORT.md` | 利用時の問い合わせ先 | 既存の Codex provider を対応一覧へ追加。 公開統合: 現行のprovider順とCodexの記載を保持。 | 文書レビュー・R1・R2・R3 |
| `docs/maintenance-review.md` | 全対象のレビュー・検証記録 | 全対象の役割・改善理由・機能別検証に加え、32言語の逐次レビューを記録。V / T / L の段階と証拠を区別し、新旧ファイルの照合を示す。 実接続見直し: fixture と実サービスの確認を区別し、不備の再現・修正・検証範囲を記録。 CLI更新確認: 同じ認証・同じ拡張コードで旧CLIと現行CLIの結果を比較し、判断を訂正。 | V10・T7・L5・P1–P5・A1–A7・C1–C4 |
| `eslint.config.cjs` | 手書き JS / TS の lint | 手書き JS / TS と実行環境を区分。生成物を除き、未使用処理と明示的な any を検査する。 | V1・T1 |
| `i18n/package-nls/package.nls.ar.json` | VS Code コマンド文言（ar） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。2文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.bn.json` | VS Code コマンド文言（bn） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.da.json` | VS Code コマンド文言（da） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.de.json` | VS Code コマンド文言（de） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。2文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.es.json` | VS Code コマンド文言（es） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.fa.json` | VS Code コマンド文言（fa） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.fr.json` | VS Code コマンド文言（fr） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.he.json` | VS Code コマンド文言（he） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.hi.json` | VS Code コマンド文言（hi） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。2文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.id.json` | VS Code コマンド文言（id） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。2文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.it.json` | VS Code コマンド文言（it） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.ja.json` | VS Code コマンド文言（ja） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。2文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.ko.json` | VS Code コマンド文言（ko） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.my.json` | VS Code コマンド文言（my） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。2文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.nb.json` | VS Code コマンド文言（nb） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.nl.json` | VS Code コマンド文言（nl） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.pl.json` | VS Code コマンド文言（pl） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.pt-br.json` | VS Code コマンド文言（pt-br） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.ro.json` | VS Code コマンド文言（ro） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.ru.json` | VS Code コマンド文言（ru） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.sv.json` | VS Code コマンド文言（sv） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.sw.json` | VS Code コマンド文言（sw） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.ta.json` | VS Code コマンド文言（ta） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.th.json` | VS Code コマンド文言（th） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.tl.json` | VS Code コマンド文言（tl） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.tr.json` | VS Code コマンド文言（tr） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.uk.json` | VS Code コマンド文言（uk） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.ur.json` | VS Code コマンド文言（ur） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.vi.json` | VS Code コマンド文言（vi） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.zh-cn.json` | VS Code コマンド文言（zh-cn） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。2文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `i18n/package-nls/package.nls.zh-tw.json` | VS Code コマンド文言（zh-tw） | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `media/commit-maker-activitybar.svg` | Activity Bar のアイコン | 変更なし。XML と viewBox、実行スクリプトなしを確認。 | 資産レビュー |
| `media/commit-maker-store.svg` | ストア画像の制作元 | 変更なし。XML と埋め込み画像を確認。UI ロジックと独立。 | 資産レビュー |
| `media/commit_maker_SNS.svg` | SNS 画像の制作元 | 変更なし。XML と埋め込み画像を確認。UI ロジックと独立。 | 資産レビュー |
| `media/panel.css` | 本番画面のレイアウト | 開始時の変更をそのまま保持。追加変更なし。122px のモデルカードと幅別表示を確認。 | V4・V5 |
| `media/panel.js` | DOM のイベントと状態描画 | 機能別のイベント登録へ分割し、単純な委譲関数と状態キーの二重定義を除去。draft を維持し、不正な host 状態を拒否。通知タイマーは置換時に解除する。 | V4・V5・T1・T3 |
| `media/src/dom.ts` | DOM 操作の共通関数 | 操作可能な DOM 型を引数に使い、後からの広いキャストを除去。classic script の理由を説明。 | V1・V4・T1・T3 |
| `media/src/elements.ts` | 画面 ID と型付き要素取得 | DOM ID と要素型を取得箇所で対応付け、キャストを一箇所の境界へまとめた。開始時の Local 要素も保持。 | V1・V4・T1・T3 |
| `media/src/events.ts` | input / change の小さな共通処理 | 既存の登録補助を維持し、classic script と Node/browser の境界を正確なコメントで説明。 | V1・V4・T1・T3 |
| `media/src/events/model.ts` | 旧モデルイベントの別実装 | 削除。本番の読み込み・呼び出しがなく panel.js と重複していた。 | 参照検索・V4 |
| `media/src/events/preset.ts` | 旧プリセットイベントの別実装 | 削除。本番の読み込み・呼び出しがなく panel.js と重複していた。 | 参照検索・V4 |
| `media/src/render.ts` | 状態と認証バッジの描画 | 実際の共通型を使用。未使用の推論・詳細度描画と重複型を削除。 | V1・V4 |
| `media/src/state.ts` | 画面状態の複製・統合 | 状態の浅い統合という責務を保ち、同梱 classic script の共有先をコメントで説明。 | V1・V4・T1・T3 |
| `media/src/types.ts` | 画面要素・状態・Window の型契約 | 共通ヘルパーの型をまとめ、任意の Local 状態を正しく表現。開始時のカード要素を維持。 | V1・V4 |
| `media/tsconfig.json` | 画面ヘルパーのコンパイル設定 | strict と未使用検査を有効化。同じ classic script へ生成。 | V1・V9 |
| `package.json` | 拡張 metadata・コマンド・設定・開発依存 | 検査コマンドと開発依存を整備。OpenAI endpoint の説明を Responses API へ揃えた。version 0.12.2、engines、権限、既定値、設定キーは維持。 公開統合: 最新の初期設定・ストア説明を保持し、0.18.0へ更新。 追加見直し: バグ修正公開0.18.1へ更新。 実接続の不備を修正するPATCH版0.18.2へ更新。設定・権限・依存は維持。 CLI更新対応をPATCH版0.18.3へ反映。version以外のmetadata・設定・権限・依存は維持。 | V1–V3・V9・R1・R2・R3・P4・A5・A6・C1–C4 |
| `package.nls.json` | 英語の VS Code コマンド文言 | 全8文言を個別に読み、コマンドの対象と自然な表現を確認。1文言を修正。キー集合・ブランド名・配布時の生成契約は保持。 | L1・L2・L3・L4・L5 |
| `scripts/check-commit-emails.js` | Git 履歴のメール検査 | 変更なし。全履歴・範囲指定・push 入力の責務を確認。 | V8 |
| `scripts/clean-out.js` | out の削除 | 変更なし。リポジトリー内の生成先だけを削除する短い処理。 | V8 |
| `scripts/clean-package-nls.js` | 生成した NLS の除去 | 削除する対象を、i18n の正本から生成した一時コピーと明記。基準 package.nls.json は維持。 | V8・V9・T4 |
| `scripts/clean-vsix.js` | VSIX を最新 5 個へ整理 | 変更なし。隔離した 7 個で保持数と root の stray 除去を検証。 | V8・V9 |
| `scripts/copy-package-nls.js` | 翻訳 NLS の生成 | 編集先と生成先を区別するコメントへ修正。ファイル名・コピー契約は維持。 | V8・V9・T4 |
| `scripts/run-vscode-smoke.cjs` | 実 Extension Host 検査の準備・実行 | 専用 profile の実 Extension Host / VSIX を確認。macOS で終了が遅れた根拠から待機を期限付き 10 秒へ変更し、利用者のプロセスと区別して掃除。 | V1・V6・T5 |
| `scripts/serve-webview-smoke.ts` | 本番画面を開く隔離サーバー | 本番画面と隔離ブリッジを使う。VS Code fixture のキャストを境界一箇所へ限定。 | V1・V4・V5・T1・T3 |
| `scripts/smoke-claude-matrix.ts` | Claude 候補の実 API 検証入口 | 型検査に必要な引数の絞り込みと未使用 catch を整理。候補・送信契約は維持。 | V1・V2 |
| `scripts/smoke-claude.ts` | Claude の単一 API 検証入口 | 変更なし。明示実行時だけ環境変数を使用する処理を確認。 | V1・V2 |
| `scripts/smoke-cloud-minimal.ts` | クラウド候補の最小 API 検証入口 | 変更なし。引数と fixture で検証した各 service の呼び出し関係を確認。 公開統合: 最新モデル候補とAstraのreasoningを保持。 | V1–V3・R1・R2・R3 |
| `scripts/smoke-gemini-matrix.ts` | Gemini 候補の実 API 検証入口 | 型検査の絞り込みと未使用 catch を整理。候補・送信契約は維持。 | V1・V2 |
| `scripts/smoke-gemini.ts` | Gemini の単一 API 検証入口 | 変更なし。明示実行時の環境変数と generateContent 契約を確認。 | V1・V2 |
| `scripts/smoke-local-runtime.ts` | runtime の取得・検証・実行 | 最小 ExtensionContext fixture を明示し、any を除去。実取得・検証・一時領域の掃除の契約を保持。 実接続見直し: 4モデルの配布URLをHEADで順に確認し、HTTP status・SHA-256・サイズの一致もCIで検査。 | V1・V7・T1・T6・A3・A5 |
| `scripts/smoke-openai-matrix.ts` | OpenAI の全許容設定の API 検証入口 | 変更なし。能力表からの列挙と API サービスの利用を確認。 | V1・V2 |
| `scripts/smoke-openai-response.ts` | OpenAI 応答形の API 検証入口 | 変更なし。応答契約の検査と秘密情報を出さない入口を確認。 | V1・V2 |
| `scripts/smoke-openai.ts` | OpenAI の単一 API 検証入口 | 変更なし。明示実行時の環境変数と Responses 呼び出しを確認。 | V1・V2 |
| `scripts/test-integration.ts` | 機能間の統合・競合・終了検査 | 描画用の型と外部へ送った状態で検証し、private 状態への依存と any を除去。ready の保存先を取得後に確定して使う。 実接続見直し: 未完成応答によるSCM上書き抑止、Codex既定モデルとプロンプトより後のエラー表示を回帰検査。 CLI更新確認: Codexの初期モデルをGPT-6 Lunaへ戻した生成契約を検査。 | V1・V3・T1・T2・A2・A4・A5・C1–C4 |
| `scripts/test-support.ts` | 検査専用の認証・Git・HTTP・CLI fixture | VS Code の必要な境界を型付き fixture で再現。状態・要求は unknown / 実際の通信型とし、読込 hook の復元理由を説明。 未完成のHTTP 200と、プロンプトの後に出る構造化CLIエラーを認証fixtureで再現。 | V1・V3–V5・T1・T2・T3・A4・A5 |
| `scripts/update-badges.js` | ストア統計 JSON の更新 | 変更なし。取得失敗時の保持、数値整形、書き込み先を確認。実統計データは変更しない。 | V1・資産レビュー |
| `scripts/vscode-smoke.cjs` | 実 VS Code 側の操作・結果確認 | 追加。標準 Git API と実 SCM を検査。observer を復元し、終了コマンドを予約せず呼び出して専用ウィンドウを閉じる。 | V1・V6 |
| `scripts/webview-smoke.cjs` | 実 Chromium の操作確認 | 本番画面の機能操作と 384 表示ケースを検証。不正な状態の無視と通知の置換・期限も実ブラウザーで確認。 | V1・V4・V5・T1・T3 |
| `src/commitController.test.ts` | 実際には promptLimit の単体検査 | src/promptLimit.test.ts へ移動。対象の責務とファイル名を一致させる。 | V2 |
| `src/commitController.ts` | 機能の状態・Git・LLM・SCM の進行管理 | 生成設定と signal の所有を明示。プロンプトの純粋関数を抽出し、言語更新を命名。設定優先順・Local 引数・logger・同一エラー処理の重複を解消し、provider 分岐を直接 switch にした。 | V1–V7・T1–T6 |
| `src/commitDiffUtil.ts` | 差分制限の小さな補助 | 使われないエラー変数を整理。既存の補助責務を維持。 | V1–V3 |
| `src/commitPrompt.ts` | 言語・利用者の指示・差分の組み立て | controller から純粋関数を抽出。保存・通信を持たず、変更前の出力と 192 ケースで完全一致。 | T1・T2・T6 |
| `src/commitState.ts` | 内部状態と画面への投影 | 復元済み内部状態の必須項目を型で表し、MaxPromptMode を共有。利用前に正規化する責務をコメントに記録。 | V1・V3・T1・T2 |
| `src/configScope.ts` | ユーザー設定の安全な参照 | 通常の明示設定の 6 段階の優先順を共有。endpoint 等のユーザー専用取得とは分け、信頼境界を保持。 | V1・V2・V3・T1・T2 |
| `src/constants.ts` | 候補・能力・既定値の一覧 | 表から索引を作る目的をコメントで説明。モデル・保存キー・URL・SHA・画面 metadata の値は維持。 公開統合: 最新の候補・既定値と開始時のモデル詳細表示を両立。 実接続見直し: CLI 0.153.4のChatGPT認証で拒否されたCodex候補と提供終了したOpenAI候補を当時除外。Gemma Q4_K_Mの実在する固定revision・SHA・サイズへ修正。保存ID・sampling・runtimeは維持。 CLI更新確認: CLI 0.160.1で実生成を確認し、CodexのGPT-6 Luna / Sol候補とLuna既定値を復元。 | V1・V2・V4・T2・T6・T8・R1・R2・R3・A1・A2・A3・C1–C4 |
| `src/defaults.ts` | 初期状態とパネル既定値 | 既定値を型注釈で表し、モデル fallback と Codex reasoning の優先順を読みやすく整理。値と復元順は維持。 | V1・V3・T1・T2 |
| `src/extension.ts` | 登録・認証・拡張寿命の入口 | 認証イベントの購読も context の寿命に登録。不要な provider キャストを除去し、認証・保存方式は保持。 | V1・V3・V4・V6・T1・T2・T5 |
| `src/i18n/languages.ts` | 対応言語コードと表示名 | 変更なし。登録と実ファイルの一致を確認。 | V2・V5 |
| `src/i18n/locales/ar.ts` | Webview 文言（ar） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。36文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/bn.ts` | Webview 文言（bn） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。35文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/da.ts` | Webview 文言（da） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。39文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/de.ts` | Webview 文言（de） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。37文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/en.ts` | Webview 文言（en） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。24文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/es.ts` | Webview 文言（es） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。39文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/fa.ts` | Webview 文言（fa） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。35文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/fr.ts` | Webview 文言（fr） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。40文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/he.ts` | Webview 文言（he） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。38文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/hi.ts` | Webview 文言（hi） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。38文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/id.ts` | Webview 文言（id） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。41文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/it.ts` | Webview 文言（it） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。32文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/ja.ts` | Webview 文言（ja） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。33文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/ko.ts` | Webview 文言（ko） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。42文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/my.ts` | Webview 文言（my） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。47文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/nb.ts` | Webview 文言（nb） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。33文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/nl.ts` | Webview 文言（nl） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。30文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/pl.ts` | Webview 文言（pl） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。40文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/pt-BR.ts` | Webview 文言（pt-BR） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。42文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/ro.ts` | Webview 文言（ro） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。37文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/ru.ts` | Webview 文言（ru） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。32文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/sv.ts` | Webview 文言（sv） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。38文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/sw.ts` | Webview 文言（sw） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。39文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/ta.ts` | Webview 文言（ta） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。45文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/th.ts` | Webview 文言（th） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。31文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/tl.ts` | Webview 文言（tl） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。43文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/tr.ts` | Webview 文言（tr） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。33文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/uk.ts` | Webview 文言（uk） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。32文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/ur.ts` | Webview 文言（ur） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。36文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/vi.ts` | Webview 文言（vi） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。48文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/zh-TW.ts` | Webview 文言（zh-TW） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。39文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/locales/zh.ts` | Webview 文言（zh） | 全144文言を個別に読み、自然さ・文法・用語・操作の意味を確認。35文言を修正。言語別判断は32言語の逐次レビュー表に記録。キー・置換文字列・条件は保持。 | L1・L2・L3・L4・L5 |
| `src/i18n/strings.test.ts` | 全 locale / NLS の整合検査 | 追加。登録・ファイル・型・キー・重複・空文言・置換文字列を各ファイルで検査。 | V1・V2 |
| `src/i18n/strings.ts` | 言語辞書の選択と既定値 | 変更なし。全登録・fallback と文字列契約を確認。 | V2・V5 |
| `src/i18n/types.ts` | UiStrings の契約 | 変更なし。全 locale が型と基準キーを満たす。 | V1・V2 |
| `src/modelCapabilities.test.ts` | モデル別の設定値の単体検査 | 保守レビュー時は変更なし。後方互換モデルも含む既存の能力表の検査を維持。公開統合で最新モデルと初期設定のテストを取得関数へ適合。 実接続見直し: 当時のCodex既定値・旧CLIで拒否された候補・提供終了モデルの除外を検査。カスタムモデルの能力は維持。 CLI更新確認: CodexのGPT-6 Luna既定値とLuna / Sol候補の登録を検査。 | V2・R1・R2・R3・A1・A2・A5・C1–C4 |
| `src/modelCapabilities.ts` | モデル別の推論・詳細度の能力 | 空の blocklist を除去。表を繰り返すコメントを整理し、未対応と未知のカスタムモデルの違いを説明。能力値は維持。 公開統合: GPT-6の許可値と既定値を保持。 | V1・V2・V4・T1・T2・R1・R2・R3 |
| `src/panel.ts` | Webview の HTML・メッセージ・通知 | 受信検査の後を判別共用体の switch で dispatch し、重複キャスト・委譲だけの関数を除去。never で 30 種類の対応漏れを検査。全イベントを dispose。 | V1–V4・V6・T1–T3・T5 |
| `src/panelBody.test.ts` | HTML 構造の単体検査 | 開始時の Local カード検査を維持し、読み込み・ID・安全な構造を確認。 | V2・V5 |
| `src/panelBody.ts` | 静的 HTML と bootstrap | 空の blocklist データを除去。開始時のモデルカード・既存の画面構造を維持。 | V1・V2・V4 |
| `src/panelMessageGuard.test.ts` | 画面入力境界の単体検査 | 不正な入れ子、0 / 空欄の上限解除、負数 / 非有限値の拒否を検査。 | V2 |
| `src/panelMessageGuard.ts` | 画面からの値の許可・正規化 | Record と型ガードで重複キャストを解消。不正な入れ子を拒否し、説明どおり 0 / null で上限を解除。 | V1–V3 |
| `src/panelMessages.ts` | 画面通信の型契約 | 要求の type による型の絞り込みと、API キーを含めない描画用状態の意図をコメントで説明。通信の種類・キーは維持。 | V1–V4・T1–T3・T8 |
| `src/panelSync.ts` | 初期状態の送信と render context | 変更なし。bootstrap と更新状態の責務の分離を確認。 | V1・V3・V4 |
| `src/promptLimit.test.ts` | 文字数制限と Local digest の単体検査 | 責務に合わせたテスト名へ改名。上限 1 / 2 / 6 と 0 / null の境界・正確な省略数を追加検証。 | V2・T2 |
| `src/promptLimit.ts` | 文字数制限と Local 用差分要約 | 未使用処理を削除。slice(-0) が全差分を残す不具合を修正し、省略数を実際の保持長から求める。Local digest の到達不能な fallback を整理。 | V1–V3・T1・T2 |
| `src/promptPresetStorage.test.ts` | 保存スコープの単体検査 | 型付きの最小 VS Code fixture で global / workspace 保存と後方互換を確認。any を除去。 | V2・T1・T2 |
| `src/promptPresetStorage.ts` | プリセットの保存・移行 | 変更なし。既存キーの読み書きと旧 workspace データの移行を確認。 | V2・V3 |
| `src/promptPresets.ts` | プリセットの整理・更新・選択 | 保存結果の共通項目を ApplyResult に統一。既定プリセットを先頭に置く比較を単純化し、言語更新のコメントを正確にした。 | V2–V4・T1–T3 |
| `src/providerSettings.test.ts` | provider 設定優先の単体検査 | WorkspaceConfiguration の境界を明示し、workspace からの endpoint / secret 上書き防止を型付きで検査。 | V2・T1・T2 |
| `src/providerSettings.ts` | endpoint・SecretStorage 名・環境変数 | 認証環境変数の名前と優先順を唯一の関数へ集約。設定契約を維持。 | V1–V4 |
| `src/services/codexCli.test.ts` | Codex コマンド・専用領域の単体検査 | 最小 WorkspaceConfiguration fixture を型で表し、コマンド・専用認証領域の契約を保持。 | V2・T1・T2 |
| `src/services/codexCli.ts` | Codex CLI の検出・認証操作 | 変更なし。専用 CODEX_HOME、shell 引数、認証状態の解釈を確認。 | V2–V4・V6 |
| `src/services/diffCollector.test.ts` | 差分取得とパスの単体検査 | 実 Git API の Change[] / diff(cached) を検査。CLI fallback の理由を日本語コメントに修正。 | V2・T2 |
| `src/services/diffCollector.ts` | Git API と CLI による差分取得 | staged / unstaged から Git API と CLI 引数を一緒に決める。拡張子 Set の反復生成を除去し、relativePath / absolutePath / buffer で対象を区別。 | V1–V3・V6・T1・T2・T5 |
| `src/services/fileDownload.test.ts` | 転送・検証・異常終了の単体検査 | 追加。実 localhost HTTP と一時ファイルで hash / progress / abort / 404 / 書き込み失敗を検証。 公開後の見直し: 中止済みのハッシュ検証がファイルを開かずAbortErrorになることを追加。 | V1・V2・P1・P2 |
| `src/services/fileDownload.ts` | stream 転送とファイル hash の共有処理 | 追加。2 箇所の転送を pipeline へ統一し、backpressure・abort・書き込みエラーを伝播。 公開後の見直し: ハッシュ用streamへAbortSignalを接続し、検証中の取り消しとstream解放を伝播。 | V1–V3・V7・P1・P2 |
| `src/services/llm/claude.test.ts` | Claude HTTP 契約の単体検査 | fetch 復元を共有補助へまとめ、部分的な Response の any を実 Response に置換。送信・応答・異常系の契約を保持。 公開統合: Opus 5.5とFable 5.1の契約を同じ型・Responseで検査。 | V2・T1・T2・R1・R2・R3 |
| `src/services/llm/claude.ts` | Claude Messages への変換 | 外部 JSON を unknown から検査。テキスト block の抽出順と既存のリクエスト形式を維持。 公開統合: Opus 5系のtemperature非対応判定を保持。 | V1–V4・R1・R2・R3 |
| `src/services/llm/codex.test.ts` | Codex 送信形式の単体検査 | 変更なし。schema / reasoning / command 設定の契約を維持。 公開統合: 現行の初期モデルでCLI引数を検査。 | V2・R1・R2・R3 |
| `src/services/llm/codex.ts` | Codex exec による生成 | JSON を record として検査し、二度の文字列整形を除去。通常テキストの fallback を日本語で説明し、CLI 契約を保持。 実接続見直し: 入力全文で失敗理由が切れないよう、末尾のCLIエラーを選んでから認証情報の伏せ字・長さ制限を適用。 | V1–V4・V6・T1–T3・T5・A2・A4・A5 |
| `src/services/llm/gemini.test.ts` | Gemini HTTP 契約の単体検査 | 共通 fetch 補助、実 Response と Headers を使用。独自ヘッダー読取の重複と any を除去。 | V2・T1・T2 |
| `src/services/llm/gemini.ts` | Gemini generateContent への変換 | URL 変数名を具体化。candidate / parts の検査と既存認証・送信形式を維持。 | V1–V4・T1–T3 |
| `src/services/llm/local.ts` | llama-server の寿命と生成通信 | 二重起動、abort / timeout / health / 停止対象を整理。外部 JSON の choices を検査し、不正応答を空応答エラーとして扱う。 | V1・V3・V4・V7 |
| `src/services/llm/openai.test.ts` | OpenAI API・モデル確認の単体検査 | 認証別 cache・期限・設定制約・6 応答形式・不正応答を維持。共通 fetch 補助と実 Response へ整理。 公開統合: GPT-6のreasoning検査を同じ型・Responseで維持。 実接続見直し: 部分文章・空文章・詳細なし・失敗時の伏せ字・completedを検査。互換応答の既存検査を保持。 | V2・T1・T2・R1・R2・R3・A4・A5 |
| `src/services/llm/openai.ts` | Responses 送信と互換応答の解析 | 一度だけ使う attempt closure と不要キャストを除去。temperature の送信条件と複数出力の扱いを実装に合わせ説明し、要求値を保持。 実接続見直し: HTTP 200でもincomplete / failedの応答を拒否し、未完成の文章をSCMへ反映しない。出力上限・期限は変更しない。 | V1–V4・T1–T3・A1・A4・A5 |
| `src/services/llm/shared.test.ts` | 共通 HTTP の単体検査 | 共通 fetch 補助と DOMException / assert.rejects を使用。再試行・即時中止・期限を実際の Response で検査。 | V2・T1・T2 |
| `src/services/llm/shared.ts` | HTTP・再試行・abort・文字列の共通処理 | 送信前の中止と再試行待機の abort を管理。HTTP status と通信エラーで再試行を判断し、JSON object の短い型ガードを共有。 | V1–V4 |
| `src/services/localModel.test.ts` | GGUF 定義・パス・検証の単体検査 | モデル説明検査を保持。VS Code fixture を明示し、失敗時も一時ファイルを finally で削除。 公開後の見直し: 転送完了後の検証中に取り消し、正式配置・一時ファイルが残らないことと正常取得を検査。 実接続見直し: Gemmaの実ファイルのSHA-256・サイズに更新し、保存IDなどの既存検査を維持。 | V2・T1・T2・T6・P1・P2・A3・A5 |
| `src/services/localModel.ts` | GGUF の取得・保存・検証 | 転送進捗型を共有し、保存候補を一度で求める。検証後の置換と候補を試す理由をコメントで説明。ID 移行と保存契約を維持。 公開後の見直し: 検証へsignalを渡し、配置直前に取り消しを確認。URL・SHA・保存先を維持。 | V1–V4・T1–T3・T6・P1・P2 |
| `src/services/localModelProfiles.ts` | sampling と runtime 調整の profile | 空 profile に対する古い方針説明だけを除去。既存 4 モデルの sampling と引数の値を比較して一致。 | V2・V3・T2・T6 |
| `src/services/localRuntime.test.ts` | runtime 資産・OS 選択の単体検査 | 型付き fixture と実モデル定義を使用。2 系列・全 OS / CPU・SHA・展開規則の検査を保持。 公開後の見直し: 隔離archiveの実展開後に取り消し、配置抑止・一時物削除・正常取得を検査。 | V2・V7・T1・T2・T6・P1・P2 |
| `src/services/localRuntime.ts` | runtime の自動取得・展開・選択 | 転送進捗型を共有。OS から決まる archive 種類と実行ファイル名の重複指定を除去し、12 資産の URL・SHA・全属性の一致を比較。 公開後の見直し: 検証・展開後・配置直前の取り消しを確認。資産・展開方式を維持。 | V1・V3・V7・T1・T2・T6・P1・P2 |
| `src/testRunner.ts` | 軽量単体テストの実行順序 | 改名した promptLimit と download / i18n の回帰検査を登録。 | V2 |
| `src/testSupport.ts` | HTTP 単体テストの fetch 差し替え | 重複した 4 箇所の補助を共有。成功・失敗のどちらでも finally で元へ戻し、VSIX から除外。 | T1・T2・T4 |
| `src/types.ts` | provider・言語・状態の共有契約 | 共有状態型を追加して重複宣言を解消。開始時の Local 表示 metadata を保持。 | V1–V5 |
| `src/webviewSerialization.test.ts` | JSON の script 埋め込みの単体検査 | 変更なし。終了タグ・特殊文字の既存検査を維持。 | V2 |
| `src/webviewSerialization.ts` | bootstrap を安全に埋め込む処理 | 変更なし。小さい専用 escape 処理として維持。 | V2・V4 |
| `tsconfig.json` | 拡張の型検査と CommonJS ビルド | 未使用 locals / parameters を有効化。既存の target / module を維持。 | V1・V9 |
| `tsconfig.scripts.json` | 保守スクリプトの型検査 | 追加。scripts と利用する実コードを rootDir . / noEmit で検査。 | V1 |

## 生成物と資産の区分

外部ライブラリーを手編集しない。以下は手書きコードの改善対象とは別に、生成元・参照・配布状態を確認した。out / node_modules / 一時 NLS / VSIX / output は ignore 済みの生成先であり、同じ一覧へ手書きファイルとして重複計上しない。

| ファイル | 区分 | 確認結果 |
| --- | --- | --- |
| `media/badges/open-vsx-downloads.json` | 統計生成物 | schemaVersion / message と更新スクリプトの生成契約を確認。実データを維持。 |
| `media/badges/vs-marketplace-downloads.json` | 統計生成物 | schemaVersion / message と更新スクリプトの生成契約を確認。実データを維持。 |
| `media/commit-maker-128.png` | バイナリー資産 | 既存の表示・README 参照を維持。画像形式・寸法または動画コンテナーを確認。 |
| `media/commit-maker-store.png` | バイナリー資産 | 既存の表示・README 参照を維持。画像形式・寸法または動画コンテナーを確認。 |
| `media/commit-maker.png` | バイナリー資産 | 既存の表示・README 参照を維持。画像形式・寸法または動画コンテナーを確認。 |
| `media/commit_gen.gif` | バイナリー資産 | 既存の表示・README 参照を維持。画像形式・寸法または動画コンテナーを確認。 |
| `media/commit_gen.mov` | バイナリー資産 | 既存の表示・README 参照を維持。画像形式・寸法または動画コンテナーを確認。 |
| `media/commit_maker_SNS.png` | バイナリー資産 | 既存の表示・README 参照を維持。画像形式・寸法または動画コンテナーを確認。 |
| `media/panel.png` | バイナリー資産 | 既存の表示・README 参照を維持。画像形式・寸法または動画コンテナーを確認。 |
| `media/pr_quick_recorder.png` | バイナリー資産 | 既存の表示・README 参照を維持。画像形式・寸法または動画コンテナーを確認。 |
| `media/scm-toolbar.png` | バイナリー資産 | 既存の表示・README 参照を維持。画像形式・寸法または動画コンテナーを確認。 |
| `media/ui/dom.js` | 生成物 | 対応する media/src から再生成。classic script と実ブラウザーで検証。 |
| `media/ui/elements.js` | 生成物 | 対応する media/src から再生成。classic script と実ブラウザーで検証。 |
| `media/ui/events.js` | 生成物 | 対応する media/src から再生成。classic script と実ブラウザーで検証。 |
| `media/ui/events/model.js` | 生成物 | 未使用の手書きイベント削除に合わせて削除。 |
| `media/ui/events/preset.js` | 生成物 | 未使用の手書きイベント削除に合わせて削除。 |
| `media/ui/render.js` | 生成物 | 対応する media/src から再生成。classic script と実ブラウザーで検証。 |
| `media/ui/state.js` | 生成物 | 対応する media/src から再生成。classic script と実ブラウザーで検証。 |
| `media/ui/types.js` | 生成物 | 対応する media/src から再生成。classic script と実ブラウザーで検証。 |
| `package-lock.json` | 生成物 | npm で再生成。クリーン npm ci と audit 0 件を確認。公開統合では検証済みの依存関係を保持し、0.18.0へ更新。R1・R2・R3。追加見直しでは依存を変更せず0.18.1へ更新。P4。 依存を変更せず0.18.2へ更新。 A5・A6。 依存を変更せず0.18.3へ更新。C4。 |

## 再検証の入口

```sh
npm ci
npm run lint
npm run typecheck
npm run compile
npm run build:media
npm test
npm run test:integration
npm run smoke:local:runtime
```

実ブラウザーは `npm run smoke:webview` を起動し、表示された localhost URL を別ターミナルで `node scripts/webview-smoke.cjs <URL>` に渡す。操作結果と画像を `output/playwright/` に保存し、server は終了時に一時データを破棄する。

実 VS Code は `node scripts/run-vscode-smoke.cjs [code のパス] [VSIX のパス]`。第 2 引数があれば専用 extensions dir へ VSIX をインストールして検証する。省略すれば workspace の out を使う。macOS / Linux 向け fixture で、ユーザーのプロファイルへ設定を書かない。

配布物は compile / build:media / build:nls の後、`npx vsce package --no-dependencies --no-rewrite-relative-links --out vsix/commit-maker-0.12.2.vsix` で生成。`npm run clean:nls`、`npm run clean:vsix` を実行し、元の 0.12.2 VSIX は一時領域へ退避してから置き換えた。公開は行わずローカル検証用として保持した。

## 最終照合

- 開始時: 191 ファイル = 手書き 171 + 生成物 9 + 統計 2 + バイナリー 9。
- 新規の手書き 16 ファイルもレビューし、手書きの判断行は 187 行。重複コード 2 ファイルを削除、テスト 1 ファイルを改名（旧ファイルの判断も記録）。現存の手書きは 184 ファイル。
- 生成物は不要になった 2 ファイルを削除して現存 7。統計 2 とバイナリー 9 は維持。現存対象は合計 202 ファイル。
- 新旧の対象を合わせた全 207 パスと記録の 207 行を照合し、欠け・余り・重複はいずれも 0。削除した 5 パスも記録に残す。
- V1–V11 と T1–T8 の記載した検査は成功。今回のコード改善で検出した指摘の未修正項目と、対象ファイルの未レビュー項目は 0。実サービス・他 OS の未検証範囲は最終検証の説明に明記した。
- 翻訳見直しの L1–L5 も成功。32言語の4,864文言を逐次確認し、UI 1,189項目・NLS 39項目を修正。64翻訳ファイルと記録以外の137ファイルは翻訳開始時と一致し、未レビューの言語・文言は0。
- 開始時の利用者の変更を保持。version は 0.12.2、コミット・push・タグ・ストア公開は未実施。

## 0.18.0の公開準備

2026-10-06の公開依頼を受け、最新の origin/main（0.16.2、9d3780f）を統合した。OpenAI / Gemini / Claude / Codex のモデル候補、OpenAI と GPT-6 Luna の初期設定、設定・コマンド・権限の契約を保持した。32言語の翻訳はすべて保持し、OpenAI の表示名だけは最新の共通表記に合わせた。設定の OpenAI endpoint 説明は実装に合わせて Responses API とする修正を保持した。

開始時から存在したモデル詳細・サイズ・バッジの表示改善も公開対象に含めるため、安定版の偶数 MINOR 規則に従い0.18.0とする。Local のモデルURL・SHA-256・sampling・runtime選択は0.16.2と一致。統合で追加されたAPIテストには同じResponse fixtureと型を適用し、初期providerのテストを現行の取得関数に合わせた。

| ID | 公開前の検査 | 結果・証拠 |
| --- | --- | --- |
| R1 | 最新版とレビュー結果の保持 | 32言語の修正文言、最新モデル・既定値・コマンド・権限・Local実行契約を照合。output/release-0.18.0/translation-parity.json / latest-contracts.json。 |
| R2 | クリーン導入・統合コードの検証 | npm ci成功・audit 0件。統合後のlint・型検査・単体18ファイル・統合8機能群・compile・build:mediaが成功。各ログは output/release-0.18.0/。 |
| R3 | 0.18.0の配布物と実VS Code | VSIX生成成功。126 entries、NLS32言語・JS67モジュールが生成元と一致。開発物・秘密情報・テストは除外。専用profileへインストールし、実SCM入力欄への反映と終了時の掃除に成功。package-verification.json / native-vscode.json。 |
| R4 | 統合後の実ブラウザーと一覧 | 5 provider の操作と32言語×4モデル×3幅の384ケースが成功。console error / warning と pageerror は0。現存202ファイル・手書き184ファイル・新旧207パスの記録に欠け・余り・重複なし。browser.json / inventory-verification.json。 |

V / T / L の「公開未実施」は各レビュー時点の記録である。公開はこの0.18.0をコミットし、mainとv0.18.0タグをpushしてstable workflowから行う。両ストアへの公開結果はGitHub Actionsの実行結果とストアのバージョンで確認する。

## 0.18.0の公開結果

2026-10-06にmainとv0.18.0をpushし、[mainのCI](https://github.com/Hiromitsu-A-T/commit-maker/actions/runs/37385402547)と[stable公開workflow](https://github.com/Hiromitsu-A-T/commit-maker/actions/runs/37385529355)が成功した。公開対象はc10ba29。Windows・macOS・Linuxのruntime取得・検証・実行も成功し、MarketplaceとOpen VSXへ同じCI成果物を公開した。

08:05 JSTに、[Marketplace](https://marketplace.visualstudio.com/items?itemName=Hiromitsu.commit-maker)と[Open VSX](https://open-vsx.org/extension/Hiromitsu/commit-maker)の公開APIで0.18.0を確認した。公開後のバッジ更新も成功し、mainへ取り込んだ。

CIのVSIXの126 entriesは、実VS Codeで検証したローカルVSIXと全ファイルの内容が一致した。Open VSXで配布中のVSIXのSHA-256もCI成果物と一致する（58604cf83aa0c37fce15299b8576c44e643a9ff61a900495489cbe3b9b295135）。証拠は output/release-0.18.0/publish-run.json / published-package-verification.json / open-vsx-package-verification.json / store-verification.json。

この追記は公開後の記録であり、公開タグに含まれる拡張機能のコードは変更していない。

## 0.18.1の追加レビュー・公開準備

2026-10-06、公開後のコード改善の再確認依頼を受け、生成の停止・Local取得・画面との境界・配布処理を見直した。Localモデルのハッシュ検証中とruntime展開後に取り消しても、正式配置へ進む不備を一時ファイルとfixture通信で再現した。

ハッシュ用streamにAbortSignalを接続し、取得開始・展開後・正式配置直前にも取り消しを確認する。再現した2ケースはAbortErrorとなり、取り消したモデルまたはruntimeを正式配置せず、その一時ファイルも削除した。正常取得も同じfixtureで確認した。取り消しと正式配置の境界を示す短いコメントを更新し、新しい抽象化や設定は追加していない。

| ID | 機能・検査 | 結果・根拠 |
| --- | --- | --- |
| P1 | 検証中・展開後の取り消し | 修正前は2ケースともaborted=trueでもinstalled=true。修正後はAbortError、installed=false、partial=false。output/post-release-review/cancel-before.json / cancel-after.json。 |
| P2 | 単体・統合・静的検査 | 18単体テストファイルと8統合機能群が成功。取り消し・配置抑止・一時物削除・正常取得・キャッシュ解決を追加検査。lint・型検査・compile・build:media成功。output/post-release-review/内の実行ログ。 |
| P3 | 実ブラウザー・実VS Code | 全5 providerの操作、認証fixture、SCM、プリセット、言語、Local管理が成功。console error/warning・pageerrorは0。隔離profileに0.18.1のVSIXを導入し、実SCMへ反映・終了時の掃除も成功。browser.json / native-vscode.json。 |
| P4 | 保持する契約・配布物・全ファイル | 設定・権限・metadataはversion以外同一。画面・翻訳等101ファイルが0.18.0とbyte一致。126 entries・32 NLS・67 JSが生成元と一致し、秘密情報・開発物なし。一時NLS/root VSIXは0、保管VSIXは5。現存202ファイルと新旧207パスの記録に欠け・重複なし。contracts.json / package.json / inventory.json。 |

画面・翻訳は変更していないため、384表示ケースは0.18.0の結果を保持し、今回は機能操作を再確認した。実クラウド課金・実Codexアカウント・実GGUF推論の未検証範囲も前回と同じである。今回再現できた2つの取り消し境界は修正済みだが、検証で未知の不具合がないことまで保証するものではない。

既存の公開依頼に沿い、バグ修正のPATCH版0.18.1としてmainとv0.18.1をpushし、stable workflowで公開する。公開結果は成功後に追記する。

## 0.18.1の公開結果

2026-10-06にmainとv0.18.1をpushした。公開対象は60f1622。[mainのCI](https://github.com/Hiromitsu-A-T/commit-maker/actions/runs/37388328719)と[stable公開workflow](https://github.com/Hiromitsu-A-T/commit-maker/actions/runs/37388329541)が成功し、Windows・macOS・Linuxのruntime取得・検証・実行も成功した。公開後のバッジ更新workflowも成功した。

| ID | 公開後の確認 | 結果・根拠 |
| --- | --- | --- |
| P5 | CI・両ストア・公開VSIX | 08:32 JSTにMarketplaceとOpen VSXの公開APIで最新版0.18.1を確認。CIの126 entriesは、実VS Codeで検証したVSIXと全ファイル内容が一致。Open VSXの配布物のSHA-256もCIと一致。output/post-release-review/publish-run.json / stores.json / published-package.json / open-vsx-package.json。 |

公開先は[Marketplace](https://marketplace.visualstudio.com/items?itemName=Hiromitsu.commit-maker)と[Open VSX](https://open-vsx.org/extension/Hiromitsu/commit-maker)。公開VSIXのSHA-256は `40401cbc9b3f757aae5baef9a7c61dd0082e99bc110b7a51eba7a3c7867c5ec7`。検証したローカルVSIXは証拠用に退避し、vsix/commit-maker-0.18.1.vsixにはCI成果物を保存した。

この追記は公開後の記録であり、公開タグの拡張コードは変更していない。追加レビューで再現した不備は修正・検証・公開済み。実サービス・実GGUF推論の確認範囲は上記の通りで、未知の不具合がないという保証はしていない。

## 0.18.2の実接続検証・修正

2026-10-06、実APIと本番利用の確認依頼を受け、公開済み0.18.1のVSIXから実コードを読み込み、候補を1モデル・1設定ずつ順に確認した。従来のクラウドfixture・CLI fixture・GGUF fixtureによる結果と区別し、実際にコミット文章を生成できることを確認する。

実接続で次の不備を再現した。当時のCLI 0.153.4のChatGPT認証ではgpt-6-luna / gpt-6-solが拒否され、CLIが出した入力全文のため失敗理由も表示から切れていた。GemmaのカタログURLはQ4_K_Mファイルが存在せず404だった。OpenAIのgpt-5-codexは実POSTが404で、[公式の提供終了記録](https://developers.openai.com/api/docs/deprecations)でも2026-07-23の終了を確認した。

Codexの既定モデルを実接続できたgpt-5.6-lunaへ変更し、拒否された2候補を除外する。CLIエラーを末尾から選び、構造化された原因だけを伏せ字・長さ制限の対象とする。Gemmaは実在するUnslothの固定revisionのQ4_K_MへURL・SHA-256・サイズを修正する。OpenAIの終了モデルは推奨候補から外す。利用者の保存済みモデルを自動置換せず、カスタム指定の能力表は保持する。当時のCLIで拒否されたモデルを保存している場合の案内として、モデル欄での選び直しを説明した。GPT-6 Luna / Solの拒否原因は下記0.18.3で訂正する。

OpenAIの最初の確認では、高推論の1ケースが300秒の期限に達し、別の1ケースは8192トークンを推論に使い切ってincompleteとなった。同じ期限・出力上限で2ケースを再実行すると、131秒と43秒でcompletedの文章を得た。期限や出力上限を自動で増やす処理は追加していない。HTTP 200だけでは成功とみなさず、incomplete / failedを実コードで拒否し、未完成の文章でSCMを上書きしない回帰検査を追加した。

実接続では、通常の利用者プロファイルの設定・SCM・保存データを変更していない。専用のVS Codeプロファイルと一時Gitリポジトリのsample.txtの差分を使用した。既存の3件のSecretStorageは暗号化された行だけを隔離環境へ複製し、実VS Code APIで取得した値をメモリー内で使用した。Codexも既存の有効なアクセストークンを専用CODEX_HOMEへ複製し、元の認証を更新しないようrefresh tokenを無効にした。キー・トークンの平文を記録やリポジトリへ出していない。モデル・認証の一時領域と実行プロセスは終了時に破棄した。

| ID | 機能・検査 | 結果・証拠 |
| --- | --- | --- |
| A1 | OpenAI / Gemini / Claudeの実生成 | 現行候補はOpenAI 17モデル・234設定、Gemini 10モデル、Claude 13モデル。合計257ケースで実HTTP 200と非空のコミット文章を確認し、OpenAIはcompletedも確認。初回失敗と再実行も別に保持。output/live-api-0.18.1/matrix.json / retry.json / cloud-final.json。 |
| A2 | Codexの実認証・実生成 | CLI 0.153.4と実ChatGPT認証で、現行5モデル×4推論設定の20ケースが成功。旧CLIで拒否された2モデルの8失敗も保存。codex-before.json / codex.json / codex-diagnostic.json。 |
| A3 | Localの実取得・実推論・削除 | 4モデルすべて実GGUF取得とSHA-256、実runtime取得とSHA-256を確認。各モデルで2回の日本語のコミット生成・削除に成功。Gemmaの中断した初回は取得と検証までを記録し、資産だけを隔離環境へ再コピーして再検証・推論・削除を行った。local.json / gemma-interrupted.json / gemma.json / local-final.json。 |
| A4 | 不完全応答とCLI失敗理由 | 空・部分文章のincomplete、failed、原因なしの応答を拒否。completedと6互換形式の既存契約を維持。未完成応答で実Git fixtureのSCMを上書きせず、Codexのプロンプト末尾の失敗理由と伏せ字も確認。unit-final.log / integration-final.log。 |
| A5 | 静的検査・テスト・本番ビルド | lint・型検査・単体18ファイル・統合8機能群・compile・build:mediaが成功。4モデルのHEADでHTTP・SHA・サイズを順に確認する検査を追加し、実runtime取得・展開・起動も成功。各final.log / runtime-final.log。 |
| A6 | 最終VSIX・実SCM・実ブラウザー・全対象 | 最終0.18.2の実コードで、クラウド3種・Codex・Localの5 providerすべてを生成から実SCM反映まで確認。Chromiumで5 providerの操作と32言語×4モデル×3幅の384表示ケースが成功。console error / warning・pageerrorは0。126 entries・32 NLS・67 JSが生成元と一致。現存202ファイル・新旧207行の欠け・重複は0。scm-final.json / browser.json / package.json / inventory.json。 |

通常のOpenAI既定値gpt-6-luna、設定キー・設定既定値、コマンド、権限、SecretStorage / Mementoの契約、Localの保存ID・sampling・runtime選択、32言語の文言は維持した。version以外のpackage.jsonの契約は同一で、変更対象14ファイル以外の188ファイルも0.18.1とbyte一致。READMEではCodexの初期モデルだけを実装に揃えた。新規の保守対象ファイルはなく、対象一覧の207行すべてを保持した。

実サービスの生成時間・推論量には揺れがあり、最初の期限・出力上限への到達を隠して「常に成功」とは扱わない。上限による失敗は検査済みの境界として記録する。実GGUF推論と実VS CodeはmacOS ARM64で行い、Windows / Linuxを含むruntime取得・起動は公開CIでも確認する。テスト用VS Codeが途中で終了した2件の未完了結果は採用せず、終了検出を追加して再実行した。

既存の公開依頼に沿い、修正をPATCH版0.18.2としてコミットし、mainとv0.18.2をpushしてstable workflowで公開する。両ストアと配布物の確認結果は成功後にA7として追記する。

## 0.18.2の公開結果

2026-10-06にmainとv0.18.2をpushした。公開対象は6f80d0c。[mainのCI](https://github.com/Hiromitsu-A-T/commit-maker/actions/runs/37399803705)と[stable公開workflow](https://github.com/Hiromitsu-A-T/commit-maker/actions/runs/37399803978)が成功した。Windows・macOS・Linuxすべてで、4モデルの配布先とSHA-256・サイズの確認、2系列のruntimeの取得・検証・実行も成功した。[公開後のバッジ更新](https://github.com/Hiromitsu-A-T/commit-maker/actions/runs/37400011647)も成功した。

| ID | 公開後の確認 | 結果・証拠 |
| --- | --- | --- |
| A7 | 両ストア・公開配布物 | 10:41 JSTにMarketplaceとOpen VSXの公開APIで最新版0.18.2を確認。両ストアから実際に取得したVSIXは、CI成果物とSHA-256が一致。CIの内部126ファイルも、実SCMで検証した最終VSIXとすべて一致。output/live-api-0.18.1/stores.json / published-package.json / marketplace-package.json / openvsx-package.json。 |

公開先は[Marketplace](https://marketplace.visualstudio.com/items?itemName=Hiromitsu.commit-maker)と[Open VSX](https://open-vsx.org/extension/Hiromitsu/commit-maker)。公開VSIXのSHA-256は `6f59ac11ad5a6e6ab52f1fc932d8c6f89cb0ea14cc7b17b11cca57182db935c0`。vsix/commit-maker-0.18.2.vsixにはCI成果物を保存し、実操作で検証した元のVSIXも証拠用に保持した。

A1–A7の確認は完了し、今回再現した本番利用の不備は修正・検証・公開済み。対象一覧とレビュー記録の欠け・余り・重複は0。通常の利用者データへ検証の変更は残していない。この追記は公開後の記録であり、公開タグの拡張コードは変更していない。

## 0.18.3のCodex CLI更新・GPT-6再検証

2026-10-06、CLIのバージョンを確認する依頼に対し、通常利用の実行ファイルがHomebrewの0.153.4であることを確認した。[公式更新履歴](https://learn.chatgpt.com/docs/changelog)では、0.157.0でGPT-6 Luna / Solが追加され、現行安定版は0.160.1だった。0.18.2では現行CLIでの比較を行わずに候補を除外していたため、この判断を訂正する。

同じ既存認証・同じ0.18.2の生成サービス・同じ入力と設定でCLIだけを替えると、0.153.4はLuna / Solを拒否し、0.160.1は両方で日本語コミット文章を生成した。Astraは両CLIで成功した。Luna / Solは0.160.1のlow / medium / high / xhighすべてで成功した。その後、利用者の更新依頼に沿ってHomebrewで通常CLIも0.160.1へ更新した。

CodexのGPT-6 Luna / Sol候補とLunaの初期選択を復元し、READMEにCLI 0.157.0以降と更新方法を明記する。設定・保存済みモデルの自動移行、認証方式、タイムアウトや使用量の上限は変更しない。前回修正したCLI失敗理由の表示、不完全なOpenAI応答の拒否、Gemmaの配布先も維持する。

| ID | 機能・検査 | 結果・証拠 |
| --- | --- | --- |
| C1 | 旧CLIと現行CLIの実比較・通常CLI更新 | 旧CLIのLuna / Sol拒否と現行CLIの成功を同じ認証・同じ拡張コードで再現。現行CLIのLuna / Sol各4推論とAstraの計9ケースが成功。元認証のbyte不変と隔離認証・一時CLIの削除を確認。通常のcodex --versionは0.160.1。output/codex-cli-0.18.3/codex-cli-comparison.json / cli-environment.json。 |
| C2 | 最終VSIXからのCodex実生成・実SCM | 0.18.3の配布物と通常CLI 0.160.1で、全7候補×4推論の28ケースが成功。日本語の実コミット文章を取得。Luna / Solは実VS CodeのSCM入力欄への反映も各1回成功。codex.json / codex-scm.json。 |
| C3 | 静的検査・テスト・ビルド・実ブラウザー | lint・型検査・単体18ファイル・統合8機能群・compile・build:media・VSIX生成が成功。headed ChromiumでCodexのLuna初期選択とLuna / Sol候補を追加確認し、5 providerの操作と32言語×4カード×3幅の384表示ケースも成功。console error / warningは0。lint.log / typecheck.log / unit.log / integration.log / package-build.log / browser.json。 |
| C4 | データ契約・全ファイル照合・配布物 | version以外のpackage設定・権限・metadataとすべての依存が0.18.2と同一。変更対象8ファイル以外の194ファイルはbyte一致。現存202ファイル・新旧207レビュー行に欠け・余り・重複は0。VSIXは126 entries・32 NLS・67 JSが生成元と一致し、秘密情報・開発物なし。一時NLS/root VSIXは0、保管VSIXは5。inventory.json / contracts.json / package.json。 |

クラウド3種とLocalの生成サービス・画面・32言語は0.18.2から変更しておらず、A1・A3の実接続結果を保持した。C3ではそれらの認証・生成・失敗・SCM契約の統合と実ブラウザーを再確認した。実接続・SCM操作は専用認証・一時Git・隔離VS Codeで行い、通常のSCMや保存済みデータへ検証の変更を残さない。

C1–C4の検証は完了した。修正をPATCH版0.18.3としてコミットし、既存の公開依頼に沿ってmainとv0.18.3をpushし、stable workflow経由で両ストアへ公開する。公開結果は成功後にC5として追記する。
