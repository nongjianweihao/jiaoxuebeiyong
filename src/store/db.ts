import Dexie, { type EntityTable } from 'dexie';
import type {
  Benchmark,
  ClassCyclePlan,
  ClassEntity,
  CycleReport,
  FitnessTestItem,
  FitnessTestResult,
  GameDrill,
  LessonPackage,
  MetricsSnapshot,
  MissionCardV2,
  PaymentRecord,
  PointEvent,
  PointsRule,
  RankExamRecord,
  RankMove,
  Recommendation,
  SessionRecord,
  SessionReview,
  SpeedRankThreshold,
  Student,
  TrainingCycleTemplate,
  TrainingPlan,
  TrainingStage,
  TrainingUnit,
  TrainingDrill,
  TrainingGame,
  TrainingQuality,
  TrainingTemplate,
  WarriorPathNode,
} from '../types';
import type {
  Badge,
  EnergyLog,
  Kudos,
  LeaderboardEntry,
  MissionProgress,
  RewardItem,
  PuzzleCampaignInstance,
  PuzzleQuestInstance,
  PuzzleTemplate,
  Season,
  Squad,
  SquadChallenge,
  SquadProgressLog,
  StudentExchange,
} from '../types.gamify';

export class CoachDatabase extends Dexie {
  students!: EntityTable<Student, 'id'>;
  classes!: EntityTable<ClassEntity, 'id'>;
  templates!: EntityTable<TrainingTemplate, 'id'>;
  sessions!: EntityTable<SessionRecord, 'id'>;
  fitnessTestItems!: EntityTable<FitnessTestItem, 'id'>;
  fitnessTests!: EntityTable<FitnessTestResult, 'id'>;
  rankExams!: EntityTable<RankExamRecord, 'id'>;
  lessonPackages!: EntityTable<LessonPackage, 'id'>;
  payments!: EntityTable<PaymentRecord, 'id'>;
  recommendations!: EntityTable<Recommendation, 'id'>;
  benchmarks!: EntityTable<Benchmark, 'id'>;
  warriorNodes!: EntityTable<WarriorPathNode, 'id'>;
  rankMoves!: EntityTable<RankMove, 'id'>;
  gameDrills!: EntityTable<GameDrill, 'id'>;
  metrics!: EntityTable<MetricsSnapshot, 'id'>;
  speedRankThresholds!: EntityTable<SpeedRankThreshold, 'id'>;
  pointEvents!: EntityTable<PointEvent, 'id'>;
  pointsRules!: EntityTable<PointsRule, 'type'>;
  missionsProgress!: EntityTable<MissionProgress, 'id'>;
  badges!: EntityTable<Badge, 'id'>;
  seasons!: EntityTable<Season, 'id'>;
  leaderboards!: EntityTable<LeaderboardEntry, 'id'>;


  retrospectives!: EntityTable<SessionReview, 'id'>;
  squads!: EntityTable<Squad, 'id'>;
  squadChallenges!: EntityTable<SquadChallenge, 'id'>;
  squadProgress!: EntityTable<SquadProgressLog, 'id'>;
  kudos!: EntityTable<Kudos, 'id'>;
  energyLogs!: EntityTable<EnergyLog, 'id'>;
  puzzleTemplates!: EntityTable<PuzzleTemplate, 'id'>;
  puzzleQuests!: EntityTable<PuzzleQuestInstance, 'id'>;
  puzzleCampaigns!: EntityTable<PuzzleCampaignInstance, 'id'>;
  rewardItems!: EntityTable<RewardItem, 'id'>;
  studentExchanges!: EntityTable<StudentExchange, 'id'>;
  trainingStages!: EntityTable<TrainingStage, 'id'>;
  trainingPlans!: EntityTable<TrainingPlan, 'id'>;
  trainingUnits!: EntityTable<TrainingUnit, 'id'>;
  trainingQualities!: EntityTable<TrainingQuality, 'id'>;
  trainingDrills!: EntityTable<TrainingDrill, 'id'>;
  trainingGames!: EntityTable<TrainingGame, 'id'>;
  missionCardsV2!: EntityTable<MissionCardV2, 'id'>;
  cycleTemplates!: EntityTable<TrainingCycleTemplate, 'id'>;
  classCyclePlans!: EntityTable<ClassCyclePlan, 'id'>;
  cycleReports!: EntityTable<CycleReport, 'id'>;



