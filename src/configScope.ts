import * as vscode from 'vscode';

/**
 * セキュリティ境界に関わる設定は workspace / folder スコープを無視する。
 * 悪意あるリポジトリの .vscode/settings.json だけで endpoint や実行ファイルを
 * 差し替えられないよう、ユーザー/プロファイル設定と package default だけを読む。
 */
export function getUserConfigurationValue<T>(
  config: vscode.WorkspaceConfiguration,
  key: string,
  fallback: T
): T {
  const inspected = config.inspect<T>(key);
  const configured = inspected?.globalLanguageValue ?? inspected?.globalValue;
  if (configured !== undefined) {
    return configured;
  }
  const defaulted = inspected?.defaultLanguageValue ?? inspected?.defaultValue;
  return defaulted !== undefined ? defaulted : fallback;
}

export function getUserConfigurationString(
  config: vscode.WorkspaceConfiguration,
  key: string,
  fallback?: string
): string | undefined {
  return getUserConfigurationValue<string | undefined>(config, key, fallback);
}

export function getExplicitUserConfigurationString(
  config: vscode.WorkspaceConfiguration,
  key: string
): string | undefined {
  const inspected = config.inspect<string>(key);
  return inspected?.globalLanguageValue ?? inspected?.globalValue;
}

/** 既定値を除く明示設定を、言語・folder・workspace・user の優先順で取得する。 */
export function getExplicitConfigurationValue<T>(
  config: vscode.WorkspaceConfiguration,
  key: string
): T | undefined {
  const inspected = config.inspect<T>(key);
  return inspected?.workspaceFolderLanguageValue ?? inspected?.workspaceLanguageValue ??
    inspected?.globalLanguageValue ?? inspected?.workspaceFolderValue ?? inspected?.workspaceValue ?? inspected?.globalValue;
}
