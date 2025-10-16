import { useEffect, useMemo, useState } from 'react';
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
}

export function PuzzleQuestPage() {
  const [loading, setLoading] = useState(true);
  const [quest, setQuest] = useState<PuzzleQuestInstance | null>(null);
  const [template, setTemplate] = useState<PuzzleTemplate | null>(null);
  const [rewardState, setRewardState] = useState<RewardState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { quest: bootstrapQuest, template: bootstrapTemplate } = await puzzlesRepo.bootstrapDemoQuest();
        setQuest(bootstrapQuest);
        setTemplate(bootstrapTemplate);
      } catch (err) {
        console.error(err);
        setError('加载谜题时出现问题，请稍后再试。');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const cards: PuzzleGridCard[] = useMemo(() => {
    if (!quest || !template) return [];

    return template.cards.map((card, index) => {
      const progress = quest.progress.find((item) => item.cardId === card.id);
      const status = progress?.status ?? 'locked';
      return {
        id: card.id,
        title: card.title,
        type: card.type,
        stars: 3,
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

  const handleFlip = async (cardId: string) => {
    if (!quest) return;
    try {
      const { quest: updatedQuest, reward } = await puzzlesRepo.flipCardInQuest(quest.id, cardId, 'demo-student');
      setQuest(updatedQuest);
      setRewardState({
        cardId,
        timestamp: Date.now(),
        energy: reward?.energy,
        text: reward?.text,
        badge: reward?.badge,
      });
    } catch (err) {
      console.error(err);
      setError('翻牌失败，请重试。');
    }
  };

  const completedCount = cards.filter((card) => card.status === 'completed' || card.status === 'flipped').length;
  const isFinished = quest && completedCount === cards.length && cards.length > 0;

  return (
    <div className="relative flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/70">FlipQuest 主线谜题</p>
            <h1 className="mt-3 text-3xl font-black md:text-4xl">{template?.name ?? '课堂谜题挑战'}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              完成每项训练即可翻开一张卡，逐步拼出完整的诗句或能量图腾。坚持到最后，全班能量将被彻底点亮！
            </p>
          </div>
          <div className="flex items-end gap-4">
            <div className="text-right">
              <p className="text-xs text-white/70">当前能量累积</p>
              <p className="text-3xl font-bold">{quest?.energyEarned ?? 0}<span className="ml-1 text-sm">⚡</span></p>
            </div>
            <div className="hidden h-20 w-px bg-white/30 md:block" aria-hidden />
            <div className="text-right">
              <p className="text-xs text-white/70">已翻开卡牌</p>
              <p className="text-3xl font-bold">{completedCount}/{cards.length || 0}</p>
            </div>
          </div>
        </div>
        <RewardBurst triggerKey={rewardState?.timestamp ?? null} color="#fbbf24" />
        <div className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" aria-hidden />
      </div>

      {error && <p className="rounded-xl bg-rose-100 px-4 py-3 text-sm text-rose-600">{error}</p>}

      <PuzzleGrid
        cards={cards}
        onFlip={handleFlip}
        loading={loading}
        title="课堂翻牌进度"
        subtitle={quest?.continueAcrossSessions ? '可跨课延续的主线任务' : '本课内完成的主线任务'}
      />

      {isFinished && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-700 shadow-inner">
          <h3 className="text-xl font-bold">🎉 恭喜！主线谜题已全部解锁</h3>
          <p className="mt-2 text-sm">
            全班勇士共同完成了本次 FlipQuest，能量图腾已经被完全点亮。你可以在战队挑战中发起新的副本，或将成果同步到成长册。
          </p>
        </div>
      )}
    </div>
  );
}

