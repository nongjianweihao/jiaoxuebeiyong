import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(process.cwd());

function requireContent(path, keywords) {
  const filePath = resolve(projectRoot, path);
  const content = readFileSync(filePath, 'utf-8');
  const missing = keywords.filter((keyword) => !content.includes(keyword));
  if (missing.length > 0) {
    throw new Error(`文件 ${path} 缺少关键字：${missing.join(', ')}`);
  }
}

try {
  requireContent('tailwind.config.cjs', ['bg: \'rgb(var(--bg)', 'backgroundImage', 'grad-primary']);
  requireContent('src/styles/theme.css', ['--bg:', '--surface:', '--primary:', '[data-theme']);
  requireContent('src/theme/theme.ts', ['export type ThemeName', 'setTheme', 'initTheme']);
  console.log('✅ 设计令牌与主题配置检查通过');
} catch (error) {
  console.error('❌ 设计令牌检查失败');
  console.error(error.message);
  process.exit(1);
}
