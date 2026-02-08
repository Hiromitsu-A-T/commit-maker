import { UiStrings } from './i18n/types';

export function renderPanelBody(strings: UiStrings): string {
  return /* html */ `
    <h2>${strings.appTitle}</h2>

    <section>
      <h3 class="mt0">${strings.languageSectionTitle}</h3>
      <div class="row mt0">
        <select id="language" aria-label="${strings.languageSectionTitle}">
        </select>
      </div>
    </section>

    <section>
      <h3 class="mt0">${strings.apiKeySectionTitle}</h3>
      <div class="badge-row" id="apiKeyStatusRow"></div>
      <div class="row mt6">
        <div>
          <div class="label-row space-between">
            <label for="apiKeyProvider" class="no-margin">${strings.apiKeyProviderLabel}</label>
            <button id="apiKeyIssue" class="secondary tiny" type="button">${strings.apiKeyIssueButton}</button>
          </div>
          <select id="apiKeyProvider"></select>
        </div>
        <div>
          <div class="api-inline label-row">
            <label for="apiKeyInput" class="no-margin">${strings.apiKeyLabel}</label>
            <span id="apiKeyPreview" class="pill hint"></span>
          </div>
          <div class="api-inline">
            <input id="apiKeyInput" type="password" placeholder="${strings.apiKeyPlaceholder}" />
          </div>
          <div class="buttons two-col">
            <button id="apiKeySave" class="primary">${strings.apiKeySaveButton}</button>
            <button id="apiKeyClear" class="secondary">${strings.apiKeyClearButton}</button>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h3 class="mt0">${strings.llmSectionTitle}</h3>
      <div class="row" id="providerRow">
        <div>
          <label for="provider">${strings.providerLabel}</label>
          <select id="provider"></select>
        </div>
        <div id="modelGroup">
          <label for="model">${strings.modelLabel}</label>
          <select id="model"></select>
        </div>
      </div>
      <div id="customModelRow" class="mt8 hidden">
        <label for="customModel">${strings.customModelLabel}</label>
        <input id="customModel" type="text" placeholder="${strings.customModelPlaceholder}" />
      </div>
      <div class="row mt8">
        <div id="reasoningRow">
          <label for="reasoning">${strings.reasoningLabel}</label>
          <select id="reasoning"></select>
        </div>
        <div id="verbosityRow">
          <label for="verbosity">${strings.verbosityLabel}</label>
          <select id="verbosity"></select>
        </div>
      </div>
    </section>

    <section>
      <h3 class="section-header mt0">
        <span>${strings.promptSectionTitle}</span>
        <span id="promptSaved" class="pill hint"></span>
      </h3>
      <div class="label-row space-between">
        <div class="preset-row">
          <select id="promptPreset"></select>
        </div>
      </div>
      <div class="label-row space-between">
        <div class="preset-row">
          <input id="presetName" type="text" placeholder="${strings.presetNamePlaceholder}" />
          <button id="presetAdd" class="secondary tiny" type="button">${strings.presetAddButton}</button>
          <button id="presetDelete" class="secondary tiny" type="button">${strings.presetDeleteButton}</button>
        </div>
      </div>
      <textarea id="prompt" placeholder="${strings.promptTextareaPlaceholder}"></textarea>
      <div class="checkbox-row">
        <label class="checkbox-item" for="includeUnstaged">
          <input type="checkbox" id="includeUnstaged" />
          <span class="no-margin fw-normal">${strings.includeUnstagedLabel}</span>
        </label>
        <label class="checkbox-item" for="includeUntracked">
          <input type="checkbox" id="includeUntracked" />
          <span class="no-margin fw-normal">${strings.includeUntrackedLabel}</span>
        </label>
        <label class="checkbox-item" for="includeBinary">
          <input type="checkbox" id="includeBinary" />
          <span class="no-margin fw-normal">${strings.includeBinaryLabel}</span>
        </label>
      </div>
      <div class="row mt8">
        <label for="maxPromptMode" class="no-margin">${strings.maxPromptLabel}</label>
        <div class="prompt-limit">
          <select id="maxPromptMode">
            <option value="unlimited">${strings.maxPromptUnlimited}</option>
            <option value="limited">${strings.maxPromptLimited}</option>
          </select>
          <input id="maxPromptValue" class="input-narrow" type="number" min="1000" step="1000" placeholder="50000" />
          <span class="muted-label">${strings.maxPromptUnitLabel}</span>
        </div>
        <div class="hint">${strings.maxPromptHint}</div>
      </div>
    </section>

    <section>
      <h3 class="mt0">${strings.generationSectionTitle}</h3>
      <div class="buttons two-col">
        <button id="generate" class="primary" title="${strings.generateButtonTitle}">${strings.generateButton}</button>
        <button id="apply" title="${strings.applyButtonTitle}">${strings.applyButton}</button>
      </div>
      <div class="badge-row" id="statusRow"></div>
      <pre id="result">${strings.resultPlaceholder}</pre>
      <div class="hint">${strings.resultHint}</div>
      <div id="errorSection" class="mt8 hidden">
        <pre id="errorBox" class="error-box">${strings.errorPlaceholder}</pre>
      </div>
    </section>
  `;
}
