import type { FitnessQuality, FitnessTestItem } from '../types';

export interface AssessmentMetricDefinition {
  id: string;
  label: string;
  unit: FitnessTestItem['unit'];
  quality: FitnessQuality;
  category:
    | 'body'
    | 'speed'
    | 'flexibility'
    | 'power'
    | 'core'
    | 'endurance'
    | 'rope';
  higherIsBetter?: boolean;
  description?: string;
}

export const ASSESSMENT_METRICS: AssessmentMetricDefinition[] = [
  { id: 'height', label: '身高', unit: 'cm', quality: 'morphology', category: 'body', higherIsBetter: true },
  { id: 'weight', label: '体重', unit: 'kg', quality: 'morphology', category: 'body', higherIsBetter: false },
  { id: 'run50m', label: '50米跑', unit: 's', quality: 'speed', category: 'speed', higherIsBetter: false },
  { id: 'sitAndReach', label: '坐位体前屈', unit: 'cm', quality: 'flexibility', category: 'flexibility', higherIsBetter: true },
  { id: 'longJump', label: '立定跳远', unit: 'cm', quality: 'power', category: 'power', higherIsBetter: true },
  { id: 'sitUps', label: '仰卧起坐 (1分钟)', unit: 'count', quality: 'core', category: 'core', higherIsBetter: true },
  { id: 'pullUps', label: '引体向上', unit: 'count', quality: 'core', category: 'core', higherIsBetter: true },
  { id: 'pushUps', label: '俯卧撑', unit: 'count', quality: 'power', category: 'power', higherIsBetter: true },
  { id: 'vitalCapacity', label: '肺活量', unit: 'ml', quality: 'endurance', category: 'endurance', higherIsBetter: true },
  { id: 'ropeEndurance', label: '3分钟单摇', unit: 'count', quality: 'endurance', category: 'rope', higherIsBetter: true },
  { id: 'ropeSkipSpeed', label: '30秒单摇', unit: 'count', quality: 'speed', category: 'rope', higherIsBetter: true },
  { id: 'sr30', label: 'SR30 极速测试', unit: 'count', quality: 'speed', category: 'rope', higherIsBetter: true, description: '30 秒极速单摇次数' },
  { id: 'sr60', label: 'SR60 节奏耐力', unit: 'count', quality: 'endurance', category: 'rope', higherIsBetter: true, description: '60 秒节奏单摇次数' },
  { id: 'du30', label: 'DU30 双摇挑战', unit: 'count', quality: 'power', category: 'rope', higherIsBetter: true, description: '30 秒双摇次数' },
];

export const LEVEL_TITLES: Array<{ threshold: number; title: string; index: number }> = [
  { threshold: 0, title: '体能黑铁', index: 0 },
  { threshold: 60, title: '英勇黄铜', index: 1 },
  { threshold: 70, title: '不屈白银', index: 2 },
  { threshold: 80, title: '荣耀黄金', index: 3 },
  { threshold: 85, title: '华贵铂金', index: 4 },
  { threshold: 90, title: '璀璨钻石', index: 5 },
  { threshold: 95, title: '超凡大师', index: 6 },
  { threshold: 98, title: '最强王者', index: 7 },
];

export const GROWTH_STAGES: Array<{ name: string; honor: string }> = [
  { name: '新手训练营', honor: '青铜勇士' },
  { name: '勇士训练场', honor: '白银勇士' },
  { name: '精英竞技场', honor: '黄金斗士' },
  { name: '至尊决战场', honor: '钻石王者' },
];

export const FREESTYLE_STAGE_DAN: Array<{ name: string; color: string; ranks: number[] }> = [
  { name: '新手训练营', color: '#f472b6', ranks: [1] },
  { name: '勇士训练场', color: '#ec4899', ranks: [2, 3] },
  { name: '精英竞技场', color: '#be185d', ranks: [4, 5, 6, 7] },
  { name: '至尊决战场', color: '#a21caf', ranks: [8, 9] },
];

export type GenderKey = 'male' | 'female';

export const ASSESSMENT_STANDARDS: Record<
  string,
  { male: Array<[number, number]>; female: Array<[number, number]>; higherIsBetter: boolean }
