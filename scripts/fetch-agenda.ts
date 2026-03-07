import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { load } from 'cheerio';
import { TalksFileSchema } from '../src/schemas/talk';

const SOURCE_URL = 'https://www.jsconf.es/';
const CACHE_DIR = path.join('.cache', 'agenda');
const CACHE_HTML_PATH = path.join(CACHE_DIR, 'index.html');
const CACHE_META_PATH = path.join(CACHE_DIR, 'meta.json');
const OUT_PATH = path.join('src', 'data', 'talks.json');

type CacheMeta = {
  sourceUrl: string;
  fetchedAt: string;
  etag?: string;
  lastModified?: string;
  sha256: string;
};

type Args = {
  refresh: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { refresh: false };

  for (const a of argv) {
    if (a === '--refresh') args.refresh = true;
    else if (a === '--help' || a === '-h') {
      process.stdout.write(`Usage: npm run fetch-agenda [-- --refresh]\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }

  return args;
}

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function slugify(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function ensureAbsoluteUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return new URL(url, SOURCE_URL).toString();
  return new URL(url, SOURCE_URL).toString();
}

function inferType(title: string, speakerRole?: string, speakerCount = 0) {
  const t = title.toLowerCase();

  if (/(pausa|café|cafe|churros|comer|comida|coctel|cocktail|networking)/.test(t)) {
    return 'break' as const;
  }

  if (/(inicio|sorteos|despedida|clausura|bienvenida|apertura|avisos)/.test(t)) {
    return 'ceremony' as const;
  }

  if (speakerRole?.toLowerCase().includes('presentador')) {
    return 'ceremony' as const;
  }

  if (speakerCount > 0) return 'talk' as const;

  return 'ceremony' as const;
}

function inferLanguage(title: string, description: string) {
  const txt = `${title} ${description}`.toLowerCase();
  if (/\b(the|and|with|from|into|without|how|why|what|human-in-the-loop)\b/.test(txt)) return 'en' as const;
  return 'es' as const;
}

async function readCache() {
  try {
    const [html, metaRaw] = await Promise.all([
      fs.readFile(CACHE_HTML_PATH, 'utf8'),
      fs.readFile(CACHE_META_PATH, 'utf8'),
    ]);
    const meta = JSON.parse(metaRaw) as CacheMeta;
    return { html, meta };
  } catch {
    return null;
  }
}

async function writeCache(html: string, meta: CacheMeta) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await Promise.all([
    fs.writeFile(CACHE_HTML_PATH, html, 'utf8'),
    fs.writeFile(CACHE_META_PATH, JSON.stringify(meta, null, 2) + '\n', 'utf8'),
  ]);
}

async function fetchHtml({ refresh }: Args) {
  const cached = refresh ? null : await readCache();

  const headers: Record<string, string> = {
    Accept: 'text/html',
    'User-Agent': 'sopla-el-cartucho-jsconf/agenda-fetch',
  };

  if (cached?.meta.etag) headers['If-None-Match'] = cached.meta.etag;
  if (cached?.meta.lastModified) headers['If-Modified-Since'] = cached.meta.lastModified;

  try {
    const res = await fetch(SOURCE_URL, { headers });

    if (res.status === 304 && cached) {
      return { html: cached.html, cache: 'hit' as const };
    }

    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    const meta: CacheMeta = {
      sourceUrl: SOURCE_URL,
      fetchedAt: new Date().toISOString(),
      etag: res.headers.get('etag') ?? undefined,
      lastModified: res.headers.get('last-modified') ?? undefined,
      sha256: sha256(html),
    };

    await writeCache(html, meta);
    return { html, cache: cached ? ('refreshed' as const) : ('miss' as const) };
  } catch (err) {
    if (cached) {
      process.stderr.write(`WARN: fetch failed, using cached HTML (reason: ${String(err)})\n`);
      return { html: cached.html, cache: 'stale' as const };
    }

    throw err;
  }
}

function parseAgenda(html: string) {
  const $ = load(html);
  const $agenda = $('#agenda');

  if ($agenda.length === 0) {
    throw new Error('Could not find <section id="agenda"> in HTML');
  }

  const talks: Array<any> = [];

  // Break blocks (time range)
  $agenda.find('div.py-6').each((_i, el) => {
    const $el = $(el);

    const rangeText = $el
      .find('span')
      .toArray()
      .map((s) => $(s).text().trim())
      .find((t) => /^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/.test(t));

    if (!rangeText) return;

    const [start, end] = rangeText.split('-').map((x) => x.trim());

    // Heuristic: the title tends to be the longest non-time string in spans/p tags.
    const titleCandidates = $el
      .find('span, p')
      .toArray()
      .map((n) => $(n).text().trim())
      .filter(Boolean)
      .filter((t) => !/\d{2}:\d{2}/.test(t));

    const title = titleCandidates.sort((a, b) => b.length - a.length)[0] ?? 'Break';

    talks.push({
      id: slugify(title),
      title,
      description: '',
      speakers: [],
      time: { start, end },
      type: 'break',
      language: 'es',
      tags: [],
    });
  });

  // Talk/ceremony cards
  $agenda.find('div.bg-dark-surface\\/50').each((_i, el) => {
    const $card = $(el);

    const title = $card.find('h4').first().text().trim();
    if (!title) return;

    const start = $card.find('span.text-js-yellow').first().text().trim();
    const end = $card.find('span.text-gray-500').first().text().trim();

    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
      return;
    }

    const description = $card.find('p.text-gray-400').first().text().trim() || '';

    const name = $card.find('p.font-bold').first().text().trim();
    const role = $card.find('p.font-bold').first().nextAll('p').first().text().trim() || '';
    const avatarSrc = $card.find('img').first().attr('src');

    const speakers = name && avatarSrc
      ? [{ name, role, avatarUrl: ensureAbsoluteUrl(avatarSrc) }]
      : [];

    talks.push({
      id: slugify(title),
      title,
      description,
      speakers,
      time: { start, end },
      type: inferType(title, speakers[0]?.role, speakers.length),
      language: inferLanguage(title, description),
      tags: [],
    });
  });

  talks.sort((a, b) => a.time.start.localeCompare(b.time.start));

  // Ensure stable unique IDs (some slot titles repeat, e.g. "Pausa de Café").
  const seen = new Map<string, number>();
  for (const t of talks) {
    const n = seen.get(t.id) ?? 0;
    if (n === 0) seen.set(t.id, 1);
    else {
      const next = n + 1;
      seen.set(t.id, next);
      t.id = `${t.id}-${next}`;
    }
  }

  const talksFile = {
    event: {
      name: 'JSConf España 2026',
      date: '2026-03-14',
      venue: 'La Nave, Madrid',
    },
    talks,
  };

  return TalksFileSchema.parse(talksFile);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const { html, cache } = await fetchHtml(args);
  const parsed = parseAgenda(html);

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(parsed, null, 2) + '\n', 'utf8');

  process.stdout.write(`OK: wrote ${OUT_PATH} (items=${parsed.talks.length}, cache=${cache})\n`);
}

main().catch((err) => {
  process.stderr.write(`${err?.stack ?? String(err)}\n`);
  process.exitCode = 1;
});
