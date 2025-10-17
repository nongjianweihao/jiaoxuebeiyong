import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { BRANDING } from '../config/branding';
import { ThemeToggle } from './ThemeToggle';

interface NavigationItem {
  to: string;
  label: string;
  icon: string;
  description: string;
  match?: (pathname: string) => boolean;
}

const navigation: NavigationItem[] = [
  {
    to: '/classes',
    label: '勇士训练营',
    icon: '🏕️',
    description: '签到 · 出勤 · 能量条',
    match: (pathname) => pathname === '/classes',
  },
  {
    to: '/classes',
    label: '教练作战台',
    icon: '🚀',
    description: '任务执行 · 能量记录',
    match: (pathname) => pathname.startsWith('/classes/') && pathname !== '/classes',
  },
  {
    to: '/squads',
    label: '战队挑战',
    icon: '🛡️',
    description: '组队闯关 · 互评公示',
    match: (pathname) => pathname.startsWith('/squads'),
  },
  {
    to: '/students',
    label: '勇士成长册',
    icon: '📘',
    description: '星级 · 勋章 · 成长轨迹',
    match: (pathname) => pathname.startsWith('/students'),
  },
  {
    to: '/market',
    label: '成长积分商店',
    icon: '💎',
    description: '积分兑换 · 奖励库存',
    match: (pathname) => pathname.startsWith('/market'),
  },
  {
    to: '/training-library',
    label: '训练资产库',
    icon: '📚',
    description: '体能素质 · 动作 · 挑战卡 · 周期',
    match: (pathname) => pathname.startsWith('/training-library'),
  },
  {
    to: '/assessments',
    label: '勇士试炼场',
    icon: '🏆',
    description: '段位挑战 · 能力评测',
    match: (pathname) => pathname.startsWith('/assessments') || pathname.startsWith('/reports'),
  },
  {
    to: '/retrospectives',
    label: '复盘智库',
    icon: '🧠',
    description: '课堂复盘 · 行动闭环',
    match: (pathname) => pathname.startsWith('/retrospectives'),
  },
  {
    to: '/finance',
    label: '成长指挥塔',
    icon: '🛰️',
    description: '课时能量 · 运营指标',
    match: (pathname) => pathname.startsWith('/finance'),
  },
  {
    to: '/settings/data',
    label: '数据管家',
    icon: '🗂️',
    description: '导出备份 · 导入迁移',
    match: (pathname) => pathname.startsWith('/settings/data'),
  },
];

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="app-shell flex min-h-screen text-text">
      <aside className="app-sidebar hidden w-72 lg:flex">
        <div className="sidebar-brand-card">
          <img src={BRANDING.logoUrl} alt={BRANDING.organization} />
          <div>
            <h1>{BRANDING.organization}</h1>
            <p>{BRANDING.tagline}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const isActive = item.match ? item.match(pathname) : pathname.startsWith(item.to);
            return (
              <Link
                key={`${item.label}-${item.to}`}
                to={item.to}
                className="sidebar-nav-item"
                data-active={isActive ? true : undefined}
              >
                <span className="sidebar-nav-topline">
                  <span className="sidebar-nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </span>
                <span className="sidebar-nav-description">{item.description}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-info">
          <p className="sidebar-info-title">AI Mission 提示</p>
          <p className="sidebar-info-body">根据勇士表现生成挑战，完成后即可领取能量值与星星奖励。</p>
          <div className="sidebar-info-meta">
            {BRANDING.website && (
              <p>
                官网：
                <a href={BRANDING.website} target="_blank" rel="noreferrer">
                  {BRANDING.website.replace(/^https?:\/\//, '')}
                </a>
              </p>
            )}
            {BRANDING.phone && <p>热线：{BRANDING.phone}</p>}
          </div>
        </div>

        <div className="sidebar-footer">
          <ThemeToggle />
        </div>
      </aside>

      <main className="app-main overflow-y-auto px-4 py-6 lg:px-10">
        <div className="mb-6 grid gap-3 lg:hidden">
          <div className="mobile-brand-card">
            <div className="flex items-center gap-3">
              <img
                src={BRANDING.logoUrl}
                alt={BRANDING.organization}
                className="h-12 w-12 rounded-full object-contain"
              />
              <div>
                <h1 className="text-lg font-semibold">{BRANDING.organization}</h1>
                <p className="text-xs">{BRANDING.tagline}</p>
              </div>
            </div>
          </div>
          <nav className="mobile-nav">
            {navigation.map((item) => {
              const isActive = item.match ? item.match(pathname) : pathname.startsWith(item.to);
              return (
                <Link
                  key={`mobile-${item.label}-${item.to}`}
                  to={item.to}
                  className="sidebar-nav-item"
                  data-active={isActive ? true : undefined}
                >
                  <span className="sidebar-nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>

        <div className="flex w-full flex-col gap-10 pb-10 lg:pb-16">{children}</div>
      </main>
    </div>
  );
}

export default Layout;
