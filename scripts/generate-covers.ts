import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import sharp from 'sharp';

type TalksFile = {
  talks: Array<{
    id: string;
    title: string;
    type: 'talk' | 'lightning' | 'break' | 'ceremony';
    speakers: Array<{ name: string }>;
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

const COVERS_DIR_WEB = '/assets/covers';
const COVERS_DIR_FS = path.join('public', 'assets', 'covers');

const COVER_W = 600;
const COVER_H = 400;

const TALK_TYPES_TO_RENDER = new Set(['talk', 'lightning'] as const);

function parseArgs(argv: string[]): Args {
  const args: Args = { force: false };

  for (const a of argv) {
    if (a === '--force') args.force = true;
    else if (a === '--help' || a === '-h') {
      process.stdout.write('Usage: npm run generate:covers [-- --force]\n');
      process.exit(0);
    } else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }

  return args;
}

function stableHashHex(input: string) {
  return crypto.createHash('sha1').update(input).digest('hex');
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText({
  text,
  maxCharsPerLine,
  maxLines,
}: {
  text: string;
  maxCharsPerLine: number;
  maxLines: number;
}) {
  const words = text.trim().split(/\s+/g);
  const lines: string[] = [];

  let current = '';
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;

    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = w;

    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length > maxLines) lines.length = maxLines;

  // Ensure *every* line fits the width; add ellipsis if it doesn't.
  return lines.map((ln, i) => {
    if (ln.length <= maxCharsPerLine) return ln;
    const clipped = ln.slice(0, Math.max(0, maxCharsPerLine - 1)) + '…';
    // If it's not the last line, prefer hard clip (no ellipsis) to avoid visual noise.
    return i === maxLines - 1 ? clipped : ln.slice(0, maxCharsPerLine);
  });
}

function webPathToFsPath(webPath: string) {
  // If webPath starts with '/', path.join would treat it as an absolute path.
  const rel = webPath.replace(/^\/+/, '');
  return path.join(process.cwd(), 'public', rel);
}

async function fileExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(p: string): Promise<T> {
  const raw = await fs.readFile(p, 'utf8');
  return JSON.parse(raw) as T;
}

function pickPalette(talkId: string) {
  // Fixed retro-ish palettes (dark bg + vibrant accents).
  const palettes = [
    ['#0b1026', '#16f7ff', '#ff2fd6', '#ffe948', '#3d34ff'],
    ['#0b0b0f', '#00ff6a', '#00c8ff', '#ff4d4d', '#ffd166'],
    ['#0a1320', '#ff9f1c', '#2ec4b6', '#e71d36', '#ffffff'],
    ['#120b1f', '#9b5de5', '#00f5d4', '#f15bb5', '#fee440'],
    ['#08101a', '#4cc9f0', '#4361ee', '#f72585', '#b9fbc0'],
  ] as const;

  const h = stableHashHex(talkId);
  const seed = parseInt(h.slice(0, 8), 16);
  const p = palettes[seed % palettes.length];

  // Rotate accents so we don’t always use the same pairing.
  const rot = seed % (p.length - 1);
  const accents = p.slice(1);
  const rotated = accents.slice(rot).concat(accents.slice(0, rot));

  return {
    bg: p[0],
    a1: rotated[0]!,
    a2: rotated[1]!,
    a3: rotated[2]!,
    ink: '#e6f6ff',
  };
}

function buildBackgroundSvg({ talkId }: { talkId: string }) {
  const { bg, a1, a2, a3 } = pickPalette(talkId);
  const h = stableHashHex(talkId);

  const seed = parseInt(h.slice(0, 8), 16);
  const s2 = parseInt(h.slice(8, 16), 16);

  const bandY = 40 + (seed % 120);
  const bandH = 80 + (s2 % 140);
  const diagShift = ((seed >>> 8) % 80) - 40;

  const dotStep = 14 + (seed % 10);
  const dotR = 1 + (s2 % 2);

  const frameStroke = a2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${COVER_W}" height="${COVER_H}" viewBox="0 0 ${COVER_W} ${COVER_H}">
  <rect width="100%" height="100%" fill="${bg}" />

  <!-- big diagonal blocks -->
  <polygon points="${-40 + diagShift},0 ${COVER_W * 0.65 + diagShift},0 ${COVER_W * 0.35 + diagShift},${COVER_H} ${-80 + diagShift},${COVER_H}" fill="${a1}" opacity="0.26" />
  <polygon points="${COVER_W + 80 - diagShift},0 ${COVER_W * 0.55 - diagShift},0 ${COVER_W * 0.85 - diagShift},${COVER_H} ${COVER_W + 40 - diagShift},${COVER_H}" fill="${a3}" opacity="0.22" />

  <!-- horizontal band -->
  <rect x="0" y="${bandY}" width="${COVER_W}" height="${bandH}" fill="${a2}" opacity="0.18" />

  <!-- dotted pattern -->
  <g opacity="0.25" fill="#ffffff">
    ${Array.from({ length: Math.ceil(COVER_H / dotStep) }, (_, yi) => {
      const y = yi * dotStep + ((seed % dotStep) / 2);
      const rowShift = (yi % 2) * (dotStep / 2);
      const cols = Math.ceil(COVER_W / dotStep);
      return Array.from({ length: cols }, (_, xi) => {
        const x = xi * dotStep + rowShift + ((s2 % dotStep) / 2);
        if (x > COVER_W || y > COVER_H) return '';
        return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${dotR}" />`;
      }).join('');
    }).join('')}
  </g>

  <!-- outer frame hint -->
  <rect x="8" y="8" width="${COVER_W - 16}" height="${COVER_H - 16}" fill="none" stroke="${frameStroke}" stroke-width="2" opacity="0.35" />
</svg>`;
}

function buildOverlaySvg({
  talkId,
  title,
  speaker,
}: {
  talkId: string;
  title: string;
  speaker?: string;
}) {
  const { a2, ink } = pickPalette(talkId);

  const avatarSize = 196;
  const pad = 28;
  const avatarX = COVER_W - pad - avatarSize;
  const avatarY = Math.round((COVER_H - avatarSize) / 2);

  const textX = pad;
  const textW = avatarX - pad - 16;

  const titleFont = 34;
  const speakerFont = 18;

  const approxCharW = titleFont * 0.56;
  const maxChars = clamp(Math.floor(textW / approxCharW), 12, 28);

  const lines = wrapText({ text: title, maxCharsPerLine: maxChars, maxLines: 4 });
  const lineHeight = Math.round(titleFont * 1.15);
  const titleY = 86;

  const speakerLine = speaker?.trim();

  // A subtle readability panel behind the text.
  const panelX = pad - 10;
  const panelY = 48;
  const panelW = textW + 20;
  const panelH = 250;

  const borderOuter = '#ffffff';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${COVER_W}" height="${COVER_H}" viewBox="0 0 ${COVER_W} ${COVER_H}">
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0.55" />
      <stop offset="1" stop-color="#000" stop-opacity="0.25" />
    </linearGradient>

    <!-- Clip text so it never overlaps the avatar well. -->
    <clipPath id="clipText">
      <rect x="${textX}" y="0" width="${textW}" height="${COVER_H}" />
    </clipPath>
  </defs>

  <!-- border/frame -->
  <rect x="4" y="4" width="${COVER_W - 8}" height="${COVER_H - 8}" fill="none" stroke="${borderOuter}" stroke-width="3" opacity="0.9" />
  <rect x="10" y="10" width="${COVER_W - 20}" height="${COVER_H - 20}" fill="none" stroke="${a2}" stroke-width="2" opacity="0.55" />

  <!-- avatar well (image is composited separately) -->
  <rect x="${avatarX - 10}" y="${avatarY - 10}" width="${avatarSize + 20}" height="${avatarSize + 20}" rx="14" fill="#000" opacity="0.25" />
  <rect x="${avatarX - 6}" y="${avatarY - 6}" width="${avatarSize + 12}" height="${avatarSize + 12}" rx="12" fill="none" stroke="${a2}" stroke-width="2" opacity="0.8" />

  <!-- text panel -->
  <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="14" fill="url(#panel)" />
  <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="14" fill="none" stroke="${a2}" stroke-width="2" opacity="0.6" />

  <g clip-path="url(#clipText)" font-family="system-ui, -apple-system, Segoe UI, sans-serif" fill="${ink}">
    ${lines
      .map((ln, i) => {
        const y = titleY + i * lineHeight;
        return `<text x="${textX}" y="${y}" font-size="${titleFont}" font-weight="800" letter-spacing="0.2">${escapeXml(ln)}</text>`;
      })
      .join('\n    ')}

    ${
      speakerLine
        ? `<text x="${textX}" y="${COVER_H - 48}" font-size="${speakerFont}" font-weight="600" opacity="0.9">${escapeXml(speakerLine)}</text>`
        : ''
    }
  </g>

  <!-- corner micro-label -->
  <text x="${pad}" y="${COVER_H - 18}" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="12" fill="${a2}" opacity="0.85">${escapeXml(talkId)}</text>
</svg>`;
}

async function generateCover({
  talkId,
  title,
  speaker,
  avatar8bitWebPath,
  outPath,
}: {
  talkId: string;
  title: string;
  speaker?: string;
  avatar8bitWebPath?: string;
  outPath: string;
}) {
  const bgSvg = buildBackgroundSvg({ talkId });
  const overlaySvg = buildOverlaySvg({ talkId, title, speaker });

  const composites: sharp.OverlayOptions[] = [{ input: Buffer.from(overlaySvg) }];

  if (avatar8bitWebPath) {
    const avatarFs = webPathToFsPath(avatar8bitWebPath);
    if (await fileExists(avatarFs)) {
      const avatarSize = 196;
      const pad = 28;
      const left = COVER_W - pad - avatarSize;
      const top = Math.round((COVER_H - avatarSize) / 2);

      const avatarBuf = await sharp(avatarFs)
        .resize(avatarSize, avatarSize, { fit: 'cover', kernel: sharp.kernel.nearest })
        .png()
        .toBuffer();

      composites.unshift({ input: avatarBuf, left, top });
    }
  }

  const tmp = `${outPath}.tmp`;
  await fs.mkdir(path.dirname(outPath), { recursive: true });

  await sharp(Buffer.from(bgSvg))
    .resize(COVER_W, COVER_H)
    .composite(composites)
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(tmp);

  await fs.rename(tmp, outPath);
}

async function main() {
  const { force } = parseArgs(process.argv.slice(2));

  const talksFile = await readJsonFile<TalksFile>(TALKS_PATH);
  const assetsFile = await readJsonFile<AssetsFile>(ASSETS_PATH);

  const existingByTalkId = new Map(assetsFile.assets.map((a) => [a.talkId, a] as const));

  let generated = 0;
  let skipped = 0;
  let updatedAssets = 0;

  const outAssets: AssetsFile['assets'] = [];

  for (const talk of talksFile.talks) {
    const existing = existingByTalkId.get(talk.id) ?? { talkId: talk.id };

    if (!TALK_TYPES_TO_RENDER.has(talk.type as any)) {
      outAssets.push(existing);
      continue;
    }

    const coverWebPath = `${COVERS_DIR_WEB}/${talk.id}.png`;
    const coverFsPath = path.join(process.cwd(), COVERS_DIR_FS, `${talk.id}.png`);

    const speaker = talk.speakers?.[0]?.name;

    if (!force && (await fileExists(coverFsPath))) {
      skipped++;
    } else {
      await generateCover({
        talkId: talk.id,
        title: talk.title,
        speaker,
        avatar8bitWebPath: existing.avatar8bit,
        outPath: coverFsPath,
      });
      generated++;
    }

    const next = {
      ...existing,
      cover: coverWebPath,
    };

    if (existing.cover !== next.cover) updatedAssets++;

    outAssets.push(next);
  }

  const out: AssetsFile = { assets: outAssets };
  await fs.writeFile(ASSETS_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');

  process.stdout.write(
    [
      `OK: wrote ${ASSETS_PATH}`,
      `covers: generated=${generated} skipped=${skipped}`,
      `assetsUpdated=${updatedAssets}`,
      force ? 'mode=force' : 'mode=cache',
    ].join(' | ') + '\n',
  );
}

main().catch((err) => {
  process.stderr.write(`${err?.stack ?? String(err)}\n`);
  process.exitCode = 1;
});
