import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { SUPPORTED_LANG_CODES } from './languages';
import { STRINGS } from './strings';

export function runStringsTests(): void {
  const root = path.resolve(__dirname, '../..');
  const expectedKeys = Object.keys(STRINGS.en).sort();
  assert.deepStrictEqual(Object.keys(STRINGS).sort(), [...SUPPORTED_LANG_CODES].sort());
  assert.deepStrictEqual(fs.readdirSync(path.join(__dirname, 'locales')).map(file => file.replace(/\.ts$/, '')).sort(),
    [...SUPPORTED_LANG_CODES].sort());
  const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const code of SUPPORTED_LANG_CODES) {
    const strings = STRINGS[code];
    assert.deepStrictEqual(Object.keys(strings).sort(), expectedKeys, `${code}: キー集合`);
    assert.strictEqual(strings.langCode, code);
    assertUniqueProperties(path.join(__dirname, 'locales', `${code}.ts`));
    for (const key of expectedKeys as (keyof typeof strings)[]) {
      assert.ok(strings[key].trim(), `${code}.${key}: 空の文言`);
      assert.deepStrictEqual(placeholders(strings[key]), placeholders(STRINGS.en[key]), `${code}.${key}: 置換文字列`);
    }
  }
  const nlsRoot = path.join(root, 'i18n/package-nls');
  const nlsKeys = Object.keys(JSON.parse(fs.readFileSync(path.join(root, 'package.nls.json'), 'utf8'))).sort();
  const nlsLanguages = SUPPORTED_LANG_CODES.filter(code => code !== 'en')
    .map(code => code === 'zh' ? 'zh-cn' : code.toLowerCase());
  assert.deepStrictEqual(fs.readdirSync(nlsRoot).sort(), nlsLanguages.map(code => `package.nls.${code}.json`).sort());
  for (const filename of [path.join(root, 'package.nls.json'), ...fs.readdirSync(nlsRoot).map(file => path.join(nlsRoot, file))]) {
    assertUniqueProperties(filename);
    const values = JSON.parse(fs.readFileSync(filename, 'utf8')) as Record<string, string>;
    assert.deepStrictEqual(Object.keys(values).sort(), nlsKeys, filename);
    assert.ok(Object.values(values).every(value => typeof value === 'string' && value.trim()), filename);
  }
  console.log(`PASS: UI ${SUPPORTED_LANG_CODES.length} 言語・NLS ${nlsLanguages.length + 1} 言語のキー・重複・置換文字列`);
}

function assertUniqueProperties(filename: string): void {
  const text = fs.readFileSync(filename, 'utf8');
  const source = ts.createSourceFile(filename, filename.endsWith('.json') ? `(${text})` : text, ts.ScriptTarget.Latest, true);
  const visit = (node: ts.Node): void => {
    if (ts.isObjectLiteralExpression(node)) {
      const names = node.properties.map(property => property.name?.getText(source)).filter(Boolean);
      assert.strictEqual(new Set(names).size, names.length, `${filename}: 重複キー`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}
