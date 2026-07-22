import assert from 'assert';
import { serializeForInlineScript } from './webviewSerialization';

export async function runWebviewSerializationTests(): Promise<void> {
  const value = {
    prompt: '</script><script>alert("x")</script>',
    symbols: '<>&',
    separators: '\u2028\u2029'
  };
  const serialized = serializeForInlineScript(value);

  assert.deepStrictEqual(JSON.parse(serialized), value);
  assert.ok(!serialized.includes('</script>'), 'inline JSON must not terminate the script element');
  assert.ok(!/[<>&\u2028\u2029]/u.test(serialized), 'inline JSON must escape HTML and line separator characters');
  assert.strictEqual(serializeForInlineScript(undefined), 'null');

  console.log('webviewSerialization.test.ts passed');
}
