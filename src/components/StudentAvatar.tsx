import clsx from 'classnames';
import { Fragment } from 'react';
import { DEFAULT_AVATAR_PRESET_ID, getAvatarPreset } from '../config/avatarPresets';
import { getVirtualAssetById } from '../config/virtualWardrobe';

const sizeMap = {
  xs: 'h-8 w-8 text-base',
  sm: 'h-10 w-10 text-xl',
  md: 'h-14 w-14 text-2xl',
  lg: 'h-20 w-20 text-3xl',
} as const;

export type StudentAvatarSize = keyof typeof sizeMap;

export interface StudentAvatarProps {
  name: string;
  avatarUrl?: string | null;
  avatarPresetId?: string | null;
  size?: StudentAvatarSize;
  className?: string;
  badge?: React.ReactNode;
  equippedVirtualItems?: string[] | null;
}

function getInitials(name: string) {
  if (!name) return '勇';
  const trimmed = name.trim();
  if (!trimmed) return '勇';
  if (trimmed.length <= 2) return trimmed;
  return trimmed.slice(0, 2);
}

export function StudentAvatar({
  name,
  avatarUrl,
  avatarPresetId,
  size = 'sm',
  className,
  badge,
  equippedVirtualItems,
}: StudentAvatarProps) {
  const preset = getAvatarPreset(avatarPresetId ?? DEFAULT_AVATAR_PRESET_ID);
  const initials = getInitials(name);
  const overlays = (equippedVirtualItems ?? [])
    .map((itemId) => getVirtualAssetById(itemId))
    .filter((asset): asset is NonNullable<ReturnType<typeof getVirtualAssetById>> => Boolean(asset));

  return (
    <div className={clsx('relative inline-flex items-center justify-center rounded-2xl font-semibold shadow-inner', sizeMap[size], className)}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${name} 的头像`}
          className="h-full w-full rounded-2xl object-cover shadow"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-2xl text-white"
          style={{ background: preset.background }}
          aria-label={`${name} 的头像`}
        >
          <span className="drop-shadow-sm" aria-hidden="true">
            {preset.emoji || initials}
          </span>
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1 rounded-b-2xl opacity-90"
            style={{ backgroundColor: preset.accent }}
            aria-hidden="true"
          />
        </div>
      )}
      {!avatarUrl && !preset.emoji ? (
        <span className="pointer-events-none absolute text-base text-white/90" aria-hidden="true">
          {initials}
        </span>
      ) : null}
      {overlays.map((asset) => (
        <Fragment key={asset.id}>{asset.overlay({ size })}</Fragment>
      ))}
      {badge ? (
        <span className="absolute -bottom-1 -right-1 inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-slate-700 shadow-lg">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
