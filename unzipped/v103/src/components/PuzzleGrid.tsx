import { FlipCard, type FlipCardProps } from './FlipCard';

export type PuzzleGridCard = Omit<FlipCardProps, 'onFlip'>;

interface PuzzleGridProps {
  cards: PuzzleGridCard[];
  onFlip?: (cardId: string) => void;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

export function PuzzleGrid({ cards, onFlip, loading, title, subtitle }: PuzzleGridProps) {
  return (
    <section className="relative rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title ?? '主线任务进度'}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-600">
          已解锁 {cards.filter((card) => card.status === 'completed' || card.status === 'flipped').length}/{cards.length}
        </span>
      </header>

      {loading ? (
        <div className="grid h-48 place-content-center text-sm text-slate-500">加载中…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <FlipCard key={card.id} {...card} onFlip={() => onFlip?.(card.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

