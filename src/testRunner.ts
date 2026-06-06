import './commitController.test';
import { runDiffCollectorTests } from './services/diffCollector.test';
import { runClaudeLlmTests } from './services/llm/claude.test';
import { runCodexLlmTests } from './services/llm/codex.test';
import { runGeminiLlmTests } from './services/llm/gemini.test';
import { runOpenAiLlmTests } from './services/llm/openai.test';
import { runSharedLlmTests } from './services/llm/shared.test';
import { runCodexCliTests } from './services/codexCli.test';
import { runLocalModelTests } from './services/localModel.test';
import { runLocalRuntimeTests } from './services/localRuntime.test';
import { runPromptPresetStorageTests } from './promptPresetStorage.test';
import { runPanelMessageGuardTests } from './panelMessageGuard.test';
import { runPanelBodyTests } from './panelBody.test';
import { runModelCapabilitiesTests } from './modelCapabilities.test';
import { runProviderSettingsTests } from './providerSettings.test';

async function main() {
  await runDiffCollectorTests();
  await runClaudeLlmTests();
  await runCodexLlmTests();
  await runGeminiLlmTests();
  await runOpenAiLlmTests();
  await runSharedLlmTests();
  await runCodexCliTests();
  await runLocalModelTests();
  await runLocalRuntimeTests();
  await runPromptPresetStorageTests();
  await runPanelMessageGuardTests();
  await runPanelBodyTests();
  await runProviderSettingsTests();
  runModelCapabilitiesTests();
  console.log('All tests completed');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
