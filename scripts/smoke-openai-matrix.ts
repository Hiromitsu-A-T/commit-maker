import { MODEL_SUGGESTIONS_BY_PROVIDER } from '../src/constants';
import {
  getAllowedReasoningOptions,
  getAllowedVerbosityOptions
} from '../src/modelCapabilities';
import { ReasoningEffort, VerbositySetting } from '../src/types';

const key =
  process.env.COMMIT_MAKER_OPENAI_API_KEY ||
  process.env.OPENAI_API_KEY ||
  process.env.openai_api_key;

if (!key) {
  throw new Error('OpenAI API key not found in env (COMMIT_MAKER_OPENAI_API_KEY / OPENAI_API_KEY / openai_api_key)');
}

type Combo = {
  model: string;
  effort: ReasoningEffort;
  verbosity: VerbositySetting;
};

function buildCombos(model: string): Combo[] {
  const allowEff = getAllowedReasoningOptions(model);
  const allowVerb = getAllowedVerbosityOptions(model);
  if (!allowEff || allowEff.length === 0 || !allowVerb || allowVerb.length === 0) {
    return [];
  }
  const combos: Combo[] = [];
  for (const e of allowEff) {
    for (const v of allowVerb) {
      combos.push({ model, effort: e, verbosity: v });
    }
  }
  return combos;
}

async function main(): Promise<void> {
  const models = MODEL_SUGGESTIONS_BY_PROVIDER.openai;
  const combos = models.flatMap(buildCombos);
  let ok = 0;
  for (const c of combos) {
    const body: Record<string, unknown> = {
      model: c.model,
      input: 'ping',
      max_output_tokens: 32,
      reasoning: { effort: c.effort },
      text: { format: { type: 'text' }, verbosity: c.verbosity }
    };
    if (c.effort === 'none') {
      body.temperature = 0;
    }
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });
    const txt = await res.text();
    const success = res.ok;
    if (success) {
      ok += 1;
      process.stdout.write('.');
    } else {
      console.error(
        `\nFAIL model=${c.model} effort=${c.effort} verb=${c.verbosity} status=${res.status} sample=${txt.slice(0, 200)}`
      );
      process.exitCode = 1;
    }
    // 軽いレートリミット回避
    await new Promise(r => setTimeout(r, 120));
  }
  console.log(`\nDone: ${ok}/${combos.length} OK`);
  if (process.exitCode && process.exitCode !== 0) {
    throw new Error('Some combinations failed');
  }
}

void main();
