import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ClassEntity, Student, TrainingTemplate } from '../../types';
import type {
  EnergyLog,
  Kudos,
  MissionProgress,
  Squad,
  SquadChallenge,
} from '../../types.gamify';
import { squadsRepo } from '../../store/repositories/squadsRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { kudosRepo } from '../../store/repositories/kudosRepo';
import { energyLogsRepo } from '../../store/repositories/energyLogsRepo';
import { classesRepo } from '../../store/repositories/classesRepo';
import { templatesRepo } from '../../store/repositories/templatesRepo';
import { pointEventsRepo } from '../../store/repositories/pointEventsRepo';
import { AwardEngine } from '../../gamify/awardEngine';
import { getPointValue } from '../../utils/points';
import { resolveMissionTypeFromBlock } from '../../utils/mission';
import { SQUAD_EVALUATION_DIMENSIONS, SQUAD_LEADERBOARD_WINDOWS } from '../../config/squads';
import { db } from '../../store/db';
import { generateId } from '../../store/repositories/utils';

const missionIcons: Record<string, string> = {
  speed: '⚡',
  strength: '💪',
  stamina: '🔋',
  coordination: '🎯',
  social: '🤝',
  mystery: '🎁',
};

interface SquadDashboard {
  squads: Squad[];
  challenges: SquadChallenge[];
  kudos: Kudos[];
  energyLogs: EnergyLog[];
  students: Student[];
  classes: ClassEntity[];
  templates: TrainingTemplate[];
  missions: MissionProgress[];
}

interface AssignmentCard {
  mission: MissionProgress;
  template?: TrainingTemplate;
  student?: Student;
  className: string;
  meta: {
    honor?: string;
    reward?: string;
    rewardPoints?: number;
  };
}

function shiftDate(days: number, from: Date = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() - days);
  return date;
}

function formatMonthDay(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}.${day}`;
}

function formatFullStamp(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hour}:${minute}`;
}

function extractTemplateMeta(template: TrainingTemplate) {
  const lines = template.blocks.flatMap((block) => (block.notes ? block.notes.split('\n') : []));
  const honorLine = lines.find((line) => line.includes('荣誉认证'));
  const rewardLine = lines.find((line) => line.includes('奖励'));
  const clean = (line?: string) => (line ? line.split(/[:：]/).slice(1).join(':').trim() : undefined);
  const reward = clean(rewardLine);
  const honor = clean(honorLine);
  const rewardMatch = reward?.match(/([0-9]+)\s*积分/);
  const rewardPoints = rewardMatch ? Number(rewardMatch[1]) : undefined;
  return { honor, reward, rewardPoints };
}

