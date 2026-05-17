const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BADGES_DIR = path.join(ROOT, 'media', 'badges');
const EXTENSION_ID = 'Hiromitsu.commit-maker';
const OPEN_VSX_URL = 'https://open-vsx.org/api/Hiromitsu/commit-maker';
const MARKETPLACE_URL = 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery?api-version=3.0-preview.1';

function compactNumber(value) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value < 10000 ? 1 : 0,
  })
    .format(value)
    .toLowerCase();
}

function badge(label, message, color) {
  return {
    schemaVersion: 1,
    label,
    message,
    color,
  };
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function writeBadge(filename, content) {
  await fs.mkdir(BADGES_DIR, { recursive: true });
  await fs.writeFile(path.join(BADGES_DIR, filename), `${JSON.stringify(content, null, 2)}\n`);
}

async function keepExistingOrFallback(filename, fallback) {
  try {
    await fs.access(path.join(BADGES_DIR, filename));
  } catch {
    await writeBadge(filename, fallback);
  }
}

async function updateBadge(filename, fallback, load) {
  try {
    const content = await load();
    await writeBadge(filename, content);
    console.log(`Updated ${filename}: ${content.message}`);
    return true;
  } catch (error) {
    await keepExistingOrFallback(filename, fallback);
    console.warn(`Kept existing ${filename}: ${error.message}`);
    return false;
  }
}

function statisticMap(statistics) {
  return Object.fromEntries((statistics || []).map((entry) => [entry.statisticName, entry.value]));
}

async function openVsxDownloadsBadge() {
  const json = await fetchJson(OPEN_VSX_URL, {
    headers: { Accept: 'application/json' },
  });
  const downloads = Number(json.downloadCount);
  if (!Number.isFinite(downloads)) {
    throw new Error('Open VSX downloadCount is missing');
  }

  return badge('Open VSX', `${compactNumber(downloads)} downloads`, '00c7b7');
}

async function marketplaceDownloadsBadge() {
  const json = await fetchJson(MARKETPLACE_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json;api-version=3.0-preview.1',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filters: [
        {
          criteria: [{ filterType: 7, value: EXTENSION_ID }],
        },
      ],
      flags: 918,
    }),
  });

  const extension = json.results?.[0]?.extensions?.[0];
  if (!extension) {
    throw new Error('Marketplace extension was not found');
  }

  const stats = statisticMap(extension.statistics);
  const downloads = Number(stats.downloadCount);
  if (!Number.isFinite(downloads)) {
    throw new Error('Marketplace downloadCount is missing');
  }

  return badge('VS Marketplace', `${compactNumber(downloads)} downloads`, '0078d4');
}

async function main() {
  const results = await Promise.all([
    updateBadge(
      'open-vsx-downloads.json',
      badge('Open VSX', 'downloads unavailable', 'lightgrey'),
      openVsxDownloadsBadge,
    ),
    updateBadge(
      'vs-marketplace-downloads.json',
      badge('VS Marketplace', 'downloads unavailable', 'lightgrey'),
      marketplaceDownloadsBadge,
    ),
  ]);

  if (!results.some(Boolean)) {
    console.warn('No badge data was refreshed; existing badge JSON was preserved.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
