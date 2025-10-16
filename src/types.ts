export type ID = string;
export type ISODate = string;

export type Period = 'PREP' | 'SPEC' | 'COMP' | 'TRANS';
export type WindowSec = 10 | 20 | 30 | 60;
export type JumpMode = 'single' | 'double';

export type AbilityKey =
  | 'speed'
  | 'power'
  | 'coordination'
  | 'agility'
  | 'endurance'
  | 'flexibility';

export type StimulusType =
  | 'neural'
  | 'strength'
  | 'metabolic'
  | 'technical'
  | 'psychological';

export type IntensityLevel = '💧' | '🌈' | '⚡';

export type PerformanceDimensionId =
  | 'confidence'
  | 'engagement'
  | 'focus'
  | 'resilience'
  | 'teamwork';

export interface SessionPerformanceDimensionScore {
  dimension: PerformanceDimensionId;
  score: number;
}

export interface SessionPerformanceEntry {
  id: ID;
  studentId: ID;
  stars: number;
  presetIds: string[];
  comment?: string;
  noteId?: ID;
  attendance?: 'present' | 'leave' | 'absent';
  dimensions: SessionPerformanceDimensionScore[];
  updatedAt: ISODate;
}

export interface TrainingQuality {
  id: AbilityKey;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface TrainingDrill {
  id: ID;
  name: string;
  type: 'drill';
  primaryAbilities: AbilityKey[];
  secondaryAbilities?: AbilityKey[];
  stimulusType: StimulusType;
  intensity: IntensityLevel;
  durationMin: number;
  videoUrl?: string;
  equipment?: string[];
  coachTips?: string;
}

export interface TrainingGame {
  id: ID;
  name: string;
  goal: string;
  focusAbilities: AbilityKey[];
  stimulusType: StimulusType;
  intensity: IntensityLevel;
  groupSize: '1v1' | '3v3' | '全班';
  durationMin: number;
  equipment?: string[];
  rules: string;
  coachTips?: string;
  variations?: string;
}

export interface MissionBlock {
  title: string;
  drillIds?: ID[];
  gameIds?: ID[];
  stimulus: StimulusType;
  intensity: IntensityLevel;
  puzzleTemplateId?: ID;
  puzzleCardIds?: ID[];
}

export interface MissionCardV2 {
  id: ID;
  name: string;
  phase: Period;
  durationMin: number;
  focusAbilities: AbilityKey[];
  blocks: MissionBlock[];
}

export interface CycleWeekPlan {
  week: number;
  focus: string;
  missionCards: ID[];
  puzzleTemplateId?: ID;
  puzzleCardIds?: ID[];
}



export interface TrainingStageAgeGuidance {
  range: string;
  priorities: string[];
  load: 'light' | 'moderate' | 'high' | string;
  cautions?: string[];
}

export interface TrainingStageCycleTheme {
  period: Period | 'ALL';
  title: string;
  focus: string;
  load: 'light' | 'moderate' | 'high' | string;
  notes?: string;
}


export interface TrainingStage {
  id: ID;
  name: string;
  summary: string;
  icon?: string;
  color?: string;
  focusAbilities?: AbilityKey[];
  recommendedNextStageId?: ID;

  
  heroMetric?: string;
  coreTasks?: string[];
  keyMilestones?: string[];
  ageGuidance?: TrainingStageAgeGuidance[];
  cycleThemes?: TrainingStageCycleTheme[];
  growthRoadmapStageId?: ID;

}

export interface TrainingPlanWeek {
  week: number;
  unitIds: ID[];
  theme?: string;
  focusAbilities?: AbilityKey[];
}



export interface TrainingPlanPhase {
  id: Period;
  name: string;
  durationWeeks: number;
  goal: string;
  load: 'light' | 'moderate' | 'high' | string;
  focusPoints: string[];
  monitoring?: string;
  notes?: string;
  recommendedAges?: string[];
}


export interface TrainingPlan {
  id: ID;
  stageId: ID;
  name: string;
  durationWeeks: number;
  summary?: string;
  focusAbilities: AbilityKey[];
  icon?: string;
  weeks: TrainingPlanWeek[];

  
  phases?: TrainingPlanPhase[];

}

export interface TrainingCycleTemplate {
  id: ID;
  name: string;
  goal: string;

  durationWeeks: 4 | 8 | 12;
  focusAbilities: AbilityKey[];
  weekPlan: CycleWeekPlan[];
  trackingMetrics: string[];

