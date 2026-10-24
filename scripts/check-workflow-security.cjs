const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const YAML = require('yaml');

const directory = path.join(__dirname, '..', '.github', 'workflows');
for (const filename of fs.readdirSync(directory).filter(name => name.endsWith('.yml'))) {
  const workflow = YAML.parse(fs.readFileSync(path.join(directory, filename), 'utf8'));
  assert.notStrictEqual(workflow.permissions?.contents, 'write', filename);
  for (const job of Object.values(workflow.jobs)) {
    assert.notStrictEqual(job.permissions?.contents, 'write', filename);
    for (const step of job.steps ?? []) {
      if (step.uses && !step.uses.startsWith('./')) assert.match(step.uses, /@[a-f0-9]{40}$/, filename);
      if (JSON.stringify(step).includes('secrets.')) assert.strictEqual(job.environment, 'release', filename);
    }
  }
}
const core = YAML.parse(fs.readFileSync(path.join(directory, '_publish-core.yml'), 'utf8'));
assert.strictEqual(core.jobs.publish.environment, 'release');
assert.ok(!core.jobs.publish.steps.some(step => /npm run|npm ci(?! --ignore-scripts)/.test(step.run ?? '')));
assert.ok(core.jobs.publish.steps.some(step => (step.run ?? '').includes('sha256sum --check --strict')));
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'commit-maker-release-contract-'));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim();
try {
  git('init', '--quiet');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '0.18.8' }));
  git('add', '.');
  const commit = () => git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'core.hooksPath=/dev/null', 'commit', '--quiet', '-m', 'test: fixture');
  commit();
  git('update-ref', 'refs/remotes/origin/main', git('rev-parse', 'HEAD'));
  const run = (channel, preRelease, refType, ref, refName, success) => {
    const env = { ...process.env, CHANNEL: channel, PRE_RELEASE: preRelease, GITHUB_REF_TYPE: refType,
      GITHUB_REF: ref, GITHUB_REF_NAME: refName, GITHUB_OUTPUT: path.join(root, 'metadata') };
    const action = () => execFileSync('bash', ['-c', core.jobs.validate.steps.find(step => step.id === 'metadata').run], { cwd: root, env, stdio: 'pipe' });
    if (success) action(); else assert.throws(action);
  };
  run('stable', 'false', 'tag', 'refs/tags/v0.18.8', 'v0.18.8', true);
  run('stable', 'false', 'tag', 'refs/tags/v0.18.9', 'v0.18.9', false);
  fs.writeFileSync(path.join(root, 'outside-main'), 'fixture'); git('add', '.'); commit();
  run('stable', 'false', 'tag', 'refs/tags/v0.18.8', 'v0.18.8', false);
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '0.19.0' })); git('add', '.'); commit();
  git('update-ref', 'refs/remotes/origin/main', git('rev-parse', 'HEAD'));
  run('preview', 'true', 'branch', 'refs/heads/main', 'main', true);
  run('preview', 'true', 'branch', 'refs/heads/unapproved', 'unapproved', false);
  run('stable', 'false', 'tag', 'refs/tags/v0.19.0', 'v0.19.0', false);
  console.log('PASS: workflow権限・固定SHA・artifact検証・main外tag/未承認preview拒否・正常公開metadata');
} finally { fs.rmSync(root, { recursive: true, force: true }); }
