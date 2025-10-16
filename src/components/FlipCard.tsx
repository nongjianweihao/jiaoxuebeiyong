import classNames from 'classnames';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PuzzleCardStatus } from '../types.gamify';

const typeMeta = {
  speed: { label: '速度', color: 'from-amber-400 to-orange-500', chip: 'bg-amber-100 text-amber-700', icon: '⚡' },
  strength: { label: '力量', color: 'from-rose-400 to-pink-500', chip: 'bg-rose-100 text-rose-700', icon: '💪' },
  stamina: { label: '耐力', color: 'from-emerald-400 to-teal-500', chip: 'bg-emerald-100 text-emerald-700', icon: '🔋' },
  coordination: {
    label: '协调',
    color: 'from-violet-400 to-purple-500',
    chip: 'bg-violet-100 text-violet-700',
    icon: '🎯',
  },
  team: { label: '团队', color: 'from-sky-400 to-cyan-500', chip: 'bg-sky-100 text-sky-700', icon: '🤝' },
};

export interface FlipCardProps {
  id: string;
  title: string;
  type: keyof typeof typeMeta;
  stars: number;
  status: PuzzleCardStatus;
  skin: 'poem' | 'mosaic' | 'emoji' | 'math' | 'team';
  hint?: string;
  iconUrl?: string;
  fragmentText?: string;
  fragmentImageUrl?: string;
  reward?: {
    energy?: number;
    badge?: string;
    text?: string;
  };
  index?: number;
  total?: number;
  onFlip?: (id: string) => void;
}

export function FlipCard(props: FlipCardProps) {
  const {
    id,
    title,
    type,
    stars,
    status,
    skin,
    hint,
    iconUrl,
    fragmentText,
    fragmentImageUrl,
    reward,
    index,
    total,
    onFlip,
  } = props;

  const [localStatus, setLocalStatus] = useState<PuzzleCardStatus>(status);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== localStatus && localStatus !== 'flipping') {
      setLocalStatus(status);
    }
  }, [status, localStatus]);

  const canFlip = localStatus === 'available';
  const isFlipped = localStatus === 'flipped' || localStatus === 'completed';
  const isFlipping = localStatus === 'flipping';
  const meta = typeMeta[type];

  const handleFlip = () => {
    if (!canFlip) return;
    setLocalStatus('flipping');
    window.setTimeout(() => {
      setLocalStatus('flipped');
    }, 420);
    onFlip?.(id);
  };

  useEffect(() => {
    if (status === 'completed' && localStatus !== 'completed') {
      setLocalStatus('completed');
    }
  }, [status, localStatus]);

  const Stars = useMemo(() => {
    const active = Math.min(Math.max(stars, 0), 5);
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {'★'.repeat(active)}
        {'☆'.repeat(5 - active)}
      </div>
    );
  }, [stars]);

  return (
    <div
      ref={cardRef}
      className={classNames(
        'group relative h-56 w-full select-none transition-transform',
        "[perspective:1200px]",
        canFlip && 'cursor-pointer',
        canFlip && 'animate-[float_3s_ease-in-out_infinite]',
        localStatus === 'locked' && 'cursor-not-allowed grayscale opacity-70'
      )}
      onClick={handleFlip}
      aria-disabled={!canFlip}
    >
      <div
        className={classNames(
          'relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]',
          (isFlipping || isFlipped || status === 'completed') && '[transform:rotateY(180deg)]'
        )}
      >
        <div
          className={classNames(
            'absolute inset-0 grid h-full w-full grid-rows-[auto,1fr,auto] gap-2 rounded-3xl border border-white/40 bg-white/90 p-4 shadow-xl backdrop-blur',
            '[backface-visibility:hidden]'
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={classNames(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                meta.chip
              )}
            >
              <span className="text-base" aria-hidden>
                {meta.icon}
              </span>
              {meta.label}
            </span>
            {Stars}
          </div>

          <div className="relative flex items-center justify-center">
            <div
              className={classNames(
                'absolute inset-0 rounded-3xl opacity-30 blur-2xl',
                'bg-gradient-to-br',
                meta.color
              )}
            />
            {iconUrl ? (
              <img src={iconUrl} alt="" className="z-10 h-16 w-16 object-contain drop-shadow-lg" />
            ) : (
              <span className="z-10 text-6xl" aria-hidden>
                {meta.icon}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
            </div>
            <span
              className={classNames(
                'rounded-md px-2 py-1 text-[11px] font-semibold',
                canFlip
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow'
                  : 'bg-slate-100 text-slate-400'
              )}
            >
              {canFlip ? '轻触翻开' : localStatus === 'locked' ? '未解锁' : '已翻开'}
            </span>
          </div>

          <div className="pointer-events-none absolute -inset-6 opacity-0 transition group-hover:opacity-100">
            <div className="absolute -inset-6 rotate-12 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shine_1.6s_linear_infinite]" />
          </div>
        </div>

        <div
          className={classNames(
            'absolute inset-0 grid h-full w-full grid-rows-[auto,1fr,auto] rounded-3xl border border-white/40 bg-white/95 p-4 shadow-2xl backdrop-blur',
            '[transform:rotateY(180deg)] [backface-visibility:hidden]'
          )}
        >
          <SkinBackground skin={skin} colorClass={meta.color} />

          <div className="flex items-center justify-between">
            <span className="rounded-full bg-slate-900/80 px-2 py-1 text-xs font-semibold text-white">
              {index ?? 0}/{total ?? 0} 已翻
            </span>
            {reward?.badge && (
              <span className="rounded-full bg-amber-400/90 px-2 py-1 text-xs font-semibold text-slate-900">
                🏅 {reward.badge}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center px-2">
            {fragmentImageUrl ? (
              <img src={fragmentImageUrl} alt="" className="max-h-28 rounded-xl shadow-md" />
            ) : (
              <p
                className={classNames(
                  'text-center leading-relaxed text-slate-800',
                  skin === 'poem' && 'font-serif text-xl tracking-wide',
                  skin === 'emoji' && 'text-5xl',
                  skin === 'math' && 'font-mono text-lg'
                )}
              >
                {fragmentText}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              {reward?.energy != null && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-emerald-700">
                  ⚡ +{reward.energy}
                </span>
              )}
              {reward?.text && (
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-1 text-purple-700">
                  ✨ {reward.text}
                </span>
              )}
            </div>
            <span className="rounded-md bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 text-xs font-semibold text-white shadow">
              继续挑战
            </span>
          </div>
        </div>
      </div>

      {canFlip && (
        <span className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-purple-400/50 shadow-[0_0_24px_rgba(168,85,247,0.35)]" />
      )}
    </div>
  );
}

function SkinBackground({ skin, colorClass }: { skin: FlipCardProps['skin']; colorClass: string }) {
  if (skin === 'poem') {
    return (
      <>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(15,23,42,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(148,163,184,0.2),transparent_60%)] mix-blend-multiply" />
      </>
    );
  }
  if (skin === 'mosaic') {
    return <div className={classNames('absolute inset-0 rounded-3xl opacity-40 blur-lg bg-gradient-to-br', colorClass)} />;
  }
  if (skin === 'emoji') {
    return <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-yellow-200 via-pink-200 to-purple-200 opacity-60" />;
  }
  if (skin === 'math') {
    return (
      <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] bg-[size:18px_18px] opacity-70" />
    );
  }
  if (skin === 'team') {
    return <div className={classNames('absolute inset-0 rounded-3xl bg-gradient-to-br opacity-45', colorClass)} />;
  }
  return null;
}

