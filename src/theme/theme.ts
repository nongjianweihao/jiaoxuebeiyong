export type ThemeName = 'classic' | 'game';

const THEME_STORAGE_KEY = 'theme';
const DEFAULT_THEME: ThemeName = 'classic';

export function getStoredTheme(): ThemeName {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return saved === 'game' ? 'game' : DEFAULT_THEME;
}

export function setTheme(name: ThemeName) {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  if (name === 'game') {
    root.setAttribute('data-theme', 'game');
  } else {
    root.removeAttribute('data-theme');
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, name);
  }
}

export function initTheme(): ThemeName {
  const resolved = getStoredTheme();
  setTheme(resolved);
  return resolved;
}
