import * as vscode from 'vscode';
import { ProviderId } from './types';
import { DEFAULT_PROVIDER_ENDPOINTS, DEFAULT_PROVIDER_SECRETS } from './constants';

const ENDPOINT_CONFIG_KEY: Record<ProviderId, string> = {
  openai: 'endpoint',
  claude: 'endpointClaude',
  gemini: 'endpointGemini',
  local: 'endpointLocal'
};

const API_KEY_CONFIG_KEY: Record<ProviderId, string> = {
  openai: 'apiKeySecret',
  claude: 'apiKeySecretClaude',
  gemini: 'apiKeySecretGemini',
  local: 'apiKeySecretLocal'
};

export function getEndpoint(config: vscode.WorkspaceConfiguration, provider: ProviderId): string {
  return config.get<string>(ENDPOINT_CONFIG_KEY[provider], DEFAULT_PROVIDER_ENDPOINTS[provider]);
}

export function getApiKeySecretName(config: vscode.WorkspaceConfiguration, provider: ProviderId): string {
  return config.get<string>(API_KEY_CONFIG_KEY[provider], DEFAULT_PROVIDER_SECRETS[provider]);
}
