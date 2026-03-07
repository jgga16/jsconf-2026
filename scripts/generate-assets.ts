import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

type TalksFile = {
  talks: Array<{
    id: string;
    speakers: Array<{ name: string; avatarUrl: string }>;
  }>;
};

type AssetsFile = {
  assets: Array<{
    talkId: string;
    cover?: string;
    avatar8bit?: string;
    avatarOriginal?: string;
  }>;
};

type Args = {
  force: boolean;
};

const TALKS_PATH = path.join('src', 'data', 'talks.json');
const ASSETS_PATH = path.join('src', 'data', 'assets.json');

const ORIGINAL_DIR_WEB = '/assets/avatars/original';
const ORIGINAL_DIR_FS = path.join('public', 'assets', 'avatars', 'original');
const AVATAR8_DIR_WEB = '/assets/avatars';
const AVATAR8_DIR_FS = path.join('public', 'assets', 'avatars');

function parseArgs(argv: string[]): Args {
  const args: Args = { force: false };

  for (const a of argv) {
    if (a === '--force') args.force = true;
    else if (a === '--help' || a === '-h') {
      process.stdout.write('Usage: npm run generate:assets [-- --force]\n');
      process.exit(0);
    } else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }

  return args;
}

function slugify(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function shortHash(input: string) {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 8);
}

function safeExtFromUrl(url: string) {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (ext && /^\.(png|jpe?g|webp)$/i.test(ext)) return ext;
  } catch {
    // ignore
  }
  return '.img';
}

async function fileExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function downloadIfNeeded(url: string, outPath: string, force: boolean) {
  if (!force && (await fileExists(outPath))) return { skipped: true };

  await fs.mkdir(path.dirname(outPath), { recursive: true });

  const res = await fetch(url, {
    headers: {
      Accept: 'image/*',
      'User-Agent': 'sopla-el-cartucho-jsconf/assets-generator',
    },
  });

  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText} (${url})`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const tmp = `${outPath}.tmp`;
  await fs.writeFile(tmp, buf);
  await fs.rename(tmp, outPath);

  return { skipped: false };
}

async function runGenerateAvatars({ inputPath, slug, force }: { inputPath: string; slug: string; force: boolean }) {
  const outPng = path.join(AVATAR8_DIR_FS, `${slug}.png`);
  if (!force && (await fileExists(outPng))) return { skipped: true };

  await fs.mkdir(AVATAR8_DIR_FS, { recursive: true });

  const args = ['scripts-generate-avatars.mjs', '--input', inputPath, '--slug', slug, '--outDir', AVATAR8_DIR_FS];
  if (force) args.push('--overwrite');

  await new Promise<void>((resolve, reject) => {
    const child = spawn('node', args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`generate-avatars exited with code ${code}`));
    });
  });

  return { skipped: false };
}

async function readJsonFile<T>(p: string): Promise<T> {
  const raw = await fs.readFile(p, 'utf8');
  return JSON.parse(raw) as T;
}

async function readAssetsFileOrEmpty(): Promise<AssetsFile> {
  try {
    return await readJsonFile<AssetsFile>(ASSETS_PATH);
  } catch {
    return { assets: [] };
  }
}

async function main() {
  const { force } = parseArgs(process.argv.slice(2));

  const talks = await readJsonFile<TalksFile>(TALKS_PATH);
  const existingAssets = await readAssetsFileOrEmpty();

  const existingByTalkId = new Map(existingAssets.assets.map((a) => [a.talkId, a] as const));

  const slugToUrl = new Map<string, string>();

  let downloaded = 0;
  let downloadedSkipped = 0;
  let generated = 0;
  let generatedSkipped = 0;
  let withAvatar = 0;

  const outAssets: AssetsFile['assets'] = [];

  for (const talk of talks.talks) {
    const existing = existingByTalkId.get(talk.id);

    const speaker = talk.speakers?.[0];
    if (!speaker?.avatarUrl) {
      outAssets.push({ talkId: talk.id, cover: existing?.cover });
      continue;
    }

    withAvatar++;

    const baseSlug = slugify(speaker.name) || talk.id;

    // Avoid accidental collisions if the same slug is encountered with a different URL.
    const priorUrl = slugToUrl.get(baseSlug);
    const speakerSlug = !priorUrl
      ? baseSlug
      : priorUrl === speaker.avatarUrl
        ? baseSlug
        : `${baseSlug}-${shortHash(speaker.avatarUrl)}`;

    // Reserve both the base slug and (if needed) the disambiguated slug.
    if (!priorUrl) slugToUrl.set(baseSlug, speaker.avatarUrl);
    slugToUrl.set(speakerSlug, speaker.avatarUrl);

    const ext = safeExtFromUrl(speaker.avatarUrl);
    const originalWebPath = `${ORIGINAL_DIR_WEB}/${speakerSlug}${ext}`;
    const originalFsPath = path.join(process.cwd(), ORIGINAL_DIR_FS, `${speakerSlug}${ext}`);

    try {
      const dl = await downloadIfNeeded(speaker.avatarUrl, originalFsPath, force);
      if (dl.skipped) downloadedSkipped++;
      else downloaded++;

      const gen = await runGenerateAvatars({ inputPath: originalFsPath, slug: speakerSlug, force });
      if (gen.skipped) generatedSkipped++;
      else generated++;

      const avatar8bitWebPath = `${AVATAR8_DIR_WEB}/${speakerSlug}.png`;

      outAssets.push({
        talkId: talk.id,
        cover: existing?.cover,
        avatarOriginal: originalWebPath,
        avatar8bit: avatar8bitWebPath,
      });
    } catch (err) {
      process.stderr.write(`WARN: ${talk.id}: failed to generate avatar (${String(err)})\n`);
      outAssets.push({ talkId: talk.id, cover: existing?.cover });
    }
  }

  const out: AssetsFile = { assets: outAssets };

  await fs.mkdir(path.dirname(ASSETS_PATH), { recursive: true });
  await fs.writeFile(ASSETS_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');

  process.stdout.write(
    [
      `OK: wrote ${ASSETS_PATH}`,
      `talks=${talks.talks.length}`,
      `withAvatar=${withAvatar}`,
      `downloaded=${downloaded} skipped=${downloadedSkipped}`,
      `generated=${generated} skipped=${generatedSkipped}`,
      force ? 'mode=force' : 'mode=cache',
    ].join(' | ') +
      '\n',
  );
}

main().catch((err) => {
  process.stderr.write(`${err?.stack ?? String(err)}\n`);
  process.exitCode = 1;
});
