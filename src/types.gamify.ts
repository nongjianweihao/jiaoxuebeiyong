export type MissionProgressStatus = 'assigned' | 'started' | 'completed';

export interface MissionProgress {
  id?: number;
  studentId: string;
  classId: string;
  missionId: string;
  date: string;
  stars: number;
  energy: number;
  status: MissionProgressStatus;
  honorTitle?: string;
  rewardPoints?: number;
  rewardNote?: string;
  completedAt?: string;
}

export interface Badge {
  id?: number;
  studentId: string;
  code: string;
  name: string;
  earnedAt: string;
}

export interface Season {
  id?: number;
  code: string;
  name: string;
  start: string;
  end: string;
}

export interface LeaderboardEntry {
  id?: number;
  seasonCode: string;
  scope: 'global' | 'class';
  refId: string;
  energy: number;
}

export interface RecommendedMission {
  missionId: string;
  name: string;
  type: string;
}



export interface Squad {
  id: string;
  name: string;
  classId?: string;
  memberIds: string[];
  seasonCode?: string;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
}

export type SquadUnit = 'count' | 'sec' | 'm' | 'custom';

export interface SquadChallenge {
  id: string;
  squadId: string;
  title: string;
  target: number;
  unit: SquadUnit;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'ongoing' | 'done' | 'expired';
  createdAt: string;
  updatedAt: string;
  milestoneLevel?: number;
}

export interface SquadProgressLog {
  id?: number;
  squadId: string;
  challengeId: string;
  value: number;
  by: 'class' | 'coach' | 'student';
  refSessionId?: string;
  note?: string;
  createdBy: string;
  createdAt: string;
}

export type KudosBadge = '最有毅力' | '最佳队友' | '最快进步' | '最佳表现' | string;

export interface Kudos {
  id?: number;
  fromStudentId: string;
  toStudentId: string;
  badge: string;
  reason?: string;
  classId?: string;
  seasonCode?: string;
  createdAt: string;
}

export type EnergySource =
  | 'attendance'
  | 'mission'
  | 'assessment'
  | 'freestyle_pass'
  | 'kudos'
  | 'squad_milestone'
  | 'squad_completion'
  | 'puzzle_card'
  | 'manual'
  | 'market_redeem';

export interface EnergyLog {
  id?: number;
  studentId: string;
  source: EnergySource;
  refId?: string;
  delta: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export type RewardItemType = 'virtual' | 'physical' | 'privilege' | 'charity';

export interface RewardItem {
  id: string;
  name: string;
  type: RewardItemType;
  costScore: number;
  costEnergy?: number;
  stock?: number;
  description: string;
  imageUrl?: string;
  virtualAssetId?: string;
  visible: boolean;
  levelLimit?: number;
  seasonTag?: string;
  featured?: boolean;
}

export type RewardExchangeStatus = 'pending' | 'delivered' | 'confirmed';

export interface StudentExchange {
  id: string;
  studentId: string;
  rewardId: string;
  costScore: number;
  costEnergy?: number;
  redeemedAt: number;
  status: RewardExchangeStatus;
  note?: string;
}

export type PuzzleCardStatus = 'locked' | 'available' | 'flipping' | 'flipped' | 'completed';




export type PuzzleCategory =
  | 'poem'
  | 'motivation'
  | 'emoji'
  | 'mosaic'
  | 'story'
  | 'math'
  | 'science'
  | 'habit'
  | 'team'
  | 'image'
  | 'wisdom'
  | 'riddle';




export interface PuzzleCardTemplate {
  id: string;
  title: string;
  type: 'speed' | 'strength' | 'stamina' | 'coordination' | 'team';
  skin?: 'poem' | 'mosaic' | 'emoji' | 'math' | 'team';

  
  difficulty?: 1 | 2 | 3 | 4 | 5;

  fragmentText?: string;
  fragmentImageUrl?: string;
  reward?: {
    energy?: number;
    badge?: string;
    score?: number;
    text?: string;

    
    honorTitle?: string;

  };
  description?: string;
}

export interface PuzzleTemplate {
  id: string;
  name: string;
  code?: string;
  tags?: string[];
  totalCards: number;

  

  totalEnergy?: number;
  category: PuzzleCategory;
  description?: string;
  assignedTo?: 'class' | 'team' | 'individual';
  difficulty?: 1 | 2 | 3 | 4 | 5;
  recommendedScene?: '课堂主线' | '战队挑战' | '个人练习' | '混合';
  recommendedAges?: string;
  focusAbilities?: string[];

  

  cards: PuzzleCardTemplate[];
  continueAcrossSessions?: boolean;
}

export interface PuzzleCardProgress {
  cardId: string;
  status: PuzzleCardStatus;
  updatedAt: string;
  ownerId?: string;
  completedBy?: string;

  

  sharedWith?: string[];
}

export interface PuzzleScoreLogEntry {
  studentId?: string;
  delta: number;
  reason: string;
  createdAt: string;
  cardId: string;
  badge?: string;

  

}

export interface PuzzleQuestInstance {
  id: string;
  scope: 'classroom';
  classId: string;
  sessionId: string;
  templateId: string;
  continueAcrossSessions: boolean;
  progress: PuzzleCardProgress[];

  
  
  scoreLog: PuzzleScoreLogEntry[];

  energyEarned: number;
  finishedAt?: string;
}

export interface PuzzleCampaignInstance {
  id: string;
  scope: 'squad';
  squadId: string;
  name: string;
  templateId: string;
  startDate: string;
  endDate?: string;
  rules: {
    mode: 'co-op' | 'relay' | 'pvp';
    openCardsPerDay?: number;
    scorePerCard?: number;
    personalScoreFactor?: number;
  };
  members: string[];
  progress: PuzzleCardProgress[];
  scoreBoard: {
    squad: number;
    byMember: Record<string, number>;
  };
  kudos: Array<{
    from: string;
    to: string;
    badge: string;
    createdAt: string;
  }>;
  finishedAt?: string;
}
