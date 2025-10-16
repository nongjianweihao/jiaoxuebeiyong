import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Combobox, Dialog, Transition } from '@headlessui/react';
import classNames from 'classnames';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';


import { Check, ChevronsUpDown, Edit3, Eye, EyeOff, ImageIcon, Plus, Trash2, X } from 'lucide-react';

import type { RewardItem, RewardItemType, StudentExchange } from '../../types.gamify';
import type { Student } from '../../types';
import { rewardItemsRepo } from '../../store/repositories/rewardItemsRepo';
import { rewardExchangesRepo } from '../../store/repositories/rewardExchangesRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { StudentAvatar } from '../../components/StudentAvatar';
import { VIRTUAL_WARDROBE, getVirtualAssetById, type VirtualAsset } from '../../config/virtualWardrobe';

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

const TYPE_LABELS: Record<RewardItemType, string> = {
  virtual: '虚拟成就',
  physical: '实物纪念',
  privilege: '特权体验',
  charity: '公益使命',
};

const TYPE_ICONS: Record<RewardItemType, string> = {
  virtual: '🎖️',
  physical: '🎁',
  privilege: '🏕️',
  charity: '💚',
};



type RewardArtworkVariant = 'card' | 'table' | 'form';


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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);
  const [savingReward, setSavingReward] = useState(false);
  const [actioningRewardId, setActioningRewardId] = useState<string | null>(null);
  const [studentQuery, setStudentQuery] = useState('');

  const rewardMap = useMemo(
    () => new Map(rewards.map((item) => [item.id, item])),
    [rewards],
  );

  const filteredStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) => {
      const haystack = `${student.name ?? ''}${student.guardian?.phone ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [studentQuery, students]);

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
          setSelectedStudentId((prev) => prev || list[0].id);
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
      const updatedStudent = await studentsRepo.get(selectedStudentId);
      if (updatedStudent) {
        setStudents((prev) =>
          prev.map((student) => (student.id === updatedStudent.id ? updatedStudent : student)),
        );
      }
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
    setRedeemingId(null);
  };

  const activeStudent = selectedStudentId
    ? students.find((student) => student.id === selectedStudentId)
    : undefined;

  const handleCreateReward = () => {
    setEditingReward(null);
    setIsEditorOpen(true);
  };

  const handleEditReward = (reward: RewardItem) => {
    setEditingReward(reward);
    setIsEditorOpen(true);
  };

  const handleRewardSaved = async (payload: RewardItem) => {
    const isEditing = Boolean(editingReward);
    setSavingReward(true);
    try {
      await rewardItemsRepo.upsert(payload);
      setFeedback({
        type: 'success',
        message: isEditing ? '奖励已更新并同步到奖励池' : '已新建奖励并加入奖励池',
      });
      await refreshRewards();
      setIsEditorOpen(false);
      setEditingReward(null);
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: '保存奖励失败，请重试' });
    } finally {
      setSavingReward(false);
    }
  };

  const handleToggleRewardVisibility = async (reward: RewardItem) => {
    setActioningRewardId(reward.id);
    try {
      await rewardItemsRepo.toggleVisibility(reward.id, !reward.visible);
      setFeedback({
        type: 'success',
        message: reward.visible ? '已隐藏该奖励' : '奖励已重新上架',
      });
      await refreshRewards();
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: '更新可见状态失败，请稍后重试' });
    } finally {
      setActioningRewardId(null);
    }
  };

  const handleDeleteReward = async (reward: RewardItem) => {
    const confirmed = window.confirm(`确定要删除【${reward.name}】吗？该操作不可撤销。`);
    if (!confirmed) return;
    setActioningRewardId(reward.id);
    try {
      await rewardItemsRepo.remove(reward.id);
      setFeedback({ type: 'success', message: '奖励已删除' });
      await refreshRewards();
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: '删除奖励失败，请稍后再试' });
    } finally {
      setActioningRewardId(null);
    }
  };

  const handleCloseEditor = () => {
    if (savingReward) return;
    setIsEditorOpen(false);
    setEditingReward(null);
  };

  return (
    <>
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
          {activeStudent ? (
            <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
              <StudentAvatar
                name={activeStudent.name ?? '勇士'}
                avatarUrl={activeStudent.avatarUrl}
                avatarPresetId={activeStudent.avatarPresetId}
                equippedVirtualItems={activeStudent.equippedVirtualItems}
                size="md"
                className="shadow-lg"
              />
              <div className="space-y-1 text-xs">
                <p className="text-sm font-semibold text-white">{activeStudent.name}</p>
                <p className="text-white/80">
                  虚拟配件 {activeStudent.virtualInventory?.length ?? 0} · 已装备{' '}
                  {activeStudent.equippedVirtualItems?.length ?? 0}
                </p>
              </div>
            </div>
          ) : null}
          <Combobox value={selectedStudentId} onChange={(value: string) => setSelectedStudentId(value)}>
            <div className="relative">
              <Combobox.Input
                className="w-full rounded-xl border border-white/30 bg-white/20 p-3 text-base font-semibold text-white shadow-inner placeholder:text-white/60 focus:border-white focus:outline-none"
                displayValue={(id: string) => students.find((student) => student.id === id)?.name ?? ''}

                

                  onChange={(event) => setStudentQuery(event.target.value)}
                  placeholder="输入姓名或手机号搜索"
                  autoComplete="off"
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/70">

                  
                  <ChevronsUpDown className="h-4 w-4" aria-hidden />

                </Combobox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  afterLeave={() => setStudentQuery('')}
                >
                  <Combobox.Options className="absolute z-30 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-violet-100 bg-white p-2 text-sm shadow-xl">
                    {filteredStudents.length === 0 ? (
                      <div className="px-3 py-2 text-slate-500">未找到匹配的勇士</div>
                    ) : (
                      filteredStudents.map((student) => (
                        <Combobox.Option
                          key={student.id}
                          value={student.id}
                          className={({ active }) =>
                            classNames(
                              'flex cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2',
                              active ? 'bg-violet-100 text-violet-700' : 'text-slate-700',
                            )
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span>{student.name}</span>
                              {selected ? <Check className="h-4 w-4 text-violet-600" aria-hidden /> : null}
                            </>
                          )}
                        </Combobox.Option>
                      ))
                    )}
                  </Combobox.Options>
                </Transition>
              </div>
            </Combobox>
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

      <div className="rounded-3xl border border-dashed border-violet-200 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">奖励池管理</h2>
            <p className="mt-1 text-sm text-slate-500">在此增删改查奖励，支持自定义积分、能量和实物图片。</p>
          </div>
          <button
            type="button"
            onClick={handleCreateReward}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-violet-600 hover:to-fuchsia-600"
          >
            <Plus className="h-4 w-4" aria-hidden /> 新建奖励
          </button>
        </div>
        {rewards.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            当前暂无奖励，点击“新建奖励”开始配置。
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-3 py-3">奖励</th>
                  <th scope="col" className="px-3 py-3">类型</th>
                  <th scope="col" className="px-3 py-3">积分 / 能量</th>
                  <th scope="col" className="px-3 py-3">库存</th>
                  <th scope="col" className="px-3 py-3">状态</th>
                  <th scope="col" className="px-3 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rewards.map((reward) => {
                  const isProcessing = actioningRewardId === reward.id;
                  return (
                    <tr key={reward.id} className="align-top">
                      <td className="whitespace-nowrap px-3 py-3 pr-6">
                        <div className="flex items-center gap-3">

                          

                          <RewardArtwork
                            reward={reward}
                            variant="table"
                            className="h-12 w-12 rounded-xl border border-slate-200 bg-white"
                          />

                          

                          <div className="min-w-0">
                            <div className="font-medium text-slate-800">{reward.name}</div>
                            <div className="text-xs text-slate-400">{reward.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-600">{TYPE_LABELS[reward.type]}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                        {reward.costScore} 积分
                        {reward.costEnergy ? <span className="text-xs text-slate-400"> · {reward.costEnergy} 能量</span> : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                        {reward.stock !== undefined && reward.stock !== null ? reward.stock : '不限'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span
                          className={classNames(
                            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
                            reward.visible ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500',
                          )}
                        >
                          {reward.visible ? '展示中' : '已下架'}
                          {reward.featured ? <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-600">精选</span> : null}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditReward(reward)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-violet-200 hover:text-violet-600"
                          >
                            <Edit3 className="h-4 w-4" aria-hidden />
                            <span className="sr-only">编辑</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleRewardVisibility(reward)}
                            disabled={isProcessing}
                            className={classNames(
                              'inline-flex items-center justify-center rounded-lg border p-2 transition',
                              reward.visible
                                ? 'border-amber-200 bg-amber-50 text-amber-600 hover:border-amber-300 hover:text-amber-700'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-300 hover:text-emerald-700',
                              isProcessing ? 'opacity-60' : '',
                            )}
                          >
                            {reward.visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                            <span className="sr-only">{reward.visible ? '下架' : '上架'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReward(reward)}
                            disabled={isProcessing}
                            className={classNames(
                              'inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-500 transition hover:border-rose-300 hover:text-rose-600',
                              isProcessing ? 'opacity-60' : '',
                            )}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                            <span className="sr-only">删除</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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

                    

                    <RewardArtwork
                      reward={reward}
                      className="h-40 w-full rounded-xl border border-slate-200 bg-white"
                    />

                    

                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-800">{reward.name}</h3>
                          {reward.featured && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600">精选</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{reward.description}</p>
                        {reward.virtualAssetId ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs text-violet-600">
                            🎨 兑换后自动装扮虚拟形象
                          </span>
                        ) : null}
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                        {TYPE_LABELS[reward.type]}
                      </span>
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
              const rewardAsset = reward?.virtualAssetId ? getVirtualAssetById(reward.virtualAssetId) : undefined;
              const exchangeStudent = students.find((student) => student.id === exchange.studentId);
              return (
                <div key={exchange.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <StudentAvatar
                        name={exchangeStudent?.name ?? '勇士'}
                        avatarUrl={exchangeStudent?.avatarUrl}
                        avatarPresetId={exchangeStudent?.avatarPresetId}
                        equippedVirtualItems={exchangeStudent?.equippedVirtualItems}
                        size="sm"
                      />
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-700">{reward?.name ?? '奖励'}</div>
                        <div className="text-xs text-slate-400">
                          {formatDate(exchange.redeemedAt)} · {exchangeStudent?.name ?? '勇士'}
                        </div>
                      </div>
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
                  <div className="mt-4 grid gap-3 sm:grid-cols-[auto,1fr]">
                    {reward ? (
                      <RewardArtwork
                        reward={reward}
                        variant="form"
                        className="h-24 w-24 rounded-xl border border-slate-200 bg-white"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-lg text-slate-400">
                        🎁
                      </div>
                    )}
                    <div className="space-y-2 text-xs text-slate-500">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                          积分 {exchange.costScore}
                        </span>
                        {exchange.costEnergy ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                            能量 {exchange.costEnergy}
                          </span>
                        ) : null}
                        {rewardAsset ? (
                          <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-600">
                            已同步虚拟形象
                          </span>
                        ) : null}
                      </div>
                      <p className="leading-relaxed">
                        {rewardAsset
                          ? `${exchangeStudent?.name ?? '勇士'} 的虚拟形象已解锁「${rewardAsset.name}」，可在头像中实时查看效果。`
                          : '教练确认后即可在“奖励池管理”中查看发放备注。'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>

      <RewardEditorDialog
        open={isEditorOpen}
        onClose={handleCloseEditor}
        onSubmit={handleRewardSaved}
        initialReward={editingReward}
        isSaving={savingReward}
      />
    </>
  );
}

interface RewardEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reward: RewardItem) => Promise<void>;
  initialReward: RewardItem | null;
  isSaving: boolean;
}

type RewardFormValues = {
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
  featured: boolean;
};

function toFormValues(reward: RewardItem | null): RewardFormValues {
  return {
    name: reward?.name ?? '',
    type: reward?.type ?? 'physical',
    costScore: reward?.costScore ?? 0,
    costEnergy: reward?.costEnergy,
    stock: reward?.stock,
    description: reward?.description ?? '',
    imageUrl: reward?.imageUrl ?? '',

    
    virtualAssetId: reward?.virtualAssetId,

    visible: reward?.visible ?? true,
    levelLimit: reward?.levelLimit,
    seasonTag: reward?.seasonTag ?? '',
    featured: reward?.featured ?? false,
  };
}

function RewardEditorDialog({ open, onClose, onSubmit, initialReward, isSaving }: RewardEditorDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,

    
    setValue,
    setError,

    formState: { errors },
  } = useForm<RewardFormValues>({
    defaultValues: toFormValues(initialReward),
  });


  
  const selectedType = watch('type');
  const virtualAssetId = watch('virtualAssetId');
  const imagePreview = watch('imageUrl');


  useEffect(() => {
    if (open) {
      reset(toFormValues(initialReward));
    }
  }, [initialReward, open, reset]);


  

  useEffect(() => {
    if (selectedType === 'virtual') {
      setValue('imageUrl', '');
    } else {
      setValue('virtualAssetId', undefined);
    }
  }, [selectedType, setValue]);


  
  const selectedAsset = getVirtualAssetById(virtualAssetId);


  const submitForm = handleSubmit(async (values) => {
    const normalizeOptionalNumber = (value: number | undefined) => {
      if (value === undefined || Number.isNaN(value)) return undefined;
      return Math.max(0, Math.round(value));
    };


    

    if (values.type === 'virtual' && !values.virtualAssetId) {
      setError('virtualAssetId', { type: 'manual', message: '请选择一个虚拟配件' });
      return;
    }


        

    const payload: RewardItem = {
      id: initialReward?.id ?? uuidv4(),
      name: values.name.trim(),
      type: values.type,
      costScore: Math.max(0, Math.round(values.costScore ?? 0)),
      costEnergy: normalizeOptionalNumber(values.costEnergy),
      stock: normalizeOptionalNumber(values.stock),
      description: values.description.trim(),

        

      imageUrl:
        values.type === 'virtual'
          ? undefined
          : values.imageUrl?.trim()
          ? values.imageUrl.trim()
          : undefined,
      virtualAssetId: values.type === 'virtual' ? values.virtualAssetId : undefined,

        

      visible: values.visible,
      levelLimit: normalizeOptionalNumber(values.levelLimit),
      seasonTag: values.seasonTag?.trim() ? values.seasonTag.trim() : undefined,
      featured: values.featured,
    };

    await onSubmit(payload);
  });

  const typeEntries = Object.entries(TYPE_LABELS) as Array<[RewardItemType, string]>;

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="translate-y-4 opacity-0"
              enterTo="translate-y-0 opacity-100"
              leave="transition ease-in duration-150"
              leaveFrom="translate-y-0 opacity-100"
              leaveTo="translate-y-4 opacity-0"
            >
              <Dialog.Panel className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className={classNames(
                    'absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700',
                    isSaving ? 'opacity-60' : '',
                  )}
                >
                  <X className="h-4 w-4" aria-hidden />
                  <span className="sr-only">关闭</span>
                </button>

                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  {initialReward ? '编辑奖励' : '新建奖励'}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-slate-500">
                  自定义奖励名称、积分与实物图片，保存后将同步至兑换商城。
                </Dialog.Description>

                <form onSubmit={submitForm} className="mt-6 space-y-6">

                  
                  <input type="hidden" {...register('virtualAssetId')} />

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">奖励名称</label>
                        <input
                          type="text"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-violet-500 focus:bg-white focus:outline-none"
                          placeholder="输入奖励名称"
                          {...register('name', { required: '请输入奖励名称' })}
                        />
                        {errors.name ? <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p> : null}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">奖励类型</label>
                        <select
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-violet-500 focus:bg-white focus:outline-none"
                          {...register('type')}
                        >
                          {typeEntries.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-slate-700">兑换积分</label>
                          <input
                            type="number"
                            min={0}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-violet-500 focus:bg-white focus:outline-none"
                            {...register('costScore', {
                              required: '请填写积分',
                              valueAsNumber: true,
                              setValueAs: (value) => (value === '' ? 0 : Number(value)),
                              validate: (value) => (value ?? 0) >= 0 || '积分不可为负',
                            })}
                          />
                          {errors.costScore ? <p className="mt-1 text-xs text-rose-500">{errors.costScore.message}</p> : null}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">消耗能量 (可选)</label>
                          <input
                            type="number"
                            min={0}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-violet-500 focus:bg-white focus:outline-none"
                            {...register('costEnergy', {
                              valueAsNumber: true,
                              setValueAs: (value) => (value === '' ? undefined : Number(value)),
                              validate: (value) => value === undefined || value >= 0 || '能量不可为负',
                            })}
                          />
                          {errors.costEnergy ? <p className="mt-1 text-xs text-rose-500">{errors.costEnergy.message}</p> : null}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-slate-700">库存数量 (可选)</label>
                          <input
                            type="number"
                            min={0}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-violet-500 focus:bg-white focus:outline-none"
                            {...register('stock', {
                              valueAsNumber: true,
                              setValueAs: (value) => (value === '' ? undefined : Number(value)),
                              validate: (value) => value === undefined || value >= 0 || '库存不可为负',
                            })}
                          />
                          {errors.stock ? <p className="mt-1 text-xs text-rose-500">{errors.stock.message}</p> : null}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">建议段位 (可选)</label>
                          <input
                            type="number"
                            min={0}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-violet-500 focus:bg-white focus:outline-none"
                            {...register('levelLimit', {
                              valueAsNumber: true,
                              setValueAs: (value) => (value === '' ? undefined : Number(value)),
                              validate: (value) => value === undefined || value >= 0 || '段位不可为负',
                            })}
                          />
                          {errors.levelLimit ? <p className="mt-1 text-xs text-rose-500">{errors.levelLimit.message}</p> : null}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">赛季标签 (可选)</label>
                        <input
                          type="text"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-violet-500 focus:bg-white focus:outline-none"
                          placeholder="如 春季·精英赛"
                          {...register('seasonTag')}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">

                      

                      {selectedType === 'virtual' ? (
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                            <label className="text-sm font-medium text-slate-700">虚拟形象配件</label>
                            <span className="text-xs text-violet-500">兑换后将自动作用于勇士的虚拟形象</span>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {VIRTUAL_WARDROBE.map((asset) => {
                              const active = virtualAssetId === asset.id;
                              return (
                                <button
                                  type="button"
                                  key={asset.id}
                                  onClick={() => setValue('virtualAssetId', asset.id, { shouldDirty: true, shouldValidate: true })}
                                  className={classNames(
                                    'relative flex flex-col gap-2 rounded-2xl border bg-white p-3 text-left transition shadow-sm hover:border-violet-200 hover:shadow-md',
                                    active ? 'border-violet-300 ring-2 ring-violet-200' : 'border-slate-200',
                                  )}
                                >
                                  <VirtualAssetPreview asset={asset} variant="form" className="h-28 w-full" />
                                  <div className="space-y-1">
                                    <p className="text-sm font-semibold text-slate-800">{asset.name}</p>
                                    <p className="text-xs text-slate-500">{asset.description}</p>
                                  </div>
                                  <span className="text-[10px] font-medium text-slate-400">{asset.categoryLabel}</span>
                                  {active ? (
                                    <span className="absolute right-3 top-3 rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-semibold text-white">已选择</span>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                          {errors.virtualAssetId ? (
                            <p className="text-xs text-rose-500">{errors.virtualAssetId.message}</p>
                          ) : (
                            <p className="text-xs text-slate-500">系统将生成 SVG 配件并同步到勇士的虚拟形象中，无需额外上传图片。</p>
                          )}
                        </div>
                      ) : null}

                      

                      <div>
                        <label className="text-sm font-medium text-slate-700">奖励描述</label>
                        <textarea
                          rows={5}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-violet-500 focus:bg-white focus:outline-none"
                          placeholder="补充奖励亮点或使用说明"
                          {...register('description', { required: '请填写奖励描述' })}
                        />
                        {errors.description ? <p className="mt-1 text-xs text-rose-500">{errors.description.message}</p> : null}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">图片链接 (可选)</label>
                        <input
                          type="url"

                          

                          disabled={selectedType === 'virtual'}
                          className={classNames(
                            'mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm focus:border-violet-500 focus:bg-white focus:outline-none',
                            selectedType === 'virtual' ? 'cursor-not-allowed border-dashed border-slate-200 text-slate-400' : 'border-slate-200',
                          )}
                          placeholder={selectedType === 'virtual' ? '虚拟配件已自动生成，无需上传图片' : '粘贴奖励图片地址'}
                          {...register('imageUrl')}
                        />
                        <p className="mt-1 text-xs text-slate-400">
                          {selectedType === 'virtual'
                            ? '虚拟奖励将展示系统生成的 SVG 形象，兑换后立即同步到勇士头像。'
                            : '支持使用 CDN 或网盘公开链接，实物奖励可展示真实照片。'}
                        </p>
                      </div>

                      <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                        {selectedType === 'virtual' && selectedAsset ? (
                          <VirtualAssetPreview asset={selectedAsset} variant="card" className="h-full w-full" />
                        ) : imagePreview ? (

                          

                          <img src={imagePreview} alt="奖励图片预览" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <ImageIcon className="h-10 w-10" aria-hidden />

                            
                            <span className="text-xs">{selectedType === 'virtual' ? '请选择一个虚拟配件预览效果' : '粘贴图片链接后即可预览'}</span>

                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                        <p className="font-medium text-slate-600">配置提示</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                          <li>积分和能量会自动取整并防止负数。</li>
                          <li>未填写库存则表示不限量兑换。</li>
                          <li>更改类型为 {TYPE_LABELS[selectedType]} 时，卡片标识将自动更新。</li>

                          
                          <li>虚拟配件由系统生成 SVG，确保可直接作用于勇士虚拟形象。</li>

                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          {...register('visible')}
                        />
                        上架展示
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          {...register('featured')}
                        />
                        标记为精选
                      </label>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className={classNames(
                          'rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-700',
                          isSaving ? 'opacity-60' : '',
                        )}
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={classNames(
                          'rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-violet-600 hover:to-fuchsia-600',
                          isSaving ? 'opacity-60' : '',
                        )}
                      >
                        {isSaving ? '保存中...' : '保存奖励'}
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>

      

  );
}

function RewardArtwork({
  reward,
  className,
  variant = 'card',
}: {
  reward: RewardItem;
  className?: string;
  variant?: RewardArtworkVariant;
}) {
  const asset = reward.virtualAssetId ? getVirtualAssetById(reward.virtualAssetId) : undefined;

  if (reward.imageUrl) {
    return (
      <div className={classNames('relative overflow-hidden rounded-2xl bg-slate-50', className)}>
        <img src={reward.imageUrl} alt={`${reward.name} 奖励图`} className="h-full w-full object-cover" />
      </div>
    );
  }

  if (asset) {
    return <VirtualAssetPreview asset={asset} variant={variant} className={className} />;
  }

  return (
    <div
      className={classNames(
        'flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 via-white to-slate-50 text-2xl text-slate-500',
        className,
      )}
    >
      <span>{TYPE_ICONS[reward.type]}</span>

      
    </div>
  );
}

function VirtualAssetPreview({
  asset,
  className,
  variant = 'card',
}: {
  asset: VirtualAsset;
  className?: string;
  variant?: RewardArtworkVariant;
}) {
  const paddingMap: Record<RewardArtworkVariant, string> = {
    card: 'p-5',
    form: 'p-3',
    table: 'p-2',
  };
  const sizeMap: Record<RewardArtworkVariant, 'lg' | 'md' | 'sm'> = {
    card: 'lg',
    form: 'md',
    table: 'sm',
  };
  const labelClassMap: Record<RewardArtworkVariant, string> = {
    card: 'bottom-3 left-3 text-[10px]',
    form: 'bottom-2 left-2 text-[10px]',
    table: 'bottom-1 left-1 text-[9px]',
  };

  return (
    <div
      className={classNames(
        'relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner',
        paddingMap[variant],
        className,
      )}
    >
      <div className={classNames('absolute inset-0 opacity-80', `bg-gradient-to-br ${asset.previewGradient}`)} aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.65),rgba(255,255,255,0))]" aria-hidden />
      <StudentAvatar name={`虚拟配件-${asset.name}`} size={sizeMap[variant]} avatarPresetId={undefined} equippedVirtualItems={[asset.id]} />
      <span
        className={classNames(
          'absolute rounded-full bg-white/85 px-2 py-0.5 font-medium text-slate-500 shadow-sm backdrop-blur',
          labelClassMap[variant],
        )}
      >
        虚拟形象
      </span>

    </div>

  );
}

