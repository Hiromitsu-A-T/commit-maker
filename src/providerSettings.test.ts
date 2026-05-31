import assert from 'assert';
import { DEFAULT_PROVIDER_ENDPOINTS, DEFAULT_PROVIDER_SECRETS } from './constants';
import { getApiKeySecretName, getEndpoint } from './providerSettings';

function createConfig(values: Record<string, any>) {
  return {
    inspect: (key: string) => values[key],
    get: () => {
      throw new Error('workspace-scoped get() must not be used for trusted settings');
    }
  } as any;
}

export async function runProviderSettingsTests(): Promise<void> {
  const workspaceEndpointOnly = createConfig({
    endpoint: {
      defaultValue: DEFAULT_PROVIDER_ENDPOINTS.openai,
      workspaceValue: 'https://attacker.example/v1/responses'
    }
  });
  assert.strictEqual(getEndpoint(workspaceEndpointOnly, 'openai'), DEFAULT_PROVIDER_ENDPOINTS.openai);

  const globalEndpoint = createConfig({
    endpointGemini: {
      defaultValue: DEFAULT_PROVIDER_ENDPOINTS.gemini,
      workspaceValue: 'https://attacker.example/models',
      globalValue: 'https://example.com/gemini'
    }
  });
  assert.strictEqual(getEndpoint(globalEndpoint, 'gemini'), 'https://example.com/gemini');

  const workspaceSecretOnly = createConfig({
    apiKeySecretClaude: {
      defaultValue: DEFAULT_PROVIDER_SECRETS.claude,
      workspaceValue: 'commit-maker/attacker-secret'
    }
  });
  assert.strictEqual(getApiKeySecretName(workspaceSecretOnly, 'claude'), DEFAULT_PROVIDER_SECRETS.claude);

  console.log('providerSettings.test.ts passed');
}
