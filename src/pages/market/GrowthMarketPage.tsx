import { useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import type { RewardItem, RewardItemType, StudentExchange } from '../../types.gamify';
import type { Student } from '../../types';
import { rewardItemsRepo } from '../../store/repositories/rewardItemsRepo';
import { rewardExchangesRepo } from '../../store/repositories/rewardExchangesRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';

const CATEGORY_TABS: Array<{ key: RewardItemType | 'all'; label: string; icon: string; description: string }> = [
  { key: 'all', label: '全部奖励', icon: '🌟', description: '查看全部奖励池配置' },
  { key: 'virtual', label: '虚拟成就', icon: '🎖️', description: '勋章 · 皮肤 · 称号' },
  { key: 'physical', label: '实物纪念', icon: '🎁', description: 'T恤 · 手环 · 实体证书' },
  { key: 'privilege', label: '特权体验', icon: '🏕️', description: '营期 · 课时 · 荣誉席位' },
  { key: 'charity', label: '公益使命', icon: '💚', description: '植树 · 捐赠 · 公益联动' },
];

const statusMap: Record<string, string> = {
  pending: '待发放',
  delivered: '已发放',
  confirmed: '已确认',
};

function formatNumber(value: number | undefined) {
  if (value === undefined) return '0';
  return new Intl.NumberFormat('zh-CN').format(Math.max(0, Math.round(value)));
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function GrowthMarketPage() {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<RewardItemType | 'all'>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [balance, setBalance] = useState<Awaited<ReturnType<typeof rewardExchangesRepo.getBalance>> | null>(null);
  const [recentExchanges, setRecentExchanges] = useState<StudentExchange[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [loadingRewards, setLoadingRewards] = useState(true);

  const rewardMap = useMemo(
    () => new Map(rewards.map((item) => [item.id, item])),
    [rewards],
  );

  const refreshRewards = useCallback(async () => {
    setLoadingRewards(true);
    try {
      const list = await rewardItemsRepo.listVisibleByType('all');
      setRewards(
        list.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.costScore - b.costScore;
        }),
      );
    } finally {
      setLoadingRewards(false);
    }
  }, []);

  const refreshBalance = useCallback(
    async (studentId: string) => {
      if (!studentId) return;
      const [wallet, exchanges] = await Promise.all([
        rewardExchangesRepo.getBalance(studentId),
        rewardExchangesRepo.listRecent(studentId, 6),
      ]);
      setBalance(wallet);
      setRecentExchanges(exchanges);
    },
    [],
  );

  useEffect(() => {
    refreshRewards().catch(() => {
      setFeedback({ type: 'error', message: '加载奖励池失败，请刷新页面重试' });
    });
    studentsRepo
      .list()
      .then((list) => {
        setStudents(list);
        if (list.length) {
          setSelectedStudentId(list[0].id);
        }
      })
      .catch(() => setFeedback({ type: 'error', message: '无法获取勇士列表，请检查本地数据' }));
  }, [refreshRewards]);

  useEffect(() => {
    if (selectedStudentId) {
      refreshBalance(selectedStudentId).catch(() =>
        setFeedback({ type: 'error', message: '加载勇士积分失败，请稍后再试' }),
      );
    }
  }, [refreshBalance, selectedStudentId]);

  const filteredRewards = useMemo(() => {
    if (selectedCategory === 'all') return rewards;
    return rewards.filter((item) => item.type === selectedCategory);
  }, [rewards, selectedCategory]);

  const handleRedeem = async (reward: RewardItem) => {
    if (!selectedStudentId) {
      setFeedback({ type: 'info', message: '请选择一位勇士再尝试兑换' });
      return;
    }
    setRedeemingId(reward.id);
    const result = await rewardExchangesRepo.redeem(selectedStudentId, reward.id);
    if (result.ok) {
      setFeedback({ type: 'success', message: result.message });
      await Promise.all([refreshRewards(), refreshBalance(selectedStudentId)]);
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
    setRedeemingId(null);
  };

  const activeStudent = selectedStudentId
    ? students.find((student) => student.id === selectedStudentId)
    : undefined;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-widest text-white/80">勇士成长激励 · Growth Market</p>
            <h1 className="text-3xl font-bold">成长积分兑换系统</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-white/80">
              将课堂出勤、挑战与评测累计的积分、能量转化为真实奖励。激励勇士持续投入，同时让家长看见成长成果。
            </p>
          </div>
          <div className="space-y-2 rounded-2xl bg-white/15 p-4 text-sm backdrop-blur">
            <div className="text-white/80">当前查看勇士</div>
            <select
              className="w-full rounded-xl border border-white/30 bg-white/20 p-3 text-base font-semibold text-white shadow-inner focus:border-white"
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
            >
              <option value="" disabled>
                请选择勇士
              </option>
              {students.map((student) => (
                <option key={student.id} value={student.id} className="text-slate-900">
                  {student.name}
                </option>
              ))}
            </select>
            {activeStudent?.currentRank ? (
              <p className="text-xs text-white/70">当前段位：L{activeStudent.currentRank}</p>
            ) : (
              <p className="text-xs text-white/70">尚未设置段位</p>
            )}
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={classNames('rounded-xl border px-4 py-3 text-sm', {
            'border-emerald-200 bg-emerald-50 text-emerald-700': feedback.type === 'success',
            'border-amber-200 bg-amber-50 text-amber-700': feedback.type === 'info',
            'border-rose-200 bg-rose-50 text-rose-700': feedback.type === 'error',
          })}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-500">当前可用积分</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-violet-600">{formatNumber(balance?.scoreBalance)}</span>
            <span className="text-xs text-slate-400">总累计 {formatNumber(balance?.totalScoreEarned)}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-500">勇士能量</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-sky-600">{formatNumber(balance?.energyBalance)}</span>
            <span className="text-xs text-slate-400">累计消耗 {formatNumber(balance?.totalEnergySpent)}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-500">已兑换奖励</div>
          <div className="mt-2 text-3xl font-bold text-amber-500">{formatNumber(recentExchanges.length)}</div>
          <p className="mt-2 text-xs text-slate-400">展示最近 6 次兑换记录</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-500">下一个目标</div>
          <p className="mt-3 text-emerald-600">
            {filteredRewards.length
              ? `距离 ${filteredRewards[0].name} 还差 ${Math.max(
                  0,
                  (filteredRewards[0].costScore ?? 0) - (balance?.scoreBalance ?? 0),
                )} 积分`
              : '当前分类暂无可兑换奖励'}
          </p>
          <p className="mt-2 text-xs text-slate-400">可在奖励卡片中查看能量要求与库存信息</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedCategory(tab.key)}
            className={classNames(
              'group rounded-2xl border px-4 py-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-violet-500',
              selectedCategory === tab.key
                ? 'border-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-200'
                : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-600',
            )}
          >
            <div className="flex items-center gap-3 text-base font-semibold">
              <span className="text-xl">{tab.icon}</span>
              {tab.label}
            </div>
            <p className={classNames('mt-1 text-xs', selectedCategory === tab.key ? 'text-white/80' : 'text-slate-400')}>
              {tab.description}
            </p>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            {CATEGORY_TABS.find((tab) => tab.key === selectedCategory)?.label ?? '全部奖励'}
          </h2>
          <span className="text-sm text-slate-500">共 {filteredRewards.length} 项可兑换奖励</span>
        </div>

        {loadingRewards ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">
            正在载入奖励池配置...
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">
            当前分类暂无可兑换奖励，请在后台补充奖励池。
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {filteredRewards.map((reward) => {
              const stockDepleted = reward.stock !== undefined && reward.stock <= 0;
              const requireEnergy = reward.costEnergy ?? 0;
              const scoreEnough = (balance?.scoreBalance ?? 0) >= (reward.costScore ?? 0);
              const energyEnough = (balance?.energyBalance ?? 0) >= requireEnergy;
              const disabled =
                !selectedStudentId ||
                !balance ||
                !scoreEnough ||
                !energyEnough ||
                stockDepleted ||
                redeemingId === reward.id;

              return (
                <div key={reward.id} className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-2xl">
                        {reward.type === 'virtual'
                          ? '🎖️'
                          : reward.type === 'physical'
                          ? '🎁'
                          : reward.type === 'privilege'
                          ? '🏕️'
                          : '💚'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-800">{reward.name}</h3>
                          {reward.featured && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600">精选</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{reward.description}</p>
                      </div>
                    </div>
                    {reward.seasonTag && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                        🗓️ 限定赛季：{reward.seasonTag}
                      </span>
                    )}
                    {reward.levelLimit && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs text-violet-600">
                        🔓 建议段位 ≥ L{reward.levelLimit}
                      </span>
                    )}
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>
                        {reward.costScore} 积分
                        {requireEnergy ? ` · ${requireEnergy} 能量` : ''}
                      </span>
                      {reward.stock !== undefined && (
                        <span className={classNames('text-xs font-semibold', stockDepleted ? 'text-rose-500' : 'text-slate-400')}>
                          库存 {stockDepleted ? '已兑完' : reward.stock}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRedeem(reward)}
                      disabled={disabled}
                      className={classNames(
                        'w-full rounded-xl px-4 py-2 text-sm font-semibold transition-all',
                        disabled
                          ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                          : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md hover:from-violet-600 hover:to-fuchsia-600',
                      )}
                    >
                      {redeemingId === reward.id ? '兑换中...' : stockDepleted ? '等待补货' : scoreEnough ? '立即兑换' : '积分不足'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">最近兑换记录</h2>
          <span className="text-xs text-slate-400">状态由教练端确认后更新</span>
        </div>
        {recentExchanges.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400">
            暂无兑换记录，提醒勇士完成日常任务积累积分吧！
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {recentExchanges.map((exchange) => {
              const reward = rewardMap.get(exchange.rewardId);
              return (
                <div key={exchange.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">{reward?.name ?? '奖励'}</div>
                      <div className="text-xs text-slate-400">{formatDate(exchange.redeemedAt)}</div>
                    </div>
                    <span
                      className={classNames('rounded-full px-3 py-1 text-xs font-medium', {
                        'bg-amber-100 text-amber-600': exchange.status === 'pending',
                        'bg-sky-100 text-sky-600': exchange.status === 'delivered',
                        'bg-emerald-100 text-emerald-600': exchange.status === 'confirmed',
                      })}
                    >
                      {statusMap[exchange.status] ?? exchange.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span>积分 {exchange.costScore}</span>
                    {exchange.costEnergy ? <span>能量 {exchange.costEnergy}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
