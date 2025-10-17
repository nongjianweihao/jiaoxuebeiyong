export type VirtualAssetCategory = 'headgear' | 'aura' | 'badge';
export type VirtualAssetAvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface VirtualAsset {
  id: string;
  name: string;
  category: VirtualAssetCategory;
  categoryLabel: string;
  description: string;
  previewGradient: string;
  previewIcon: string;
  overlay: (options: { size: VirtualAssetAvatarSize }) => JSX.Element;
}

export const VIRTUAL_WARDROBE: VirtualAsset[] = [
  {
    id: 'aurora-crown',
    name: '极光冠冕',
    category: 'headgear',
    categoryLabel: '头饰',
    description: '为勇士带来北境极光的守护，象征荣耀与专注。',
    previewGradient: 'from-amber-200 via-rose-300 to-violet-400',
    previewIcon: '👑',
    overlay: () => (
      <span className="pointer-events-none absolute inset-0 flex items-start justify-center">
        <svg
          viewBox="0 0 120 80"
          className="h-[58%] w-[78%] -translate-y-[26%] drop-shadow-[0_4px_10px_rgba(244,114,182,0.45)]"
          aria-hidden
        >
          <defs>
            <linearGradient id="aurora-crown-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="45%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <filter id="aurora-glow" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M15 60 L30 25 L45 55 L60 18 L75 55 L90 25 L105 60 Z"
            fill="url(#aurora-crown-gradient)"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="4"
            strokeLinejoin="round"
            filter="url(#aurora-glow)"
          />
          <circle cx="20" cy="48" r="6" fill="rgba(255,255,255,0.85)" />
          <circle cx="100" cy="48" r="6" fill="rgba(255,255,255,0.85)" />
          <circle cx="60" cy="32" r="8" fill="rgba(255,255,255,0.9)" />
        </svg>
      </span>
    ),
  },
  {
    id: 'nebula-wings',
    name: '星云幻翼',
    category: 'aura',
    categoryLabel: '背饰',
    description: '挥动能量双翼，留下星云轨迹，提升勇士存在感。',
    previewGradient: 'from-sky-200 via-purple-300 to-emerald-300',
    previewIcon: '🪽',
    overlay: () => (
      <span className="pointer-events-none absolute inset-0 -z-10">
        <span className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_20%_20%,rgba(125,211,252,0.45),rgba(14,165,233,0)_55%),radial-gradient(circle_at_80%_20%,rgba(192,132,252,0.45),rgba(192,132,252,0)_55%),radial-gradient(circle_at_50%_80%,rgba(45,212,191,0.45),rgba(45,212,191,0)_65%)] blur-[10px]" />
        <span className="absolute inset-0 rounded-[32px] border border-white/20" />
        <span className="absolute inset-2 rounded-[28px] border border-white/10" />
      </span>
    ),
  },
  {
    id: 'valor-badge',
    name: '勇气勋章',
    category: 'badge',
    categoryLabel: '胸章',
    description: '专属胸前徽记，记录勇士在成长旅程中的关键突破。',
    previewGradient: 'from-amber-200 via-orange-300 to-rose-400',
    previewIcon: '🏅',
    overlay: () => (
      <span className="pointer-events-none absolute right-[12%] top-[52%] flex h-[28%] w-[28%] -translate-y-1/2 items-center justify-center">
        <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="valor-ribbon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="50%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
            <linearGradient id="valor-medal" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#fff7ed" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
          </defs>
          <path d="M30 0 L50 0 L58 28 L22 28 Z" fill="url(#valor-ribbon)" />
          <circle cx="40" cy="50" r="24" fill="url(#valor-medal)" stroke="rgba(244,114,182,0.7)" strokeWidth="4" />
          <path
            d="M40 30 L46 46 H62 L49 56 L54 72 L40 62 L26 72 L31 56 L18 46 H34 Z"
            fill="rgba(244,114,182,0.9)"
            stroke="white"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    ),
  },
];

export function getVirtualAssetById(id?: string | null) {
  if (!id) return undefined;
  return VIRTUAL_WARDROBE.find((asset) => asset.id === id);
}
