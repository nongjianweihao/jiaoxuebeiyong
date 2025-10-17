import { useMemo, useState } from 'react';

const missionIcons: Record<string, string> = {
  speed: '⚡',
  strength: '💪',
  stamina: '🔋',
  coordination: '🎯',
  social: '🤝',
  mystery: '🎁',
};

export interface MissionMeta {
  id: string;
  name: string;
  type: string;
  duration?: number;
  notes?: string;
}

interface MissionStripProps {
  missions: MissionMeta[];
  students: Array<{ id: string; name: string }>;
  onComplete: (missionId: string, studentId: string, stars: number) => Promise<void>;
}

export function MissionStrip({ missions, students, onComplete }: MissionStripProps) {
  const [activeMission, setActiveMission] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Record<string, string>>({});
  const [loadingMission, setLoadingMission] = useState<string | null>(null);

  const orderedStudents = useMemo(
    () => [...students].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
    [students],
  );

  if (!missions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-center text-sm text-slate-500">
        今日尚未配置任务卡，可在挑战任务卡库中派发。
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">今日任务卡</h2>
          <p className="text-xs text-slate-500">完成后请为勇士评星并结算能量奖励</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {missions.map((mission) => {
          const icon = missionIcons[mission.type] ?? '🧩';
          const selected = selectedStudent[mission.id] ?? '';
          const isActive = activeMission === mission.id;
          return (
            <div key={mission.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{mission.type}</p>
                  <h3 className="text-base font-semibold text-slate-800">{mission.name}</h3>
                </div>
                <span className="text-3xl" aria-hidden="true">
                  {icon}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                预计 {mission.duration && mission.duration > 0 ? `${mission.duration} 分钟` : '—'}
              </p>


              <div className="mt-3 space-y-2">
                <select
                  value={selected}
                  onChange={(event) =>
                    setSelectedStudent((prev) => ({ ...prev, [mission.id]: event.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                >
                  <option value="">选择结算勇士</option>
                  {orderedStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-2 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-purple-600"
                  onClick={() => setActiveMission(isActive ? null : mission.id)}
                >
                  {isActive ? '收起星级评定' : '评定星级' }
                </button>
                {isActive && (
                  <div className="flex items-center justify-between">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`text-2xl transition ${star <= 3 ? 'text-amber-400' : 'text-amber-500'}`}
                        disabled={!selected || loadingMission === mission.id}
                        onClick={async () => {
                          if (!selected) {
                            window.alert('请选择要结算的勇士');
                            return;
                          }
                          setLoadingMission(mission.id);
                          try {
                            await onComplete(mission.id, selected, star);
                          } finally {
                            setLoadingMission(null);
                            setActiveMission(null);
                          }
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
