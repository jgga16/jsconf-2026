export type TalkType = 'talk' | 'break' | 'ceremony' | 'lightning';
export type TalkLanguage = 'es' | 'en';

export type Speaker = {
  name: string;
  role: string;
  avatarUrl: string;
};

export type Talk = {
  id: string;
  title: string;
  description: string;
  speakers: Speaker[];
  time: {
    start: string;
    end: string;
  };
  type: TalkType;
  language: TalkLanguage;
  tags: string[];

  // Optional metadata (not part of the canonical schema yet).
  room?: string;
};

export type TalksFile = {
  event: {
    name: string;
    date: string;
    venue: string;
  };
  talks: Talk[];
};

export type AssetsFile = {
  assets: Array<{
    talkId: string;
    cover?: string;
    avatar8bit?: string;
    avatarOriginal?: string;
  }>;
};

export type TalkWithAssets = Talk & {
  assets?: AssetsFile['assets'][number];
};
