import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";


import { Link, useParams } from "react-router-dom";
import { AttendanceGrid } from "../../components/AttendanceGrid";
import { ExportPdfButton } from "../../components/ExportPdfButton";
import { ProgressChart } from "../../components/ProgressChart";
import { RadarChart } from "../../components/RadarChart";
import { SpeedInput, type SpeedRow } from "../../components/SpeedInput";
import { EnergyBoard } from "../../components/EnergyBoard";
import { RewardToast } from "../../components/RewardToast";
import { ClassSquadPanel } from "../../components/squads/ClassSquadPanel";
import { PuzzleGrid } from "../../components/PuzzleGrid";
import { StudentAvatar } from "../../components/StudentAvatar";
import { PERFORMANCE_DIMENSIONS, PERFORMANCE_PRESET_LOOKUP } from "../../config/performance";
import { getFreestyleReward } from "../../config/freestyleRewards";
import { classesRepo } from "../../store/repositories/classesRepo";
import { sessionsRepo } from "../../store/repositories/sessionsRepo";
import { studentsRepo } from "../../store/repositories/studentsRepo";
import { templatesRepo } from "../../store/repositories/templatesRepo";
import { testsRepo } from "../../store/repositories/testsRepo";
import { trainingRepo } from "../../store/repositories/trainingRepo";
import { generateId } from "../../store/repositories/utils";
import { db } from "../../store/db";
import { puzzlesRepo } from "../../store/repositories/puzzlesRepo";
import type {
  AttendanceItem,
  ClassCyclePlan,
  ClassEntity,
  CycleWeekPlan,
  IntensityLevel,
  MissionCardV2,
  PerformanceDimensionId,
  SessionPerformanceEntry,
  PointEvent,
  PointEventType,
  RankMove,
  SessionRecord,
  SpeedRecord,
  WindowSec,
  StimulusType,
  Period,
  Student,
  TrainingCycleTemplate,
  TrainingDrill,
  TrainingGame,
  TrainingNote,
  TrainingQuality,
  TrainingTemplate,
  TrainingUnit,
  WarriorPathNode,
} from "../../types";
import type { PuzzleQuestInstance, PuzzleTemplate } from "../../types.gamify";
import {
  buildFreestyleProgress,
  buildRankTrajectory,
  buildSpeedSeries,
  buildSpeedRankTrajectory,
  latestRadar,
  maybeUpgradeRank,
} from "../../utils/calc";
import { getPointValue, SESSION_POINT_CAP } from "../../utils/points";
import { pointEventsRepo } from "../../store/repositories/pointEventsRepo";
import { AwardEngine } from "../../gamify/awardEngine";

interface FreestyleDraft {
  id: string;
  studentId: string;
  moveId: string;
  passed: boolean;
  note?: string;
}

const INTENSITY_META: Record<IntensityLevel, { label: string; bg: string; text: string }> = {
  '⚡': { label: '高强度', bg: 'bg-rose-100 text-rose-600', text: 'text-rose-600' },
  '🌈': { label: '中等强度', bg: 'bg-violet-100 text-violet-600', text: 'text-violet-600' },
  '💧': { label: '恢复强度', bg: 'bg-sky-100 text-sky-600', text: 'text-sky-600' },
};

const STIMULUS_LABEL: Record<StimulusType, string> = {
  neural: '神经',
  strength: '力量',
  metabolic: '代谢',
  technical: '技术',
  psychological: '心理',
};


const PERIOD_LABEL: Record<Period | 'ALL', string> = {
  PREP: '准备期',
  SPEC: '专项准备期',
  COMP: '比赛期',
  ALL: '通用阶段',
};

function compactUnique<T>(values: Array<T | null | undefined>): T[] {
  return Array.from(new Set(values.filter((value): value is T => value !== null && value !== undefined)));
}



interface MissionBlockEntry {
  key: string;
  title: string;
  duration?: number;
  stimulus?: StimulusType;
  intensity?: IntensityLevel;
  drillIds: string[];
  gameIds: string[];
  rankMoveIds?: string[];
  qualities?: string[];
  notes?: string;
  drills?: TrainingDrill[];
  games?: TrainingGame[];
}

interface SessionPlanView {
  id: string;
  week: number;
  plannedDate: string;
  status: ClassCyclePlan['sessions'][number]['status'];
  missionName: string;
  totalDuration?: number;
  blocks: Array<{
    key: string;
    title: string;
    duration?: number;
    stimulus?: StimulusType;
    intensity?: IntensityLevel;
    drills: TrainingDrill[];
    games: TrainingGame[];
  }>;
}

const PERFORMANCE_SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;
const DEFAULT_PERFORMANCE_SCORE = 4;

interface PerformanceDraft {
  performanceId?: string;
  noteId?: string;
  stars: number;
  comment: string;
  presetIds: string[];
  dimensionScores: Record<PerformanceDimensionId, number>;
}

function createDimensionScoreMap(): Record<PerformanceDimensionId, number> {
  const map: Partial<Record<PerformanceDimensionId, number>> = {};
  PERFORMANCE_DIMENSIONS.forEach((dimension) => {
    map[dimension.id] = DEFAULT_PERFORMANCE_SCORE;
  });
  return map as Record<PerformanceDimensionId, number>;
}

function createEmptyPerformanceDraft(): PerformanceDraft {
  return {
    stars: DEFAULT_PERFORMANCE_SCORE,
    comment: '',
    presetIds: [],
    dimensionScores: createDimensionScoreMap(),
  };
}

function cloneDraft(draft: PerformanceDraft): PerformanceDraft {
  return {
    ...draft,
    presetIds: [...draft.presetIds],
    dimensionScores: { ...draft.dimensionScores },
  };
}

function buildDraftFromEntry(entry?: SessionPerformanceEntry | null): PerformanceDraft {
  const base = createDimensionScoreMap();
  if (entry?.dimensions?.length) {
    entry.dimensions.forEach(({ dimension, score }) => {
      base[dimension] = score;
    });
  }
  return {
    performanceId: entry?.id,
    noteId: entry?.noteId,
    stars: entry?.stars ?? DEFAULT_PERFORMANCE_SCORE,
    comment: entry?.comment ?? '',
    presetIds: entry?.presetIds ? [...entry.presetIds] : [],
    dimensionScores: base,
  };
}

function normaliseWeekNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const match = value.match(/\d+/);
    if (!match) {
      return null;
    }
    const parsed = Number.parseInt(match[0] ?? '', 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}


