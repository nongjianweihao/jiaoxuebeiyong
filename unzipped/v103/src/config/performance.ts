import type { PerformanceDimensionId } from '../types';

export type PerformancePresetTone = 'highlight' | 'focus';

export interface PerformancePreset {
  id: string;
  dimension: PerformanceDimensionId;
  label: string;
  tone: PerformancePresetTone;
}

export interface PerformanceDimensionMeta {
  id: PerformanceDimensionId;
  label: string;
  icon: string;
  description: string;
  focusQuestion: string;
  presets: PerformancePreset[];
}

export const PERFORMANCE_DIMENSIONS: PerformanceDimensionMeta[] = [
  {
    id: 'confidence',
    label: '自信表达',
    icon: '🌟',
    description: '敢于发声、主动展示成果，拥有稳定的课堂存在感。',
    focusQuestion: '今天他/她是否勇敢表达观点？',
    presets: [
      { id: 'confidence_voice', dimension: 'confidence', label: '声音洪亮，敢于发言', tone: 'highlight' },
      { id: 'confidence_demo', dimension: 'confidence', label: '主动示范带动同伴', tone: 'highlight' },
      { id: 'confidence_encourage', dimension: 'confidence', label: '需要更多鼓励开口', tone: 'focus' },
      { id: 'confidence_stage', dimension: 'confidence', label: '上台时略显紧张', tone: 'focus' },
    ],
  },
  {
    id: 'engagement',
    label: '积极投入',
    icon: '🔥',
    description: '进入课堂状态快，愿意尝试挑战，保持训练激情。',
    focusQuestion: '他/她的能量状态如何？',
    presets: [
      { id: 'engagement_drive', dimension: 'engagement', label: '热身进入状态快', tone: 'highlight' },
      { id: 'engagement_try', dimension: 'engagement', label: '愿意尝试更难动作', tone: 'highlight' },
      { id: 'engagement_warm', dimension: 'engagement', label: '热身阶段较慢热', tone: 'focus' },
      { id: 'engagement_energy', dimension: 'engagement', label: '需要提醒保持节奏', tone: 'focus' },
    ],
  },
  {
    id: 'focus',
    label: '专注执行',
    icon: '🎯',
    description: '听指令、控节奏、把动作做到位，保持注意力。',
    focusQuestion: '动作质量与注意力是否稳定？',
    presets: [
      { id: 'focus_detail', dimension: 'focus', label: '动作控制到位', tone: 'highlight' },
      { id: 'focus_follow', dimension: 'focus', label: '指令响应迅速', tone: 'highlight' },
      { id: 'focus_attention', dimension: 'focus', label: '注意力易分散', tone: 'focus' },
      { id: 'focus_reset', dimension: 'focus', label: '需要提醒动作标准', tone: 'focus' },
    ],
  },
  {
    id: 'resilience',
    label: '自我驱动',
    icon: '⚡',
    description: '面对困难能坚持完成，对自我要求高。',
    focusQuestion: '遇到挑战时的坚持与调整如何？',
    presets: [
      { id: 'resilience_push', dimension: 'resilience', label: '挑战动作不放弃', tone: 'highlight' },
      { id: 'resilience_goal', dimension: 'resilience', label: '主动设定练习目标', tone: 'highlight' },
      { id: 'resilience_pace', dimension: 'resilience', label: '后半段节奏下滑', tone: 'focus' },
      { id: 'resilience_mindset', dimension: 'resilience', label: '需要建立进步目标', tone: 'focus' },
    ],
  },
  {
    id: 'teamwork',
    label: '团队协作',
    icon: '🤝',
    description: '愿意互助、配合小组训练，营造团队氛围。',
    focusQuestion: '对同伴的支持与协作表现如何？',
    presets: [
      { id: 'teamwork_support', dimension: 'teamwork', label: '主动扶持队友', tone: 'highlight' },
      { id: 'teamwork_share', dimension: 'teamwork', label: '分享技巧带动伙伴', tone: 'highlight' },
      { id: 'teamwork_listen', dimension: 'teamwork', label: '需要倾听团队节奏', tone: 'focus' },
      { id: 'teamwork_role', dimension: 'teamwork', label: '协作角色待明确', tone: 'focus' },
    ],
  },
];

export const PERFORMANCE_PRESET_LOOKUP: Record<string, PerformancePreset> = Object.fromEntries(
  PERFORMANCE_DIMENSIONS.flatMap((dimension) =>
    dimension.presets.map((preset) => [preset.id, preset] as const),
  ),
);
