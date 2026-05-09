# Security Policy / セキュリティポリシー

Commit Maker handles Git diffs, provider API keys, local model files, and
extension runtime downloads. Security reports are taken seriously.

Commit Maker は Git の差分、provider API キー、ローカルモデルファイル、
拡張機能の runtime download を扱います。セキュリティ報告は重要なものとして扱います。

日本語・英語のどちらでも報告できます。
Security reports are accepted in both Japanese and English.

## Supported Versions / サポート対象

セキュリティ修正は、Visual Studio Marketplace と Open VSX に公開されている
最新の stable release を優先します。

Security fixes are prioritized for the latest stable release published on the
Visual Studio Marketplace and Open VSX.

Preview release で見つかった問題は、先に新しい preview で修正し、その後 stable に
反映する場合があります。

If a security issue affects a preview release, the fix may be shipped in a newer
preview first and then promoted to stable.

## Reporting a Vulnerability / 脆弱性の報告

脆弱性は public GitHub Issue で報告しないでください。

Please do not create a public GitHub issue for a vulnerability.

Preferred reporting paths / 推奨される報告方法:

- GitHub の private vulnerability reporting または Security Advisories が
  利用できる場合は、それを使用してください。
- 利用できない場合は、メンテナーの GitHub profile に記載された連絡先から
  連絡してください。
- Use GitHub's private vulnerability reporting or Security Advisories if
  available for this repository.
- If private vulnerability reporting is not available, contact the maintainer
  through the contact method listed on the maintainer's GitHub profile.

Include / 含めてほしい情報:

- 問題の概要。
- 再現手順または最小の proof of concept。
- 影響する version と platform。
- cloud provider、local model execution、runtime download、SecretStorage、
  generated output、release artifact のどれに関係するか。
- A clear description of the issue.
- Reproduction steps or a minimal proof of concept.
- The affected version and platform.
- Whether the issue affects cloud providers, local model execution, runtime
  downloads, SecretStorage, generated output, or release artifacts.

実際の API キー、Personal Access Token、非公開リポジトリの差分、本番秘密情報は
含めないでください。必要に応じて redacted example を使ってください。

Do not include real API keys, personal access tokens, private repository diffs,
or production secrets. Use redacted examples.

## Expected Response / 返信目安

有効な報告には、できるだけ 7 日以内に初回返信するよう努めます。
修正までの期間は、重大度、再現性、リリースリスクによって変わります。

The maintainer will try to acknowledge valid reports within 7 days. Resolution
time depends on severity, reproducibility, and release risk.

重大な問題は、修正版を公開した後に詳細を開示する場合があります。

High-impact issues may be fixed privately first and disclosed after a patched
release is available.

## Security Design Notes / セキュリティ設計メモ

- API キーは VS Code SecretStorage に保存されます。
- 拡張機能は API キーを同期しません。API キーはコミットしないでください。
- cloud provider は、ユーザーが選択した場合のみ生成に必要な差分を受け取ります。
- Local provider は差分を端末内に留め、SHA-256 検証済みの llama.cpp runtime と
  GGUF モデルファイルを使用します。
- release token と marketplace token は GitHub Actions secrets に保存し、
  リポジトリには含めないでください。

- API keys are stored in VS Code SecretStorage.
- API keys are not synced by the extension and should not be committed.
- Cloud providers receive the diff content required for generation only when
  the user selects that provider.
- The Local provider keeps diffs on-device and uses downloaded llama.cpp runtime
  and GGUF model files after SHA-256 verification.
- Release tokens and marketplace tokens must be stored in GitHub Actions
  secrets, not in the repository.
