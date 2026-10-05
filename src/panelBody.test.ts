import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { renderPanelBody } from './panelBody';
import ja from './i18n/locales/ja';

export async function runPanelBodyTests(): Promise<void> {
  const html = renderPanelBody(ja);
  const apiSection = html.indexOf('id="apiKeySection"');
  const statusRow = html.indexOf('id="apiKeyStatusRow"');
  const setupProvider = html.indexOf('id="apiKeyProvider"');
  const cloudPanel = html.indexOf('id="apiKeyCloudPanel"');
  const localPanel = html.indexOf('id="localModelPanel"');
  const codexPanel = html.indexOf('id="codexAuthPanel"');
  const llmSection = html.indexOf(ja.llmSectionTitle);

  assert.ok(apiSection >= 0, 'apiKeySection should exist');
  assert.ok(statusRow > apiSection, 'provider status badges should be in the setup section');
  assert.ok(setupProvider > statusRow, 'setup provider selector should follow badges');
  assert.ok(cloudPanel > setupProvider, 'cloud API key panel should follow setup provider selector');
  assert.ok(localPanel > cloudPanel, 'local model panel should share the setup row with API key panel');
  assert.ok(codexPanel > localPanel, 'codex auth panel should share the setup row with API key panel');
  assert.ok(localPanel < llmSection, 'local model panel must not be inside LLM settings');
  assert.ok(codexPanel < llmSection, 'codex auth panel must not be inside LLM settings');
  assert.ok(html.includes('<select id="localModelName">'), 'local model should be selected with a dropdown');
  assert.ok(html.includes('id="localModelGuidance"'), 'local model guidance should be available');
  assert.ok(html.includes('id="localModelGuidanceBadge"'), 'local model guidance should include a badge');
  assert.ok(html.includes('id="localModelGuidanceSize"'), 'local model guidance should include model size');
  assert.ok(html.includes('id="localModelGuidanceText"'), 'local model guidance should include explanatory text');
  assert.ok(html.includes('id="localModelGuidanceDetails"'), 'local model guidance should include technical details');
  assert.ok(!html.includes('id="localModelGuidance" class="model-guidance hidden"'), 'local model guidance should stay in the layout');
  assert.ok(html.includes('id="promptSaved" class="pill hint" role="status"'), 'prompt feedback should be an overlay status');
  assert.ok(html.includes('id="reasoningLabel"'), 'reasoning label should be addressable for provider-specific text');
  assert.ok(html.includes('id="advancedModelControls"'), 'advanced controls should be grouped');
  assert.ok(html.indexOf('id="apiKeyIssue"') < html.indexOf('id="apiKeyCloudPanel"'), 'API key issue link should stay in the provider header');
  assert.ok(html.includes('class="buttons single-half"'), 'single secondary action should use a half-width row');
  assert.ok(html.includes('id="codexAuthLogin"'), 'codex panel should include a login button');
  assert.ok(html.includes('id="codexAuthRefresh"'), 'codex panel should include a refresh button');
  assert.ok(html.includes('id="codexAuthLogout"'), 'codex panel should include a logout button');
  assert.ok(!html.includes('id="localModelStatusRow"'), 'local status should use the common provider badge row');
  assert.ok(!html.includes('class="subsection-title"'), 'local model panel should not use a separate nested heading');

  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepStrictEqual([...new Set(duplicates)], [], 'panel body should not contain duplicate ids');

  const css = await fs.promises.readFile(path.join(__dirname, '..', 'media', 'panel.css'), 'utf8');
  const guidanceRule = css.match(/\.model-guidance\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.ok(guidanceRule.includes('display: grid'), 'local model guidance should use a stable grid');
  assert.ok(guidanceRule.includes('height: 122px'), 'local model guidance should reserve a consistent card height');
  assert.ok(css.includes('-webkit-line-clamp: 3'), 'local model guidance copy should stay within the fixed card');

  console.log('panelBody.test.ts passed');
}
