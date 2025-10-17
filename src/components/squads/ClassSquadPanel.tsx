import { useEffect, useMemo, useState } from 'react';
import type { Student } from '../../types';
import type { Kudos, Squad, SquadChallenge } from '../../types.gamify';
import { squadsRepo } from '../../store/repositories/squadsRepo';
import { kudosRepo } from '../../store/repositories/kudosRepo';
import { AwardEngine } from '../../gamify/awardEngine';
import { DEFAULT_KUDOS_BADGES } from '../../config/squads';

interface ClassSquadPanelProps {
  classId: string;
  students: Student[];
  onStudentEnergyChange?: (studentIds: string[]) => Promise<void> | void;
}

function defaultEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}


export function ClassSquadPanel({
  classId,
  students,
  onStudentEnergyChange,
}: ClassSquadPanelProps) {

  const [squads, setSquads] = useState<Squad[]>([]);
  const [challenges, setChallenges] = useState<SquadChallenge[]>([]);
  const [selectedSquadId, setSelectedSquadId] = useState<string>('');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [kudos, setKudos] = useState<Kudos[]>([]);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadMembers, setNewSquadMembers] = useState<string[]>([]);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeTarget, setChallengeTarget] = useState<number>(1000);
  const [challengeUnit, setChallengeUnit] = useState<SquadChallenge['unit']>('count');
  const [challengeEndDate, setChallengeEndDate] = useState(defaultEndDate);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [kudosFrom, setKudosFrom] = useState<string>('');
  const [kudosTo, setKudosTo] = useState<string>('');
  const [kudosBadge, setKudosBadge] = useState<string>(DEFAULT_KUDOS_BADGES[0]);
  const [kudosReason, setKudosReason] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void refreshBoard();
  }, [classId]);

  useEffect(() => {
    if (!selectedSquadId && squads.length > 0) {
      setSelectedSquadId(squads[0].id);
    }
  }, [squads, selectedSquadId]);

  useEffect(() => {
    if (!selectedSquadId) {
      setSelectedChallengeId('');
      return;
    }
    const firstActive = challenges
      .filter((item) => item.squadId === selectedSquadId)
      .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
    setSelectedChallengeId(firstActive?.id ?? '');
  }, [challenges, selectedSquadId]);

  const studentMap = useMemo(
    () => Object.fromEntries(students.map((student) => [student.id, student])),
    [students],
  );

  const squadSummaries = useMemo(() => {
    return squads.map((squad) => {
      const challenge = challenges
        .filter((item) => item.squadId === squad.id)
        .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
      const ratio = challenge?.target
        ? Math.min(1, challenge.progress / Math.max(1, challenge.target))
        : 0;
      return {
        squad,
        challenge,
        ratio,
      };
    });
  }, [squads, challenges]);

  const kudosLeaders = useMemo(() => {
    const counts: Record<string, number> = {};
    kudos.forEach((item) => {
      counts[item.toStudentId] = (counts[item.toStudentId] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([studentId, total]) => ({
        student: studentMap[studentId]?.name ?? '未知勇士',
        total,
      }));
  }, [kudos, studentMap]);

  async function refreshBoard() {
    const [squadList, challengeList, kudosList] = await Promise.all([
      squadsRepo.listByClass(classId),
      squadsRepo.listChallengesByClass(classId),
      kudosRepo.listByClass(classId),
    ]);
    setSquads(squadList);
    setChallenges(challengeList);
    setKudos(kudosList);
  }

  const selectedSquad = squads.find((item) => item.id === selectedSquadId);
  const selectedChallenge = challenges.find((item) => item.id === selectedChallengeId);

  function toggleMember(id: string) {
    setNewSquadMembers((prev) =>
      prev.includes(id) ? prev.filter((member) => member !== id) : [...prev, id],
    );
  }

  async function handleCreateSquad(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newSquadName.trim() || newSquadMembers.length === 0) return;
    setIsSubmitting(true);
    await squadsRepo.createSquad({
      name: newSquadName.trim(),
      memberIds: newSquadMembers,
      classId,
    });
    setNewSquadName('');
    setNewSquadMembers([]);
    setIsSubmitting(false);
    setStatusMessage('新小队已创建，去发起挑战吧！');
    await refreshBoard();
  }

  async function handleCreateChallenge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSquad || !challengeTitle.trim() || challengeTarget <= 0) return;
    setIsSubmitting(true);
    const start = new Date();
    await squadsRepo.createChallenge({
      squadId: selectedSquad.id,
      title: challengeTitle.trim(),
      target: challengeTarget,
      unit: challengeUnit,
      startDate: start.toISOString().slice(0, 10),
      endDate: challengeEndDate,
    });
    setChallengeTitle('');
    setChallengeTarget(1000);
    setProgressValue(0);
    setIsSubmitting(false);
    setStatusMessage('挑战任务已发布，记得课上更新进度！');
    await refreshBoard();
  }

  async function handleAddProgress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedChallenge || progressValue <= 0) return;
    setIsSubmitting(true);
    await squadsRepo.addProgress({
      challengeId: selectedChallenge.id,
      value: progressValue,
      by: 'class',
      createdBy: 'coach-app',
      refSessionId: undefined,
      note: undefined,
    });
    if (onStudentEnergyChange) {
      const squad = squads.find((item) => item.id === selectedChallenge.squadId);
      if (squad) {
        await onStudentEnergyChange(squad.memberIds);
      }
    }
    setProgressValue(0);
    setIsSubmitting(false);
    setStatusMessage('已记录本次进度并发放能量奖励！');
    await refreshBoard();
  }

  async function handleKudos(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!kudosFrom || !kudosTo || kudosFrom === kudosTo) return;
    setIsSubmitting(true);
    await AwardEngine.awardKudos({
      fromStudentId: kudosFrom,
      toStudentId: kudosTo,
      badge: kudosBadge,
      reason: kudosReason.trim() || undefined,
      classId,
    });
    setKudosReason('');
    if (onStudentEnergyChange) {
      await onStudentEnergyChange([kudosTo]);
    }
    setIsSubmitting(false);
    setStatusMessage('互评已送达，对方能量+5！');
    await refreshBoard();
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[2fr_2fr_1.6fr]">
      <div className="rounded-3xl bg-white/80 p-6 shadow-lg shadow-purple-200/40 backdrop-blur">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-purple-700">小队战术板</h3>
          {statusMessage && (
            <span className="text-xs text-purple-500">{statusMessage}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          建立训练小队并查看当前挑战进度，鼓励勇士协作冲榜。
        </p>

        <div className="mt-4 space-y-4">
          <form onSubmit={handleCreateSquad} className="space-y-3 rounded-2xl border border-white/60 bg-white/70 p-4">
            <h4 className="text-sm font-semibold text-slate-700">快速组队</h4>
            <input
              value={newSquadName}
              onChange={(event) => setNewSquadName(event.target.value)}
              className="w-full rounded-xl border border-purple-200/60 bg-white/90 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="输入小队名称"
            />
            <div className="grid grid-cols-2 gap-2 text-sm">
              {students.map((student) => (
                <label
                  key={student.id}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                    newSquadMembers.includes(student.id)
                      ? 'border-purple-400 bg-purple-50 text-purple-700'
                      : 'border-purple-100 bg-white/80 text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={newSquadMembers.includes(student.id)}
                    onChange={() => toggleMember(student.id)}
                    className="h-4 w-4 rounded border-purple-300 text-purple-500 focus:ring-purple-400"
                  />
                  {student.name}
                </label>
              ))}
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !newSquadName.trim() || newSquadMembers.length === 0}
              className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-300/50 transition hover:from-purple-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              创建小队
            </button>
          </form>

          <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
            <h4 className="text-sm font-semibold text-slate-700">小队概览</h4>
            <div className="mt-3 space-y-3">
              {squadSummaries.length === 0 && (
                <p className="text-xs text-slate-400">尚未创建小队。</p>
              )}
              {squadSummaries.map(({ squad, challenge, ratio }) => (
                <button
                  key={squad.id}
                  onClick={() => setSelectedSquadId(squad.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    selectedSquadId === squad.id
                      ? 'border-purple-400 bg-purple-50 shadow'
                      : 'border-transparent bg-white/70 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{squad.name}</p>
                      <p className="text-xs text-slate-400">
                        成员：{squad.memberIds.map((id) => studentMap[id]?.name ?? '未知').join('、')}
                      </p>
                    </div>
                    {challenge && (
                      <span className="text-xs font-semibold text-purple-500">
                        {Math.round(ratio * 100)}%
                      </span>
                    )}
                  </div>
                  {challenge && (
                    <p className="mt-1 text-xs text-slate-500">
                      当前任务：{challenge.title} · {challenge.progress}/{challenge.target}
                      {challenge.unit === 'count' ? '次' : challenge.unit === 'sec' ? '秒' : ''}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white/80 p-6 shadow-lg shadow-purple-200/40 backdrop-blur">
        <h3 className="text-lg font-semibold text-purple-700">挑战进度</h3>
        {selectedSquad ? (
          <>
            <p className="mt-1 text-sm text-slate-500">
              为 {selectedSquad.name} 发布挑战、记录课堂进度，系统会自动发放能量与奖励。
            </p>
            <form onSubmit={handleCreateChallenge} className="mt-4 space-y-3 rounded-2xl border border-white/60 bg-white/70 p-4">
              <div className="text-xs font-semibold text-slate-500">新挑战任务</div>
              <input
                value={challengeTitle}
                onChange={(event) => setChallengeTitle(event.target.value)}
                className="w-full rounded-xl border border-purple-200/60 bg-white/90 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="例如：本周累计双摇10000次"
              />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs text-slate-500">目标数值</label>
                  <input
                    type="number"
                    min={1}
                    value={challengeTarget}
                    onChange={(event) => setChallengeTarget(Number(event.target.value))}
                    className="mt-1 w-full rounded-xl border border-purple-200/60 bg-white/90 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">单位</label>
                  <select
                    value={challengeUnit}
                    onChange={(event) => setChallengeUnit(event.target.value as SquadChallenge['unit'])}
                    className="mt-1 w-full rounded-xl border border-purple-200/60 bg-white/90 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  >
                    <option value="count">次数</option>
                    <option value="sec">秒</option>
                    <option value="m">米</option>
                    <option value="custom">自定义</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-500">截至日期</label>
                  <input
                    type="date"
                    value={challengeEndDate}
                    onChange={(event) => setChallengeEndDate(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-purple-200/60 bg-white/90 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !challengeTitle.trim() || challengeTarget <= 0}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-300/50 transition hover:from-indigo-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                发布挑战
              </button>
            </form>

            {selectedChallenge && (
              <form onSubmit={handleAddProgress} className="mt-4 space-y-3 rounded-2xl border border-white/60 bg-white/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">课堂加进度</div>
                    <p className="text-sm font-semibold text-slate-700">{selectedChallenge.title}</p>
                  </div>
                  <span className="text-xs font-semibold text-purple-500">
                    {selectedChallenge.target > 0
                      ? `${Math.round(
                          (selectedChallenge.progress / selectedChallenge.target) * 100,
                        )}%`
                      : '—'}
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  value={progressValue}
                  onChange={(event) => setProgressValue(Number(event.target.value))}
                  className="w-full rounded-xl border border-purple-200/60 bg-white/90 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="本次增加的数值"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || progressValue <= 0}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-pink-500 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-200/50 transition hover:from-amber-500 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  记录进度并发放能量
                </button>
              </form>
            )}
          </>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-purple-200/60 bg-white/70 p-6 text-center text-sm text-slate-400">
            先在左侧建立小队，再来这里发布挑战。
          </p>
        )}
      </div>

      <div className="rounded-3xl bg-slate-900/90 p-6 text-slate-100 shadow-xl shadow-slate-900/30">
        <h3 className="text-lg font-semibold">互评鼓励</h3>
        <p className="mt-1 text-sm text-slate-400">
          课堂互评让勇士彼此鼓励，每次互评被表扬者将获得 +5 能量。
        </p>
        <form onSubmit={handleKudos} className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-xs text-slate-400">来自</label>
              <select
                value={kudosFrom}
                onChange={(event) => setKudosFrom(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="">选择勇士</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">授予</label>
              <select
                value={kudosTo}
                onChange={(event) => setKudosTo(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="">选择勇士</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400">勋章</label>
            <select
              value={kudosBadge}
              onChange={(event) => setKudosBadge(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              {DEFAULT_KUDOS_BADGES.map((badge) => (
                <option key={badge} value={badge}>
                  {badge}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={kudosReason}
            onChange={(event) => setKudosReason(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="写下鼓励语，可选"
          />
          <button
            type="submit"
            disabled={isSubmitting || !kudosFrom || !kudosTo || kudosFrom === kudosTo}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-400/40 transition hover:from-emerald-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            发送互评
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h4 className="text-sm font-semibold">本课互评记录</h4>
            <div className="mt-3 space-y-2 text-xs">
              {kudos.slice(0, 5).map((item) => (
                <div key={`${item.toStudentId}-${item.createdAt}-${item.badge}`} className="rounded-xl bg-slate-800/60 p-3">
                  <div className="flex items-center justify-between">
                    <span>
                      {studentMap[item.fromStudentId]?.name ?? '—'} →{' '}
                      {studentMap[item.toStudentId]?.name ?? '—'}
                    </span>
                    <span className="text-emerald-300">{item.badge}</span>
                  </div>
                  {item.reason && (
                    <p className="mt-1 text-slate-400">{item.reason}</p>
                  )}
                </div>
              ))}
              {kudos.length === 0 && (
                <p className="text-slate-500">尚未有互评记录，鼓励勇士互相点赞！</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h4 className="text-sm font-semibold">互评热力榜</h4>
            <ul className="mt-3 space-y-2 text-xs">
              {kudosLeaders.length === 0 && <li className="text-slate-500">暂无数据</li>}
              {kudosLeaders.map((item, index) => (
                <li key={item.student} className="flex items-center justify-between rounded-xl bg-slate-800/60 px-3 py-2">
                  <span>
                    #{index + 1} {item.student}
                  </span>
                  <span className="text-emerald-300">+{item.total}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
