export interface AvatarPreset {
  id: string;
  label: string;
  description: string;
  emoji: string;
  background: string;
  accent: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'starlight-fox',
    label: '星火狐',
    description: '敏捷与创造力的守护者',
    emoji: '🦊',
    background: 'linear-gradient(135deg, #ff8fb1 0%, #ffafbd 50%, #ffc3a0 100%)',
    accent: '#ff6b81',
  },
  {
    id: 'cosmic-dragon',
    label: '宇宙龙',
    description: '勇敢与力量的象征',
    emoji: '🐲',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 45%, #ec4899 100%)',
    accent: '#4f46e5',
  },
  {
    id: 'aqua-dolphin',
    label: '浪跃海豚',
    description: '速度与节奏的伙伴',
    emoji: '🐬',
    background: 'linear-gradient(135deg, #38bdf8 0%, #22d3ee 50%, #2dd4bf 100%)',
    accent: '#0891b2',
  },
  {
    id: 'ember-panther',
    label: '炽焰豹',
    description: '爆发力与冲刺王者',
    emoji: '🐆',
    background: 'linear-gradient(135deg, #fb923c 0%, #f97316 45%, #ef4444 100%)',
    accent: '#ea580c',
  },
  {
    id: 'aurora-bunny',
    label: '极光兔',
    description: '协作与快乐的引路人',
    emoji: '🐰',
    background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 40%, #f472b6 100%)',
    accent: '#9333ea',
  },
  {
    id: 'galaxy-otter',
    label: '星河水獭',
    description: '专注与智慧的伙伴',
    emoji: '🦦',
    background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 50%, #3b82f6 100%)',
    accent: '#0f766e',
  },
  {
    id: 'meteor-lion',
    label: '流星狮',
    description: '领袖与守护的象征',
    emoji: '🦁',
    background: 'linear-gradient(135deg, #facc15 0%, #f59e0b 50%, #f97316 100%)',
    accent: '#d97706',
  },
  {
    id: 'nebula-robot',
    label: '星云机甲',
    description: '科技与探索的先锋',
    emoji: '🤖',
    background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%)',
    accent: '#2563eb',
  },
];

export const DEFAULT_AVATAR_PRESET_ID = AVATAR_PRESETS[0]?.id ?? 'starlight-fox';

export function getAvatarPreset(presetId?: string) {
  if (!presetId) return AVATAR_PRESETS.find((preset) => preset.id === DEFAULT_AVATAR_PRESET_ID)!;
  return (
    AVATAR_PRESETS.find((preset) => preset.id === presetId) ??
    AVATAR_PRESETS.find((preset) => preset.id === DEFAULT_AVATAR_PRESET_ID)!
  );
}
