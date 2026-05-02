import './commitController.test';
import { runDiffCollectorTests } from './services/diffCollector.test';
import { runSharedLlmTests } from './services/llm/shared.test';
import { runLocalModelTests } from './services/localModel.test';
import { runLocalRuntimeTests } from './services/localRuntime.test';
import { runPromptPresetStorageTests } from './promptPresetStorage.test';
import { runPanelMessageGuardTests } from './panelMessageGuard.test';
import { runPanelBodyTests } from './panelBody.test';

async function main() {
  await runDiffCollectorTests();
  await runSharedLlmTests();
  await runLocalModelTests();
  await runLocalRuntimeTests();
  await runPromptPresetStorageTests();
  await runPanelMessageGuardTests();
  await runPanelBodyTests();
  console.log('All tests completed');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
