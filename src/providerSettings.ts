import * as vscode from 'vscode';
import { ProviderId } from './types';
import { DEFAULT_PROVIDER_ENDPOINTS, DEFAULT_PROVIDER_SECRETS } from './constants';
import { getUserConfigurationString } from './configScope';

const ENDPOINT_CONFIG_KEY: Record<ProviderId, string> = {
  openai: 'endpoint',
  claude: 'endpointClaude',
  gemini: 'endpointGemini',
  codex: 'endpointCodex',
  local: 'endpointLocal'
};

const API_KEY_CONFIG_KEY: Record<ProviderId, string> = {
  openai: 'apiKeySecret',
  claude: 'apiKeySecretClaude',
  gemini: 'apiKeySecretGemini',
  codex: 'apiKeySecretCodex',
  local: 'apiKeySecretLocal'
};

export function getEndpoint(config: vscode.WorkspaceConfiguration, provider: ProviderId): string {
  return getUserConfigurationString(config, ENDPOINT_CONFIG_KEY[provider], DEFAULT_PROVIDER_ENDPOINTS[provider])
    ?? DEFAULT_PROVIDER_ENDPOINTS[provider];
}

export function getApiKeySecretName(config: vscode.WorkspaceConfiguration, provider: ProviderId): string {
  return getUserConfigurationString(config, API_KEY_CONFIG_KEY[provider], DEFAULT_PROVIDER_SECRETS[provider])
    ?? DEFAULT_PROVIDER_SECRETS[provider];
}

export function getApiKeyEnvironmentNames(provider: ProviderId): string[] {
  if (provider === 'openai') return ['COMMIT_MAKER_OPENAI_API_KEY', 'OPENAI_API_KEY', 'openai_api_key'];
  if (provider === 'gemini') return ['COMMIT_MAKER_GEMINI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'google_api_key'];
  if (provider === 'claude') return ['COMMIT_MAKER_CLAUDE_API_KEY', 'ANTHROPIC_API_KEY', 'CLAUDE_API_KEY', 'anthropic_api_key'];
  return [];
}
