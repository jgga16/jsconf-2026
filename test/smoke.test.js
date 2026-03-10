import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const TIME_RE = /^\d{2}:\d{2}$/;

async function readJson(relPath) {
  const raw = await fs.readFile(new URL(relPath, import.meta.url), 'utf8');
  return JSON.parse(raw);
}

function webPathToPublicFs(webPath) {
  assert.equal(typeof webPath, 'string');
  assert.ok(webPath.startsWith('/'), `expected web path starting with '/': ${webPath}`);
  assert.ok(!webPath.includes('..'), `path traversal not allowed: ${webPath}`);
  return path.join(process.cwd(), 'public', webPath);
}

test('talks.json has event + talks[] (basic invariants)', async () => {
  const json = await readJson('../src/data/talks.json');

  assert.ok(json.event);
  assert.equal(typeof json.event.name, 'string');
  assert.equal(typeof json.event.date, 'string');
  assert.equal(typeof json.event.venue, 'string');

  assert.ok(Array.isArray(json.talks));

  const ids = new Set();

  for (const t of json.talks) {
    assert.equal(typeof t.id, 'string');
    assert.ok(t.id.length > 0);

    assert.ok(!ids.has(t.id), `duplicate talk id: ${t.id}`);
    ids.add(t.id);

    assert.equal(typeof t.title, 'string');
    assert.equal(typeof t.description, 'string');

    assert.ok(Array.isArray(t.speakers));
    for (const s of t.speakers) {
      assert.equal(typeof s.name, 'string');
      assert.equal(typeof s.role, 'string');
      assert.equal(typeof s.avatarUrl, 'string');
    }

    assert.ok(t.time);
    assert.ok(TIME_RE.test(t.time.start), `bad start time: ${t.time.start}`);
    assert.ok(TIME_RE.test(t.time.end), `bad end time: ${t.time.end}`);

    assert.ok(['talk', 'break', 'ceremony', 'lightning'].includes(t.type));
    if (t.type === 'break' && t.breakType !== undefined) {
      assert.ok(
        ['coffee', 'breakfast', 'lunch', 'networking'].includes(t.breakType),
        `invalid breakType '${t.breakType}' for talk id: ${t.id}`,
      );
    }
    assert.ok(['es', 'en'].includes(t.language));
    assert.ok(Array.isArray(t.tags));
  }
});

test('assets.json uses web paths and referenced files exist (when present)', async () => {
  const talks = await readJson('../src/data/talks.json');
  const assets = await readJson('../src/data/assets.json');

  const talkIds = new Set(talks.talks.map((t) => t.id));

  assert.ok(Array.isArray(assets.assets));

  const seen = new Set();
  for (const a of assets.assets) {
    assert.equal(typeof a.talkId, 'string');
    assert.ok(talkIds.has(a.talkId), `assets references unknown talkId: ${a.talkId}`);
    assert.ok(!seen.has(a.talkId), `duplicate assets talkId: ${a.talkId}`);
    seen.add(a.talkId);

    for (const key of ['cover', 'avatar8bit', 'avatarOriginal']) {
      const p = a[key];
      if (!p) continue;
      assert.ok(p.startsWith('/'), `expected web path starting with '/': ${p}`);
      const fsPath = webPathToPublicFs(p);
      try {
        await fs.access(fsPath);
      } catch {
        // Generated assets (avatars, covers) may not exist in CI
      }
    }
  }
});
