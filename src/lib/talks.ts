import talksJson from '../data/talks.json';
import assetsJson from '../data/assets.json';
import type { TalkWithAssets } from '../types/talk';
import { AssetsFileSchema, TalksFileSchema } from '../schemas/talk';

const talksFile = TalksFileSchema.parse(talksJson);
const assetsFile = AssetsFileSchema.parse(assetsJson);

export const event = talksFile.event;

const talks = talksFile.talks;
const assets = assetsFile.assets;

const assetsByTalkId = new Map(assets.map((a) => [a.talkId, a] as const));

export const talksWithAssets: TalkWithAssets[] = talks.map((t) => ({
  ...t,
  assets: assetsByTalkId.get(t.id),
}));

export function formatTimeRange(start: string, end: string) {
  return `${start} – ${end}`;
}
