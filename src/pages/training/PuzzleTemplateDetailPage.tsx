import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PuzzleGrid, type PuzzleGridCard } from '../../components/PuzzleGrid';
import { RewardBurst } from '../../components/RewardBurst';
import { puzzlesRepo } from '../../store/repositories/puzzlesRepo';
import type { PuzzleQuestInstance, PuzzleTemplate } from '../../types.gamify';

interface RewardState {
  cardId: string;
  timestamp: number;
  energy?: number;
  text?: string;
  badge?: string;
  awards?: Array<{ studentId?: string; energy: number }>;
}

const TEAM_PREVIEW_PARTICIPANTS = ['demo-alpha', 'demo-bravo', 'demo-charlie'];
const SOLO_PREVIEW_PARTICIPANTS = ['demo-solo'];

export function PuzzleTemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quest, setQuest] = useState<PuzzleQuestInstance | null>(null);
  const [template, setTemplate] = useState<PuzzleTemplate | null>(null);
  const [rewardState, setRewardState] = useState<RewardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'single' | 'team'>('single');

  useEffect(() => {
    if (!templateId) {
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const { quest: previewQuest, template: previewTemplate } = await puzzlesRepo.previewQuest(templateId);
        setQuest(previewQuest);
        setTemplate(previewTemplate);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('加载谜题失败，请返回资产库重试。');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [templateId]);

  const cards: PuzzleGridCard[] = useMemo(() => {
    if (!quest || !template) return [];
    return template.cards.map((card, index) => {
      const progress = quest.progress.find((item) => item.cardId === card.id);
      const status = progress?.status ?? 'locked';
      return {
        id: card.id,
        title: card.title,
        type: card.type,
        stars: card.difficulty ?? template.difficulty ?? 3,
        status,
        skin: card.skin ?? 'poem',
        hint: card.description,
        fragmentText: card.fragmentText,
        fragmentImageUrl: card.fragmentImageUrl,
        reward: card.reward,
        index: index + 1,
        total: template.cards.length,
      } satisfies PuzzleGridCard;
    });
  }, [quest, template]);

  const completedCount = quest?.progress.filter((item) => item.status === 'completed').length ?? 0;
  const isFinished = quest && completedCount === template?.cards.length && template?.cards.length;

  const participants = previewMode === 'team' ? TEAM_PREVIEW_PARTICIPANTS : SOLO_PREVIEW_PARTICIPANTS;

  const handleFlip = async (cardId: string) => {
    if (!quest) return;
    try {
      const { quest: updatedQuest, reward, awards } = await puzzlesRepo.flipCardInQuest(quest.id, cardId, participants);
      setQuest(updatedQuest);
      setRewardState({
        cardId,
        timestamp: Date.now(),
        energy: reward?.energy,
        text: reward?.text,
        badge: reward?.badge,
        awards,
      });
    } catch (err) {
      console.error(err);
      setError('翻牌失败，请重试。');
    }
  };

  const handleReset = async () => {
    if (!quest) return;
    const refreshed = await puzzlesRepo.resetQuest(quest.id);
    if (refreshed) {
      setQuest(refreshed);
      setRewardState(null);
    }
  };

  const handleBack = () => {
    navigate('/training-library?tab=puzzles');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-500"
          >
            ← 返回资产库
          </button>
          <div className="rounded-3xl border border-white/60 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/70">FlipQuest 主线谜题</p>
                <h1 className="mt-2 text-3xl font-black lg:text-4xl">{template?.name ?? '课堂主线谜题'}</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/80">
                  {template?.description ?? '完成课程中的关键环节即可翻开卡片，集齐所有碎片，揭晓整套主线奖励。'}
                </p>
                {template && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/80">
                    <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">
                      分类：{template.category.toUpperCase()}
                    </span>
                    <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">
                      难度 Lv.{template.difficulty ?? 3}
                    </span>
                    <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">
                      {template.totalCards} 张卡片 · {template.totalEnergy ?? template.cards.reduce((sum, card) => sum + (card.reward?.energy ?? 0), 0)}⚡
                    </span>
                    {template.recommendedScene && (
                      <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">推荐：{template.recommendedScene}</span>
                    )}
                    {template.recommendedAges && (
                      <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">适龄：{template.recommendedAges}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-end gap-6">
                <div className="text-right">
                  <p className="text-xs text-white/70">当前能量累积</p>
                  <p className="text-3xl font-bold">{quest?.energyEarned ?? 0}<span className="ml-1 text-sm">⚡</span></p>
                </div>
                <div className="hidden h-20 w-px bg-white/30 lg:block" aria-hidden />
                <div className="text-right">
                  <p className="text-xs text-white/70">已翻开卡牌</p>
                  <p className="text-3xl font-bold">{completedCount}/{template?.cards.length ?? 0}</p>
                </div>
              </div>
            </div>
            <RewardBurst triggerKey={rewardState?.timestamp ?? null} color="#fbbf24" />
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg">
          <h2 className="text-sm font-semibold text-slate-700">预览模式</h2>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setPreviewMode('single')}
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                previewMode === 'single' ? 'bg-brand-500 text-white shadow' : 'bg-slate-100 text-slate-600'
              }`}
            >
              单人翻牌
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('team')}
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                previewMode === 'team' ? 'bg-brand-500 text-white shadow' : 'bg-slate-100 text-slate-600'
              }`}
            >
              三人协作
            </button>
          </div>
          <p className="text-xs text-slate-500">
            {previewMode === 'team'
              ? '示例：3 名勇士共同完成此环节，卡牌能量将自动平分并记录到每位学员。'
              : '示例：单人完成任务，卡牌能量全部归属该学员。'}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            重置翻牌进度
          </button>
          <Link
            to="/templates"
            className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-100"
          >
            去挑战任务卡库绑定该谜题 →
          </Link>
        </div>
      </div>

      {error && <p className="rounded-xl bg-rose-100 px-4 py-3 text-sm text-rose-600">{error}</p>}

      <PuzzleGrid
        cards={cards}
        onFlip={handleFlip}
        loading={loading}
        title="课堂翻牌模拟"
        subtitle={template?.continueAcrossSessions ? '支持跨课延续的主线任务' : '本课内完成的主线任务'}
      />

      {rewardState?.awards && rewardState.awards.length > 0 && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-700 shadow-inner">
          <h3 className="text-base font-semibold">奖励分配明细</h3>
          <p className="mt-2 text-sm">
            本次翻牌合计 {rewardState.energy ?? 0}⚡，已为 {rewardState.awards.length} 名勇士记录能量。
          </p>
          <ul className="mt-3 space-y-1 text-xs">
            {rewardState.awards.map((award, index) => (
              <li key={`${award.studentId ?? 'unknown'}-${index}`}>#{index + 1} · {award.studentId ?? '未指定'} 获得 {award.energy}⚡</li>
            ))}
          </ul>
        </div>
      )}

      {quest?.scoreLog.length ? (
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">能量日志</h3>
              <p className="text-xs text-slate-500">翻牌奖励将同步至学员能量与排行榜。</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">
              共 {quest.scoreLog.length} 条记录
            </span>
          </header>
          <div className="grid gap-2 text-xs text-slate-600">
            {quest.scoreLog
              .slice()
              .reverse()
              .map((log, index) => (
                <div
                  key={`${log.cardId}-${index}`}
                  className="flex flex-wrap items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{log.reason}</span>
                    <span className="text-[11px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="text-slate-500">{log.studentId ?? '未指定'}</span>
                    <span className="text-emerald-600">+{log.delta}⚡</span>
                    {log.badge && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-600">🏅 {log.badge}</span>}
                  </div>
                </div>
              ))}
          </div>
        </section>
      ) : null}

      {isFinished && (
        <div className="rounded-3xl border border-purple-200 bg-purple-50 p-6 text-purple-700 shadow-inner">
          <h3 className="text-xl font-bold">🎉 主线谜题已全部解锁</h3>
          <p className="mt-2 text-sm">
            可以将该模板绑定到课程或战队挑战，真实课堂中翻开全部卡牌后，将自动触发能量加成与荣誉记录。
          </p>
        </div>
      )}
    </div>
  );
}

export default PuzzleTemplateDetailPage;
