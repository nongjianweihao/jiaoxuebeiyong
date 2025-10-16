import type { StudentRoadmapState } from '../utils/growthRoadmap';

interface GrowthRoadmapProps {
  roadmap: StudentRoadmapState | null;
}

function buildPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return '';
  const [first, ...rest] = points;
  return [`M ${first.x} ${first.y}`, ...rest.map((point) => `L ${point.x} ${point.y}`)].join(' ');
}

export function GrowthRoadmap({ roadmap }: GrowthRoadmapProps) {
  if (!roadmap || roadmap.stages.length === 0) return null;
  const { stages, activeStageIndex, normalizedProgress } = roadmap;
  const activeStage = stages[activeStageIndex];
  const stageCount = stages.length;
  const width = 360;
  const height = 180;
  const stepX = stageCount > 1 ? (width - 80) / (stageCount - 1) : 0;
  const baseY = [140, 95, 60, 30, 20];
  const points = stages.map((_, index) => ({
    x: 40 + index * stepX,
    y: baseY[index] ?? baseY[baseY.length - 1] ?? 80,
  }));
  const path = buildPath(points);
  const progressOffset = Math.max(0, 1 - normalizedProgress) * 100;
  const accent = activeStage?.stage.color ?? '#38bdf8';

  return (
    <div className="rounded-2xl border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <header className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">勇士成长路线</p>
            <h2 className="text-2xl font-bold text-slate-900">
              当前阶段：{activeStage.stage.icon}{' '}
              <span style={{ color: accent }}>{activeStage.stage.name}</span>
            </h2>
            <p className="text-sm text-slate-500">{activeStage.stage.summary}</p>
          </header>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 shadow-inner">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
              <defs>
                <linearGradient id="roadmap-progress" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <path
                d={path}
                stroke="#cbd5f5"
                strokeWidth={12}
                fill="none"
                strokeLinecap="round"
                opacity={0.6}
              />
              <path
                d={path}
                stroke="url(#roadmap-progress)"
                strokeWidth={12}
                fill="none"
                strokeLinecap="round"
                strokeDasharray="100"
                strokeDashoffset={progressOffset}
                pathLength={100}
              />
              {points.map((point, index) => {
                const stage = stages[index];
                const completed = index < activeStageIndex || (index === activeStageIndex && stage.overallProgress >= 0.99);
                const isCurrent = index === activeStageIndex;
                return (
                  <g key={stage.stage.id} transform={`translate(${point.x}, ${point.y})`}>
                    <circle r={18} fill="#ffffff" stroke="#cbd5f5" strokeWidth={2} />
                    <circle
                      r={12}
                      fill={completed || isCurrent ? stage.stage.color : '#e2e8f0'}
                      stroke={isCurrent ? stage.stage.color : '#e2e8f0'}
                      strokeWidth={isCurrent ? 2 : 1}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={14}
                      fill={completed || isCurrent ? '#ffffff' : '#64748b'}
                    >
                      {stage.stage.icon}
                    </text>
                    <text
                      textAnchor="middle"
                      fontSize={11}
                      fill="#475569"
                      transform="translate(0, 36)"
                    >
                      {stage.stage.name}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="mt-2 text-right text-xs font-semibold text-slate-500">
              攀登进度 {Math.round(normalizedProgress * 100)}%
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-700">阶段目标</p>
            <p className="mt-2 text-slate-500">{activeStage.stage.focus}</p>
            <p className="mt-3 text-xs text-slate-400">{activeStage.stage.celebration}</p>
          </div>
        </div>

        <aside className="w-full max-w-md space-y-4">
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-800">阶段三线进度</h3>
            {activeStage.trackProgress.map((track) => {
              const widthPercent = Math.round(track.progress * 100);
              return (
                <div key={track.id} className="rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{track.title}</p>
                      <p className="text-xs text-slate-400">{track.subtitle}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">目标：{track.targetLabel}</span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, widthPercent)}%`,
                        background: `linear-gradient(90deg, ${accent}, ${accent}aa)`,
                      }}
                    />
                  </div>
                  {track.currentLabel && (
                    <p className="mt-2 text-xs text-slate-500">当前：{track.currentLabel}</p>
                  )}
                </div>
              );
            })}
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-800">推荐周期计划</h3>
            {activeStage.recommendedCycles.length ? (
              <ul className="space-y-3 text-sm text-slate-600">
                {activeStage.recommendedCycles.map((cycle) => (
                  <li
                    key={cycle.id}
                    className="rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {cycle.icon ? `${cycle.icon} ` : ''}
                          {cycle.name}
                        </p>
                        <p className="text-xs text-slate-400">周期 {cycle.durationWeeks} 周</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{cycle.summary ?? cycle.goal}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-4 text-xs text-slate-400">
                暂无与阶段匹配的模板，可在资产库中创建后自动关联。
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
