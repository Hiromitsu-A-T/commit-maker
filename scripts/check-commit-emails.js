const { execFileSync } = require('child_process');

const ZERO_SHA = '0000000000000000000000000000000000000000';
const BANNED_EMAIL_PATTERNS = [/tozai-c\.co\.jp/i];

function git(args, options = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options,
  });
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function parsePrePushInput(input, remoteName) {
  return input
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [localRef, localSha, remoteRef, remoteSha] = line.split(/\s+/);
      if (!localRef || !localSha || !remoteRef || !remoteSha) {
        return [];
      }

      if (localSha === ZERO_SHA) {
        return [];
      }

      if (remoteSha === ZERO_SHA) {
        return [localSha, '--not', `--remotes=${remoteName}`];
      }

      return [`${remoteSha}..${localSha}`];
    })
    .filter((args) => args.length > 0);
}

function collectCommits(revArgsList) {
  const commits = new Set();

  for (const revArgs of revArgsList) {
    const output = git(['rev-list', ...revArgs], { stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (!output) {
      continue;
    }

    for (const sha of output.split(/\r?\n/)) {
      commits.add(sha);
    }
  }

  return [...commits];
}

function readCommitMetadata(commits) {
  if (commits.length === 0) {
    return [];
  }

  const output = git([
    'show',
    '-s',
    '--format=%H%x09%an%x09%ae%x09%cn%x09%ce',
    ...commits,
  ]).trim();

  if (!output) {
    return [];
  }

  return output.split(/\r?\n/).map((line) => {
    const [sha, authorName, authorEmail, committerName, committerEmail] = line.split('\t');
    return { sha, authorName, authorEmail, committerName, committerEmail };
  });
}

function emailIsBanned(email) {
  return BANNED_EMAIL_PATTERNS.some((pattern) => pattern.test(email || ''));
}

function checkCommits(revArgsList) {
  const commits = collectCommits(revArgsList);
  const violations = readCommitMetadata(commits).filter(
    (entry) => emailIsBanned(entry.authorEmail) || emailIsBanned(entry.committerEmail),
  );

  if (violations.length === 0) {
    process.stdout.write(`Checked ${commits.length} commit(s); no blocked email metadata found.\n`);
    return;
  }

  fail('Blocked email metadata was found in commit history:');
  for (const entry of violations) {
    process.stderr.write(
      `- ${entry.sha} author=${entry.authorName} <${entry.authorEmail}> ` +
        `committer=${entry.committerName} <${entry.committerEmail}>\n`,
    );
  }
  process.stderr.write('\nUse the GitHub noreply address before pushing public history.\n');
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--all')) {
    checkCommits([['--all']]);
    return;
  }

  const rangeIndex = args.indexOf('--range');
  if (rangeIndex >= 0 && args[rangeIndex + 1]) {
    checkCommits([[args[rangeIndex + 1]]]);
    return;
  }

  if (args.includes('--pre-push')) {
    const remoteName = args[args.indexOf('--pre-push') + 1] || 'origin';
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      input += chunk;
    });
    process.stdin.on('end', () => {
      const revArgsList = parsePrePushInput(input, remoteName);
      checkCommits(revArgsList);
    });
    return;
  }

  process.stderr.write(
    'Usage: node scripts/check-commit-emails.js --all | --range <rev-range> | --pre-push <remote>\n',
  );
  process.exitCode = 2;
}

main();
