import { getDefaultCommitPrompt } from './constants';
import { DEFAULT_LANGUAGE, getStrings } from './i18n/strings';
import { getLanguagePromptName } from './i18n/languages';
import { LanguageCode } from './types';

export interface CommitPromptSettings {
  language: LanguageCode;
  prompt: string;
}

/** 言語・利用者の指示・差分を組み立てる。保存や通信は呼び出し元が担当する。 */
export function buildCommitPrompt(diff: string, settings: CommitPromptSettings): string {
  const languageCode = settings.language || DEFAULT_LANGUAGE;
  const strings = getStrings(languageCode);
  const guard = strings.promptGuard;
  const userInstructionLabel = strings.userInstructionLabel;
  const instruction = settings.prompt || getDefaultCommitPrompt(languageCode);
  const languagePromptName = getLanguagePromptName(languageCode);
  const outputLanguageHint = [
    `Default output language selected in Commit Maker: ${languageCode} / ${languagePromptName} / ${strings.languageName}.`,
    'Do not answer in English unless the selected language is en or the user instructions below explicitly request English.',
    'If Conventional Commits are requested, the required pattern is "<type>: <summary>". The first characters must be one of feat:, fix:, chore:, docs:, refactor:, test:, ci:, build:, or perf:.',
    'Use exactly one type prefix at the very beginning, then write the rest in the requested language.',
    'For non-Latin selected languages, use the native script for natural-language text.',
    'Do not invent issue numbers, PR numbers, file names, or identifiers; include them only when they appear below.',
    'If the user instructions below request a different output language, follow those instructions instead.'
  ].join(' ');
  return `${guard}\n\n${outputLanguageHint}\n\n${userInstructionLabel}\n${instruction}\n\n${strings.diffHeading}\n${diff}`;
}
