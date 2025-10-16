import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExportPdfButton } from '../../components/ExportPdfButton';
import { ProgressChart, type LineSeries } from '../../components/ProgressChart';
import { RadarChart } from '../../components/RadarChart';
import { PERFORMANCE_DIMENSIONS, PERFORMANCE_PRESET_LOOKUP } from '../../config/performance';
import { BadgeWall } from '../../components/BadgeWall';
import { AssessmentReportPanel } from '../../components/assessment/AssessmentReportPanel';
import { AssessmentReportModal } from '../../components/assessment/AssessmentReportModal';


import {
  LessonLedgerPanel,
  type LessonLedgerFormValues,
  type LessonSessionRecord,
} from '../../components/lesson/LessonLedgerPanel';

import { sessionsRepo } from '../../store/repositories/sessionsRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { testsRepo } from '../../store/repositories/testsRepo';
import { pointEventsRepo } from '../../store/repositories/pointEventsRepo';
import { db } from '../../store/db';
import { billingRepo } from '../../store/repositories/billingRepo';
import { retrospectivesRepo } from '../../store/repositories/retrospectivesRepo';
import { classesRepo } from '../../store/repositories/classesRepo';
import { squadsRepo } from '../../store/repositories/squadsRepo';
import { kudosRepo } from '../../store/repositories/kudosRepo';
import { lessonLedgerRepo } from '../../store/repositories/lessonLedgerRepo';
import {
  evalSpeedRank,
  buildSpeedSeries,
  buildSpeedRankTrajectory,
  buildRankTrajectory,
  normalizeByBenchmark,
} from '../../utils/calc';
import { buildPointsSnapshot } from '../../utils/points';
import { calculateLevel } from '../../config/gamify';
import { recommendMissionsFor } from '../../gamify/aiRecommender';
import { resolveMissionTypeFromBlock } from '../../utils/mission';
import { GrowthProjectionPanel } from '../../components/GrowthProjectionPanel';
import { evaluateGrowthProjection } from '../../utils/growthProjection';


import { StudentAvatar } from '../../components/StudentAvatar';
import { generateId } from '../../store/repositories/utils';

import type {
  FitnessQuality,
  LessonWallet,
  LessonLedgerEntry,
  PointEvent,
  SessionRecord,
  Student,
  WarriorPathNode,
  RankMove,
  SessionReview,
  ClassEntity,
  PerformanceDimensionId,
  SessionPerformanceEntry,
  WindowSec,
  FitnessTestResult,
} from '../../types';

import type {
  Badge,
  Kudos,
  MissionProgress,
  RecommendedMission,
  Squad,
  EnergyLog,
  EnergySource,
} from '../../types.gamify';
import { calculateWarriorAssessmentReport, type WarriorAssessmentReport } from '../../utils/warriorAssessment';
import {
  buildHeightPercentileCurve,
  calculateAgeInYears,
  estimateHeightPercentile,
  getHeightPercentilesForAge,
} from '../../utils/height';


interface RadarView {
  normalized: Record<FitnessQuality, number>;
  reference?: Record<FitnessQuality, number>;
}

interface SquadEnergySummary {
  total: number;
  weekly: number;
}

function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

const missionTypeIcon: Record<string, string> = {
  speed: '⚡',
  strength: '💪',
  stamina: '🔋',
  coordination: '🎯',
};

const SPEED_WINDOWS: WindowSec[] = [10, 20, 30, 60];

type SpeedSeriesBundle = {
  single: Array<{ date: string; score: number }>;
  double: Array<{ date: string; score: number }>;
};

type ChartSeries = {
  label: string;
  color: string;
  data: Array<{ date: string; score: number }>;
};

type HeightRecord = {
  date: string;
  height: number;
  ageYears: number | null;
};