export function SquadsPage() {
  const [data, setData] = useState<SquadDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [
          squads,
          challenges,
          kudos,
          energyLogs,
          students,
          classes,
          templates,
          missions,
        ] = await Promise.all([
          squadsRepo.listAll(),
          squadsRepo.listChallenges(),
          kudosRepo.listAll(),
          energyLogsRepo.listBySources(['squad_milestone', 'squad_completion', 'kudos']),
          studentsRepo.list(),
          classesRepo.list(),
          templatesRepo.list(),
          db.missionsProgress.toArray(),
        ]);
        setData({ squads, challenges, kudos, energyLogs, students, classes, templates, missions });
      } catch (err) {
        console.error('无法加载战队数据', err);
        setError('战队数据加载失败，请刷新页面或联系管理员。');
        setData({
          squads: [],
          challenges: [],
          kudos: [],
          energyLogs: [],
          students: [],
          classes: [],
          templates: [],
          missions: [],
        });
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const studentMap = useMemo(() => {
    if (!data) return {} as Record<string, Student>;
    return Object.fromEntries(data.students.map((student) => [student.id, student]));
  }, [data]);

  const classMap = useMemo(() => {
    if (!data) return new Map<string, ClassEntity>();
    return new Map(data.classes.map((cls) => [cls.id, cls]));
  }, [data]);

  const templateMap = useMemo(() => {
    if (!data) return new Map<string, TrainingTemplate>();
    return new Map(data.templates.map((tpl) => [tpl.id, tpl]));
  }, [data]);

  const templateMeta = useMemo(() => {
    if (!data) return new Map<string, ReturnType<typeof extractTemplateMeta>>();
    return new Map(data.templates.map((tpl) => [tpl.id, extractTemplateMeta(tpl)]));
  }, [data]);

  const assignments = useMemo<AssignmentCard[]>(() => {
    if (!data) return [];
    return data.missions
      .filter((mission) => mission.status === 'assigned' && mission.missionId !== 'attendance')
      .map((mission) => {
        const template = templateMap.get(mission.missionId);
        const student = studentMap[mission.studentId];
        const className =
          mission.classId === 'personal'
            ? '个人任务'
            : classMap.get(mission.classId)?.name ?? '未分配';
        const meta = templateMeta.get(mission.missionId) ?? {};
        return { mission, template, student, className, meta };
      })
      .sort((a, b) => new Date(a.mission.date).getTime() - new Date(b.mission.date).getTime());
  }, [classMap, data, studentMap, templateMap, templateMeta]);

  const completedMissions = useMemo(() => {
    if (!data) return [] as MissionProgress[];
    return data.missions
      .filter((mission) => mission.status === 'completed' && mission.missionId !== 'attendance')
      .slice()
      .sort((a, b) => (b.completedAt ?? b.date).localeCompare(a.completedAt ?? a.date));
  }, [data]);

  const challengeHonors = useMemo(() => {
    return completedMissions
      .filter((mission) => Boolean(mission.honorTitle))
      .slice(0, 6)
      .map((mission) => ({
        mission,
        student: studentMap[mission.studentId],
        template: templateMap.get(mission.missionId),
      }));
  }, [completedMissions, studentMap, templateMap]);

  const challengeRanking = useMemo(() => {
    const totals = new Map<
      string,
      { points: number; energy: number; count: number; honors: number; last: string }
    >();
    completedMissions.forEach((mission) => {
      const prev =
        totals.get(mission.studentId) ?? {
          points: 0,
          energy: 0,
          count: 0,
          honors: 0,
          last: mission.completedAt ?? mission.date,
        };
      prev.points += mission.rewardPoints ?? 0;
      prev.energy += mission.energy ?? 0;
      prev.count += 1;
      prev.honors += mission.honorTitle ? 1 : 0;
      const stamp = mission.completedAt ?? mission.date;
      if (stamp > prev.last) {
        prev.last = stamp;
      }
      totals.set(mission.studentId, prev);
    });
    return Array.from(totals.entries())
      .sort(([, a], [, b]) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.energy !== a.energy) return b.energy - a.energy;
        return b.last.localeCompare(a.last);
      })
      .map(([studentId, stats]) => ({
        studentId,
        student: studentMap[studentId],
        stats,
      }));
  }, [completedMissions, studentMap]);

  const leaderboard = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const weeklyStartDate = shiftDate(SQUAD_LEADERBOARD_WINDOWS.weeklyDays - 1, now);
    const monthlyStartDate = shiftDate(SQUAD_LEADERBOARD_WINDOWS.monthlyDays - 1, now);
    const weeklyStartIso = weeklyStartDate.toISOString();
    const monthlyStartIso = monthlyStartDate.toISOString();

    const energyAll: Record<string, number> = {};
    const energyWeekly: Record<string, number> = {};
    const energyMonthly: Record<string, number> = {};

    data.energyLogs.forEach((log) => {
      const metadata = (log.metadata ?? {}) as { squadId?: string };
      if (!metadata.squadId) return;
      if (log.source !== 'squad_milestone' && log.source !== 'squad_completion') return;
      energyAll[metadata.squadId] = (energyAll[metadata.squadId] ?? 0) + log.delta;
      if (log.createdAt >= weeklyStartIso) {
        energyWeekly[metadata.squadId] = (energyWeekly[metadata.squadId] ?? 0) + log.delta;
      }
      if (log.createdAt >= monthlyStartIso) {
        energyMonthly[metadata.squadId] = (energyMonthly[metadata.squadId] ?? 0) + log.delta;
      }
    });

    const kudosBySquad: Record<string, number> = {};
    data.kudos.forEach((item) => {
      data.squads.forEach((squad) => {
        if (squad.memberIds.includes(item.toStudentId)) {
          kudosBySquad[squad.id] = (kudosBySquad[squad.id] ?? 0) + 1;
        }
      });
    });

    const weeklyKudosCounts: Record<string, number> = {};
    const monthlyKudosCounts: Record<string, number> = {};

    data.kudos.forEach((item) => {
      if (item.createdAt >= weeklyStartIso) {
        weeklyKudosCounts[item.toStudentId] = (weeklyKudosCounts[item.toStudentId] ?? 0) + 1;
      }
      if (item.createdAt >= monthlyStartIso) {
        monthlyKudosCounts[item.toStudentId] = (monthlyKudosCounts[item.toStudentId] ?? 0) + 1;
      }
    });

    const weeklyTopSquadId = Object.entries(energyWeekly).sort((a, b) => b[1] - a[1])[0]?.[0];
    const monthlyTopSquadId = Object.entries(energyMonthly).sort((a, b) => b[1] - a[1])[0]?.[0];

    const weeklyTopWarriorId = Object.entries(weeklyKudosCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const monthlyTopWarriorId = Object.entries(monthlyKudosCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const weeklyTopWarrior = weeklyTopWarriorId
      ? {
          name: studentMap[weeklyTopWarriorId]?.name ?? '未知勇士',
          total: weeklyKudosCounts[weeklyTopWarriorId],
        }
      : null;

    const monthlyTopWarrior = monthlyTopWarriorId
      ? {
          name: studentMap[monthlyTopWarriorId]?.name ?? '未知勇士',
          total: monthlyKudosCounts[monthlyTopWarriorId],
        }
      : null;

    const squadCards = data.squads.map((squad) => {
      const challenge = data.challenges
        .filter((item) => item.squadId === squad.id)
        .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
      const completion = challenge?.target
        ? Math.min(1, challenge.progress / Math.max(1, challenge.target))
        : 0;
      return {
        squad,
        challenge,
        completion,
        energy: energyAll[squad.id] ?? 0,
        kudos: kudosBySquad[squad.id] ?? 0,
        weeklyEnergy: energyWeekly[squad.id] ?? 0,
        monthlyEnergy: energyMonthly[squad.id] ?? 0,
      };
    });

    return {
      squadCards,
      weeklyTopSquadId,
      monthlyTopSquadId,
      weeklyTopWarrior,
      monthlyTopWarrior,
      weeklyStartDate,
      monthlyStartDate,
    };
  }, [data, studentMap]);

  const refreshMissions = useCallback(async () => {
    const missions = await db.missionsProgress.toArray();
    setData((prev) => (prev ? { ...prev, missions } : prev));
  }, []);

  const handleCompleteAssignment = useCallback(
    async (assignment: AssignmentCard) => {
      const { mission, template, meta } = assignment;
      const templateName = template?.name ?? '挑战任务卡';
      const starInput = window.prompt(`为「${templateName}」评星（1-5）`, String(mission.stars || 5));
      if (starInput === null) return;
      const parsedStars = Number(starInput);
      if (!Number.isFinite(parsedStars)) {
        window.alert('请填写 1-5 之间的数字星级。');
        return;
      }
      const safeStars = Math.max(1, Math.min(5, Math.round(parsedStars)));

      const honorInput = window.prompt(
        '输入荣誉称谓（可选，例如“速度王者”）',
        mission.honorTitle ?? meta.honor ?? '',
      );
      if (honorInput === null) return;
      const honorTitle = honorInput.trim() || undefined;

      const defaultPoints = mission.rewardPoints ?? meta.rewardPoints ?? getPointValue('challenge');
      const pointsInput = window.prompt(
        '输入奖励积分（可选，仅数字）',
        defaultPoints ? String(defaultPoints) : '',
      );
      if (pointsInput === null) return;
      const trimmedPoints = pointsInput.trim();
      let rewardPoints: number | undefined;
      if (trimmedPoints) {
        const parsedPoints = Number(trimmedPoints);
        if (!Number.isFinite(parsedPoints)) {
          window.alert('积分必须为数字。');
          return;
        }
        rewardPoints = Math.round(parsedPoints);
      }

      const noteInput = window.prompt(
        '输入奖励说明（可选，例如实物奖励）',
        mission.rewardNote ?? meta.reward ?? '',
      );
      if (noteInput === null) return;
      const rewardNote = noteInput.trim() || undefined;

      const now = new Date();
      await AwardEngine.awardMission(mission.studentId, mission.classId, mission.missionId, safeStars, {
        progressId: mission.id,
        honorTitle,
        rewardPoints,
        rewardNote,
        date: now,
      });

      if (rewardPoints && rewardPoints !== 0) {
        await pointEventsRepo.add({
          id: generateId(),
          studentId: mission.studentId,
          sessionId: mission.id ? `challenge-${mission.id}` : generateId(),
          date: now.toISOString(),
          type: 'challenge',
          points: rewardPoints,
          reason: honorTitle ?? templateName,
        });
      }

      if (honorTitle) {
        await db.badges.add({
          studentId: mission.studentId,
          code: `challenge:${mission.missionId}:${now.getTime()}`,
          name: honorTitle,
          earnedAt: now.toISOString(),
        });
      }

      window.alert('已记录挑战完成，能量与荣誉同步更新。');
      await refreshMissions();
    },
    [refreshMissions],
  );

  if (loading || !data || !leaderboard) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">战队挑战</h1>
        <p className="text-sm text-slate-500">正在加载战队数据...</p>
      </div>
    );
  }

  const {
    squadCards,
    weeklyTopSquadId,
    monthlyTopSquadId,
    weeklyTopWarrior,
    monthlyTopWarrior,
    weeklyStartDate,
    monthlyStartDate,
  } = leaderboard;

  const weeklyLabel = `${formatMonthDay(weeklyStartDate)} - ${formatMonthDay(new Date())}`;
  const monthlyLabel = `${formatMonthDay(monthlyStartDate)} - ${formatMonthDay(new Date())}`;

  const kudosWall = data.kudos
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  const topChallengeWarriors = challengeRanking.slice(0, 3);

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-800 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 xl:flex-row">
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">战队挑战指挥室</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                汇总小队进度、挑战荣誉与互评热度。指挥官可在此跟进待完成任务卡，及时加油打气并公示最新荣誉。
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-white/70">周最佳战队</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {weeklyTopSquadId
                    ? data.squads.find((item) => item.id === weeklyTopSquadId)?.name ?? '未评出'
                    : '未评出'}
                </p>
                <p className="text-[11px] text-white/60">统计区间：{weeklyLabel}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-white/70">月最佳战队</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {monthlyTopSquadId
                    ? data.squads.find((item) => item.id === monthlyTopSquadId)?.name ?? '未评出'
                    : '未评出'}
                </p>
                <p className="text-[11px] text-white/60">统计区间：{monthlyLabel}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-white/70">周最佳勇士</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {weeklyTopWarrior
                    ? `${weeklyTopWarrior.name} · ${weeklyTopWarrior.total} 次互评`
                    : '等待评选'}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-white/70">待完成挑战</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {assignments.length ? `${assignments.length} 项` : '全部完成'}
                </p>
                <p className="text-[11px] text-white/60">可在下方任务卡列表标记完成</p>
              </div>
            </div>
          </div>
          <div className="w-full xl:w-80">
            <div className="rounded-3xl bg-white/10 p-5 shadow-lg shadow-purple-500/30">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">挑战荣誉榜</h2>
                <span className="text-xs text-white/60">累计 {completedMissions.length} 次</span>
              </div>
              <div className="mt-4 space-y-3">
                {topChallengeWarriors.length === 0 && (
                  <p className="text-sm text-white/70">暂未完成挑战，快去派发任务卡吧！</p>
                )}
                {topChallengeWarriors.map((entry, index) => {
                  const palette = [
                    'bg-gradient-to-r from-amber-300/80 to-amber-500/80 text-amber-900',
                    'bg-gradient-to-r from-slate-200/70 to-slate-400/60 text-slate-900',
                    'bg-gradient-to-r from-orange-200/70 to-orange-400/60 text-orange-900',
                  ];
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div
                      key={entry.studentId}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm shadow ${palette[index] ?? 'bg-white/80 text-slate-900'}`}
                    >
                      <div>
                        <p className="font-semibold">
                          {medals[index] ?? '⭐'} {entry.student?.name ?? '勇士'}
                        </p>
                        <p className="text-xs text-slate-700/80">
                          积分 {entry.stats.points} · 能量 +{entry.stats.energy} · 荣誉 {entry.stats.honors}
                        </p>
                      </div>
                      <span className="text-xs text-slate-700/80">完成 {entry.stats.count} 次</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <section className="space-y-4">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">战队雷达榜</h2>
                <p className="text-sm text-slate-500">
                  从 {SQUAD_EVALUATION_DIMENSIONS.join(' · ')} 三个维度评估战队表现。
                </p>
              </div>
            </header>
            <div className="grid gap-4 xl:grid-cols-2">
              {squadCards.map(({ squad, challenge, completion, energy, kudos, weeklyEnergy }) => (
                <div key={squad.id} className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-purple-200/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{squad.name}</h3>
                      <p className="text-xs text-slate-500">
                        成员：{squad.memberIds.map((id) => studentMap[id]?.name ?? '—').join('、')}
                      </p>
                    </div>
                    <div className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-600">
                      周能量 +{weeklyEnergy}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-500">挑战完成率</p>
                      <p className="text-xl font-semibold text-purple-600">{Math.round(completion * 100)}%</p>
                      {challenge && (
                        <p className="text-[11px] text-slate-400">
                          {challenge.title} · {challenge.progress}/{challenge.target}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">累计能量</p>
                      <p className="text-xl font-semibold text-emerald-600">+{energy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">互评热度</p>
                      <p className="text-xl font-semibold text-amber-500">{kudos}</p>
                    </div>
                  </div>
                </div>
              ))}
              {squadCards.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 text-center text-sm text-slate-500">
                  还没有小队挑战，前往班级作战台创建第一支战队吧！
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-purple-200/40">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">挑战进度看板</h2>
                <p className="text-sm text-slate-500">查看每个挑战的目标与倒计时，及时提醒战队冲刺。</p>
              </div>
            </header>
            <div className="mt-4 space-y-4">
              {data.challenges.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
                  目前没有在进行的挑战。
                </p>
              )}
              {data.challenges
                .slice()
                .sort((a, b) => a.endDate.localeCompare(b.endDate))
                .map((challenge) => {
                  const squad = data.squads.find((item) => item.id === challenge.squadId);
                  if (!squad) return null;
                  const ratio = challenge.target
                    ? Math.min(1, challenge.progress / Math.max(1, challenge.target))
                    : 0;
                  const remaining = Math.max(
                    0,
                    Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                  );
                  return (
                    <div key={challenge.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{challenge.title}</p>
                          <p className="text-xs text-slate-500">
                            战队：{squad.name} · 截止 {challenge.endDate}
                          </p>
                        </div>
                        <div className="text-xs font-semibold text-purple-600">{Math.round(ratio * 100)}%</div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{ width: `${Math.round(ratio * 100)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>进度：{challenge.progress}/{challenge.target}</span>
                        <span>{remaining > 0 ? `剩余 ${remaining} 天` : '已到期/完成'}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>

          <section className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-purple-200/40">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">待完成挑战任务卡</h2>
                <p className="text-sm text-slate-500">派发给班级或个人的任务卡，课堂可直接结算。</p>
              </div>
              <span className="text-xs text-slate-400">共 {assignments.length} 项</span>
            </header>
            <div className="mt-4 space-y-3">
              {assignments.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
                  当前没有待完成的挑战任务卡。
                </p>
              )}
              {assignments.map((assignment) => {
                const { mission, template, student, className, meta } = assignment;
                const missionType = template?.blocks.length
                  ? resolveMissionTypeFromBlock(template.blocks[0])
                  : 'coordination';
                const blockSummary = template
                  ? template.blocks.map((block) => block.title).slice(0, 3).join(' · ')
                  : '';
                return (
                  <div
                    key={`${mission.missionId}-${mission.date}-${mission.studentId}`}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm md:flex-row md:items-center"
                  >
                    <div className="flex flex-1 items-start gap-3">
                      <span className="text-3xl" aria-hidden="true">
                        {missionIcons[missionType] ?? '🧩'}
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-800">{template?.name ?? '挑战任务卡'}</p>
                        <p className="text-xs text-slate-500">
                          {student?.name ?? '未指定勇士'} · {className} · 派发 {formatFullStamp(new Date(mission.date))}
                        </p>
                        {blockSummary && (
                          <p className="text-xs text-slate-400">关卡：{blockSummary}</p>
                        )}
                        {(meta.honor || meta.reward) && (
                          <p className="text-xs text-purple-500">
                            {meta.honor ? `荣誉：${meta.honor}` : ''}
                            {meta.honor && meta.reward ? ' ｜ ' : ''}
                            {meta.reward ? `奖励：${meta.reward}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCompleteAssignment(assignment)}
                      className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-purple-600"
                    >
                      标记完成
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-lg shadow-purple-200/40">
            <h2 className="text-xl font-semibold text-slate-800">挑战荣誉墙</h2>
            <p className="text-sm text-slate-500">展示最新 6 条挑战荣誉记录，家长与勇士一目了然。</p>
            <div className="mt-4 space-y-3">
              {challengeHonors.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
                  暂无荣誉记录，完成挑战即可上墙。
                </p>
              )}
              {challengeHonors.map(({ mission, student, template }) => (
                <div
                  key={`${mission.studentId}-${mission.completedAt ?? mission.date}`}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-r from-purple-50 to-white p-4 shadow"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">{mission.honorTitle}</span>
                    <span className="text-xs font-semibold text-purple-500">+{mission.energy} ⚡</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {student?.name ?? '勇士'} · {template?.name ?? '挑战'} · {formatFullStamp(new Date(mission.completedAt ?? mission.date))}
                  </p>
                  {mission.rewardNote && (
                    <p className="mt-2 text-xs text-slate-500">奖励：{mission.rewardNote}</p>
                  )}
                  {mission.rewardPoints ? (
                    <p className="mt-1 text-xs font-semibold text-amber-500">积分 +{mission.rewardPoints}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-purple-200/40">
            <h2 className="text-xl font-semibold text-slate-800">互评荣誉墙</h2>
            <p className="text-sm text-slate-500">展示最新 8 条互评，方便课堂公示与家长分享。</p>
            <div className="mt-4 space-y-3">
              {kudosWall.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
                  还没有互评记录。
                </p>
              )}
              {kudosWall.map((item) => (
                <div
                  key={`${item.toStudentId}-${item.createdAt}-${item.badge}`}
                  className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {studentMap[item.fromStudentId]?.name ?? '—'} → {studentMap[item.toStudentId]?.name ?? '—'}
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-600">{item.badge}</span>
                  </div>
                  {item.reason && <p className="mt-2 text-xs text-slate-500">“{item.reason}”</p>}
                  <p className="mt-2 text-[11px] text-slate-400">{formatFullStamp(new Date(item.createdAt))}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