  constructor() {
    super('coach-db');

    this.version(1).stores({
      students: 'id, name, currentRank',
      classes: 'id, name, coachName',
      templates: 'id, name, period',
      sessions: 'id, classId, date, closed',
      fitnessTestItems: 'id, quality',
      fitnessTests: 'id, studentId, quarter, date',
      rankExams: 'id, studentId, date',
      lessonPackages: 'id, studentId, purchasedAt',
      payments: 'id, studentId, paidAt',
      recommendations: 'id, studentId, createdAt',
      benchmarks: 'id, quality, ageMin, ageMax',
      warriorNodes: 'id, rank',
      rankMoves: 'id, rank',
      gameDrills: 'id, name',
      metrics: 'id, studentId, weekOf',
      speedRankThresholds: 'id, rank, windowSec, mode',
    });

    this.version(2).stores({
      students: 'id, name, currentRank',
      classes: 'id, name, coachName',
      templates: 'id, name, period',
      sessions: 'id, classId, date, closed',
      fitnessTestItems: 'id, quality',
      fitnessTests: 'id, studentId, quarter, date',
      rankExams: 'id, studentId, date',
      lessonPackages: 'id, studentId, purchasedAt',
      payments: 'id, studentId, paidAt',
      recommendations: 'id, studentId, createdAt',
      benchmarks: 'id, quality, ageMin, ageMax',
      warriorNodes: 'id, rank',
      rankMoves: 'id, rank',
      gameDrills: 'id, name',
      metrics: 'id, studentId, weekOf',
      speedRankThresholds: 'id, rank, windowSec, mode',
      pointEvents: 'id, studentId, sessionId, date, type',
      pointsRules: 'type',
    });

    this.version(3).stores({
      students: 'id, name, currentRank',
      classes: 'id, name, coachName',
      templates: 'id, name, period',
      sessions: 'id, classId, date, closed',
      fitnessTestItems: 'id, quality',
      fitnessTests: 'id, studentId, quarter, date',
      rankExams: 'id, studentId, date',
      lessonPackages: 'id, studentId, purchasedAt',
      payments: 'id, studentId, paidAt',
      recommendations: 'id, studentId, createdAt',
      benchmarks: 'id, quality, ageMin, ageMax',
      warriorNodes: 'id, rank',
      rankMoves: 'id, rank',
      gameDrills: 'id, name',
      metrics: 'id, studentId, weekOf',
      speedRankThresholds: 'id, rank, windowSec, mode',
      pointEvents: 'id, studentId, sessionId, date, type',
      pointsRules: 'type',
      missionsProgress: '++id, studentId, classId, missionId, date, stars, energy, status',
      badges: '++id, studentId, code, earnedAt',
      seasons: '++id, code',
      leaderboards: '++id, seasonCode, scope, refId',
    });



    this.version(4).stores({
      students: 'id, name, currentRank',
      classes: 'id, name, coachName',
      templates: 'id, name, period',
      sessions: 'id, classId, date, closed',
      fitnessTestItems: 'id, quality',
      fitnessTests: 'id, studentId, quarter, date',
      rankExams: 'id, studentId, date',
      lessonPackages: 'id, studentId, purchasedAt',
      payments: 'id, studentId, paidAt',
      recommendations: 'id, studentId, createdAt',
      benchmarks: 'id, quality, ageMin, ageMax',
      warriorNodes: 'id, rank',
      rankMoves: 'id, rank',
      gameDrills: 'id, name',
      metrics: 'id, studentId, weekOf',
      speedRankThresholds: 'id, rank, windowSec, mode',
      pointEvents: 'id, studentId, sessionId, date, type',
      pointsRules: 'type',
      missionsProgress: '++id, studentId, classId, missionId, date, stars, energy, status',
      badges: '++id, studentId, code, earnedAt',
      seasons: '++id, code',
      leaderboards: '++id, seasonCode, scope, refId',
      retrospectives: 'id, classId, date',
    });



    this.version(5).stores({
      students: 'id, name, currentRank',
      classes: 'id, name, coachName',
      templates: 'id, name, period',
      sessions: 'id, classId, date, closed',
      fitnessTestItems: 'id, quality',
      fitnessTests: 'id, studentId, quarter, date',
      rankExams: 'id, studentId, date',
      lessonPackages: 'id, studentId, purchasedAt',
      payments: 'id, studentId, paidAt',
      recommendations: 'id, studentId, createdAt',
      benchmarks: 'id, quality, ageMin, ageMax',
      warriorNodes: 'id, rank',
      rankMoves: 'id, rank',
      gameDrills: 'id, name',
      metrics: 'id, studentId, weekOf',
      speedRankThresholds: 'id, rank, windowSec, mode',
      pointEvents: 'id, studentId, sessionId, date, type',
      pointsRules: 'type',
      missionsProgress: '++id, studentId, classId, missionId, date, stars, energy, status',
      badges: '++id, studentId, code, earnedAt',
      seasons: '++id, code',
      leaderboards: '++id, seasonCode, scope, refId',
      retrospectives: 'id, classId, date',
      squads: 'id, classId, seasonCode',
      squadChallenges: 'id, squadId, status, endDate',
      squadProgress: '++id, challengeId, squadId, createdAt',
      kudos: '++id, toStudentId, fromStudentId, classId, seasonCode, createdAt',
      energyLogs: '++id, studentId, createdAt, source',
      trainingQualities: 'id',
      trainingDrills: 'id',
      trainingGames: 'id',
      missionCardsV2: 'id',
      cycleTemplates: 'id',
      classCyclePlans: 'id, classId, cycleId',
      cycleReports: 'id, studentId, cycleId, planId',


    });

    this.version(6).stores({
      students: 'id, name, currentRank',
      classes: 'id, name, coachName',
      templates: 'id, name, period',
      sessions: 'id, classId, date, closed',
      fitnessTestItems: 'id, quality',
      fitnessTests: 'id, studentId, quarter, date',
      rankExams: 'id, studentId, date',
      lessonPackages: 'id, studentId, purchasedAt',
      payments: 'id, studentId, paidAt',
      recommendations: 'id, studentId, createdAt',
      benchmarks: 'id, quality, ageMin, ageMax',
      warriorNodes: 'id, rank',
      rankMoves: 'id, rank',
      gameDrills: 'id, name',
      metrics: 'id, studentId, weekOf',
      speedRankThresholds: 'id, rank, windowSec, mode',
      pointEvents: 'id, studentId, sessionId, date, type',
      pointsRules: 'type',
      missionsProgress: '++id, studentId, classId, missionId, date, stars, energy, status',
      badges: '++id, studentId, code, earnedAt',
      seasons: '++id, code',
      leaderboards: '++id, seasonCode, scope, refId',
      retrospectives: 'id, classId, date',
      squads: 'id, classId, seasonCode',
      squadChallenges: 'id, squadId, status, endDate',
      squadProgress: '++id, challengeId, squadId, createdAt',
      kudos: '++id, toStudentId, fromStudentId, classId, seasonCode, createdAt',
      energyLogs: '++id, studentId, createdAt, source',
      trainingQualities: 'id',
      trainingDrills: 'id',
      trainingGames: 'id',
      missionCardsV2: 'id',
      cycleTemplates: 'id',
      classCyclePlans: 'id, classId, cycleId',
      cycleReports: 'id, studentId, cycleId, planId',
    });

    this.version(7).stores({
      students: 'id, name, currentRank',
      classes: 'id, name, coachName',
      templates: 'id, name, period',
      sessions: 'id, classId, date, closed',
      fitnessTestItems: 'id, quality',
      fitnessTests: 'id, studentId, quarter, date',
      rankExams: 'id, studentId, date',
      lessonPackages: 'id, studentId, purchasedAt',
      payments: 'id, studentId, paidAt',
      recommendations: 'id, studentId, createdAt',
      benchmarks: 'id, quality, ageMin, ageMax',
      warriorNodes: 'id, rank',
      rankMoves: 'id, rank',
      gameDrills: 'id, name',
      metrics: 'id, studentId, weekOf',
      speedRankThresholds: 'id, rank, windowSec, mode',
      pointEvents: 'id, studentId, sessionId, date, type',
      pointsRules: 'type',
      missionsProgress: '++id, studentId, classId, missionId, date, stars, energy, status',
      badges: '++id, studentId, code, earnedAt',
      seasons: '++id, code',
      leaderboards: '++id, seasonCode, scope, refId',
      retrospectives: 'id, classId, date',
      squads: 'id, classId, seasonCode',
      squadChallenges: 'id, squadId, status, endDate',
      squadProgress: '++id, challengeId, squadId, createdAt',
      kudos: '++id, toStudentId, fromStudentId, classId, seasonCode, createdAt',
      energyLogs: '++id, studentId, createdAt, source',
      trainingQualities: 'id',
      trainingDrills: 'id',
      trainingGames: 'id',
      missionCardsV2: 'id',
      cycleTemplates: 'id',
      classCyclePlans: 'id, classId, cycleId',
      cycleReports: 'id, studentId, cycleId, planId',
      puzzleTemplates: 'id, name, code, totalCards',
      puzzleQuests: 'id, classId, sessionId, templateId',
      puzzleCampaigns: 'id, squadId, templateId',
    });

    this.version(8).stores({
      students: 'id, name, currentRank',
      classes: 'id, name, coachName',
      templates: 'id, name, period',
      sessions: 'id, classId, date, closed',
      fitnessTestItems: 'id, quality',
      fitnessTests: 'id, studentId, quarter, date',
      rankExams: 'id, studentId, date',
      lessonPackages: 'id, studentId, purchasedAt',
      payments: 'id, studentId, paidAt',
      recommendations: 'id, studentId, createdAt',
      benchmarks: 'id, quality, ageMin, ageMax',
      warriorNodes: 'id, rank',
      rankMoves: 'id, rank',
      gameDrills: 'id, name',
      metrics: 'id, studentId, weekOf',
      speedRankThresholds: 'id, rank, windowSec, mode',
      pointEvents: 'id, studentId, sessionId, date, type',
      pointsRules: 'type',
      missionsProgress: '++id, studentId, classId, missionId, date, stars, energy, status',
      badges: '++id, studentId, code, earnedAt',
      seasons: '++id, code',
      leaderboards: '++id, seasonCode, scope, refId',
      retrospectives: 'id, classId, date',
      squads: 'id, classId, seasonCode',
      squadChallenges: 'id, squadId, status, endDate',
      squadProgress: '++id, challengeId, squadId, createdAt',
      kudos: '++id, toStudentId, fromStudentId, classId, seasonCode, createdAt',
      energyLogs: '++id, studentId, createdAt, source',
      trainingQualities: 'id',
      trainingDrills: 'id',
      trainingGames: 'id',
      missionCardsV2: 'id',
      cycleTemplates: 'id',
      classCyclePlans: 'id, classId, cycleId',
      cycleReports: 'id, studentId, cycleId, planId',
      puzzleTemplates: 'id, name, code, totalCards',
      puzzleQuests: 'id, classId, sessionId, templateId',
      puzzleCampaigns: 'id, squadId, templateId',
      rewardItems: 'id, type, visible, seasonTag',
      studentExchanges: 'id, studentId, rewardId, status, redeemedAt',
    });

    this.version(9)
      .stores({
        students: 'id, name, currentRank',
        classes: 'id, name, coachName',
        templates: 'id, name, period',
        sessions: 'id, classId, date, closed',
        fitnessTestItems: 'id, quality',
        fitnessTests: 'id, studentId, quarter, date',
        rankExams: 'id, studentId, date',
        lessonPackages: 'id, studentId, purchasedAt',
        payments: 'id, studentId, paidAt',
        recommendations: 'id, studentId, createdAt',
        benchmarks: 'id, quality, ageMin, ageMax',
        warriorNodes: 'id, rank',
        rankMoves: 'id, rank',
        gameDrills: 'id, name',
        metrics: 'id, studentId, weekOf',
        speedRankThresholds: 'id, rank, windowSec, mode',
        pointEvents: 'id, studentId, sessionId, date, type',
        pointsRules: 'type',
        missionsProgress: '++id, studentId, classId, missionId, date, stars, energy, status',
        badges: '++id, studentId, code, earnedAt',
        seasons: '++id, code',
        leaderboards: '++id, seasonCode, scope, refId',
        retrospectives: 'id, classId, date',
        squads: 'id, classId, seasonCode',
        squadChallenges: 'id, squadId, status, endDate',
        squadProgress: '++id, challengeId, squadId, createdAt',
        kudos: '++id, toStudentId, fromStudentId, classId, seasonCode, createdAt',
        energyLogs: '++id, studentId, createdAt, source',
        trainingStages: 'id',
        trainingPlans: 'id, stageId',
        trainingUnits: 'id, stageId',
        trainingQualities: 'id',
        trainingDrills: 'id',
        trainingGames: 'id',
        missionCardsV2: 'id',
        cycleTemplates: 'id',
        classCyclePlans: 'id, classId, cycleId',
        cycleReports: 'id, studentId, cycleId, planId',
        puzzleTemplates: 'id, name, code, totalCards',
        puzzleQuests: 'id, classId, sessionId, templateId',
        puzzleCampaigns: 'id, squadId, templateId',
        rewardItems: 'id, type, visible, seasonTag',
        studentExchanges: 'id, studentId, rewardId, status, redeemedAt',
      })
      .upgrade(async (transaction) => {
        const templatesTable = transaction.table('templates');
        const templates = await templatesTable.toArray();
        await Promise.all(
          templates.map(async (template) => {
            if (!Array.isArray((template as any).unitIds)) {
              (template as any).unitIds = [];
              await templatesTable.put(template);
            }
            if (!Array.isArray((template as any).blocks)) {
              (template as any).blocks = [];
              await templatesTable.put(template);
            }
          }),
        );
      });

  }
}

export const db = new CoachDatabase();