export function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const studentId = params.id!;
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [wallet, setWallet] = useState<LessonWallet | null>(null);
  const [lessonLedger, setLessonLedger] = useState<LessonLedgerEntry[]>([]);
  const [nodes, setNodes] = useState<WarriorPathNode[]>([]);
  const [rankMoves, setRankMoves] = useState<RankMove[]>([]);
  const [radarView, setRadarView] = useState<RadarView | null>(null);
  const [pointEvents, setPointEvents] = useState<PointEvent[]>([]);
  const [pointsSummary, setPointsSummary] = useState(() => buildPointsSnapshot([]));
  const [missionHistory, setMissionHistory] = useState<MissionProgress[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedMission[]>([]);
  const [missionCatalog, setMissionCatalog] = useState<Record<string, { name: string; type: string }>>({});
  const [templateLookup, setTemplateLookup] = useState<Record<string, string>>({});
  const [studentRetrospectives, setStudentRetrospectives] = useState<SessionReview[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [studentKudos, setStudentKudos] = useState<Kudos[]>([]);
  const [squadMemberships, setSquadMemberships] = useState<Squad[]>([]);
  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>([]);
  const [squadEnergy, setSquadEnergy] = useState<SquadEnergySummary>({ total: 0, weekly: 0 });
  const [assessmentReport, setAssessmentReport] = useState<WarriorAssessmentReport | null>(null);
  const [fitnessTests, setFitnessTests] = useState<FitnessTestResult[]>([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState<WindowSec>(30);
  const energy = student?.energy ?? 0;

  useEffect(() => {
    async function load() {
      const [
        stu,
        sessionList,
        walletInfo,
        ledgerList,
        nodesData,
        moves,
        items,
        tests,
        events,
        missionProgressList,
        badgeList,
        templateList,
        retrospectivesList,
        kudosList,
        squadList,
        energyLogList,
        studentList,
        classList,
      ] = await Promise.all([
        studentsRepo.get(studentId),
        sessionsRepo.listByStudent(studentId),
        billingRepo.calcWallet(studentId),
        lessonLedgerRepo.listByStudent(studentId),
        db.warriorNodes.toArray(),
        db.rankMoves.toArray(),
        db.fitnessTestItems.toArray(),
        testsRepo.listResultsByStudent(studentId),
        pointEventsRepo.listByStudent(studentId),
        db.missionsProgress.where('studentId').equals(studentId).toArray(),
        db.badges.where('studentId').equals(studentId).toArray(),
        db.templates.toArray(),
        retrospectivesRepo.listForStudent(studentId),
        kudosRepo.listByStudent(studentId),
        squadsRepo.listForStudent(studentId),
        db.energyLogs.where('studentId').equals(studentId).toArray(),
        studentsRepo.list(),
        classesRepo.list(),
      ]);

      setStudent(stu ?? null);
      setSessions(sessionList);
      setWallet(walletInfo);
      setLessonLedger(
        [...ledgerList].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );
      setNodes(nodesData);
      setRankMoves(moves);
      setPointEvents(events);
      setPointsSummary(buildPointsSnapshot(events));
      setMissionHistory(
        [...missionProgressList].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );
      setBadges(
        [...badgeList].sort(
          (a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime(),
        ),
      );
      setRecommendations(await recommendMissionsFor(studentId));
      setMissionCatalog(
        Object.fromEntries(
          templateList.map((template) => [
            template.id,
            {
              name: template.name,
              type: template.blocks.length
                ? resolveMissionTypeFromBlock(template.blocks[0])
                : 'coordination',
            },
          ]),
        ),
      );
      setTemplateLookup(Object.fromEntries(templateList.map((template) => [template.id, template.name])));
      setStudentRetrospectives(retrospectivesList);
      setStudentKudos(kudosList);
      setSquadMemberships(squadList);
      setEnergyLogs(
        [...energyLogList].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
      );
      setAllStudents(studentList);
      setClasses(classList);
      const squadEnergyLogs = energyLogList.filter(
        (log) => log.source === 'squad_milestone' || log.source === 'squad_completion',
      );
      const energyLogs = squadEnergyLogs.filter((log) => log.studentId === studentId);
      const weeklyCutoff = daysAgoIso(7);
      const totalEnergy = energyLogs.reduce((sum, log) => sum + log.delta, 0);
      const weeklyEnergy = energyLogs.reduce(
        (sum, log) => (log.createdAt >= weeklyCutoff ? sum + log.delta : sum),
        0,
      );
      setSquadEnergy({ total: totalEnergy, weekly: weeklyEnergy });

      const sortedResults = [...tests].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setFitnessTests(sortedResults);
      const latest = sortedResults[0];
      if (stu && latest) {
        setAssessmentReport(
          calculateWarriorAssessmentReport({
            student: stu,
            result: latest,
            sessions: sessionList,
            rankMoves: moves,
          }),
        );
      } else {
        setAssessmentReport(null);
      }

      if (latest && stu?.birth) {
        const age = Math.max(
          4,
          Math.floor((Date.now() - new Date(stu.birth).getTime()) / (365 * 24 * 3600 * 1000)),
        );
        const normalized: Record<FitnessQuality, number> = {} as any;
        const reference: Record<FitnessQuality, number> = {} as any;
        latest.items.forEach((entry) => {
          const item = items.find((testItem) => testItem.id === entry.itemId);
          if (!item) return;
          const { score, ref } = normalizeByBenchmark(entry.value, item.quality, age, item.unit);
          normalized[item.quality] = Math.round(score);
          if (ref?.p50 !== undefined) {
            const refScore = normalizeByBenchmark(ref.p50, item.quality, age, item.unit).score;
            reference[item.quality] = Math.round(refScore);
          }
        });
        setRadarView({ normalized, reference: Object.keys(reference).length ? reference : undefined });
      } else {
        setRadarView(null);
      }
    }
    void load();
  }, [studentId]);

  const refreshLedgerAndWallet = useCallback(async () => {
    const [ledgerList, walletInfo] = await Promise.all([
      lessonLedgerRepo.listByStudent(studentId),
      billingRepo.calcWallet(studentId),
    ]);
    setLessonLedger(
      [...ledgerList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    );
    setWallet(walletInfo);
  }, [studentId]);


  
  const normalizeLedgerForm = useCallback((values: LessonLedgerFormValues) => {
    const parsed = Number(values.lessons);
    return {
      date: values.date || new Date().toISOString().slice(0, 10),
      type: values.type,
      lessons: Number.isNaN(parsed) ? 0 : Number(parsed.toFixed(2)),
      summary: values.summary?.trim() ? values.summary.trim() : undefined,
    };
  }, []);

  const handleCreateLedger = useCallback(
    async (values: LessonLedgerFormValues) => {
      const normalized = normalizeLedgerForm(values);
      const now = new Date().toISOString();
      const record: LessonLedgerEntry = {
        id: generateId(),
        studentId,
        ...normalized,

        createdAt: now,
        updatedAt: now,
      };
      await lessonLedgerRepo.upsert(record);
      await refreshLedgerAndWallet();
    },

    
    [normalizeLedgerForm, studentId, refreshLedgerAndWallet],

  );

  const handleUpdateLedger = useCallback(
    async (id: string, values: LessonLedgerFormValues) => {

      
      const normalized = normalizeLedgerForm(values);
      const existing = lessonLedger.find((entry) => entry.id === id);
      const now = new Date().toISOString();
      const record: LessonLedgerEntry = {
        id,
        studentId,
        ...normalized,

        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      await lessonLedgerRepo.upsert(record);
      await refreshLedgerAndWallet();
    },

    
    [lessonLedger, normalizeLedgerForm, studentId, refreshLedgerAndWallet],

  );

  const handleDeleteLedger = useCallback(
    async (id: string) => {
      await lessonLedgerRepo.remove(id);
      await refreshLedgerAndWallet();
    },
    [refreshLedgerAndWallet],
  );


  
  const handleImportLedger = useCallback(
    async (rows: LessonLedgerFormValues[]) => {
      const base = Date.now();
      const records: LessonLedgerEntry[] = rows.map((row, index) => {
        const normalized = normalizeLedgerForm(row);
        const timestamp = new Date(base + index).toISOString();
        return {
          id: generateId(),
          studentId,
          ...normalized,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
      });
      await Promise.all(records.map((record) => lessonLedgerRepo.upsert(record)));
      await refreshLedgerAndWallet();
    },
    [normalizeLedgerForm, studentId, refreshLedgerAndWallet],
  );


  const classLookup = useMemo(
    () => Object.fromEntries(classes.map((item) => [item.id, item.name])),
    [classes],
  );

  const studentNameLookup = useMemo(
    () => Object.fromEntries(allStudents.map((item) => [item.id, item.name])),
    [allStudents],
  );

  const lessonSessionRows = useMemo<LessonSessionRecord[]>(() => {
    return sessions
      .map((session) => {
        const attendance = session.attendance.find((item) => item.studentId === studentId);
        const override = session.consumeOverrides?.find((item) => item.studentId === studentId);
        const present = attendance?.present ?? false;
        const baseConsume = session.lessonConsume ?? 1;
        const consumeAmount = override?.consume ?? (present ? baseConsume : 0);
        if (!session.closed || !consumeAmount) {
          return null;
        }
        const className = classLookup[session.classId] ?? '课堂挑战';
        const templateName = session.templateId ? templateLookup[session.templateId] : undefined;
        const summaryParts = [className];
        if (templateName) {
          summaryParts.push(`任务卡：${templateName}`);
        }
        const speedRecord = [...session.speed]
          .filter((record) => record.studentId === studentId)
          .sort((a, b) => b.reps - a.reps)[0];
        const speedHighlight = speedRecord
          ? `${speedRecord.window}s ${speedRecord.mode === 'single' ? '单摇' : '双摇'} ${speedRecord.reps}`
          : undefined;
        const coachNote = session.notes.find((note) => note.studentId === studentId)?.comments?.trim();
        const detailParts: string[] = [];
        if (speedHighlight) {
          detailParts.push(`速度亮点 ${speedHighlight}`);
        }
        if (coachNote) {
          detailParts.push(`教练鼓励：${coachNote}`);
        }
        return {
          id: `session-${session.id}`,
          date: session.date.slice(0, 10),
          lessons: -Math.abs(Number(consumeAmount.toFixed(2))),
          summary: summaryParts.join(' · ') || className,
          detail: detailParts.join('；'),
          sourceLabel: '课堂挑战',
          createdAt: session.date,
        } satisfies LessonSessionRecord;
      })
      .filter((item): item is LessonSessionRecord => Boolean(item))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, studentId, classLookup, templateLookup]);

  const speedSeriesByWindow = useMemo<Record<WindowSec, SpeedSeriesBundle>>(
    () => {
      return SPEED_WINDOWS.reduce((acc, window) => {
        acc[window] = {
          single: buildSpeedSeries(sessions, 'single', window, studentId),
          double: buildSpeedSeries(sessions, 'double', window, studentId),
        };
        return acc;
      }, {} as Record<WindowSec, SpeedSeriesBundle>);
    },
    [sessions, studentId],
  );
  const speedSeriesSingle = speedSeriesByWindow[selectedWindow]?.single ?? [];
  const speedSeriesDouble = speedSeriesByWindow[selectedWindow]?.double ?? [];
  const speedSeriesSingle30 = speedSeriesByWindow[30]?.single ?? [];
  const rankMoveLookup = useMemo(
    () =>
      Object.fromEntries(
        rankMoves.map((move) => [move.id, { rank: move.rank, name: move.name }]),
      ),
    [rankMoves],
  );
  const freestyleRankSeries = useMemo(
    () => buildRankTrajectory(sessions, studentId, rankMoveLookup),
    [sessions, studentId, rankMoveLookup],
  );
  const speedRankSeries = useMemo(
    () => buildSpeedRankTrajectory(sessions, studentId),
    [sessions, studentId],
  );

  
  const speedChartSeries = useMemo<ChartSeries[]>(
    () => [
      { label: '单摇', color: '#2563eb', data: speedSeriesSingle },
      { label: '双摇', color: '#f97316', data: speedSeriesDouble },
    ],
    [speedSeriesSingle, speedSeriesDouble],
  );
  const skillGrowthSeries = useMemo<ChartSeries[]>(
    () =>
      [
        { label: '速度段位', color: '#ec4899', data: speedRankSeries },
        { label: '花样段位', color: '#f97316', data: freestyleRankSeries },
      ].filter((line) => line.data.length > 0),
    [speedRankSeries, freestyleRankSeries],
  );
  const pointsCurve = useMemo(
    () => pointsSummary.series.map((row) => ({ date: row.date, score: row.total })),
    [pointsSummary.series],
  );
  const sortedEnergyLogs = useMemo(
    () =>
      [...energyLogs].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [energyLogs],
  );
  const { energyCurve, initialEnergyBalance } = useMemo(() => {
    if (!sortedEnergyLogs.length) {
      return {
        energyCurve: energy
          ? [{ date: new Date().toISOString(), score: Math.max(0, energy) }]
          : [],
        initialEnergyBalance: Math.max(0, energy),
      };
    }

    const reversed: Array<{ date: string; score: number }> = [];
    let balance = Math.max(0, energy);
    for (let i = sortedEnergyLogs.length - 1; i >= 0; i -= 1) {
      const log = sortedEnergyLogs[i];
      reversed.push({ date: log.createdAt, score: balance });
      const previous = balance - log.delta;
      balance = previous < 0 ? 0 : previous;
    }

    const firstLog = sortedEnergyLogs[0];
    const firstDate = new Date(firstLog.createdAt);
    const baselinePoint = {
      date: new Date(firstDate.getTime() - 1000).toISOString(),
      score: Math.max(0, balance),
    };

    const energyCurve = [...reversed, baselinePoint].reverse();

    return {
      energyCurve,
      initialEnergyBalance: Math.max(0, balance),
    };
  }, [sortedEnergyLogs, energy]);

  const energyBreakdown = useMemo(
    () =>
      sortedEnergyLogs.reduce(
        (acc, log) => {
          acc[log.source] = (acc[log.source] ?? 0) + log.delta;
          return acc;
        },
        {} as Partial<Record<EnergySource, number>>,
      ),
    [sortedEnergyLogs],
  );
  const energyBreakdownEntries = useMemo(() => {
    const entries = (Object.entries(energyBreakdown) as Array<[EnergySource, number]>)
      .filter(([, value]) => value !== undefined && value !== 0)
      .map(([source, value]) => ({
        key: source,
        label: labelForEnergySource(source),
        value,
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    if (initialEnergyBalance > 0) {
      entries.unshift({ key: 'initial', label: '历史留存', value: initialEnergyBalance });
    }

    return entries;
  }, [energyBreakdown, initialEnergyBalance]);
  const recentEnergyLogs = useMemo(
    () => [...sortedEnergyLogs].reverse().slice(0, 10),
    [sortedEnergyLogs],
  );
  const pointsSeries = useMemo<ChartSeries[]>(
    () =>
      pointsCurve.length
        ? [{ label: '勇士积分', color: '#6366f1', data: pointsCurve }]
        : [],
    [pointsCurve],
  );
  const energySeries = useMemo<ChartSeries[]>(
    () =>
      energyCurve.length
        ? [{ label: '成长能量', color: '#fbbf24', data: energyCurve }]
        : [],
    [energyCurve],
  );


  const birthIso = student?.birth ?? null;
  const gender = student?.gender ?? null;
  const heightRecords = useMemo<HeightRecord[]>(() => {
    return fitnessTests
      .map((result) => {
        const heightItem = result.items.find((item) => item.itemId === 'height');
        if (!heightItem) return null;
        const measurement = new Date(result.date);
        if (Number.isNaN(measurement.getTime())) return null;
        const isoDate = measurement.toISOString();
        const ageYears = birthIso ? calculateAgeInYears(birthIso, isoDate) : null;
        return {
          date: isoDate,
          height: Number(heightItem.value),
          ageYears,
        } satisfies HeightRecord;
      })
      .filter((item): item is HeightRecord => Boolean(item))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [fitnessTests, birthIso]);

  const heightPercentileCurves = useMemo(() => {
    if (!birthIso || !gender) return null;
    const ages = heightRecords
      .map((record) => record.ageYears)
      .filter((age): age is number => age !== null);
    if (!ages.length) return null;
    const minAge = Math.max(Math.min(...ages) - 0.5, 0);
    const maxAge = Math.max(...ages) + 0.5;
    return buildHeightPercentileCurve(gender, birthIso, minAge, maxAge);
  }, [birthIso, gender, heightRecords]);

  const heightChartSeries = useMemo<LineSeries[]>(() => {
    if (!heightRecords.length) return [];
    const lines: LineSeries[] = [
      {
        label: '学员身高',
        color: '#2563eb',
        data: heightRecords.map((record) => ({
          date: record.date,
          score: Math.round(record.height * 10) / 10,
        })),
      },
    ];
    if (heightPercentileCurves?.length) {
      const colorMap = { p3: '#f59e0b', p50: '#10b981', p97: '#ec4899' } as const;
      (['p3', 'p50', 'p97'] as const).forEach((key) => {
        lines.push({
          label: `${key.toUpperCase()} 百分位`,
          color: colorMap[key],
          data: heightPercentileCurves.map((row) => ({
            date: row.date,
            score: Math.round(row[key] * 10) / 10,
          })),
        });
      });
    }
    return lines;
  }, [heightRecords, heightPercentileCurves]);

  const heightRange = useMemo(() => {
    if (!heightRecords.length && !heightPercentileCurves?.length) return null;
    const values = [
      ...heightRecords.map((record) => record.height),
      ...(heightPercentileCurves?.flatMap((row) => [row.p3, row.p50, row.p97]) ?? []),
    ];
    if (!values.length) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return {
      min: Math.floor(min - 2),
      max: Math.ceil(max + 2),
    };
  }, [heightRecords, heightPercentileCurves]);

  const heightInsight = useMemo(() => {
    if (!birthIso || !gender || !heightRecords.length) return null;
    const latest = heightRecords[heightRecords.length - 1];
    if (latest.ageYears === null) return null;
    const percentiles = getHeightPercentilesForAge(gender, latest.ageYears);
    if (!percentiles) return null;
    const percentileRank = estimateHeightPercentile(gender, latest.ageYears, latest.height);
    if (percentileRank === null) return null;
    let years = Math.max(0, Math.floor(latest.ageYears));
    let months = Math.max(0, Math.round((latest.ageYears - years) * 12));
    if (months === 12) {
      years += 1;
      months = 0;
    }
    const ageLabel = months ? `${years} 岁 ${months} 个月` : `${years} 岁`;
    const classification = percentileRank < 10 ? '偏矮' : percentileRank > 90 ? '偏高' : '标准范围';
    return {
      latest,
      percentileRank,
      deltaFromMedian: latest.height - percentiles.p50,
      percentiles,
      ageLabel,
      classification,
    };
  }, [birthIso, gender, heightRecords]);
  const ageLabel = useMemo(() => {
    if (!student?.birth) return '—';
    const birth = new Date(student.birth);
    if (Number.isNaN(birth.getTime())) return '—';
    const years = Math.max(
      0,
      Math.floor((Date.now() - birth.getTime()) / (365 * 24 * 3600 * 1000)),
    );
    return `${years} 岁`;
  }, [student]);
  const joinDateLabel = useMemo(() => {
    if (!student?.joinDate) return '—';
    const date = new Date(student.joinDate);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('zh-CN');
  }, [student]);
  const guardianLabel = student?.guardian?.name ?? '—';
  const guardianPhone = student?.guardian?.phone ?? '—';
  const genderLabel = student?.gender === 'M' ? '男' : student?.gender === 'F' ? '女' : '—';


  const passesByRank = useMemo(() => {
    const map = new Map<number, Set<string>>();
    sessions.forEach((session) => {
      session.freestyle
        .filter((record) => record.studentId === studentId && record.passed)
        .forEach((record) => {
          const meta = rankMoves.find((move) => move.id === record.moveId);
          if (!meta) return;
          const set = map.get(meta.rank) ?? new Set<string>();
          set.add(meta.name);
          map.set(meta.rank, set);
        });
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([rank, set]) => ({ rank, moves: Array.from(set).sort() }));
  }, [sessions, rankMoves, studentId]);

  const performanceHistory = useMemo(() => {
    const rows: Array<{ date: string; entry: SessionPerformanceEntry }> = [];
    sessions.forEach((session) => {
      (session.performance ?? [])
        .filter((entry) => entry.studentId === studentId)
        .forEach((entry) => {
          rows.push({ date: session.date, entry });
        });
    });
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, studentId]);

  const performanceRadar = useMemo(() => {
    if (!performanceHistory.length) return null;
    const totals: Partial<Record<PerformanceDimensionId, { total: number; count: number }>> = {};
    performanceHistory.forEach(({ entry }) => {
      entry.dimensions.forEach(({ dimension, score }) => {
        const bucket = totals[dimension] ?? { total: 0, count: 0 };
        bucket.total += score;
        bucket.count += 1;
        totals[dimension] = bucket;
      });
    });
    const radar: Record<string, number> = {};
    PERFORMANCE_DIMENSIONS.forEach((dimension) => {
      const bucket = totals[dimension.id];
      if (bucket && bucket.count) {
        radar[dimension.label] = Math.round((bucket.total / bucket.count / 5) * 100);
      }
    });
    return Object.keys(radar).length ? radar : null;
  }, [performanceHistory]);

  const recentPerformanceHistory = useMemo(
    () => performanceHistory.slice(0, 3),
    [performanceHistory],
  );

  const bestSingle30 = useMemo(
    () => speedSeriesSingle30.reduce((max, row) => Math.max(max, row.score), 0),
    [speedSeriesSingle30],
  );
  const speedRank = useMemo(() => evalSpeedRank(bestSingle30), [bestSingle30]);

  const lastEvents = useMemo(() => pointEvents.slice(-10).reverse(), [pointEvents]);
  const monthIncrease = useMemo(() => {
    if (!pointsSummary.series.length) return 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return pointsSummary.series
      .filter((row) => new Date(row.date) >= cutoff)
      .reduce((sum, row) => sum + row.delta, 0);
  }, [pointsSummary.series]);
  const levelInfo = useMemo(() => calculateLevel(energy), [energy]);
  const growthProjection = useMemo(
    () => evaluateGrowthProjection(pointsSummary.total, energy),
    [pointsSummary.total, energy],
  );
  const missionEntries = useMemo(
    () => missionHistory.filter((item) => item.missionId !== 'attendance'),
    [missionHistory],
  );
  const recentMissions = useMemo(() => missionEntries.slice(0, 5), [missionEntries]);
  const totalMissionStars = useMemo(
    () => missionEntries.reduce((sum, item) => sum + (item.stars ?? 0), 0),
    [missionEntries],
  );
  const totalMissionEnergy = useMemo(
    () => missionEntries.reduce((sum, item) => sum + (item.energy ?? 0), 0),
    [missionEntries],
  );




  const pendingFollowUps = useMemo(
    () =>
      studentRetrospectives.flatMap((review) =>
        review.nextActions
          .filter(
            (action) =>
              action.owner === 'student' &&
              action.studentId === studentId &&
              action.status !== 'done',
          )
          .map((action) => ({ review, action })),
      ),
    [studentRetrospectives, studentId],
  );

  const recentHighlights = useMemo(
    () =>
      studentRetrospectives
        .flatMap((review) =>
          review.studentHighlights
            .filter((highlight) => highlight.studentId === studentId)
            .map((highlight) => ({ review, highlight })),
        )
        .slice(0, 4),
    [studentRetrospectives, studentId],
  );



  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <StudentAvatar
            name={student?.name ?? '勇士'}
            avatarUrl={student?.avatarUrl}
            avatarPresetId={student?.avatarPresetId}
            size="lg"
            badge={student?.currentRank ? `L${student.currentRank}` : undefined}
          />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{student?.name ?? '勇士成长档案'}</h1>
            <p className="text-sm text-slate-500">
              段位 L{student?.currentRank ?? '-'} · 成长能量 ⚡{energy} · 课时余额 {wallet?.remaining ?? 0}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/students/${studentId}/edit`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            编辑勇士
          </Link>
          <ExportPdfButton targetId="student-report" filename={`${student?.name ?? 'student'}-report.pdf`} />
        </div>
      </div>

      <GrowthProjectionPanel projection={growthProjection} />

      <section className="grid gap-4 xl:grid-cols-[2.3fr,1.7fr]">
        <div className="space-y-4">
          <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">基础档案</h2>
              <p className="text-xs text-slate-500">训练基本信息与家长关心的重点</p>
            </div>
            {student?.tags?.length ? (
              <div className="flex flex-wrap items-center gap-2">
                {student.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="当前速度段位" value={speedRank ? `L${speedRank}` : '未入段'} />
            <StatCard
              label="30s 单摇 best"
              value={bestSingle30 ? `${bestSingle30} 次` : '暂无成绩'}
            />
            <StatCard label="勇士进阶积分" value={`${pointsSummary.total} 分`} />
            <StatCard
              label="近30天积分"
              value={`${monthIncrease >= 0 ? '+' : ''}${monthIncrease} 分`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <InfoItem label="年龄" value={ageLabel} />
            <InfoItem label="性别" value={genderLabel} />
            <InfoItem label="入营时间" value={joinDateLabel} />
            <InfoItem label="监护人" value={guardianLabel} />
            <InfoItem label="联系方式" value={guardianPhone} />
            <InfoItem label="课时余额" value={`${wallet?.remaining ?? 0} 课时`} />
          </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">身高成长曲线</h2>
                <p className="text-xs text-slate-500">参照国家学生体质健康标准百分位</p>
              </div>
              {heightInsight ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    heightInsight.classification === '偏矮'
                      ? 'bg-rose-50 text-rose-600'
                      : heightInsight.classification === '偏高'
                        ? 'bg-sky-50 text-sky-600'
                        : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  P{heightInsight.percentileRank} · {heightInsight.classification}
                </span>
              ) : heightRecords.length ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  待完善资料
                </span>
              ) : null}
            </div>
            <ProgressChart
              series={heightChartSeries.length ? heightChartSeries : []}
              yDomain={heightRange ? [heightRange.min, heightRange.max] : undefined}
              allowDecimals
              lineType="monotone"
            />
            {heightInsight ? (
              <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">最近测评</div>
                  <div className="text-sm font-semibold text-slate-800">
                    {new Date(heightInsight.latest.date).toLocaleDateString('zh-CN')}
                  </div>
                  <div>{heightInsight.ageLabel}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">身高</div>
                  <div className="text-sm font-semibold text-slate-800">
                    {heightInsight.latest.height.toFixed(1)} cm
                  </div>
                  <div>
                    比同龄平均 {heightInsight.deltaFromMedian >= 0 ? '+' : ''}
                    {Math.abs(heightInsight.deltaFromMedian).toFixed(1)} cm
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">参考区间</div>
                  <div className="text-sm font-semibold text-slate-800">
                    P3 {heightInsight.percentiles.p3.toFixed(1)} · P50 {heightInsight.percentiles.p50.toFixed(1)} · P97{' '}
                    {heightInsight.percentiles.p97.toFixed(1)}
                  </div>
                  <div>身高位于 P{heightInsight.percentileRank}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                {heightRecords.length
                  ? '已记录身高，请完善出生日期与性别以生成国家标准曲线。'
                  : '尚未录入身高测评，完成测评后可生成成长曲线。'}
              </p>
            )}
          </div>

        </div>
        <div className="space-y-4">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">成长能量</h2>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                ⚡ {energy}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              等级 L{levelInfo.level} · 距离下一等级还差 {Math.max(0, levelInfo.nextLevelEnergy - energy)} 能量
            </p>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">累计星级 {totalMissionStars}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">任务能量 {totalMissionEnergy}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">勋章 {badges.length}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">最近任务卡</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {recentMissions.map((mission) => {
                const key = `${mission.missionId}-${mission.date}`;
                const meta = missionCatalog[mission.missionId];
                return (
                  <li
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg" aria-hidden="true">
                        {missionTypeIcon[meta?.type ?? 'coordination'] ?? '🧩'}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800">{meta?.name ?? '任务卡'}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(mission.date).toLocaleDateString()} · 星级 {mission.stars}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-amber-500">+{mission.energy} ⚡</span>
                  </li>
                );
              })}
              {!recentMissions.length && (
                <li className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                  暂无任务卡记录
                </li>
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">AI 挑战推荐</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {recommendations.map((item) => (
                <li
                  key={item.missionId}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg" aria-hidden="true">
                      {missionTypeIcon[item.type] ?? '🧩'}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">目标：补强 {item.type}</p>
                    </div>
                  </div>
                  <button className="rounded-lg bg-brand-500 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-600">
                    派发
                  </button>
                </li>
              ))}
              {!recommendations.length && (
                <li className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                  暂无推荐，请先录入测评数据
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>




      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">复盘待办</h2>
            {pendingFollowUps.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600">
                {pendingFollowUps.length} 项
              </span>
            )}
          </div>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            {pendingFollowUps.length ? (
              pendingFollowUps.map(({ review, action }) => (
                <li
                  key={`${review.id}-${action.id}`}
                  className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2"
                >
                  <p className="font-semibold text-amber-700">{action.content}</p>
                  <p className="mt-1 text-xs text-amber-700/70">
                    来自 {classLookup[review.classId] ?? '训练营'} · {new Date(review.date).toLocaleDateString('zh-CN')}
                    {action.dueDate && ` · 截止 ${new Date(action.dueDate).toLocaleDateString('zh-CN')}`}
                  </p>
                </li>
              ))
            ) : (
              <li className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-400">
                暂无针对勇士的跟进行动，完成课堂复盘后会在此显示。
              </li>
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">复盘表扬</h2>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            {recentHighlights.length ? (
              recentHighlights.map(({ review, highlight }) => (
                <li
                  key={`${review.id}-${highlight.id}`}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2"
                >
                  <p className="font-semibold text-emerald-700">{highlight.note}</p>
                  <p className="mt-1 text-xs text-emerald-600/70">
                    来自 {classLookup[review.classId] ?? '训练营'} · {new Date(review.date).toLocaleDateString('zh-CN')}
                  </p>
                </li>
              ))
            ) : (
              <li className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-400">
                勇士的课堂亮点会在复盘表扬中高光呈现。
              </li>
            )}
          </ul>
        </div>
      </section>

      <AssessmentReportPanel
        report={assessmentReport}
        onOpenReport={() => setReportModalOpen(true)}
      />
      <AssessmentReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        report={assessmentReport}
      />

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">战队挑战轨迹</h2>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-600">
              近7天能量 +{squadEnergy.weekly}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            小队挑战的能量与互助记录会同步到勇士成长册，便于公示与复盘。
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {squadMemberships.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-400">
                暂未加入小队，可在课堂中邀请 TA 加入战队挑战。
              </div>
            )}
            {squadMemberships.map((squad) => (
              <div key={squad.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="font-semibold text-slate-800">{squad.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  队友：{squad.memberIds
                    .filter((id) => id !== studentId)
                    .map((id) => studentNameLookup[id] ?? '队友')
                    .join('、') || '等待队友加入'}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="text-xs text-slate-500">小队累计能量</p>
              <p className="mt-2 text-xl font-semibold text-purple-600">+{squadEnergy.total}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="text-xs text-slate-500">近7天能量</p>
              <p className="mt-2 text-xl font-semibold text-emerald-600">+{squadEnergy.weekly}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">互评荣誉</h2>
          <p className="mt-1 text-xs text-slate-500">最近 5 条互评记录，帮助家长与队友第一时间看到勇士的闪光点。</p>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            {studentKudos.slice(0, 5).map((item) => (
              <div key={`${item.createdAt}-${item.badge}`} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{item.badge}</span>
                  <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
                {item.reason && (
                  <p className="mt-1 text-xs text-slate-500">“{item.reason}”</p>
                )}
              </div>
            ))}
            {studentKudos.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-400">
                尚未获得互评勋章，课堂中互评越多，勇士越受欢迎。
              </div>
            )}
          </div>
        </div>
      </section>



      <section className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">课堂表现雷达</h2>
          <p className="text-xs text-slate-500">基于最近课堂评星维度自动汇总，帮助教练快速校准成长方向。</p>
          <RadarChart data={performanceRadar ?? undefined} valueLabel="课堂表现" />
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">最近课堂点评</h2>
            <p className="text-xs text-slate-500">最新三节课的亮点与关注点，方便家长随时掌握训练重点。</p>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            {recentPerformanceHistory.length ? (
              recentPerformanceHistory.map(({ date, entry }) => {
                const dateLabel = new Date(date).toLocaleDateString('zh-CN');
                const highlightPresets = entry.presetIds
                  .map((id) => PERFORMANCE_PRESET_LOOKUP[id])
                  .filter((preset) => preset?.tone === 'highlight');
                const focusPresets = entry.presetIds
                  .map((id) => PERFORMANCE_PRESET_LOOKUP[id])
                  .filter((preset) => preset?.tone === 'focus');
                const dimensionSummary = entry.dimensions
                  .map((item) => {
                    const meta = PERFORMANCE_DIMENSIONS.find((dimension) => dimension.id === item.dimension);
                    return `${meta?.label ?? item.dimension}${item.score}分`;
                  })
                  .join('｜');
                return (
                  <div
                    key={`${entry.id}-${date}`}
                    className="space-y-1 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-slate-700">
                      {dateLabel} · {entry.stars} 星
                    </p>
                    <p className="text-xs text-slate-400">{dimensionSummary}</p>
                    {highlightPresets.length ? (
                      <p className="text-xs text-emerald-600">
                        亮点：
                        {highlightPresets
                          .map((preset) => {
                            const meta = PERFORMANCE_DIMENSIONS.find((dimension) => dimension.id === preset!.dimension);
                            const prefix = meta ? `${meta.label}·` : '';
                            return `${prefix}${preset!.label}`;
                          })
                          .join('、')}
                      </p>
                    ) : null}
                    {focusPresets.length ? (
                      <p className="text-xs text-amber-600">
                        关注：
                        {focusPresets
                          .map((preset) => {
                            const meta = PERFORMANCE_DIMENSIONS.find((dimension) => dimension.id === preset!.dimension);
                            const prefix = meta ? `${meta.label}·` : '';
                            return `${prefix}${preset!.label}`;
                          })
                          .join('、')}
                      </p>
                    ) : null}
                    {entry.comment ? (
                      <p className="text-xs text-slate-500">教练寄语：{entry.comment}</p>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-400">
                暂无课堂表现记录，完成作战台结课点评后将在此自动生成。
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">勇士勋章墙</h2>
        <BadgeWall badges={badges} />
      </section>

      <section
        id="student-report"
        className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">速度成绩曲线</h2>
              <p className="text-xs text-slate-500">同课堂作战台保持一致，支持多计时窗口切换</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>计时窗口</span>
              <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
                {SPEED_WINDOWS.map((window) => {
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
          </div>
          <ProgressChart series={speedChartSeries} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr,1fr]">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-600">技能成长曲线</h3>
            <ProgressChart
              series={skillGrowthSeries}
              yDomain={[0, 9]}
              yTicks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
              allowDecimals={false}
              lineType="stepAfter"
            />
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-600">体能测评雷达</h3>
            <RadarChart data={radarView?.normalized} reference={radarView?.reference ?? undefined} />
          </div>
        </div>


        
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-indigo-50 to-slate-100 p-6 shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">勇士积分成长轨迹</h3>
                <p className="text-xs text-slate-500">课堂行为奖励、挑战积分等构成勇士荣耀值</p>
              </div>
              <div className="rounded-2xl bg-white/70 px-4 py-2 text-right shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-violet-400">Points</p>
                <p className="text-xl font-bold text-violet-600">{pointsSummary.total}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner backdrop-blur">
              <ProgressChart series={pointsSeries} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
                <p className="text-xs text-slate-500">积分构成</p>
                <ul className="mt-2 space-y-1 text-slate-600">
                  {Object.entries(pointsSummary.breakdown).map(([type, value]) => (
                    <li key={type} className="flex items-center justify-between text-xs">
                      <span>{labelForPointType(type as PointEvent['type'])}</span>
                      <span className="font-semibold text-violet-600">{value} 分</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
                <p className="text-xs text-slate-500">近期积分事件</p>
                <ul className="mt-2 space-y-1 text-slate-600">
                  {lastEvents.length ? (
                    lastEvents.map((event) => (
                      <li key={event.id} className="text-xs">
                        <span className="text-slate-400">{new Date(event.date).toLocaleDateString()} · </span>
                        <span className="font-semibold text-violet-600">{labelForPointType(event.type)}</span>
                        <span className="text-violet-500"> +{event.points}</span>
                        {event.reason && <span className="text-slate-500"> · {event.reason}</span>}
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400">暂无积分记录</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-amber-50 to-rose-50 p-6 shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">成长能量曲线</h3>
                <p className="text-xs text-slate-500">记录出勤连击、任务评星、战队激励等成长值沉淀</p>
              </div>
              <div className="rounded-2xl bg-white/70 px-4 py-2 text-right shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-400">Energy</p>
                <p className="text-xl font-bold text-amber-500">{energy}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-inner backdrop-blur">
              <ProgressChart series={energySeries} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
                <p className="text-xs text-slate-500">能量构成</p>
                <ul className="mt-2 space-y-1 text-slate-600">
                  {energyBreakdownEntries.length ? (
                    energyBreakdownEntries.map((entry) => (
                      <li key={entry.key} className="flex items-center justify-between text-xs">
                        <span>{entry.label}</span>
                        <span className={entry.value >= 0 ? 'font-semibold text-amber-600' : 'font-semibold text-rose-500'}>
                          {entry.value > 0 ? `+${entry.value}` : entry.value}⚡
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400">暂无能量构成</li>
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
                <p className="text-xs text-slate-500">近期能量流水</p>
                <ul className="mt-2 space-y-1 text-slate-600">
                  {recentEnergyLogs.length ? (
                    recentEnergyLogs.map((log, index) => {
                      const key = log.id ?? `${log.createdAt}-${log.source}-${index}`;
                      return (
                        <li key={key} className="text-xs">
                          <span className="text-slate-400">{new Date(log.createdAt).toLocaleDateString()} · </span>
                          <span>{labelForEnergySource(log.source)} </span>
                          <span className={log.delta >= 0 ? 'font-semibold text-amber-600' : 'font-semibold text-rose-500'}>
                            {log.delta > 0 ? `+${log.delta}` : log.delta}⚡
                          </span>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-slate-400">暂无能量记录</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">花样通关清单</h3>
          <div className="grid gap-3">
            {passesByRank.length ? (
              passesByRank.map((group) => (
                <div key={group.rank} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-700">段位 L{group.rank}</p>
                  <p className="mt-1 text-xs text-slate-500">{group.moves.join(' · ')}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-slate-400">
                暂无通关记录
              </div>
            )}
          </div>
        </section>

        <LessonLedgerPanel
          entries={lessonLedger}
          sessions={lessonSessionRows}
          onCreate={handleCreateLedger}
          onUpdate={handleUpdateLedger}
          onDelete={handleDeleteLedger}
          onImport={handleImportLedger}
        />

      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function formatWindowLabel(window: WindowSec) {
  return window === 60 ? '1分钟' : `${window}s`;
}

function labelForPointType(type: PointEvent['type']): string {
  switch (type) {
    case 'attendance':
      return '出勤';
    case 'pr':
      return '个人纪录 (PR)';
    case 'freestyle_pass':
      return '花样通过';
    case 'excellent':
      return '作战点评（优秀）';
    default:
      return type;
  }
}

function labelForEnergySource(source: EnergySource): string {
  switch (source) {
    case 'attendance':
      return '出勤连击';
    case 'mission':
      return '任务评星';
    case 'assessment':
      return '测评晋级';
    case 'kudos':
      return '荣耀点赞';
    case 'squad_milestone':
      return '战队里程碑';
    case 'squad_completion':
      return '战队完赛';
    case 'puzzle_card':
      return '解谜挑战';
    case 'manual':
      return '特别发放';
    case 'market_redeem':
      return '能量兑换';
    default:
      return source;
  }
}
