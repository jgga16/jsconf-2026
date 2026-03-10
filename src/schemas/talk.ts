import { z } from 'zod';

const TimeString = z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:MM');

export const TalkTypeSchema = z.enum(['talk', 'break', 'ceremony', 'lightning']);
export const TalkLanguageSchema = z.enum(['es', 'en']);
export const BreakCategorySchema = z.enum(['coffee', 'breakfast', 'lunch', 'networking']);

export const SpeakerSchema = z.object({
  name: z.string().min(1),
  role: z.string(),
  avatarUrl: z.string().url(),
});

export const TalkSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  speakers: z.array(SpeakerSchema),
  time: z.object({
    start: TimeString,
    end: TimeString,
  }),
  type: TalkTypeSchema,
  language: TalkLanguageSchema,
  tags: z.array(z.string()),
  breakCategory: BreakCategorySchema.optional(),

  // Optional metadata (not part of the canonical schema yet).
  room: z.string().optional(),
});

export const TalksFileSchema = z.object({
  event: z.object({
    name: z.string().min(1),
    date: z.string().min(1),
    venue: z.string().min(1),
  }),
  talks: z.array(TalkSchema),
});

export const AssetSchema = z.object({
  talkId: z.string().min(1),
  cover: z.string().optional(),
  avatar8bit: z.string().optional(),
  avatarOriginal: z.string().optional(),
});

export const AssetsFileSchema = z.object({
  assets: z.array(AssetSchema),
});

export type TalkType = z.infer<typeof TalkTypeSchema>;
export type TalkLanguage = z.infer<typeof TalkLanguageSchema>;
export type BreakCategory = z.infer<typeof BreakCategorySchema>;
export type Speaker = z.infer<typeof SpeakerSchema>;
export type Talk = z.infer<typeof TalkSchema>;
export type TalksFile = z.infer<typeof TalksFileSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type AssetsFile = z.infer<typeof AssetsFileSchema>;
