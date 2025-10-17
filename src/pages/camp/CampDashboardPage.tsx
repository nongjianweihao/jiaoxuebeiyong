import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const warriorStats = [
  { label: '今日签到', value: '28 / 30', description: '勇士按时抵达训练营', gradientVar: '--stat-gradient-attendance' },
  { label: '能量条均值', value: '82%', description: '连续打卡提升基础能量', gradientVar: '--stat-gradient-energy' },
  { label: '积分池', value: '3,420', description: '本周闯关累计积分', gradientVar: '--stat-gradient-points' },
];

const growthHighlights = [
  {
    title: '勇士晨练激活',
    detail: 'Speed 组 12 位勇士完成极速反应挑战，解锁双倍能量奖励。',
    tag: 'Speed',
  },
  {
    title: '团队协作加成',
    detail: 'Team 任务「同步节奏接力」完成率达 95%，新增团队荣誉徽章 3 枚。',
    tag: 'Team',
  },
  {
    title: 'AI 推送提醒',
    detail: 'AI Mission 推荐 6 项任务卡，覆盖 Strength 与 Stamina 关键能力。',
    tag: 'AI',
  },
];

export function CampDashboardPage() {
  return (
    <div className="space-y-8">
      <Card className="hero-card p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="tracking-[0.35em] text-xs text-mute/80 uppercase">Warrior Camp</p>
            <h1 className="text-3xl font-bold text-text">勇士训练营成长面板</h1>
            <p className="max-w-xl text-sm text-mute">
              追踪签到、出勤、能量条状态，让每一天的成长都能被看见。
            </p>
          </div>
          <Button intent="primary" className="mt-2 w-full justify-center md:mt-0 md:w-auto">
            生成勇士成长报告
          </Button>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-3">
        {warriorStats.map((item) => (
          <Card key={item.label} className="stat-card overflow-hidden p-6">
            <div
              className="absolute inset-0"
              style={{ background: `var(${item.gradientVar})`, opacity: 0.35 }}
              aria-hidden="true"
            />
            <div className="relative flex h-full flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-mute/80">
                {item.label}
              </span>
              <span className="mt-4 text-3xl font-bold text-text">{item.value}</span>
              <span className="mt-auto text-sm text-mute">{item.description}</span>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-text">成长脉冲</h2>
            <span className="chip-badge">实时刷新</span>
          </div>
          <ul className="space-y-4">
            {growthHighlights.map((highlight) => (
              <li key={highlight.title} className="glass-tile p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-text">{highlight.title}</h3>
                  <span className="chip-badge" style={{ background: 'var(--highlight-badge-gradient)', color: '#fff' }}>
                    {highlight.tag}
                  </span>
                </div>
                <p className="mt-2 text-sm text-mute">{highlight.detail}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-text">能量条排行榜</h2>
          <div className="space-y-4 text-sm text-mute">
            <ProgressRow label="王小远" value={92} energy="Speed" />
            <ProgressRow label="李可心" value={88} energy="Strength" />
            <ProgressRow label="陈一帆" value={85} energy="Stamina" />
            <ProgressRow label="赵晨曦" value={81} energy="Coordination" />
          </div>
        </Card>
      </section>
    </div>
  );
}

function ProgressRow({ label, value, energy }: { label: string; value: number; energy: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-medium text-mute/80">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="progress-track h-2">
        <div className="progress-bar" style={{ width: `${value}%` }} />
      </div>
      <p className="text-xs text-mute/70">主力能量：{energy}</p>
    </div>
  );
}
