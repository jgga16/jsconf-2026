#!/usr/bin/env node

/**
 * Deterministic 8-bit avatar generator (build-time).
 *
 * Pipeline (default):
 *  1) load input (file path) or generate placeholder
 *  2) center-crop + downscale to BASE px (default 64×64)
 *  3) map each pixel to nearest color in a fixed 16-color palette (NES-ish)
 *  4) upscale to OUT px (default 128×128) with nearest-neighbor
 *  5) write: public/assets/avatars/{slug}.png
 *
 * Usage:
 *  node scripts-generate-avatars.mjs --input ./me.jpg --slug gisela-torres
 *  node scripts-generate-avatars.mjs --inputDir ./input/avatars
 *  node scripts-generate-avatars.mjs --demo
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const NES16 = [
  '#000000', '#1D2B53', '#7E2553', '#008751',
  '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
  '#FF004D', '#FFA300', '#FFEC27', '#00E436',
  '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA',
].map(hexToRgb);

function hexToRgb(hex) {
  const h = hex.replace('#', '').trim();
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

function parseArgs(argv) {
  const args = {
    input: undefined,
    inputDir: undefined,
    slug: undefined,
    outDir: 'public/assets/avatars',
    baseSize: 64,
    scale: 2,
    palette: 'nes16',
    overwrite: false,
    demo: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];

    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--demo') args.demo = true;
    else if (a === '--overwrite') args.overwrite = true;
    else if (a === '--input') args.input = next();
    else if (a === '--inputDir') args.inputDir = next();
    else if (a === '--slug') args.slug = next();
    else if (a === '--outDir') args.outDir = next();
    else if (a === '--baseSize') args.baseSize = Number.parseInt(next(), 10);
    else if (a === '--scale') args.scale = Number.parseInt(next(), 10);
    else if (a === '--palette') args.palette = next();
    else throw new Error(`Unknown arg: ${a}`);
  }

  return args;
}

function usage() {
  return `\
Deterministic 8-bit avatar generator (sharp)

Examples:
  node scripts-generate-avatars.mjs --demo
  node scripts-generate-avatars.mjs --input ./me.jpg --slug gisela-torres
  node scripts-generate-avatars.mjs --inputDir ./input/avatars --outDir public/assets/avatars

Options:
  --input <path>        Input image path (jpg/png/webp)
  --inputDir <dir>      Process all images in a directory
  --slug <slug>         Output name (defaults to filename slug)
  --outDir <dir>        Output directory (default: public/assets/avatars)
  --baseSize <n>        Internal pixel grid size (default: 64)
  --scale <n>           Nearest-neighbor upscale factor (default: 2)
  --palette nes16       Fixed palette (default: nes16)
  --overwrite           Overwrite existing outputs
  --help                Show help
`;
}

function slugify(s) {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pickTwoBgColors(slug) {
  const h = fnv1a(slug);
  const a = NES16[h % NES16.length];
  const b = NES16[(h >>> 8) % NES16.length];
  return [a, b];
}

function makePlaceholderRaw({ slug, size }) {
  const [bgA, bgB] = pickTwoBgColors(slug);
  const fg = NES16[(fnv1a(slug) >>> 16) % NES16.length];

  const buf = Buffer.alloc(size * size * 4);

  // Background checker gradient-ish.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * (size - 1));
      const bg = (x + y) % 2 === 0 ? bgA : bgB;
      const r = Math.round(bg.r * (0.75 + 0.25 * t));
      const g = Math.round(bg.g * (0.75 + 0.25 * t));
      const b = Math.round(bg.b * (0.75 + 0.25 * t));

      const idx = (y * size + x) * 4;
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = 255;
    }
  }

  // Draw a simple 8×8 '?' glyph in the center.
  const glyph = [
    '00111100',
    '01100110',
    '00000110',
    '00001100',
    '00011000',
    '00000000',
    '00011000',
    '00011000',
  ];

  const glyphScale = Math.max(1, Math.floor(size / 12));
  const gw = 8 * glyphScale;
  const gh = 8 * glyphScale;
  const ox = Math.floor((size - gw) / 2);
  const oy = Math.floor((size - gh) / 2);

  for (let gy = 0; gy < 8; gy++) {
    for (let gx = 0; gx < 8; gx++) {
      if (glyph[gy][gx] !== '1') continue;
      for (let sy = 0; sy < glyphScale; sy++) {
        for (let sx = 0; sx < glyphScale; sx++) {
          const x = ox + gx * glyphScale + sx;
          const y = oy + gy * glyphScale + sy;
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          const idx = (y * size + x) * 4;
          buf[idx] = fg.r;
          buf[idx + 1] = fg.g;
          buf[idx + 2] = fg.b;
          buf[idx + 3] = 255;
        }
      }
    }
  }

  return { buf, width: size, height: size, channels: 4 };
}

function nearestPaletteColor(r, g, b, cache) {
  const key = (r << 16) | (g << 8) | b;
  const cached = cache.get(key);
  if (cached) return cached;

  let best = NES16[0];
  let bestD = Number.POSITIVE_INFINITY;

  for (const c of NES16) {
    const dr = r - c.r;
    const dg = g - c.g;
    const db = b - c.b;
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) {
      bestD = d;
      best = c;
      if (d === 0) break;
    }
  }

  cache.set(key, best);
  return best;
}

async function generate8BitAvatar({ inputPath, slug, outDir, baseSize, scale, overwrite }) {
  const outPath = path.join(outDir, `${slug}.png`);

  if (!overwrite) {
    try {
      await fs.access(outPath);
      return { outPath, skipped: true };
    } catch {
      // continue
    }
  }

  await fs.mkdir(outDir, { recursive: true });

  const source = inputPath
    ? sharp(inputPath)
    : sharp(makePlaceholderRaw({ slug, size: baseSize }).buf, {
        raw: { width: baseSize, height: baseSize, channels: 4 },
      });

  const resized = source
    .rotate()
    .toColourspace('srgb')
    .resize(baseSize, baseSize, {
      fit: 'cover',
      position: 'centre',
      kernel: sharp.kernel.lanczos3,
    })
    .flatten({ background: { r: 0, g: 0, b: 0 } })
    .ensureAlpha();

  const { data, info } = await resized.raw().toBuffer({ resolveWithObject: true });

  const cache = new Map();
  const mapped = Buffer.alloc(info.width * info.height * 4);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    const c = nearestPaletteColor(r, g, b, cache);

    mapped[i] = c.r;
    mapped[i + 1] = c.g;
    mapped[i + 2] = c.b;
    mapped[i + 3] = a;
  }

  const outSize = baseSize * scale;

  await sharp(mapped, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize(outSize, outSize, { kernel: sharp.kernel.nearest })
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(outPath);

  return { outPath, skipped: false };
}

async function listImages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => /\.(png|jpe?g|webp)$/i.test(n))
    .map((n) => path.join(dir, n))
    .sort();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    process.stdout.write(usage());
    return;
  }

  if (args.palette !== 'nes16') {
    throw new Error(`Unsupported palette: ${args.palette} (only 'nes16' is supported)`);
  }

  if (!Number.isFinite(args.baseSize) || args.baseSize <= 0) {
    throw new Error(`Invalid --baseSize: ${args.baseSize}`);
  }

  if (!Number.isFinite(args.scale) || args.scale <= 0) {
    throw new Error(`Invalid --scale: ${args.scale}`);
  }

  const jobs = [];

  if (args.demo) {
    jobs.push({ inputPath: undefined, slug: 'demo-speaker' });
  } else if (args.inputDir) {
    const inputs = await listImages(args.inputDir);
    for (const inputPath of inputs) {
      const base = path.basename(inputPath, path.extname(inputPath));
      jobs.push({ inputPath, slug: slugify(base) });
    }
  } else if (args.input) {
    const slug = args.slug ?? slugify(path.basename(args.input, path.extname(args.input)));
    jobs.push({ inputPath: args.input, slug });
  } else {
    throw new Error('Provide --input, --inputDir, or --demo. Use --help for details.');
  }

  let ok = 0;
  let skipped = 0;

  for (const job of jobs) {
    const res = await generate8BitAvatar({
      inputPath: job.inputPath,
      slug: job.slug,
      outDir: args.outDir,
      baseSize: args.baseSize,
      scale: args.scale,
      overwrite: args.overwrite,
    });

    if (res.skipped) skipped++;
    else ok++;

    process.stdout.write(`${res.skipped ? 'SKIP' : 'OK  '} ${job.slug} -> ${res.outPath}\n`);
  }

  process.stdout.write(`\nDone. generated=${ok} skipped=${skipped} total=${jobs.length}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err?.stack ?? String(err)}\n`);
  process.exitCode = 1;
});