> = {
  run50m: {
    male: [
      [15, 0],
      [12.5, 60],
      [10, 80],
      [9, 90],
      [7.1, 100],
    ],
    female: [
      [16, 0],
      [12.8, 60],
      [10.3, 80],
      [9.5, 90],
      [8.4, 100],
    ],
    higherIsBetter: false,
  },
  sitAndReach: {
    male: [
      [-5, 0],
      [5.9, 60],
      [11.7, 80],
      [16, 90],
      [21.6, 100],
    ],
    female: [
      [-2, 0],
      [7.7, 60],
      [13.5, 80],
      [18, 90],
      [22.3, 100],
    ],
    higherIsBetter: true,
  },
  longJump: {
    male: [
      [80, 0],
      [115, 60],
      [135, 70],
      [215, 90],
      [235, 100],
    ],
    female: [
      [70, 0],
      [105, 60],
      [125, 70],
      [165, 90],
      [185, 100],
    ],
    higherIsBetter: true,
  },
  sitUps: {
    male: [
      [5, 0],
      [15, 60],
      [25, 80],
      [35, 90],
      [43, 100],
    ],
    female: [
      [4, 0],
      [14, 60],
      [24, 75],
      [41, 90],
      [51, 100],
    ],
    higherIsBetter: true,
  },
  pullUps: {
    male: [
      [0, 0],
      [4, 60],
      [8, 80],
      [12, 90],
      [17, 100],
    ],
    female: [
      [0, 0],
      [2, 60],
      [4, 75],
      [6, 90],
      [9, 100],
    ],
    higherIsBetter: true,
  },
  pushUps: {
    male: [
      [2, 0],
      [10, 60],
      [20, 80],
      [30, 90],
      [40, 100],
    ],
    female: [
      [2, 0],
      [8, 60],
      [15, 80],
      [20, 90],
      [25, 100],
    ],
    higherIsBetter: true,
  },
  vitalCapacity: {
    male: [
      [800, 0],
      [1000, 60],
      [1800, 75],
      [3500, 90],
      [4800, 100],
    ],
    female: [
      [700, 0],
      [900, 60],
      [1600, 75],
      [2500, 90],
      [3500, 100],
    ],
    higherIsBetter: true,
  },
  ropeEndurance: {
    male: [
      [150, 0],
      [200, 60],
      [300, 80],
      [400, 90],
      [500, 100],
    ],
    female: [
      [130, 0],
      [180, 60],
      [280, 80],
      [380, 90],
      [480, 100],
    ],
    higherIsBetter: true,
  },
  sr30: {
    male: [
      [40, 0],
      [60, 60],
      [75, 80],
      [90, 90],
      [110, 100],
    ],
    female: [
      [35, 0],
      [55, 60],
      [70, 80],
      [85, 90],
      [100, 100],
    ],
    higherIsBetter: true,
  },
  sr60: {
    male: [
      [80, 0],
      [110, 60],
      [130, 80],
      [150, 90],
      [180, 100],
    ],
    female: [
      [70, 0],
      [100, 60],
      [120, 80],
      [145, 90],
      [170, 100],
    ],
    higherIsBetter: true,
  },
  du30: {
    male: [
      [5, 0],
      [15, 60],
      [25, 80],
      [35, 90],
      [45, 100],
    ],
    female: [
      [3, 0],
      [12, 60],
      [20, 80],
      [28, 90],
      [38, 100],
    ],
    higherIsBetter: true,
  },
};

export const ROPE_SPEED_STANDARD: Array<[number, number]> = [
  [59, 60],
  [60, 65],
  [70, 70],
  [80, 75],
  [100, 80],
  [110, 85],
  [120, 90],
  [150, 95],
  [160, 98],
  [170, 100],
];

export const HEIGHT_STANDARDS: Record<GenderKey, Record<number, number>> = {
  male: {
    6: 117.7,
    7: 124,
    8: 130,
    9: 135.4,
    10: 140.2,
    11: 145.2,
    12: 151.9,
    13: 159.5,
    14: 165.9,
    15: 169.8,
    16: 171.6,
    17: 172.4,
  },
  female: {
    6: 116.6,
    7: 122.5,
    8: 128.4,
    9: 134.1,
    10: 140.1,
    11: 146.6,
    12: 152.4,
    13: 156.3,
    14: 158.6,
    15: 159.8,
    16: 160.3,
    17: 160.6,
  },
};

export const BMI_STANDARDS: Record<GenderKey, Record<number, [number, number, number]>> = {
  male: {
    6: [13.1, 17.5, 19.4],
    7: [13.2, 18.3, 20.6],
    8: [13.4, 19.1, 21.8],
    9: [13.7, 19.9, 23],
    10: [14.1, 20.8, 24.3],
    11: [14.6, 21.7, 25.5],
    12: [15.2, 22.6, 26.6],
    13: [15.8, 23.4, 27.6],
    14: [16.4, 24.1, 28.4],
    15: [16.9, 24.8, 29.2],
    16: [17.3, 25.3, 29.8],
    17: [17.6, 25.7, 30.3],
  },
  female: {
    6: [12.7, 17.2, 18.9],
    7: [12.8, 18, 20],
    8: [13, 18.8, 21.2],
    9: [13.4, 19.7, 22.4],
    10: [13.9, 20.6, 23.7],
    11: [14.5, 21.5, 24.9],
    12: [15.1, 22.4, 26.1],
    13: [15.7, 23.1, 27.1],
    14: [16.2, 23.7, 27.9],
    15: [16.5, 24.1, 28.5],
    16: [16.7, 24.4, 28.9],
    17: [16.8, 24.5, 29.1],
  },
};
