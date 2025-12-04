import './commitController.test';
import { runDiffCollectorTests } from './services/diffCollector.test';
import { runSharedLlmTests } from './services/llm/shared.test';
import { runPromptPresetStorageTests } from './promptPresetStorage.test';
import { runPanelMessageGuardTests } from './panelMessageGuard.test';

async function main() {
  await runDiffCollectorTests();
  await runSharedLlmTests();
  await runPromptPresetStorageTests();
  await runPanelMessageGuardTests();
  console.log('All tests completed');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
