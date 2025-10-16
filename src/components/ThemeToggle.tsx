import { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { getStoredTheme, setTheme, type ThemeName } from '../theme/theme';

const LABEL = {
  classic: {
    icon: '🎮',
    headline: 'Game 深色界面',
  },
  game: {
    icon: '🌤️',
    headline: 'Classic 浅色界面',
  },
} satisfies Record<ThemeName, { icon: string; headline: string }>;

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeName>(() => getStoredTheme());

  useEffect(() => {
    setTheme(mode);
  }, [mode]);

  const handleToggle = () => {
    setMode((prev) => (prev === 'classic' ? 'game' : 'classic'));
  };

  const nextMode: ThemeName = mode === 'classic' ? 'game' : 'classic';

  return (
    <Button type="button" intent="ghost" onClick={handleToggle} className="theme-toggle" aria-pressed={mode === 'game'}>
      <span className="theme-toggle-icon" aria-hidden>
        {LABEL[nextMode].icon}
      </span>
      <span className="theme-toggle-label">
        <span>NEXT THEME</span>
        <span>{LABEL[nextMode].headline}</span>
      </span>
    </Button>
  );
}

export default ThemeToggle;