  stageId?: ID;
  summary?: string;
  icon?: string;
  category?: 'jump' | 'general' | 'custom';
  recommendedFor?: string[];
}

export interface TrainingUnit {
  id: ID;
  stageId: ID;
  name: string;
  focus: string;
  durationMin: number;
  tags?: string[];
  period?: Period | 'ALL';
  blocks: TemplateBlock[];
  summary?: string;
}

export interface ClassCycleSessionPlan {
  id: ID;
  week: number;
  missionCardId: ID;
  plannedDate: ISODate;
  status: 'planned' | 'completed';
  actualDate?: ISODate;
}

export interface ClassCyclePlan {
  id: ID;
  classId: ID;
  cycleId: ID;
  cycleName: string;
  goal: string;
  durationWeeks: number;
  startDate: ISODate;
  currentWeek: number;
  progress: number;
  focusAbilities: AbilityKey[];
  trackingMetrics: string[];
  sessions: ClassCycleSessionPlan[];
  completedAt?: ISODate;
  cycleReportGeneratedAt?: ISODate;
}

export interface CycleReport {
  id: ID;
  planId: ID;
  cycleId: ID;
  studentId: ID;
  classId: ID;
  cycleName: string;
  generatedAt: ISODate;
  startDate: ISODate;
  endDate: ISODate;
  abilityBefore: Partial<Record<AbilityKey, number>>;
  abilityAfter: Partial<Record<AbilityKey, number>>;
  sriBefore?: number;
  sriAfter?: number;
  highlights: string[];
  suggestions: string[];
}

export interface RankMove {
  id: ID;
  rank: number;
  name: string;
  tags?: string[];
  description?: string;
  criteria?: string;
}

export interface WarriorPathNode {
  id: ID;
  rank: number;
  title: string;
  moveIds: ID[];
  points: number;
}

export type FitnessQuality =
  | 'speed'
  | 'power'
  | 'endurance'
  | 'coordination'
  | 'agility'
  | 'balance'
  | 'flexibility'
  | 'core'
  | 'accuracy'
  | 'morphology';

export interface GameDrill {
  id: ID;
  name: string;
  qualityTags: FitnessQuality[];
  description?: string;
}

export interface TemplateBlock {
  id: ID;
  title: string;
  period: Period | 'ALL';
  durationMin?: number;
  drillIds?: ID[];
  rankMoveIds?: ID[];
  qualities?: FitnessQuality[];
  gameIds?: ID[];
  notes?: string;
  stimulus?: StimulusType;
  intensity?: IntensityLevel;
  puzzleTemplateId?: ID;
  puzzleCardIds?: ID[];
}

export interface TrainingTemplate {
  id: ID;
  name: string;
  period: Period;
  weeks?: number;
  stageId?: ID;
  planId?: ID;
  unitIds: ID[];
  blocks?: TemplateBlock[];
  resolvedUnits?: TrainingUnit[];
  resolvedBlocks?: TemplateBlock[];
  resolvedStage?: TrainingStage;
  resolvedPlan?: TrainingPlan;
  createdAt: ISODate;
}

export interface Student {
  id: ID;
  name: string;
  gender?: 'M' | 'F';
  birth?: ISODate;
  avatarUrl?: string;
  avatarPresetId?: string;
  guardian?: { name: string; phone?: string };
  joinDate?: ISODate;
  currentRank?: number;
  tags?: string[];
  energy?: number;
  coins?: number;
}

export interface ClassEntity {
  id: ID;
  name: string;
  coachName: string;
  schedule?: string;
  templateId?: ID;
  studentIds: ID[];
}

export interface AttendanceItem {
  studentId: ID;
  present: boolean;
  remark?: string;
}

export interface SpeedRecord {
  id: ID;
  studentId: ID;
  mode: JumpMode;
  window: WindowSec;
  reps: number;
}

export interface FreestyleChallengeRecord {
  id: ID;
  studentId: ID;
  moveId: ID;
  passed: boolean;
  note?: string;
}

export interface TrainingNote {
  id: ID;
  studentId: ID;
  rating?: number;
  comments?: string;
  tags?: string[];
}

export interface SessionRecord {
  id: ID;
  classId: ID;
  date: ISODate;
  templateId?: ID;
  cyclePlanId?: ID;
  missionCardIds?: ID[];
  cycleSessionIds?: ID[];
  attendance: AttendanceItem[];
  speed: SpeedRecord[];
  freestyle: FreestyleChallengeRecord[];
  notes: TrainingNote[];
  performance?: SessionPerformanceEntry[];
  closed: boolean;
  lessonConsume?: number;
  consumeOverrides?: Array<{ studentId: ID; consume: number }>;
  highlights?: string[];
  executedBlockIds?: ID[];
}

export type RetrospectiveMood = 'celebrate' | 'steady' | 'reset';

export interface RetrospectiveHighlight {
  id: ID;
  studentId: ID;
  note: string;
}

export interface RetrospectiveActionItem {
  id: ID;
  owner: 'coach' | 'team' | 'student';
  studentId?: ID;
  content: string;
  status: 'pending' | 'done';
  dueDate?: ISODate;
}

export interface SessionReview {
  id: ID;
  classId: ID;
  sessionId?: ID;
  date: ISODate;
  title: string;
  mood: RetrospectiveMood;
  focusTags: string[];
  wins: string[];
  blockers: string[];
  experiments: string[];
  studentHighlights: RetrospectiveHighlight[];
  nextActions: RetrospectiveActionItem[];
  energyPulse?: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface FitnessTestItem {
  id: ID;
  name: string;
  quality: FitnessQuality;
  unit: 'count' | 'cm' | 's' | 'grade' | 'kg' | 'ml';
}

export interface FitnessTestResult {
  id: ID;
  studentId: ID;
  quarter: string;
  date: ISODate;
  items: Array<{ itemId: ID; value: number }>;
  radar: Record<FitnessQuality, number>;
  coachComment?: string;
}

export interface RankExamRecord {
  id: ID;
  studentId: ID;
  date: ISODate;
  fromRank: number;
  toRank: number;
  passed: boolean;
  notes?: string;
}

export type PointEventType = 'attendance' | 'pr' | 'freestyle_pass' | 'excellent' | 'challenge';

export interface PointEvent {
  id: ID;
  studentId: ID;
  sessionId: ID;
  date: ISODate;
  type: PointEventType;
  points: number;
  reason?: string;
}

export interface PointsRule {
  type: PointEventType;
  points: number;
}

export interface PointsWallet {
  studentId: ID;
  total: number;
  month?: number;
  year?: number;
}

export interface StudentProfileSnapshot {
  student: Student;
  sessions: SessionRecord[];
  speedSeries: Array<{ date: ISODate; window: WindowSec; mode: JumpMode; reps: number }>;
  freestyleProgress: Array<{ date: ISODate; rank: number; score: number }>;
  latestRadar?: Record<FitnessQuality, number>;
  latestRank?: number;
  wallet?: LessonWallet;
  metrics?: MetricsSnapshot;
  pointsTotal?: number;
  pointsSeries?: Array<{ date: ISODate; delta: number; total: number }>;
  pointsBreakdown?: Record<PointEventType, number>;
}

export type LessonLedgerEntryType =
  | 'consume'
  | 'makeup'
  | 'gift'
  | 'transfer'
  | 'adjust'
  | 'other';

export interface LessonLedgerEntry {
  id: ID;
  studentId: ID;
  type: LessonLedgerEntryType;
  lessons: number;
  date: ISODate;
  summary?: string;
  createdAt: ISODate;
  updatedAt?: ISODate;
}

export interface LessonPackage {
  id: ID;
  studentId: ID;
  purchasedLessons: number;
  price: number;
  unitPrice?: number;
  purchasedAt: ISODate;
  remark?: string;
}

export interface LessonWallet {
  studentId: ID;
  totalPurchased: number;
  totalConsumed: number;
  remaining: number;
  manualAdjustments?: number;
}

export interface PaymentRecord {
  id: ID;
  studentId: ID;
  packageId: ID;
  amount: number;
  method?: 'cash' | 'wechat' | 'alipay' | 'card' | 'other';
  paidAt: ISODate;
}

export interface Recommendation {
  id: ID;
  studentId: ID;
  createdAt: ISODate;
  reason: string;
  templateId?: ID;
  applied: boolean;
}

export interface MetricsSnapshot {
  id: ID;
  studentId: ID;
  weekOf: ISODate;
  speedDelta: number;
  freestyleDelta: number;
  attendanceRate: number;
  wellnessRate: number;
  parentNps?: number;
}

export interface Benchmark {
  id: ID;
  quality: FitnessQuality;
  ageMin: number;
  ageMax: number;
  gender?: 'M' | 'F';
  unit: 'count' | 'cm' | 's' | 'grade';
  p25: number;
  p50: number;
  p75: number;
  min: number;
  max: number;
}

export interface SpeedRankThreshold {
  id: ID;
  rank: number;
  windowSec: number;
  mode: JumpMode;
  minReps: number;
}
