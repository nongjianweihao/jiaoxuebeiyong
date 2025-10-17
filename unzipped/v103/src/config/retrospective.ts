export const RETRO_MOODS = [
  {
    id: 'celebrate',
    label: '能量爆表',
    description: '整体表现超预期，适合表扬与巩固成功经验。',
    accent: 'from-emerald-500/90 to-teal-400/90',
    textClass: 'text-emerald-600',
    icon: '🎉',
  },
  {
    id: 'steady',
    label: '稳步推进',
    description: '常规节奏下的稳态执行，需要记录小改进。',
    accent: 'from-sky-500/90 to-indigo-500/90',
    textClass: 'text-sky-600',
    icon: '📈',
  },
  {
    id: 'reset',
    label: '需要调试',
    description: '遇到阻碍或指标下滑，聚焦问题复盘。',
    accent: 'from-rose-500/90 to-orange-500/90',
    textClass: 'text-rose-600',
    icon: '🛠️',
  },
] as const;

export const RETRO_FOCUS_TAGS = [
  { id: 'speed', label: '速度战术', icon: '⚡' },
  { id: 'strength', label: '力量爆发', icon: '💪' },
  { id: 'stamina', label: '耐力续航', icon: '🔋' },
  { id: 'coordination', label: '协调灵敏', icon: '🎯' },
  { id: 'team', label: '团队协作', icon: '🤝' },
  { id: 'mindset', label: '勇士心态', icon: '🧠' },
  { id: 'discipline', label: '课堂秩序', icon: '🛡️' },
  { id: 'fun', label: '趣味激励', icon: '🎮' },
] as const;

export const RETRO_PROMPTS = {
  wins: '今日最亮眼的3个瞬间',
  blockers: '需要修正或优化的环节',
  experiments: '下一次要尝试或强化的策略',
} as const;

export type RetrospectiveMoodId = (typeof RETRO_MOODS)[number]['id'];
export type RetrospectiveFocusId = (typeof RETRO_FOCUS_TAGS)[number]['id'];
