
import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { BRANDING } from '../config/branding';

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
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">


      <aside
        className="hidden w-72 flex-col border-r border-white/40 bg-gradient-to-b from-blue-600 via-purple-600 to-pink-600 p-6 text-white shadow-xl lg:flex"
      >
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
          <img
            src={BRANDING.logoUrl}
            alt={BRANDING.organization}
            className="h-12 w-12 rounded-full border border-white/60 bg-white/80 object-contain"
          />
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold">{BRANDING.organization}</h1>
            <p className="text-xs text-white/80">{BRANDING.tagline}</p>
          </div>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-2 text-left text-sm">


          {navigation.map((item) => {
            const isActive = item.match ? item.match(pathname) : pathname.startsWith(item.to);
            return (
              <Link
                key={`${item.label}-${item.to}`}
                to={item.to}
                className={`group flex flex-col rounded-2xl px-4 py-3 transition-all hover:bg-white/20 ${
                  isActive ? 'bg-white/20 shadow-lg shadow-purple-500/30' : 'text-white/90'
                }`}
              >
                <span className="flex items-center gap-3 text-base font-semibold">
                  <span className="text-xl" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </span>
                <span className="mt-1 text-xs text-white/70">{item.description}</span>
              </Link>
            );
          })}
        </nav>
        <div className="rounded-2xl bg-white/15 p-4 text-xs text-white/80 backdrop-blur">
          <p className="font-semibold">AI 任务提示</p>
          <p className="mt-1 leading-relaxed">根据勇士表现生成挑战，完成后即可领取能量值与星星奖励。</p>


          <div className="mt-4 space-y-1 text-[11px]">
            {BRANDING.website && (
              <p>
                官网：
                <a
                  href={BRANDING.website}
                  className="text-white underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {BRANDING.website.replace(/^https?:\/\//, '')}
                </a>
              </p>
            )}
            {BRANDING.phone && <p>热线：{BRANDING.phone}</p>}
          </div>


        </div>
      </aside>

      <main className="flex-1 overflow-y-auto w-full p-6 lg:p-10">


        <div className="mb-6 grid gap-3 lg:hidden">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <img
                src={BRANDING.logoUrl}
                alt={BRANDING.organization}
                className="h-12 w-12 rounded-full border border-white/60 bg-white/80 object-contain"
              />
              <div>
                <h1 className="text-lg font-bold">{BRANDING.organization}</h1>
                <p className="text-xs text-white/80">{BRANDING.tagline}</p>
              </div>
            </div>
          </div>
          <nav className="flex snap-x gap-2 overflow-x-auto pb-2">


            {navigation.map((item) => {
              const isActive = item.match ? item.match(pathname) : pathname.startsWith(item.to);
              return (
                <Link
                  key={`${item.label}-${item.to}`}
                  to={item.to}
                  className={`snap-start rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white/80 text-slate-700 shadow'
                  }`}
                >
                  <span className="mr-2" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}

          </nav>
        </div>

        <div className="flex w-full flex-col gap-10">{children}</div>

      </main>
    </div>
  );
}