export function ClassDetailPage() {
  const params = useParams<{ id: string }>();
  const classId = params.id!;
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [classEntity, setClassEntity] = useState<ClassEntity | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [template, setTemplate] = useState<TrainingTemplate | null>(null);
  const [rankMoves, setRankMoves] = useState<RankMove[]>([]);
  const [warriorNodes, setWarriorNodes] = useState<WarriorPathNode[]>([]);
  const [cyclePlan, setCyclePlan] = useState<ClassCyclePlan | null>(null);
  const [cycleTemplates, setCycleTemplates] = useState<TrainingCycleTemplate[]>([]);
  const [missionCardsV2, setMissionCardsV2] = useState<MissionCardV2[]>([]);
  const [trainingQualities, setTrainingQualities] = useState<TrainingQuality[]>([]);
  const [trainingDrills, setTrainingDrills] = useState<TrainingDrill[]>([]);
  const [trainingGames, setTrainingGames] = useState<TrainingGame[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [speedRows, setSpeedRows] = useState<SpeedRow[]>([]);
  const [performanceDrafts, setPerformanceDrafts] = useState<Record<string, PerformanceDraft>>({});
  const [activePerformanceStudentId, setActivePerformanceStudentId] = useState<string | null>(null);
  const [freestyle, setFreestyle] = useState<FreestyleDraft[]>([]);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [blockCompletion, setBlockCompletion] = useState<
    Record<string, boolean>
  >({});
  const [consumeOverrides, setConsumeOverrides] = useState<
    Record<string, number | undefined>
  >({});
  const [previousSpeedRecords, setPreviousSpeedRecords] = useState<
    SpeedRecord[]
  >([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [attendanceAwarded, setAttendanceAwarded] = useState(false);
  const [awardingAttendance, setAwardingAttendance] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [planStartDate, setPlanStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [assigningPlan, setAssigningPlan] = useState(false);

  const [showMissionDetail, setShowMissionDetail] = useState(false);
  const [activeBlockKey, setActiveBlockKey] = useState<string | null>(null);
  const [puzzleQuest, setPuzzleQuest] = useState<PuzzleQuestInstance | null>(null);
  const [puzzleTemplate, setPuzzleTemplate] = useState<PuzzleTemplate | null>(null);
  const [puzzleLoading, setPuzzleLoading] = useState(false);
  const [pendingFlip, setPendingFlip] = useState<{
    cardId: string;
    participantIds: string[];
  } | null>(null);
  const [flippingCardId, setFlippingCardId] = useState<string | null>(null);

  useEffect(() => {
    setPerformanceDrafts((prev) => {
      const next = { ...prev };
      let mutated = false;
      const studentIds = new Set(students.map((student) => student.id));
      students.forEach((student) => {
        if (!next[student.id]) {
          next[student.id] = createEmptyPerformanceDraft();
          mutated = true;
        }
      });
      Object.keys(next).forEach((studentId) => {
        if (!studentIds.has(studentId)) {
          delete next[studentId];
          mutated = true;
        }
      });
      return mutated ? next : prev;
    });
  }, [students]);

  useEffect(() => {
    if (!students.length) {
      setActivePerformanceStudentId(null);
      return;
    }
    setActivePerformanceStudentId((prev) => {
      if (prev && students.some((student) => student.id === prev)) {
        return prev;
      }
      return students[0]?.id ?? null;
    });
  }, [students]);

  useEffect(() => {
    if (!session?.performance?.length) return;
    setPerformanceDrafts((prev) => {
      const next = { ...prev };
      session.performance?.forEach((entry) => {
        if (!students.some((student) => student.id === entry.studentId)) return;
        next[entry.studentId] = buildDraftFromEntry(entry);
      });
      return next;
    });
  }, [session?.performance, students]);

  const updatePerformanceDraft = useCallback(
    (studentId: string, updater: (draft: PerformanceDraft) => PerformanceDraft) => {
      setPerformanceDrafts((prev) => {
        const current = prev[studentId] ?? createEmptyPerformanceDraft();
        const nextDraft = updater(cloneDraft(current));
        return { ...prev, [studentId]: nextDraft };
      });
    },
    [],
  );

  const handlePerformanceStars = useCallback(
    (studentId: string, stars: number) => {
      updatePerformanceDraft(studentId, (draft) => ({ ...draft, stars }));
    },
    [updatePerformanceDraft],
  );

  const handlePerformanceDimension = useCallback(
    (studentId: string, dimension: PerformanceDimensionId, score: number) => {
      updatePerformanceDraft(studentId, (draft) => ({
        ...draft,
        dimensionScores: { ...draft.dimensionScores, [dimension]: score },
      }));
    },
    [updatePerformanceDraft],
  );

  const handlePerformancePresetToggle = useCallback(
    (studentId: string, presetId: string) => {
      updatePerformanceDraft(studentId, (draft) => {
        const exists = draft.presetIds.includes(presetId);
        return {
          ...draft,
          presetIds: exists
            ? draft.presetIds.filter((id) => id !== presetId)
            : [...draft.presetIds, presetId],
        };
      });
    },
    [updatePerformanceDraft],
  );

  const handlePerformanceCommentChange = useCallback(
    (studentId: string, comment: string) => {
      updatePerformanceDraft(studentId, (draft) => ({ ...draft, comment }));
    },
    [updatePerformanceDraft],
  );

  const activePerformanceStudent = useMemo(() => {
    if (!activePerformanceStudentId) return null;
    return students.find((student) => student.id === activePerformanceStudentId) ?? null;
  }, [activePerformanceStudentId, students]);

  const activePerformanceDraft = activePerformanceStudent
    ? performanceDrafts[activePerformanceStudent.id] ?? createEmptyPerformanceDraft()
    : null;

  const handleOpenPuzzleFlip = useCallback(
    (cardId: string) => {
      if (!puzzleQuest) {
        window.alert('请先开启本次挑战后再翻牌');
        return;
      }
      const defaultParticipants = attendance
        .filter((item) => item.present)
        .map((item) => item.studentId);
      setPendingFlip({ cardId, participantIds: defaultParticipants });
    },
    [attendance, puzzleQuest],
  );

  const toggleFlipParticipant = useCallback((studentId: string) => {
    setPendingFlip((prev) => {
      if (!prev) return prev;
      const exists = prev.participantIds.includes(studentId);
      return {
        ...prev,
        participantIds: exists
          ? prev.participantIds.filter((id) => id !== studentId)
          : [...prev.participantIds, studentId],
      };
    });
  }, []);

  const selectAllFlipParticipants = useCallback(() => {
    const present = attendance.filter((item) => item.present).map((item) => item.studentId);
    setPendingFlip((prev) => (prev ? { ...prev, participantIds: present } : prev));
  }, [attendance]);

  const clearFlipParticipants = useCallback(() => {
    setPendingFlip((prev) => (prev ? { ...prev, participantIds: [] } : prev));
  }, []);




  const refreshStudentEnergy = useCallback(async (studentId: string) => {
    const updated = await studentsRepo.get(studentId);
    if (!updated) return;
    setStudents((prev) => prev.map((item) => (item.id === studentId ? updated : item)));
  }, []);

  const refreshStudentsEnergy = useCallback(
    async (studentIds: string[]) => {
      await Promise.all(studentIds.map((id) => refreshStudentEnergy(id)));
    },
    [refreshStudentEnergy],
  );




  const handleConfirmFlip = useCallback(async () => {
    if (!pendingFlip || !puzzleQuest) return;
    setFlippingCardId(pendingFlip.cardId);
    try {
      const participants = pendingFlip.participantIds;
      const result = await puzzlesRepo.flipCardInQuest(puzzleQuest.id, pendingFlip.cardId, participants);
      setPuzzleQuest(result.quest);
      setPuzzleTemplate(result.template);

      const energyMap = new Map<string, number>();
      result.awards.forEach((award) => {
        if (!award.studentId || award.energy <= 0) return;
        energyMap.set(award.studentId, (energyMap.get(award.studentId) ?? 0) + award.energy);
      });
      if (energyMap.size) {
        await Promise.all(
          Array.from(energyMap.entries()).map(async ([studentId, delta]) => {
            const current = await studentsRepo.get(studentId);
            if (!current) return;
            await studentsRepo.upsert({ ...current, energy: (current.energy ?? 0) + delta });
          }),
        );
        await refreshStudentsEnergy(Array.from(energyMap.keys()));
      }

      const card = result.template.cards.find((item) => item.id === pendingFlip.cardId);
      const totalEnergy = Array.from(energyMap.values()).reduce((sum, value) => sum + value, 0);
      if (card) {
        setToastMessage(
          `翻开「${card.title}」${totalEnergy > 0 ? ` +${totalEnergy} 能量` : ''}`,
        );
      }
    } catch (error) {
      console.error(error);
      window.alert('翻牌失败，请稍后再试');
    } finally {
      setFlippingCardId(null);
      setPendingFlip(null);
    }
  }, [pendingFlip, puzzleQuest, refreshStudentsEnergy]);

  const rankMoveLookup = useMemo(() => {
    const map: Record<string, { rank: number; name: string }> = {};
    rankMoves.forEach((move) => {
      map[move.id] = { rank: move.rank, name: move.name };
    });
    return map;
  }, [rankMoves]);



  const missionLookup = useMemo(() => {
    const map: Record<string, MissionCardV2> = {};
    missionCardsV2.forEach((mission) => {
      map[mission.id] = mission;
    });
    return map;
  }, [missionCardsV2]);

  const drillLookup = useMemo(() => {
    const map: Record<string, TrainingDrill> = {};
    trainingDrills.forEach((drill) => {
      map[drill.id] = drill;
    });
    return map;
  }, [trainingDrills]);

  const trainingGameLookup = useMemo(() => {
    const map: Record<string, TrainingGame> = {};
    trainingGames.forEach((game) => {
      map[game.id] = game;
    });
    return map;
  }, [trainingGames]);

  const qualityLookup = useMemo(() => {
    const map: Record<string, TrainingQuality> = {};
    trainingQualities.forEach((quality) => {
      map[quality.id] = quality;
    });
    return map;
  }, [trainingQualities]);

  const sortedPlanSessions = useMemo(() => {
    if (!cyclePlan) return [] as ClassCyclePlan['sessions'];
    return [...cyclePlan.sessions].sort(
      (a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime(),
    );
  }, [cyclePlan]);

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return sortedPlanSessions.find((session) => session.id === selectedSessionId) ?? null;
  }, [selectedSessionId, sortedPlanSessions]);

  const selectedMission = useMemo(() => {
    if (!selectedSession) return null;
    return missionLookup[selectedSession.missionCardId] ?? null;
  }, [missionLookup, selectedSession]);

  const activeCycleTemplate = useMemo(() => {
    if (!cyclePlan) return null;
    const templateRecord = cycleTemplates.find((item) => item.id === cyclePlan.cycleId);
    return templateRecord ?? null;
  }, [cyclePlan, cycleTemplates]);

  const activeWeekPlan = useMemo(() => {
    if (!selectedSession || !activeCycleTemplate) return null;

    

    const targetWeek = normaliseWeekNumber(selectedSession.week);
    if (targetWeek == null) {
      return null;
    }
    const weekPlanEntry = activeCycleTemplate.weekPlan.find((week) => {
      const parsedWeek = normaliseWeekNumber(week.week);
      return parsedWeek != null && parsedWeek === targetWeek;
    });
    if (!weekPlanEntry) return null;
    const parsedWeek = normaliseWeekNumber(weekPlanEntry.week);
    return {
      ...weekPlanEntry,
      week: parsedWeek ?? targetWeek,
    } as CycleWeekPlan;

      

  }, [activeCycleTemplate, selectedSession]);

  const missionChoices = useMemo(() => {
    return sortedPlanSessions.map((session) => {
      const mission = missionLookup[session.missionCardId];
      const label = `${mission?.name ?? '任务卡'} · 第${session.week}周`;
      return { value: session.id, label, status: session.status };
    });
  }, [sortedPlanSessions, missionLookup]);

  const formatDate = (iso: string) => {
    if (!iso) return '未排期';
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return '未排期';
    return parsed.toLocaleDateString();
  };



  const missionBlockEntries = useMemo<MissionBlockEntry[]>(() => {
    if (selectedMission) {
      return selectedMission.blocks.map((block, index) => {
        const drills = (block.drillIds ?? [])
          .map((id) => drillLookup[id])
          .filter((item): item is TrainingDrill => Boolean(item));
        const games = (block.gameIds ?? [])
          .map((id) => trainingGameLookup[id])
          .filter((item): item is TrainingGame => Boolean(item));
        const duration = [...drills, ...games]
          .map((item) => item.durationMin ?? 0)
          .reduce((total, minutes) => total + minutes, 0);
        return {
          key: `${selectedMission.id}::${index}`,
          title: block.title,
          stimulus: block.stimulus,
          intensity: block.intensity,
          drillIds: block.drillIds ?? [],
          gameIds: block.gameIds ?? [],
          drills,
          games,
          duration: duration > 0 ? duration : undefined,
        };
      });
    }
    if (template) {
      return template.blocks.map((block, index) => {
        const drills = (block.drillIds ?? [])
          .map((id) => drillLookup[id])
          .filter((item): item is TrainingDrill => Boolean(item));
        const games = (block.gameIds ?? [])
          .map((id) => trainingGameLookup[id])
          .filter((item): item is TrainingGame => Boolean(item));
        return {
          key: block.id ?? `${template.id}::${index}`,
          title: block.title,
          duration: block.durationMin,
          drillIds: block.drillIds ?? [],
          gameIds: block.gameIds ?? [],
          rankMoveIds: block.rankMoveIds ?? [],
          qualities: block.qualities ?? [],
          notes: block.notes,
          stimulus: block.stimulus,
          intensity: block.intensity,
          drills,
          games,
        };
      });
    }
    return [];
  }, [selectedMission, template, drillLookup, trainingGameLookup]);

  const puzzleBindings = useMemo(() => {
    const entries: Array<{
      key: string;
      templateId: string;
      cardIds?: string[];
      title: string;
    }> = [];
    if (selectedMission) {
      selectedMission.blocks.forEach((block, index) => {
        if (block.puzzleTemplateId) {
          entries.push({
            key: `${selectedMission.id}::${index}`,
            templateId: block.puzzleTemplateId,
            cardIds: block.puzzleCardIds,
            title: block.title,
          });
        }
      });
    } else if (template) {
      template.blocks.forEach((block) => {
        if (block.puzzleTemplateId) {
          entries.push({
            key: block.id,
            templateId: block.puzzleTemplateId,
            cardIds: block.puzzleCardIds,
            title: block.title,
          });
        }
      });
    }
    if (!entries.length && activeWeekPlan?.puzzleTemplateId) {
      const weekLabel = activeWeekPlan.week ?? selectedSession?.week;
      const focusLabel = activeWeekPlan.focus?.trim();
      entries.push({
        key: selectedSession?.id ?? `cycle-week-${activeWeekPlan.week}`,
        templateId: activeWeekPlan.puzzleTemplateId,
        cardIds:
          activeWeekPlan.puzzleCardIds && activeWeekPlan.puzzleCardIds.length
            ? activeWeekPlan.puzzleCardIds
            : undefined,
        title:
          selectedMission?.name ??
          (weekLabel
            ? `第${weekLabel}周${focusLabel ? ` · ${focusLabel}` : ''}`
            : '周期计划主线谜题'),
      });
    }
    if (!entries.length) return null;
    const uniqueTemplateIds = Array.from(new Set(entries.map((entry) => entry.templateId)));
    const templateId = uniqueTemplateIds[0];
    return {
      templateId,
      blockBindings: entries.filter((entry) => entry.templateId === templateId),
      hasMixedTemplates: uniqueTemplateIds.length > 1,
    };
  }, [selectedMission, template, activeWeekPlan, selectedSession]);

  const currentSessionPlan = useMemo<SessionPlanView | null>(() => {
    if (!selectedSession) return null;
    const blocks = missionBlockEntries.map((entry) => ({
      key: entry.key,
      title: entry.title,
      duration: entry.duration,
      stimulus: entry.stimulus,
      intensity: entry.intensity,
      drills: entry.drills ?? [],
      games: entry.games ?? [],
    }));
    const aggregatedDuration = blocks
      .map((block) => block.duration ?? 0)
      .reduce((total, minutes) => total + minutes, 0);
    const totalDuration = aggregatedDuration || selectedMission?.durationMin;
    return {
      id: selectedSession.id,
      week: selectedSession.week,
      plannedDate: selectedSession.plannedDate,
      status: selectedSession.status,
      missionName: selectedMission?.name ?? template?.name ?? '任务卡',
      totalDuration: totalDuration && totalDuration > 0 ? totalDuration : undefined,
      blocks,
    };
  }, [selectedSession, missionBlockEntries, selectedMission, template]);

  const activeBlock = useMemo(() => {
    if (!currentSessionPlan) return null;
    if (!activeBlockKey) {
      return currentSessionPlan.blocks[0] ?? null;
    }
    return (
      currentSessionPlan.blocks.find((block) => block.key === activeBlockKey) ??
      currentSessionPlan.blocks[0] ??
      null
    );
  }, [activeBlockKey, currentSessionPlan]);
  const activeIntensityMeta = activeBlock?.intensity ? INTENSITY_META[activeBlock.intensity] : undefined;
  const activeStimulusLabel = activeBlock?.stimulus ? STIMULUS_LABEL[activeBlock.stimulus] : undefined;

  const puzzleCards = useMemo(() => {
    if (!puzzleTemplate || !puzzleQuest) return [];
    return puzzleTemplate.cards.map((card, index) => {
      const progress = puzzleQuest.progress.find((item) => item.cardId === card.id);
      const skin = card.skin;
      const normalizedSkin: 'poem' | 'mosaic' | 'emoji' | 'math' | 'team' =
        skin === 'mosaic' || skin === 'emoji' || skin === 'math' || skin === 'team' || skin === 'poem'
          ? (skin as 'poem' | 'mosaic' | 'emoji' | 'math' | 'team')
          : 'poem';
      return {
        id: card.id,
        title: card.title,
        type: card.type,
        stars: card.difficulty ?? 3,
        status: progress?.status ?? 'locked',
        skin: normalizedSkin,
        fragmentText: card.fragmentText,
        fragmentImageUrl: card.fragmentImageUrl,
        reward: card.reward
          ? {
              energy: card.reward.energy,
              badge: card.reward.badge,
              text: card.reward.text,
            }
          : undefined,
        hint: card.description,
        index: index + 1,
        total: puzzleTemplate.cards.length,
      };
    });
  }, [puzzleTemplate, puzzleQuest]);

  const puzzleSubtitle = useMemo(() => {
    if (!puzzleTemplate) return undefined;
    const totalEnergy =
      puzzleTemplate.totalEnergy ??
      puzzleTemplate.cards.reduce((sum, card) => sum + (card.reward?.energy ?? 0), 0);
    const bindingCount = puzzleBindings?.blockBindings.length ?? 0;
    const bindingText = bindingCount ? `关联 ${bindingCount} 个训练环节` : '完成训练环节即可翻牌';
    return `${bindingText} · 总能量 ${totalEnergy}⚡`;
  }, [puzzleTemplate, puzzleBindings]);

  const puzzleAssignments = useMemo(() => {
    if (!puzzleBindings || !puzzleTemplate) return [] as Array<{
      key: string;
      title: string;
      cards: Array<(typeof puzzleTemplate.cards)[number]>;
      allCards: boolean;
    }>;
    return puzzleBindings.blockBindings.map((binding) => {
      const cardIds = binding.cardIds && binding.cardIds.length ? binding.cardIds : null;
      const cards: Array<(typeof puzzleTemplate.cards)[number]> = cardIds
        ? cardIds
            .map((cardId) => puzzleTemplate.cards.find((card) => card.id === cardId))
            .filter((card): card is (typeof puzzleTemplate.cards)[number] => Boolean(card))
        : [];
      return {
        key: binding.key,
        title: binding.title,
        cards,
        allCards: !cardIds || cardIds.length === 0,
      };
    });
  }, [puzzleBindings, puzzleTemplate]);

  const pendingFlipCard = useMemo(() => {
    if (!pendingFlip || !puzzleTemplate) return null;
    return puzzleTemplate.cards.find((card) => card.id === pendingFlip.cardId) ?? null;
  }, [pendingFlip, puzzleTemplate]);

  const { previousSession, nextSession } = useMemo(() => {
    if (!selectedSession) {
      return { previousSession: null as ClassCyclePlan['sessions'][number] | null, nextSession: null as ClassCyclePlan['sessions'][number] | null };
    }
    const index = sortedPlanSessions.findIndex((session) => session.id === selectedSession.id);
    if (index === -1) {
      return { previousSession: null, nextSession: null };
    }
    return {
      previousSession: index > 0 ? sortedPlanSessions[index - 1] : null,
      nextSession: index < sortedPlanSessions.length - 1 ? sortedPlanSessions[index + 1] : null,
    };
  }, [selectedSession, sortedPlanSessions]);

  useEffect(() => {
    if (!missionBlockEntries.length) {
      setBlockCompletion((prev) => (Object.keys(prev).length ? {} : prev));
      setActiveBlockKey(null);
      return;
    }
    setBlockCompletion((prev) => {
      const next: Record<string, boolean> = {};
      missionBlockEntries.forEach((entry) => {
        const executed = session?.executedBlockIds?.includes(entry.key);
        next[entry.key] = executed ?? prev[entry.key] ?? false;
      });
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const sameLength = prevKeys.length === nextKeys.length;
      const sameValues = sameLength
        ? nextKeys.every((key) => prev[key] === next[key])
        : false;
      return sameLength && sameValues ? prev : next;
    });
  }, [missionBlockEntries, session?.executedBlockIds]);

  useEffect(() => {
    if (!currentSessionPlan?.blocks.length) {
      setActiveBlockKey(null);
      return;
    }
    if (!activeBlockKey || !currentSessionPlan.blocks.some((block) => block.key === activeBlockKey)) {
      setActiveBlockKey(currentSessionPlan.blocks[0].key);
    }
  }, [activeBlockKey, currentSessionPlan]);

  useEffect(() => {
    if (!session || !puzzleBindings?.templateId) {
      setPuzzleQuest(null);
      setPuzzleTemplate(null);
      setPuzzleLoading(false);
      return;
    }
    setPuzzleLoading(true);
    void (async () => {
      try {
        const templateRecord = await puzzlesRepo.getTemplate(puzzleBindings.templateId);
        const quest = await puzzlesRepo.startQuest({
          classId,
          sessionId: session.id,
          templateId: puzzleBindings.templateId,
          continueAcrossSessions: templateRecord?.continueAcrossSessions ?? false,
        });
        setPuzzleTemplate(templateRecord);
        setPuzzleQuest(quest);
        if (puzzleBindings.hasMixedTemplates) {
          console.warn(
            '检测到多个主线谜题模板被绑定到同一课节，默认使用第一个模板:',
            puzzleBindings.templateId,
          );
        }
      } catch (error) {
        console.error(error);
        setPuzzleTemplate(null);
        setPuzzleQuest(null);
      } finally {
        setPuzzleLoading(false);
      }
    })();
  }, [classId, session, puzzleBindings]);



  useEffect(() => {
    let disposed = false;
    setLoadError(null);
    setLoading(true);

    async function load() {

      

      try {
        const cls = await classesRepo.get(classId);
        if (!cls) {
          if (!disposed) {
            setClassEntity(null);
            setStudents([]);
            setTemplate(null);
            setCyclePlan(null);
            setSelectedSessionId(null);
            setLoadError('未找到该训练营，可能已被移除。');
          }
          return;
        }

        const rosterIds = Array.isArray(cls.studentIds) ? cls.studentIds : [];
        if (disposed) return;
        setClassEntity({ ...cls, studentIds: rosterIds });

        const studentList = await studentsRepo.list();
        if (disposed) return;
        const filtered = rosterIds.length
          ? studentList.filter((student) => rosterIds.includes(student.id))
          : [];
        setStudents(filtered);

        if (cls.templateId) {
          const tpl = await templatesRepo.get(cls.templateId);
          if (!disposed) {
            setTemplate(tpl ?? null);
          }
        } else if (!disposed) {
          setTemplate(null);
        }

        const [
          moves,
          nodes,
          plan,
          missionList,
          templateList,
          qualityList,
          trainingDrillList,
          trainingGameList,
        ] = await Promise.all([

          

          db.rankMoves.toArray(),
          db.warriorNodes.toArray(),
          trainingRepo.getActivePlan(classId),
          trainingRepo.listMissionCards(),
          trainingRepo.listCycleTemplates(),
          trainingRepo.listQualities(),
          trainingRepo.listDrills(),
          trainingRepo.listGames(),
        ]);

        if (disposed) return;

        setRankMoves(moves);
        setWarriorNodes(nodes);
        setCyclePlan(plan ?? null);
        setMissionCardsV2(missionList);
        setCycleTemplates(templateList);
        setTrainingQualities(qualityList);
        setTrainingDrills(trainingDrillList);
        setTrainingGames(trainingGameList);
        setSelectedTemplateId((prev) => prev || templateList[0]?.id || '');

        if (plan?.sessions.length) {
          const sorted = [...plan.sessions].sort(
            (a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime(),
          );
          const next = sorted.find((session) => session.status !== 'completed') ?? sorted[sorted.length - 1];
          setSelectedSessionId(next?.id ?? null);
        } else {
          setSelectedSessionId(null);
        }

        const history = await sessionsRepo.listByClass(classId);
        if (!disposed) {
          const lastClosed = [...history].filter((item) => item.closed).pop();
          setPreviousSpeedRecords(lastClosed?.speed ?? []);
        }
      } catch (error) {
        console.error('加载训练营详情失败', error);
        if (!disposed) {
          setLoadError('加载训练营数据失败，请稍后再试');
          setClassEntity(null);
          setStudents([]);
          setTemplate(null);
          setCyclePlan(null);
          setSelectedSessionId(null);
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      disposed = true;
    };
  }, [classId, reloadToken]);

  useEffect(() => {
    if (!cyclePlan) {
      setSelectedSessionId(null);
      return;
    }
    const sorted = [...cyclePlan.sessions].sort(
      (a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime(),
    );
    const next = sorted.find((session) => session.status !== 'completed');
    if (next) {
      setSelectedSessionId((prev) => {
        if (!prev) return next.id;
        const stillPending = sorted.some(
          (session) => session.id === prev && session.status !== 'completed',
        );
        return stillPending ? prev : next.id;
      });
    }
  }, [cyclePlan]);

  useEffect(() => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cyclePlanId: cyclePlan?.id ?? prev.cyclePlanId,
        missionCardIds: selectedSession ? [selectedSession.missionCardId] : undefined,
        cycleSessionIds: selectedSession ? [selectedSession.id] : undefined,
      };
    });
  }, [selectedSession, cyclePlan?.id]);

  const handleAssignPlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTemplateId) return;
    setAssigningPlan(true);
    try {
      const base = planStartDate ? new Date(`${planStartDate}T00:00:00`) : new Date();
      const plan = await trainingRepo.assignPlan({
        classId,
        templateId: selectedTemplateId,
        startDate: base.toISOString(),
      });
      setCyclePlan(plan);
      setSelectedSessionId(plan.sessions[0]?.id ?? null);
      setStatus('已生成新的周期计划');
    } finally {
      setAssigningPlan(false);
    }
  };

  const startSession = () => {
    const newSession: SessionRecord = {
      id: generateId(),
      classId,
      date: new Date().toISOString(),
      templateId: classEntity?.templateId,
      cyclePlanId: cyclePlan?.id,
      missionCardIds: selectedSession ? [selectedSession.missionCardId] : undefined,
      cycleSessionIds: selectedSession ? [selectedSession.id] : undefined,
      attendance: students.map((student) => ({
        studentId: student.id,
        present: true,
      })),
      speed: [],
      freestyle: [],
      notes: [],
      performance: [],
      closed: false,
      lessonConsume: 1,
    };
    setSession(newSession);
    setAttendance(newSession.attendance);
    setSpeedRows([]);
    setPerformanceDrafts(() => {
      const map: Record<string, PerformanceDraft> = {};
      students.forEach((student) => {
        map[student.id] = createEmptyPerformanceDraft();
      });
      return map;
    });
    setFreestyle([]);
    const completionMap: Record<string, boolean> = {};
    missionBlockEntries.forEach((entry) => {
      completionMap[entry.key] = false;
    });
    setBlockCompletion(completionMap);
    setConsumeOverrides({});
    setStatus(null);
    setAttendanceAwarded(false);
    setPendingFlip(null);
    setFlippingCardId(null);
    setPuzzleQuest(null);
    setPuzzleTemplate(null);
  };

  const addFreestyle = (draft: Omit<FreestyleDraft, "id">) => {
    setFreestyle((prev) => [...prev, { ...draft, id: generateId() }]);
  };

  const handleOverrideChange = (studentId: string, consume?: number) => {
    setConsumeOverrides((prev) => {
      const next = { ...prev };
      if (consume === undefined) {
        delete next[studentId];
      } else {
        next[studentId] = consume;
      }
      return next;
    });
  };

  const handleClose = async () => {
    if (!session) return;

    const overrides = Object.entries(consumeOverrides)
      .filter(([, consume]) => consume !== undefined)
      .map(([studentId, consume]) => ({
        studentId,
        consume: consume as number,
      }));
    const executedBlockIds = Object.entries(blockCompletion)
      .filter(([, done]) => done)
      .map(([blockId]) => blockId);

    const now = new Date().toISOString();
    const performanceEntries: SessionPerformanceEntry[] = [];
    const notes: TrainingNote[] = [];

    students.forEach((student) => {
      const draft = performanceDrafts[student.id] ?? createEmptyPerformanceDraft();
      const dimensionScores = PERFORMANCE_DIMENSIONS.map((dimension) => ({
        dimension: dimension.id,
        score: draft.dimensionScores[dimension.id] ?? DEFAULT_PERFORMANCE_SCORE,
      }));
      const presetIds = draft.presetIds ?? [];
      const noteId = draft.noteId ?? generateId();
      const entry: SessionPerformanceEntry = {
        id: draft.performanceId ?? generateId(),
        studentId: student.id,
        stars: draft.stars,
        presetIds,
        comment: draft.comment.trim() ? draft.comment.trim() : undefined,
        noteId,
        attendance: attendance.find((item) => item.studentId === student.id)?.present
          ? 'present'
          : 'absent',
        dimensions: dimensionScores,
        updatedAt: now,
      };
      performanceEntries.push(entry);

      const highlightLabels = presetIds
        .map((id) => PERFORMANCE_PRESET_LOOKUP[id])
        .filter((preset) => preset?.tone === 'highlight')
        .map((preset) => preset!.label);
      const focusLabels = presetIds
        .map((id) => PERFORMANCE_PRESET_LOOKUP[id])
        .filter((preset) => preset?.tone === 'focus')
        .map((preset) => preset!.label);
      const dimensionSummary = dimensionScores
        .map((item) => {
          const meta = PERFORMANCE_DIMENSIONS.find((dimension) => dimension.id === item.dimension);
          return `${meta?.label ?? item.dimension}${item.score}分`;
        })
        .join('｜');
      const commentParts = [dimensionSummary];
      if (highlightLabels.length) commentParts.push(`亮点：${highlightLabels.join('、')}`);
      if (focusLabels.length) commentParts.push(`关注：${focusLabels.join('、')}`);
      if (entry.comment) commentParts.push(entry.comment);

      notes.push({
        id: noteId,
        studentId: student.id,
        rating: entry.stars,
        comments: commentParts.join(' / '),
        tags: highlightLabels,
      });
    });

    const record: SessionRecord = {
      ...session,
      attendance,
      speed: speedRows.map((row) => ({ ...row, id: generateId() })),
      freestyle: freestyle.map((item) => ({
        id: item.id,
        studentId: item.studentId,
        moveId: item.moveId,
        passed: item.passed,
        note: item.note,
      })),
      notes,
      performance: performanceEntries,
      closed: true,
      highlights: deriveHighlights(),
      consumeOverrides: overrides.length ? overrides : undefined,
      executedBlockIds: executedBlockIds.length ? executedBlockIds : undefined,
    };

    const previousBestMap = new Map<string, number>();
    await Promise.all(
      students.map(async (student) => {
        const history = await sessionsRepo.listClosedByStudent(student.id, session.id);
        const best = history.reduce((max, item) => {
          const candidate = item.speed
            .filter((row) => row.studentId === student.id && row.mode === 'single' && row.window === 30)
            .reduce((inner, row) => Math.max(inner, row.reps), 0);
          return Math.max(max, candidate);
        }, 0);
        previousBestMap.set(student.id, best);
      }),
    );

    await sessionsRepo.upsert(record);

    if (cyclePlan) {
      const targetSessionIds = record.cycleSessionIds && record.cycleSessionIds.length
        ? record.cycleSessionIds
        : record.missionCardIds ?? [];
      if (targetSessionIds.length) {
        await Promise.all(
          targetSessionIds.map((sessionId) =>
            trainingRepo.markSessionCompleted(cyclePlan.id, sessionId, record.date),
          ),
        );
      }
      const refreshedPlan = await trainingRepo.getActivePlan(classId);
      setCyclePlan(refreshedPlan ?? null);
    }

    await pointEventsRepo.removeBySession(record.id);
    const totals = new Map<string, number>();
    const pointEvents: PointEvent[] = [];

    const pushEvent = (
      studentId: string,
      type: PointEventType,
      points: number,
      reason?: string,
    ) => {
      const base = Math.floor(Math.max(points, 0));
      if (!base) return;
      const used = totals.get(studentId) ?? 0;
      const allowance = SESSION_POINT_CAP - used;
      if (allowance <= 0) return;
      const applied = Math.min(base, allowance);
      totals.set(studentId, used + applied);
      pointEvents.push({
        id: generateId(),
        studentId,
        sessionId: record.id,
        date: record.date,
        type,
        points: applied,
        reason,
      });
    };

    record.attendance.forEach((entry) => {
      if (entry.present) {
        pushEvent(entry.studentId, 'attendance', getPointValue('attendance'), '到课');
      }
    });

    const updatedStudents = new Map<string, Student>();

    await Promise.all(
      students.map(async (student) => {
        const prevBest = previousBestMap.get(student.id) ?? 0;
        const currentBest = record.speed
          .filter((row) => row.studentId === student.id && row.mode === 'single' && row.window === 30)
          .reduce((max, row) => Math.max(max, row.reps), prevBest);

        if (currentBest > prevBest) {
          const reason =
            prevBest > 0
              ? `30s单摇最佳 ${prevBest} -> ${currentBest}`
              : `30s单摇达到 ${currentBest}`;
          pushEvent(student.id, 'pr', getPointValue('pr'), reason);
        }

        const updated = { ...student };
        const before = updated.currentRank ?? 0;
        const after = maybeUpgradeRank(updated, currentBest);
        if (after > before) {
          await studentsRepo.upsert(updated);
          updatedStudents.set(student.id, updated);
        }
      }),
    );

    const sessionDate = new Date(record.date);
    const freestyleEnergyAwards: Array<Promise<void>> = [];

    record.freestyle
      .filter((item) => item.passed)
      .forEach((item) => {
        const meta = rankMoveLookup[item.moveId];
        const reward = getFreestyleReward(meta?.rank ?? 1);
        const reason = meta ? `通过花样 ${meta.name}` : '通过花样挑战';
        pushEvent(item.studentId, 'freestyle_pass', reward.points, reason);

        if (meta && reward.energy > 0) {
          freestyleEnergyAwards.push(
            AwardEngine.grantEnergy(
              item.studentId,
              reward.energy,
              'freestyle_pass',
              `freestyle:${record.id}:${item.moveId}`,
              {
                moveId: item.moveId,
                moveName: meta.name,
                rank: meta.rank,
                classId: record.classId,
              },
              sessionDate,
            ),
          );
        }
      });

    if (freestyleEnergyAwards.length) {
      await Promise.all(freestyleEnergyAwards);
    }

    record.performance?.forEach((entry) => {
      const highlightReasons = entry.presetIds
        .map((id) => PERFORMANCE_PRESET_LOOKUP[id])
        .filter((preset) => preset?.tone === 'highlight')
        .map((preset) => {
          const meta = PERFORMANCE_DIMENSIONS.find((dimension) => dimension.id === preset!.dimension);
          const prefix = meta ? `${meta.label}·` : '';
          return `${prefix}${preset!.label}`;
        });
      if (highlightReasons.length) {
        const reason = highlightReasons.join('、');
        pushEvent(entry.studentId, 'excellent', getPointValue('excellent'), reason);
      }
    });

    if (pointEvents.length) {
      await pointEventsRepo.bulkAdd(pointEvents);
    }

    if (updatedStudents.size) {
      setStudents((prev) => prev.map((stu) => updatedStudents.get(stu.id) ?? stu));
    }

    setSession(record);
    setPerformanceDrafts(() => {
      const map: Record<string, PerformanceDraft> = {};
      performanceEntries.forEach((entry) => {
        map[entry.studentId] = buildDraftFromEntry(entry);
      });
      students.forEach((student) => {
        if (!map[student.id]) {
          map[student.id] = createEmptyPerformanceDraft();
        }
      });
      return map;
    });
    setStatus('本次挑战已同步到成长册');

    setPreviousSpeedRecords(record.speed);

    const completionMap: Record<string, boolean> = {};
    missionBlockEntries.forEach((entry) => {
      completionMap[entry.key] = record.executedBlockIds?.includes(entry.key) ?? false;
    });
    setBlockCompletion(completionMap);

    const overrideMap: Record<string, number | undefined> = {};
    record.consumeOverrides?.forEach((item) => {
      overrideMap[item.studentId] = item.consume;
    });
    setConsumeOverrides(overrideMap);
  };

  const deriveHighlights = () => {
    const highlights: string[] = [];
    const prMap = speedRows.reduce<Record<string, number>>((map, row) => {
      map[row.studentId] = Math.max(map[row.studentId] ?? 0, row.reps);
      return map;
    }, {});
    Object.entries(prMap).forEach(([studentId, reps]) => {
      const student = students.find((item) => item.id === studentId);
      if (student) {
        highlights.push(`${student.name} 30s单摇刷新到 ${reps} 次`);
      }
    });
    freestyle
      .filter((item) => item.passed)
      .forEach((item) => {
        const student = students.find((stu) => stu.id === item.studentId);
        const move = rankMoveLookup[item.moveId];
        if (student && move) {
          highlights.push(`${student.name} 通过花样 ${move.name}`);
        }
      });
    Object.entries(performanceDrafts).forEach(([studentId, draft]) => {
      const student = students.find((item) => item.id === studentId);
      if (!student) return;
      draft.presetIds
        .map((id) => PERFORMANCE_PRESET_LOOKUP[id])
        .filter((preset) => preset?.tone === 'highlight')
        .forEach((preset) => {
          const meta = PERFORMANCE_DIMENSIONS.find((dimension) => dimension.id === preset!.dimension);
          const label = meta ? `${meta.label}·${preset!.label}` : preset!.label;
          highlights.push(`${student.name} ${label}`);
        });
    });
    return highlights.slice(0, 3);
  };
  const handleSpeedSubmit = (rows: SpeedRow[]) => {
    setSpeedRows((prev) => {
      const map = new Map(
        prev.map((row) => [`${row.studentId}-${row.mode}-${row.window}`, row]),
      );
      rows.forEach((row) => {
        map.set(`${row.studentId}-${row.mode}-${row.window}`, row);
      });
      return Array.from(map.values());
    });
  };


  const handleAttendanceEnergy = async () => {
    const presentStudentIds = attendance
      .filter((item) => item.present)
      .map((item) => item.studentId);
    if (!presentStudentIds.length) {
      window.alert('请先勾选出勤再结算能量');
      return;
    }
    setAwardingAttendance(true);
    let totalEnergy = 0;
    for (const studentId of presentStudentIds) {
      const { energy } = await AwardEngine.awardAttendance(studentId, classId);
      totalEnergy += energy;
      await refreshStudentEnergy(studentId);
    }
    setAwardingAttendance(false);
    setAttendanceAwarded(true);
    setToastMessage(`签到完成 +${totalEnergy} 能量`);
  };

  const handleReload = () => {
    setReloadToken((token) => token + 1);
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500 shadow">
        正在加载训练营数据…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-600 shadow">
          {loadError}
        </div>
        <button
          type="button"
          onClick={handleReload}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600"
        >
          重新加载训练营数据
        </button>
      </div>
    );
  }

  if (!classEntity) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500 shadow">
          未找到该训练营，可能已被删除或尚未初始化。
        </div>
        <button
          type="button"
          onClick={handleReload}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600"
        >
          刷新列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {classEntity?.name ?? "训练营作战台"}
          </h1>
          <p className="text-sm text-slate-500">
            主教练：{classEntity?.coachName} · 训练时间：
            {classEntity?.schedule ?? "未设置"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {classEntity && (
            <Link
              to={`/classes/${classEntity.id}/edit`}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              调整训练营
            </Link>
          )}
          <button
            type="button"
            onClick={startSession}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            开启本次挑战
          </button>
          <ExportPdfButton
            targetId="class-report"
            filename={`${classEntity?.name ?? "class"}-report.pdf`}
          />
        </div>
      </div>

  {status && (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      {status}
    </div>
  )}

  <section className="rounded-3xl bg-white/80 p-6 shadow-md backdrop-blur">
    {cyclePlan ? (


      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
              <span>当前周期</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {cyclePlan.durationWeeks} 周
              </span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900">{cyclePlan.cycleName}</h2>
            <p className="text-sm text-slate-500">{cyclePlan.goal}</p>


            <div className="flex flex-wrap gap-2">
              {(Array.isArray(cyclePlan.focusAbilities) ? cyclePlan.focusAbilities : []).map((ability) => {
                const quality = qualityLookup[ability];
                return (
                  <span
                    key={ability}
                    className="rounded-full border px-2 py-0.5 text-xs font-semibold"
                    style={{ borderColor: quality?.color ?? '#cbd5f5', color: quality?.color ?? '#475569' }}
                  >
                    {quality?.icon ?? '🏋️'} {quality?.name ?? ability.toUpperCase()}
                  </span>
                );
              })}
            </div>


          </div>
          <div className="w-full max-w-md space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs text-slate-500">当前周次</p>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedSession ? `第${selectedSession.week}周` : `第${cyclePlan.currentWeek}周`}
                </p>
                <p className="text-[11px] text-slate-400">计划日期：{selectedSession ? formatDate(selectedSession.plannedDate) : '未排期'}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-500">今日任务卡</p>
                <p className="text-sm font-semibold text-slate-800">{selectedMission?.name ?? '请选择任务卡'}</p>
                {selectedMission?.durationMin ? (
                  <p className="text-[11px] text-slate-400">建议时长 {selectedMission.durationMin} 分钟</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedMission?.focusAbilities?.map((ability) => {
                const quality = qualityLookup[ability];
                return (
                  <span
                    key={ability}
                    className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                    style={{ borderColor: quality?.color ?? '#cbd5f5', color: quality?.color ?? '#475569', borderWidth: 1 }}
                  >
                    {quality?.icon ?? '🏋️'} {quality?.name ?? ability.toUpperCase()}
                  </span>
                );
              })}
              {!selectedMission && (
                <span className="text-xs text-slate-400">选择任务卡后可查看主攻素质</span>
              )}
            </div>
            <label className="block text-xs text-slate-500">
              <span>切换本节任务</span>
              <select
                value={selectedSessionId ?? ''}
                onChange={(event) => setSelectedSessionId(event.target.value || null)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="">请选择任务卡</option>
                {missionChoices.map((choice, index) => (
                  <option key={`${choice.value}-${index}`} value={choice.value}>
                    {choice.label}
                    {choice.status === 'completed' ? ' · 已完成' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
              style={{ width: `${Math.round((cyclePlan.progress ?? 0) * 100)}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>周期进度 {Math.round((cyclePlan.progress ?? 0) * 100)}%</span>
            <button
              type="button"
              onClick={() => setShowMissionDetail((prev) => !prev)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-purple-300 hover:text-purple-600"
            >
              {showMissionDetail ? '收起任务卡详情' : '查看任务卡详情'}
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900">本节课训练安排</h3>
              <p className="mt-1 text-sm text-slate-500">聚焦当前课节的热身、速度、爆发力与游戏内容，滑动切换不同环节。</p>
            </div>
            {selectedSession ? (
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => previousSession && setSelectedSessionId(previousSession.id)}
                  disabled={!previousSession}
                  className="rounded-full border border-slate-200 px-4 py-1.5 font-semibold text-slate-500 transition hover:border-purple-300 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  上一节
                </button>
                <button
                  type="button"
                  onClick={() => nextSession && setSelectedSessionId(nextSession.id)}
                  disabled={!nextSession}
                  className="rounded-full border border-slate-200 px-4 py-1.5 font-semibold text-slate-500 transition hover:border-purple-300 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  下一节
                </button>
              </div>
            ) : null}
          </div>
          {currentSessionPlan ? (
            <div className="mt-6 space-y-6">
              {(template?.resolvedStage || template?.resolvedPlan) && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {template?.resolvedStage ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                      阶段：{template.resolvedStage.name}
                    </span>
                  ) : null}
                  {template?.resolvedPlan ? (
                    <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-600">
                      周期：{template.resolvedPlan.name} · {template.resolvedPlan.durationWeeks} 周
                    </span>
                  ) : null}
                </div>
              )}
                {template?.resolvedUnits?.length ? (
                  <div className="space-y-3">
                    {template.resolvedUnits.map((unit: TrainingUnit, index) => {
                      const blockList = Array.isArray(unit.blocks) ? unit.blocks : [];
                      const intensityLevels = compactUnique<IntensityLevel>(
                        blockList.map((block) => block.intensity as IntensityLevel | undefined),
                      );
                      const stimuli = compactUnique<StimulusType>(blockList.map((block) => block.stimulus));
                      const estimatedDuration =
                        blockList.reduce((total, block) => total + (block.durationMin ?? 0), 0) || unit.durationMin;

                      return (
                        <div
                          key={`${unit.id}-${index}`}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-700">
                                {index + 1}. {unit.name}
                              </div>
                              {unit.focus ? (
                                <p className="mt-1 text-xs text-slate-500">目标：{unit.focus}</p>
                              ) : null}
                              {unit.tags?.length ? (
                                <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-slate-400">
                                  {unit.tags.map((tag) => (
                                    <span key={tag} className="rounded-full bg-white/80 px-2 py-0.5">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                              {unit.period ? (
                                <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                                  周期：{PERIOD_LABEL[unit.period]}
                                </span>
                              ) : null}
                              {stimuli.map((stimulus) => (
                                <span
                                  key={`${unit.id}-stimulus-${stimulus}`}
                                  className="rounded-full bg-amber-50 px-3 py-1 text-amber-600"
                                >
                                  刺激：{STIMULUS_LABEL[stimulus]}
                                </span>
                              ))}
                              {intensityLevels.map((level) => (
                                <span
                                  key={`${unit.id}-intensity-${level}`}
                                  className={`rounded-full px-3 py-1 ${INTENSITY_META[level].bg}`}
                                >
                                  强度：{INTENSITY_META[level].label}
                                </span>
                              ))}
                              {estimatedDuration ? (
                                <span className="rounded-full bg-slate-200/70 px-3 py-1 text-slate-700">
                                  预计 {estimatedDuration} 分钟
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {unit.summary ? (
                            <p className="mt-2 text-xs text-slate-500">{unit.summary}</p>
                          ) : null}
                          {blockList.length ? (
                            <details className="mt-3 rounded-lg border border-slate-200 bg-white/80 p-3 text-xs text-slate-600">
                              <summary className="cursor-pointer select-none font-semibold text-slate-700">
                                查看 {blockList.length} 个环节拆解
                              </summary>
                              <div className="mt-2 space-y-2">
                                {blockList.map((block) => (
                                  <div key={block.id} className="rounded-md border border-slate-200 bg-white p-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="font-semibold text-slate-700">{block.title}</span>
                                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                                        {block.durationMin ? <span>{block.durationMin} 分钟</span> : null}
                                        {block.period ? <span>阶段：{PERIOD_LABEL[block.period]}</span> : null}
                                        {block.stimulus ? <span>刺激：{STIMULUS_LABEL[block.stimulus]}</span> : null}
                                        {block.intensity ? (
                                          <span className={INTENSITY_META[block.intensity].text}>
                                            强度：{INTENSITY_META[block.intensity].label}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                    {block.notes ? (
                                      <p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-500">{block.notes}</p>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            </details>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 sm:text-base">
                <span className="rounded-full bg-slate-100 px-4 py-1.5 font-semibold text-slate-700">
                  第{currentSessionPlan.week}周
                </span>
                <span className="rounded-full bg-slate-100 px-4 py-1.5">
                  计划日期：{formatDate(currentSessionPlan.plannedDate)}
                </span>
                <span
                  className={`rounded-full px-4 py-1.5 font-semibold ${
                    currentSessionPlan.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-sky-100 text-sky-600'
                  }`}
                >
                  {currentSessionPlan.status === 'completed' ? '已完成' : '待执行'}
                </span>
                {currentSessionPlan.totalDuration ? (
                  <span className="rounded-full bg-slate-100 px-4 py-1.5">
                    总时长约 {currentSessionPlan.totalDuration} 分钟
                  </span>
                ) : null}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-500">训练环节</h4>
                  <span className="text-xs text-slate-400">向左 / 向右滑动切换</span>
                </div>
                <div className="mt-3 overflow-x-auto pb-2">
                  <div className="flex gap-3 pb-1">
                    {currentSessionPlan.blocks.map((block, index) => {
                      const intensityMeta = block.intensity ? INTENSITY_META[block.intensity] : undefined;
                      const stimulusLabel = block.stimulus ? STIMULUS_LABEL[block.stimulus] : undefined;
                      const isActive = activeBlock?.key === block.key;
                      return (
                        <button
                          key={block.key}
                          type="button"
                          onClick={() => setActiveBlockKey(block.key)}
                          className={`min-w-[220px] rounded-2xl border px-4 py-3 text-left transition ${
                            isActive
                              ? 'border-purple-400 bg-purple-50 text-purple-700 shadow-md'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:text-purple-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg font-bold shadow-sm">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <div className="space-y-1">
                              <p className="text-lg font-semibold">{block.title}</p>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                {block.duration ? <span>时长 {block.duration} 分钟</span> : null}
                                {stimulusLabel ? (
                                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold">
                                    {stimulusLabel} 刺激
                                  </span>
                                ) : null}
                                {intensityMeta ? (
                                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${intensityMeta.bg}`}>
                                    {block.intensity} {intensityMeta.label}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {activeBlock ? (
                <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-white via-white to-purple-50 p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-purple-500">{currentSessionPlan.missionName}</p>
                      <h4 className="mt-1 text-2xl font-bold text-slate-900">{activeBlock.title}</h4>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        {activeBlock.duration ? <span>建议 {activeBlock.duration} 分钟</span> : null}
                        {activeStimulusLabel ? (
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {activeStimulusLabel} 刺激
                          </span>
                        ) : null}
                        {activeIntensityMeta ? (
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${activeIntensityMeta.bg}`}>
                            {activeBlock.intensity} {activeIntensityMeta.label}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {activeBlock.drills.length ? (
                      <div className="space-y-3">
                        <p className="text-base font-semibold text-slate-700">训练动作</p>
                        <ul className="space-y-4 text-slate-700">
                          {activeBlock.drills.map((drill) => (
                            <li key={drill.id} className="rounded-2xl bg-white/80 p-4 shadow-sm">
                              <p className="text-lg font-bold text-slate-900">
                                {drill.name}
                                <span className="ml-2 text-sm font-medium text-slate-500">
                                  {drill.durationMin} 分钟 · {INTENSITY_META[drill.intensity]?.label}
                                </span>
                              </p>
                              {drill.coachTips ? (
                                <p className="mt-2 text-sm text-purple-600">教练提示：{drill.coachTips}</p>
                              ) : null}
                              {drill.equipment?.length ? (
                                <p className="mt-2 text-sm text-slate-500">器材：{drill.equipment.join('、')}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {activeBlock.games.length ? (
                      <div className="space-y-3">
                        <p className="text-base font-semibold text-slate-700">游戏 / 对抗</p>
                        <ul className="space-y-4 text-slate-700">
                          {activeBlock.games.map((game) => (
                            <li key={game.id} className="rounded-2xl bg-white/80 p-4 shadow-sm">
                              <p className="text-lg font-bold text-slate-900">
                                {game.name}
                                <span className="ml-2 text-sm font-medium text-slate-500">
                                  {game.durationMin} 分钟 · {game.groupSize}
                                </span>
                              </p>
                              {game.goal ? (
                                <p className="mt-2 text-sm text-slate-600">目标：{game.goal}</p>
                              ) : null}
                              {game.rules ? (
                                <p className="mt-2 text-sm text-slate-600">玩法：{game.rules}</p>
                              ) : null}
                              {game.coachTips ? (
                                <p className="mt-2 text-sm text-purple-600">教练提示：{game.coachTips}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  {!activeBlock.drills.length && !activeBlock.games.length ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-purple-200 bg-white/80 p-6 text-center text-sm text-slate-500">
                      当前环节尚未配置训练内容。
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  请选择上方环节查看详细训练内容。
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-base text-slate-500">
              请选择任务卡后查看本节课训练安排。
            </div>
          )}
        </div>
      </div>
    ) : (
      <form onSubmit={handleAssignPlan} className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">创建班级周期计划</h2>
          <p className="text-sm text-slate-500">选择一套周期模板并设置开始日期，系统将自动生成任务卡课表与进度管理。</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="text-slate-600">选择模板</span>
            <select
              value={selectedTemplateId}
              onChange={(event) => setSelectedTemplateId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none"
            >
              {cycleTemplates.map((templateOption) => (
                <option key={templateOption.id} value={templateOption.id}>
                  {templateOption.name} · {templateOption.durationWeeks}周
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-slate-600">开始日期</span>
            <input
              type="date"
              value={planStartDate}
              onChange={(event) => setPlanStartDate(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none"
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {cycleTemplates.map((templateOption) => {
            const active = templateOption.id === selectedTemplateId;
            return (
              <button
                key={templateOption.id}
                type="button"
                onClick={() => setSelectedTemplateId(templateOption.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active ? 'border-purple-400 bg-purple-50 shadow-md' : 'border-slate-200 bg-white hover:border-purple-300'
                }`}
              >
                <p className="text-sm font-semibold text-slate-800">{templateOption.name}</p>
                <p className="mt-1 text-xs text-slate-500">{templateOption.goal}</p>
                <p className="mt-2 text-xs text-slate-400">周期 {templateOption.durationWeeks} 周</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(Array.isArray(templateOption.focusAbilities) ? templateOption.focusAbilities : []).map((ability) => {
                    const quality = qualityLookup[ability];
                    return (
                      <span
                        key={ability}
                        className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                        style={{ borderColor: quality?.color ?? '#cbd5f5', color: quality?.color ?? '#475569' }}
                      >
                        {quality?.icon ?? '🏋️'} {quality?.name ?? ability.toUpperCase()}
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={assigningPlan || !selectedTemplateId}
            className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-60"
          >
            {assigningPlan ? '生成中...' : '生成周期课表'}
          </button>
        </div>
      </form>
    )}
  </section>




  <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
    <div className="space-y-4">
      {session ? (
        puzzleBindings ? (
          <div className="space-y-4">
            <PuzzleGrid
              cards={puzzleCards}
              loading={puzzleLoading}
              title={puzzleTemplate?.name ?? '课堂主线谜题'}
              subtitle={puzzleSubtitle}
              onFlip={handleOpenPuzzleFlip}
            />
            {puzzleAssignments.length ? (
              <section className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/70 p-4 text-xs text-purple-700">
                <h3 className="text-sm font-semibold text-purple-700">翻牌指引</h3>
                <ul className="mt-2 space-y-1">
                  {puzzleAssignments.map((assignment) => (
                    <li key={assignment.key} className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-purple-800">{assignment.title}</span>
                      <span className="text-purple-400">→</span>
                      {assignment.allCards ? (
                        <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">默认顺序翻牌</span>
                      ) : assignment.cards.length ? (
                        assignment.cards.map((card) => (
                          <span
                            key={card.id}
                            className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-purple-700 shadow-sm"
                          >
                            {card.title}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">按顺序翻牌</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {puzzleBindings.hasMixedTemplates ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-600">
                当前课节绑定了多个谜题模板，系统默认使用 {puzzleBindings.templateId}。
              </div>
            ) : null}
          </div>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-sm text-slate-500">
            当前课节未绑定主线谜题，可在课程模板或任务卡中选择谜题后重新开启挑战。
          </section>
        )
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-sm text-slate-500">
          点击「开启本次挑战」后即可解锁主线谜题翻牌面板。
        </section>
      )}

      {showMissionDetail ? (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                任务卡详情 · {selectedMission?.name ?? template?.name ?? '未配置'}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedMission
                  ? `阶段：${selectedMission.phase} · 总时长 ${selectedMission.durationMin} 分钟`
                  : template
                  ? `周期：${template.period} · 建议周数：${template.weeks ?? '—'}`
                  : '暂无任务卡结构'}
              </p>
            </div>
          </div>
          {missionBlockEntries.length ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              详细的训练环节已在上方“本节课训练安排”中呈现，此处无需重复显示。
            </p>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-400">
              当前任务卡暂无结构信息
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-sm text-slate-500">
          点击「查看任务卡详情」后，可展开任务卡结构并执行评星结算。
        </section>
      )}
    </div>
    <EnergyBoard students={students} />
  </div>

      {session ? (
        <div className="grid gap-6 lg:grid-cols-2" id="class-report">
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">出勤 · 星级 · 课堂表现</h2>
                <p className="text-xs text-slate-500">
                  签到、评星与点评集中处理，自动沉淀到勇士档案与成长雷达。
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <label className="flex items-center gap-1">
                  <span>标准课时</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={session.lessonConsume ?? 1}
                    onChange={(event) =>
                      setSession((prev) =>
                        prev
                          ? {
                              ...prev,
                              lessonConsume: Number(event.target.value),
                            }
                          : prev,
                      )
                    }
                    className="w-16 rounded-md border border-slate-200 px-2 py-1"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleAttendanceEnergy}
                  disabled={awardingAttendance || attendanceAwarded}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {attendanceAwarded ? '已结算能量' : awardingAttendance ? '结算中…' : '签到能量结算'}
                </button>
              </div>
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.05fr,1.4fr]">
              <div className="space-y-4">
                <AttendanceGrid
                  students={students}
                  value={attendance}
                  onChange={setAttendance}
                  consumeOverrides={consumeOverrides}
                  lessonConsume={session?.lessonConsume ?? 1}
                  onOverrideChange={handleOverrideChange}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">勇士名单</p>
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {students.map((student) => {
                      const draft = performanceDrafts[student.id] ?? createEmptyPerformanceDraft();
                      const isActive = activePerformanceStudentId === student.id;
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => setActivePerformanceStudentId(student.id)}
                          className={`min-w-[140px] rounded-2xl border px-3 py-2 text-left text-sm transition ${
                            isActive
                              ? 'border-purple-400 bg-purple-50 text-purple-700 shadow'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:text-purple-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <StudentAvatar
                              name={student.name}
                              avatarUrl={student.avatarUrl}
                              avatarPresetId={student.avatarPresetId}
                              size="xs"
                              badge={student.currentRank ? `L${student.currentRank}` : undefined}
                            />
                            <div>
                              <p className="font-semibold">{student.name}</p>
                              <p className="text-xs text-slate-400">
                                {draft.stars} 星 · {draft.presetIds.length} 条点评
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {activePerformanceStudent && activePerformanceDraft ? (
                  <StudentPerformanceReview
                    student={activePerformanceStudent}
                    draft={activePerformanceDraft}
                    onStarsChange={(stars) => handlePerformanceStars(activePerformanceStudent.id, stars)}
                    onDimensionChange={(dimension, score) =>
                      handlePerformanceDimension(activePerformanceStudent.id, dimension, score)
                    }
                    onTogglePreset={(presetId) =>
                      handlePerformancePresetToggle(activePerformanceStudent.id, presetId)
                    }
                    onCommentChange={(comment) =>
                      handlePerformanceCommentChange(activePerformanceStudent.id, comment)
                    }
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-400">
                    请选择勇士，快速完成星级与多维点评。
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              閫熷害鎴愮哗
            </h2>
            <SpeedInput
              students={students}
              onSubmit={handleSpeedSubmit}
              previousRows={previousSpeedRecords.map(
                ({ studentId, window, mode, reps }) => ({
                  studentId,
                  window,
                  mode,
                  reps,
                }),
              )}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              鑺辨牱鎸戞垬
            </h2>
            <FreestyleEditor
              students={students}
              rankMoves={rankMoves}
              items={freestyle}
              onAdd={addFreestyle}
              onToggle={(id) =>
                setFreestyle((prev) =>
                  prev.map((item) =>
                    item.id === id ? { ...item, passed: !item.passed } : item,
                  ),
                )
              }
              onRemove={(id) =>
                setFreestyle((prev) => prev.filter((item) => item.id !== id))
              }
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">今日亮点卡</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              {deriveHighlights().map((item, index) => (
                <li key={index} className="rounded-lg bg-amber-50 px-3 py-2">
                  {item}
                </li>
              ))}
              {!deriveHighlights().length && (
                <li className="text-slate-400">结课后自动生成亮点</li>
              )}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">同步与导出</h2>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              结束挑战并同步
            </button>
          </section>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          点击「开启本次挑战」进入作战台。
        </div>
      )}

      <AnalyticsSection
        classId={classId}
        students={students}
        warriorNodes={warriorNodes}
        rankMoves={rankMoves}
        draftSpeedRows={speedRows}
        activeSession={session}
      />
      {pendingFlip && pendingFlipCard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-purple-400">FlipQuest</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">翻开「{pendingFlipCard.title}」</h3>
                <p className="mt-2 text-sm text-slate-500">
                  选择参与的勇士，能量将按人数自动平分。
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>类型：{pendingFlipCard.type.toUpperCase()}</span>
                  <span>预计奖励 ⚡ {pendingFlipCard.reward?.energy ?? 0}</span>
                  {pendingFlipCard.reward?.badge ? <span>徽章：{pendingFlipCard.reward.badge}</span> : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingFlip(null)}
                disabled={flippingCardId === pendingFlip.cardId}
                className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="关闭翻牌面板"
              >
                ✕
              </button>
            </div>
            <div className="mt-5 max-h-[320px] overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {students.map((student) => {
                  const checked = pendingFlip.participantIds.includes(student.id);
                  return (
                    <label
                      key={student.id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                        checked
                          ? 'border-purple-400 bg-purple-50 text-purple-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-purple-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-purple-500 focus:ring-purple-500"
                        checked={checked}
                        disabled={flippingCardId === pendingFlip.cardId}
                        onChange={() => toggleFlipParticipant(student.id)}
                      />
                      <StudentAvatar
                        name={student.name}
                        avatarUrl={student.avatarUrl}
                        avatarPresetId={student.avatarPresetId}
                        size="xs"
                        badge={student.currentRank ? `L${student.currentRank}` : undefined}
                      />
                      <span className="font-semibold">{student.name}</span>
                      <span className="ml-auto text-xs text-slate-400">⚡ {student.energy ?? 0}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>已选 {pendingFlip.participantIds.length} 人</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllFlipParticipants}
                  disabled={flippingCardId === pendingFlip.cardId}
                  className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:border-purple-300 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  全员到场
                </button>
                <button
                  type="button"
                  onClick={clearFlipParticipants}
                  disabled={flippingCardId === pendingFlip.cardId}
                  className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:border-purple-300 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  清空
                </button>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingFlip(null)}
                disabled={flippingCardId === pendingFlip.cardId}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-purple-300 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmFlip}
                disabled={flippingCardId === pendingFlip.cardId}
                className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-60"
              >
                {flippingCardId === pendingFlip.cardId ? '翻牌中…' : '翻开并结算'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <RewardToast
        open={Boolean(toastMessage)}
        message={toastMessage ?? ''}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}

interface FreestyleEditorProps {
  students: Student[];
  rankMoves: RankMove[];
  items: FreestyleDraft[];
  onAdd: (item: Omit<FreestyleDraft, "id">) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

function FreestyleEditor({
  students,
  rankMoves,
  items,
  onAdd,
  onToggle,
  onRemove,
}: FreestyleEditorProps) {
  const uniqueMoves = useMemo(() => {
    if (!rankMoves.length) return [];
    const sorted = [...rankMoves].sort((a, b) => {
      const rankDiff = (a.rank ?? 0) - (b.rank ?? 0);
      if (rankDiff) return rankDiff;
      const nameA = a.name ?? '';
      const nameB = b.name ?? '';
      return nameA.localeCompare(nameB, 'zh-Hans');
    });
    const map = new Map<string, RankMove>();
    sorted.forEach((move) => {
      const rank = move.rank ?? 0;
      const name = move.name?.trim() ?? '';
      const key = `${rank}|${name}`;
      const current = map.get(key);
      if (!current) {
        map.set(key, move);
        return;
      }
      const currentIsLibrary = typeof current.id === "string" && current.id.startsWith("move-");
      const candidateIsLibrary = typeof move.id === "string" && move.id.startsWith("move-");
      if (!currentIsLibrary && candidateIsLibrary) {
        map.set(key, move);
      }
    });
    return Array.from(map.values());
  }, [rankMoves]);

  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [moveId, setMoveId] = useState(uniqueMoves[0]?.id ?? "");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!studentId && students.length) setStudentId(students[0].id);
  }, [studentId, students]);
  useEffect(() => {
    if ((!moveId || uniqueMoves.every((move) => move.id !== moveId)) && uniqueMoves.length) {
      setMoveId(uniqueMoves[0].id);
    }
  }, [moveId, uniqueMoves]);

  const handleAdd = () => {
    if (!studentId || !moveId) return;
    onAdd({ studentId, moveId, passed: true, note });
    setNote("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">勇士</span>
          <select
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-slate-500">动作</span>
          <select
            value={moveId}
            onChange={(event) => setMoveId(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            {uniqueMoves.map((move) => (
              <option key={move.id} value={move.id}>
                L{move.rank ?? '-'} - {move.name ?? '未命名动作'}
              </option>
            ))}
          </select>
        </label>
        <label className="grid flex-1 gap-1">
          <span className="text-xs text-slate-500">备注</span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
            placeholder="通关细节或提醒"
          />
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          璁板綍
        </button>
      </div>
      <div className="space-y-2 text-sm">
        {items.map((item) => {
          const student = students.find((stu) => stu.id === item.studentId);
          const move = rankMoves.find((mv) => mv.id === item.moveId);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div>
                <p className="font-medium text-slate-700">
                  {student?.name} · {move?.name}
                </p>
                {item.note && (
                  <p className="text-xs text-slate-500">{item.note}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggle(item.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.passed
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {item.passed ? "通过" : "未过"}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="text-xs text-slate-400 hover:text-red-500"
                >
                  删除
                </button>
              </div>
            </div>
          );
        })}
        {!items.length && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-slate-400">
            暂无记录
          </div>
        )}
      </div>
    </div>
  );
}

interface StudentPerformanceReviewProps {
  student: Student;
  draft: PerformanceDraft;
  onStarsChange: (stars: number) => void;
  onDimensionChange: (dimension: PerformanceDimensionId, score: number) => void;
  onTogglePreset: (presetId: string) => void;
  onCommentChange: (comment: string) => void;
}

function StudentPerformanceReview({
  student,
  draft,
  onStarsChange,
  onDimensionChange,
  onTogglePreset,
  onCommentChange,
}: StudentPerformanceReviewProps) {
  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <StudentAvatar
            name={student.name}
            avatarUrl={student.avatarUrl}
            avatarPresetId={student.avatarPresetId}
            size="sm"
            badge={student.currentRank ? `L${student.currentRank}` : undefined}
          />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">当前勇士</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">{student.name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">

          
          

          {PERFORMANCE_SCORE_OPTIONS.map((score) => {
            const isActive = score <= draft.stars;
            return (
              <button
                key={score}
                type="button"
                aria-label={`${score} 星`}
                onClick={() => onStarsChange(score)}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-amber-400'
                }`}
              >
                <span aria-hidden="true">{isActive ? '★' : '☆'}</span>
              </button>
            );
          })}

          
          

        </div>
      </div>
      <div className="grid gap-4">
        {PERFORMANCE_DIMENSIONS.map((dimension) => {
          const score = draft.dimensionScores[dimension.id] ?? DEFAULT_PERFORMANCE_SCORE;
          const selectedPresetIds = draft.presetIds.filter(
            (presetId) => PERFORMANCE_PRESET_LOOKUP[presetId]?.dimension === dimension.id,
          );
          const highlightPresets = dimension.presets.filter((preset) => preset.tone === 'highlight');
          const focusPresets = dimension.presets.filter((preset) => preset.tone === 'focus');
          return (
            <div key={dimension.id} className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    {dimension.icon} {dimension.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{dimension.focusQuestion}</p>
                </div>
                <div className="flex gap-1">

                  
                  

                  {PERFORMANCE_SCORE_OPTIONS.map((option) => {
                    const isFilled = option <= score;
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-label={`${option} 星`}
                        onClick={() => onDimensionChange(dimension.id, option)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition ${
                          isFilled
                            ? 'bg-purple-500 text-white shadow'
                            : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-purple-400'
                        }`}
                      >
                        <span aria-hidden="true">{isFilled ? '★' : '☆'}</span>
                      </button>
                    );
                  })}

                  
                  

                </div>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                {highlightPresets.length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-emerald-500">亮点</span>
                    {highlightPresets.map((preset) => {
                      const active = selectedPresetIds.includes(preset.id);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => onTogglePreset(preset.id)}
                          className={`rounded-full px-3 py-1 font-semibold transition ${
                            active
                              ? 'bg-emerald-100 text-emerald-600 shadow'
                              : 'bg-slate-100 text-slate-500 hover:bg-emerald-50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                {focusPresets.length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-amber-500">关注</span>
                    {focusPresets.map((preset) => {
                      const active = selectedPresetIds.includes(preset.id);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => onTogglePreset(preset.id)}
                          className={`rounded-full px-3 py-1 font-semibold transition ${
                            active
                              ? 'bg-amber-100 text-amber-600 shadow'
                              : 'bg-slate-100 text-slate-500 hover:bg-amber-50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500">教练寄语</p>
        <textarea
          value={draft.comment}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder="记录今天的鼓励、提醒或下一次训练重点..."
          className="h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-inner"
        />
      </div>
    </div>
  );
}

interface AnalyticsSectionProps {
  classId: string;
  students: Student[];
  warriorNodes: WarriorPathNode[];
  rankMoves: RankMove[];
  draftSpeedRows: SpeedRow[];
  activeSession: SessionRecord | null;
}

function AnalyticsSection({
  classId,
  students,
  warriorNodes,
  rankMoves,
  draftSpeedRows,
  activeSession,
}: AnalyticsSectionProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [radars, setRadars] = useState<
    Record<string, ReturnType<typeof latestRadar>>
  >({});
  const [selectedWindow, setSelectedWindow] = useState<WindowSec>(30);
  const rankMoveLookup = useMemo(
    () =>
      Object.fromEntries(
        rankMoves.map((move) => [move.id, { rank: move.rank, name: move.name }]),
      ),
    [rankMoves],
  );

  const draftRowLookup = useMemo(() => {
    const map = new Map<string, SpeedRow>();
    draftSpeedRows.forEach((row) => {
      map.set(`${row.studentId}-${row.mode}-${row.window}`, row);
    });
    return map;
  }, [draftSpeedRows]);

  const includeDraft = Boolean(activeSession && !activeSession.closed && draftSpeedRows.length);
  const draftSessionDate = useMemo(() => {
    if (!activeSession) return null;
    return new Date(activeSession.date).toISOString();
  }, [activeSession]);

  const appendDraftPoint = useCallback(
    (
      series: Array<{ date: string; score: number }>,
      date: string,
      score: number,
    ) => {
      const iso = new Date(date).toISOString();
      const next = series.filter((point) => point.date !== iso);
      next.push({ date: iso, score });
      next.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return next;
    },
    [],
  );

  const windowOptions: WindowSec[] = [10, 20, 30, 60];

  const formatWindowLabel = (window: WindowSec) =>
    window === 60 ? '1分钟' : `${window}s`;

  useEffect(() => {
    async function load() {
      const [sessionList, radarMapEntries] = await Promise.all([
        sessionsRepo.listByClass(classId),
        Promise.all(
          students.map(async (student) => {
            const tests = await testsRepo.listResultsByStudent(student.id);
            return [student.id, latestRadar(tests)] as const;
          }),
        ),
      ]);
      setSessions(sessionList);
      setRadars(Object.fromEntries(radarMapEntries));
    }
    if (students.length) void load();
  }, [classId, students, activeSession?.id, activeSession?.closed]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">训练分析</h2>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 p-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>计时窗口</span>
          <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
            {windowOptions.map((window) => {
              const active = window === selectedWindow;
              return (
                <button
                  key={window}
                  type="button"
                  onClick={() => setSelectedWindow(window)}
                  className={`rounded-full px-3 py-1 font-medium transition ${
                    active ? 'bg-brand-500 text-white shadow' : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  {formatWindowLabel(window)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#2563eb]" /> 单摇
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#f97316]" /> 双摇
          </span>
          {includeDraft && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-600">
              已含今日实时成绩
            </span>
          )}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {students.map((student) => {
          const baseSingle = buildSpeedSeries(
            sessions,
            'single',
            selectedWindow,
            student.id,
          );
          const baseDouble = buildSpeedSeries(
            sessions,
            'double',
            selectedWindow,
            student.id,
          );
          const singleDraft = includeDraft
            ? draftRowLookup.get(`${student.id}-single-${selectedWindow}`)
            : undefined;
          const doubleDraft = includeDraft
            ? draftRowLookup.get(`${student.id}-double-${selectedWindow}`)
            : undefined;
          const singleSeries =
            includeDraft && singleDraft && draftSessionDate
              ? appendDraftPoint(baseSingle, draftSessionDate, singleDraft.reps)
              : baseSingle;
          const doubleSeries =
            includeDraft && doubleDraft && draftSessionDate
              ? appendDraftPoint(baseDouble, draftSessionDate, doubleDraft.reps)
              : baseDouble;
          const attendedSessions = sessions.filter((session) =>
            session.attendance.some((a) => a.studentId === student.id),
          );
          const freestyleSeries = buildFreestyleProgress(
            attendedSessions,
            warriorNodes,
            student.id,
            rankMoveLookup,
          );
          const rankSeries = buildRankTrajectory(
            attendedSessions,
            student.id,
            rankMoveLookup,
          );
          const speedRankSeries = buildSpeedRankTrajectory(
            attendedSessions,
            student.id,
          );
          return (
            <div
              key={student.id}
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {student.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    段位 L{student.currentRank ?? "-"}{" "}
                  </p>
                </div>
              </div>
              <ProgressChart
                title={`速度曲线 · ${formatWindowLabel(selectedWindow)}`}
                series={[
                  { label: '单摇', color: '#2563eb', data: singleSeries },
                  { label: '双摇', color: '#f97316', data: doubleSeries },
                ]}
              />
              <ProgressChart title="勇士进阶积分" series={freestyleSeries} />
              <ProgressChart
                title="技能成长曲线"
                series={[
                  { label: '速度段位', color: '#ec4899', data: speedRankSeries },
                  { label: '花样段位', color: '#f97316', data: rankSeries },
                ]}
                yDomain={[0, 9]}
                yTicks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
                allowDecimals={false}
                lineType="stepAfter"
              />
              <RadarChart data={radars[student.id] ?? undefined} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
