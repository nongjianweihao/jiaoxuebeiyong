import type { Badge } from '../types.gamify';

interface BadgeWallProps {
  badges: Badge[];
}

export function BadgeWall({ badges }: BadgeWallProps) {
  if (!badges.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500">
        暂无勋章。完成任务卡与段位试炼即可点亮勋章墙。
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {badges.map((badge) => (
        <div key={`${badge.code}-${badge.earnedAt}`} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-amber-500">段位勋章</p>
          <p className="mt-1 text-base font-semibold text-amber-700">{badge.name}</p>
          <p className="mt-2 text-xs text-amber-600">{new Date(badge.earnedAt).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
