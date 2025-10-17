import classNames from 'classnames';
import type { ReactNode } from 'react';

type LoadLevel = 'light' | 'moderate' | 'high';

interface SessionSegment {
  title: string;
  duration: string;
  focus: string;
  description: string;
  activities: string[];
  outcome: string;
}

interface SessionTemplate {
  id: string;
  name: string;
  stageLabel: string;
  gradient: string;
  summary: string;
  totalDuration: number;
  focusLabel: string;
  load: LoadLevel;
  highlights: string[];
  segments: SessionSegment[];
  coachTip: string;
  energySystem: string;
  recommended: string;
}

interface SessionTemplateGroup {
  id: string;
  title: string;
  description: string;
  accent: string;
  templates: SessionTemplate[];
}

const LOAD_LABELS: Record<LoadLevel, string> = {
  light: '低负荷',
  moderate: '中等负荷',
  high: '高负荷',
};

const sessionTemplateGroups: SessionTemplateGroup[] = [
  {
    id: 'foundation',
    title: '基础神经期（4W）',
    description: '适合启蒙 / 入门班级，强调节奏唤醒与敏捷移动的基础能力。',
    accent: 'from-sky-400 to-cyan-500',
    templates: [
      {
        id: 'session-speed-ignite',
        name: '极速点火课节',
        stageLabel: '基础神经期 · 45 分钟',
        gradient: 'from-sky-400 via-cyan-400 to-emerald-300',
        summary: '以动态热身与折返节奏激发神经反应，再通过双摇组合巩固速度控制。',
        totalDuration: 45,
        focusLabel: '速度 / 敏捷',
        load: 'moderate',
        highlights: ['SR30 节奏热身', '敏捷梯串联', '双摇节奏强化'],
        segments: [
          {
            title: '活力热身',
            duration: '8 分钟',
            focus: '动态激活 · 节奏唤醒',
            description: '通过 SR30 拍点与多方向移动唤醒踝、膝、髋的协同发力。',
            activities: ['SR30 节奏热身', '多方向折返跑', '动态拉伸'],
            outcome: '学生在 180-200 次/分钟的节奏中找到轻盈落地感。',
          },
          {
            title: '速度技巧',
            duration: '12 分钟',
            focus: '单脚交换 · 敏捷梯',
            description: '结合敏捷梯与低绳反应练习，强化脚踝稳定与步频控制。',
            activities: ['敏捷梯组合', '低绳反应跑', '单脚交换跳'],
            outcome: '80% 学员能在 30 秒内完成 4 轮稳定节奏。',
          },
          {
            title: '双摇闯关',
            duration: '15 分钟',
            focus: '双摇爆发 · 节奏衔接',
            description: '分组完成 6 × 20 秒的双摇闯关，强调呼吸节奏与爆发输出。',
            activities: ['双摇 20 秒挑战', '伙伴节奏提醒', '爆发+恢复循环'],
            outcome: '课堂平均双摇数量提升 15%，学生掌握呼吸节奏。',
          },
          {
            title: '整理拉伸',
            duration: '10 分钟',
            focus: '呼吸回落 · 核心放松',
            description: '以方块呼吸与静态拉伸结束课堂，帮助身体恢复到稳定状态。',
            activities: ['方块呼吸法', '腘绳肌静态拉伸', '肩带放松'],
            outcome: '学生心率回落至最大心率的 60% 以下，准备进入复盘。',
          },
        ],
        coachTip: '前两个环节可根据班级水平调整节奏梯密度。若双摇闯关压力大，可改为 15 秒执行 + 15 秒恢复，确保高质量输出。',
        energySystem: '磷酸原系统 / 糖酵解系统',
        recommended: '推荐：极速等级2-3 · 12-15 人小班',
      },
      {
        id: 'session-rhythm-play',
        name: '节奏探索课节',
        stageLabel: '基础神经期 · 40 分钟',
        gradient: 'from-indigo-400 via-violet-400 to-purple-300',
        summary: '通过游戏化闯关建立节奏感与身体控制，适合低年级课堂。',
        totalDuration: 40,
        focusLabel: '协调 / 节奏',
        load: 'light',
        highlights: ['节奏拍掌', '节奏迷宫', '合作游戏'],
        segments: [
          {
            title: '节奏唤醒',
            duration: '6 分钟',
            focus: '拍点同步 · 轻盈跳跃',
            description: '以拍掌与基础跳跃唤醒身体节奏，强调放松握绳。',
            activities: ['节奏拍掌', '基础单摇', '轻盈落地提醒'],
            outcome: '学生能跟随 4/4 拍完成 2 组稳定单摇。',
          },
          {
            title: '技巧拼图',
            duration: '14 分钟',
            focus: '节奏控制 · 动作连接',
            description: '拆分交叉、侧摆等动作，通过拼图卡片组合练习。',
            activities: ['动作拼图卡', '慢速演练', '伙伴节奏提示'],
            outcome: '70% 学员能够完成 2 种动作的无停顿连接。',
          },
          {
            title: '节奏迷宫',
            duration: '12 分钟',
            focus: '空间感知 · 团队协作',
            description: '设置 3×3 网格迷宫，学生持绳按节奏前进并完成指定动作。',
            activities: ['节奏迷宫闯关', '团队协作计时', '奖励星星机制'],
            outcome: '学生在 3 次尝试内完成迷宫路线并保持节奏。',
          },
          {
            title: '节奏冷身',
            duration: '8 分钟',
            focus: '呼吸放松 · 肌肉延展',
            description: '以节奏呼吸结合静态拉伸收尾，并鼓励学生表达课堂收获。',
            activities: ['节奏呼吸', '肩颈放松', '课堂分享'],
            outcome: '学生能用一句话描述今天掌握的节奏要点。',
          },
        ],
        coachTip: '技巧拼图环节可根据学员年龄增减动作难度。节奏迷宫建议使用彩色标识提升路线识别度。',
        energySystem: '有氧系统',
        recommended: '推荐：协调等级1-2 · 8-12 人体验课',
      },
    ],
  },
  {
    id: 'skill',
    title: '专项协调期（8W）',
    description: '聚焦技巧衔接与组合表现，适合备赛班级或校队训练。',
    accent: 'from-violet-400 to-fuchsia-500',
    templates: [
      {
        id: 'session-freestyle-flow',
        name: '花样流动课节',
        stageLabel: '专项协调期 · 50 分钟',
        gradient: 'from-fuchsia-400 via-pink-400 to-rose-300',
        summary: '围绕组合编排与表达训练，帮助学员建立舞台表现力。',
        totalDuration: 50,
        focusLabel: '花样 / 表达',
        load: 'moderate',
        highlights: ['组合拆解', '节奏过门', '镜头表达'],
        segments: [
          {
            title: '序列热身',
            duration: '10 分钟',
            focus: '核心激活 · 节奏复现',
            description: '选用旧组合片段进行慢速复现，唤醒身体记忆与控制。',
            activities: ['组合慢速回放', '核心激活', '节奏提示音'],
            outcome: '学生能够稳定完成 3 个组合过门的无失误复现。',
          },
          {
            title: '重点技巧',
            duration: '18 分钟',
            focus: '难度衔接 · 空间变化',
            description: '分组针对甩交叉、托绳等难点，使用镜面演练与慢动作反馈。',
            activities: ['镜面演练', '动作分解', '即刻反馈'],
            outcome: '关键难点的成功率提升到 70% 以上。',
          },
          {
            title: '编排走台',
            duration: '14 分钟',
            focus: '表情管理 · 空间路线',
            description: '在 8×8 米场地模拟舞台走位，强调表情和身体朝向。',
            activities: ['走台排练', '表情卡抽取', '队形调整'],
            outcome: '完成一次无停顿的完整编排走台，并获得同伴反馈。',
          },
          {
            title: '整理复盘',
            duration: '8 分钟',
            focus: '拉伸放松 · 口头复盘',
            description: '结合同伴互评，完成重点动作的口头复盘与目标设定。',
            activities: ['伙伴互评', '重点拉伸', '目标设定卡'],
            outcome: '每位学员写下下一次训练的提升目标。',
          },
        ],
        coachTip: '编排走台时可录制短视频用于课后复盘。若场地受限，可使用地贴标示关键站位，确保空间感。',
        energySystem: '混合能量系统',
        recommended: '推荐：花样等级3-4 · 10-14 人校队',
      },
      {
        id: 'session-team-sync',
        name: '同步配合课节',
        stageLabel: '专项协调期 · 55 分钟',
        gradient: 'from-blue-400 via-sky-400 to-cyan-300',
        summary: '强化团队同步与合作挑战，适用于队列、集体项目。',
        totalDuration: 55,
        focusLabel: '团队 / 同步',
        load: 'high',
        highlights: ['同步打点', '合作挑战', '团队复盘'],
        segments: [
          {
            title: '节奏校准',
            duration: '8 分钟',
            focus: '拍点统一 · 呼吸共振',
            description: '使用节拍器配合身体律动，建立团队统一节奏。',
            activities: ['节拍器热身', '呼吸共振练习', '队形转换'],
            outcome: '全队能在 90 秒内保持统一节拍无偏差。',
          },
          {
            title: '同步技巧',
            duration: '20 分钟',
            focus: '双人技巧 · 队形变化',
            description: '重点练习双人交叉、团体托绳等同步难点，分层次推进。',
            activities: ['双人交叉练习', '托绳节奏', '同步视频反馈'],
            outcome: '同步动作成功率达到 80%，并具备统一完成姿态。',
          },
          {
            title: '合作挑战',
            duration: '17 分钟',
            focus: '沟通协作 · 压力测试',
            description: '设定限时闯关任务，完成团队跳绳组合与沟通记录。',
            activities: ['限时闯关', '沟通记录卡', '能量奖励机制'],
            outcome: '团队在 3 次尝试内完成目标次数，沟通记录覆盖关键点。',
          },
          {
            title: '冷身反馈',
            duration: '10 分钟',
            focus: '呼吸回落 · 团队互评',
            description: '结合泡沫轴滚压，完成团队互评与亮点分享。',
            activities: ['泡沫轴放松', '亮点分享', '改进建议'],
            outcome: '记录 2 条团队亮点与 1 条改进方向。',
          },
        ],
        coachTip: '合作挑战环节建议设置“节奏指挥官”角色轮换，提升学生参与感。注意在高负荷输出后安排充分恢复时间。',
        energySystem: '糖酵解系统 / 有氧系统',
        recommended: '推荐：团队等级3-4 · 16-20 人集训课',
      },
    ],
  },
  {
    id: 'exam',
    title: '体能峰值期（12W）',
    description: '面向中考体能或阶段测评，兼顾速度、力量与耐力输出。',
    accent: 'from-amber-400 to-orange-500',
    templates: [
      {
        id: 'session-exam-sprint',
        name: '冲刺提速课节',
        stageLabel: '体能峰值期 · 50 分钟',
        gradient: 'from-orange-400 via-amber-400 to-yellow-300',
        summary: '通过分段冲刺与力量循环提升 30/60 秒考试表现。',
        totalDuration: 50,
        focusLabel: '速度 / 力量',
        load: 'high',
        highlights: ['冲刺分段', '力量循环', '成绩追踪'],
        segments: [
          {
            title: '速度热身',
            duration: '10 分钟',
            focus: '神经激活 · 关节预备',
            description: '结合 A 跑与高抬腿唤醒速度姿态，并进行关节专项热身。',
            activities: ['A 跑', '高抬腿', '动态关节预备'],
            outcome: '学生在测试前达到高频步频，体感进入冲刺状态。',
          },
          {
            title: '冲刺分段',
            duration: '16 分钟',
            focus: '30 秒节奏 · 60 秒耐力',
            description: '分解冲刺段落进行 4 轮节奏练习，强调起跳与落地控制。',
            activities: ['冲刺计时', '节奏分段', '数据记录'],
            outcome: '学生在 30 秒段的平均次数提升 10%。',
          },
          {
            title: '力量循环',
            duration: '16 分钟',
            focus: '下肢爆发 · 核心稳定',
            description: '设置 4 站循环：壶铃深蹲、波比跳、平板支撑、箱跳。',
            activities: ['壶铃深蹲', '波比跳', '箱跳', '核心稳定'],
            outcome: '每位学生完成 3 轮高质量循环，力量输出无明显下滑。',
          },
          {
            title: '恢复复盘',
            duration: '8 分钟',
            focus: '呼吸恢复 · 数据总结',
            description: '使用呼吸节奏回落，并记录今日冲刺次数与主观疲劳。',
            activities: ['呼吸恢复', '数据记录表', '目标复盘'],
            outcome: '完成自评后设置下一次训练目标，确保进步路径清晰。',
          },
        ],
        coachTip: '力量循环建议按 30" 动作 + 15" 转换执行，鼓励学生记录最佳成绩。必要时降低器械重量以保证动作质量。',
        energySystem: '糖酵解系统 / 有氧系统',
        recommended: '推荐：冲刺等级4-5 · 12-16 人冲刺班',
      },
      {
        id: 'session-endurance-flow',
        name: '耐力节奏课节',
        stageLabel: '体能峰值期 · 55 分钟',
        gradient: 'from-teal-400 via-emerald-400 to-green-300',
        summary: '以间歇节奏和长程控制提升持续跳绳能力，适合耐力薄弱班级。',
        totalDuration: 55,
        focusLabel: '耐力 / 呼吸',
        load: 'moderate',
        highlights: ['节奏间歇', '长程控制', '呼吸训练'],
        segments: [
          {
            title: '节奏热身',
            duration: '9 分钟',
            focus: '呼吸节奏 · 体态调整',
            description: '以 2-2 呼吸节奏结合基础跳跃，建立节奏呼吸意识。',
            activities: ['2-2 呼吸', '基础跳跃', '体态提示'],
            outcome: '学生能够在 3 分钟内保持稳定呼吸节奏。',
          },
          {
            title: '间歇训练',
            duration: '18 分钟',
            focus: '45" 输出 · 15" 恢复',
            description: '执行 6 组 45" × 15" 的节奏间歇，强调落地缓冲与肩部放松。',
            activities: ['间歇计时', '伙伴计数', '落地反馈'],
            outcome: '平均输出提升 12%，落地评分保持在 4 分以上。',
          },
          {
            title: '长程控制',
            duration: '18 分钟',
            focus: '连续节奏 · 心肺耐力',
            description: '进行 2 × 6 分钟的长程跳绳，加入节奏提示音辅助控制。',
            activities: ['长程跳绳', '节奏提示音', '心率监测'],
            outcome: '学生心率维持在 75-85%HRmax，节奏保持稳定。',
          },
          {
            title: '整理舒缓',
            duration: '10 分钟',
            focus: '拉伸放松 · 心态回顾',
            description: '配合泡沫轴与静态拉伸恢复，并进行心态调整分享。',
            activities: ['泡沫轴放松', '静态拉伸', '心态分享'],
            outcome: '学生完成主观疲劳 1-5 分量表，并写下课后恢复计划。',
          },
        ],
        coachTip: '间歇训练可根据学员情况调整为 40"×20" 或 30"×15"。长程控制阶段建议使用节拍器或音乐辅助节奏稳定。',
        energySystem: '有氧系统',
        recommended: '推荐：耐力等级3-4 · 18 人常规班',
      },
    ],
  },
];

export function MissionShowcase({ className, footer }: { className?: string; footer?: ReactNode }) {
  return (
    <section className={classNames('space-y-12', className)}>
      <header className="rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">课节模板精选</p>
            <h2 className="text-3xl font-extrabold md:text-4xl">课节模板展示</h2>
            <p className="max-w-2xl text-sm text-white/80">
              聚合课程模板中精选的课节，覆盖热身、技巧、挑战与整理全流程。每个模板均包含可直接引用的课堂环节，帮助教练在排课与授课时快速落地。
            </p>
          </div>
          <div className="grid gap-4 rounded-2xl bg-white/10 p-6 text-sm backdrop-blur md:min-w-[240px]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">精选模板</p>
              <p className="mt-1 text-3xl font-black">6</p>
              <p className="text-xs text-white/70">覆盖基础、专项与备考 3 大阶段</p>
            </div>
            <div className="border-t border-white/20 pt-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">平均课节时长</p>
              <p className="mt-1 text-3xl font-black">49′</p>
              <p className="text-xs text-white/70">建议结合班级人数和场地灵活调节</p>
            </div>
            <div className="border-t border-white/20 pt-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">更新频率</p>
              <p className="mt-1 text-3xl font-black">每月</p>
              <p className="text-xs text-white/70">来自教练共创与课堂数据回流</p>
            </div>
          </div>
        </div>
      </header>

      {sessionTemplateGroups.map((group) => (
        <section key={group.id} className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">阶段主题</p>
              <h3 className="text-2xl font-bold text-slate-900">{group.title}</h3>
              <p className="text-sm text-slate-500">{group.description}</p>
            </div>
            <span
              className={classNames(
                'inline-flex items-center rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white shadow',
                group.accent,
              )}
            >
              推荐使用：结合能力测评结果安排课节
            </span>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {group.templates.map((template) => (
              <SessionTemplateCard key={template.id} template={template} />
            ))}
          </div>
        </section>
      ))}

      {footer && <div>{footer}</div>}
    </section>
  );
}

function SessionTemplateCard({ template }: { template: SessionTemplate }) {
  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-lg">
      <div
        className={classNames(
          'absolute inset-x-0 top-0 h-36 opacity-80 blur-xl',
          `bg-gradient-to-r ${template.gradient}`,
        )}
        aria-hidden="true"
      />
      <div className="relative flex h-full flex-col gap-6 p-6">
        <header className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow">
                {template.stageLabel}
              </span>
              <h4 className="mt-3 text-xl font-semibold text-slate-900">{template.name}</h4>
              <p className="text-sm text-slate-600">{template.summary}</p>
            </div>
            <div className="space-y-1 text-right text-xs text-slate-500">
              <p>课节时长 · {template.totalDuration} 分钟</p>
              <p>聚焦能力 · {template.focusLabel}</p>
              <p>课堂负荷 · {LOAD_LABELS[template.load]}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {template.highlights.map((item) => (
              <span
                key={`${template.id}-highlight-${item}`}
                className="inline-flex items-center rounded-full bg-white/85 px-3 py-1 text-slate-600 shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </header>

        <ol className="space-y-3 text-sm">
          {template.segments.map((segment, index) => (
            <li
              key={`${template.id}-segment-${segment.title}`}
              className="rounded-2xl border border-slate-100 bg-white/85 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">环节 {index + 1}</p>
                  <p className="text-base font-semibold text-slate-800">{segment.title}</p>
                  <p className="text-xs text-slate-500">{segment.focus}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-white shadow">
                  {segment.duration}
                </span>
              </div>
              <p className="mt-2 text-slate-600">{segment.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {segment.activities.map((activity) => (
                  <span key={`${template.id}-${segment.title}-${activity}`} className="rounded-full bg-slate-100 px-2 py-0.5">
                    {activity}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">课堂成果：{segment.outcome}</p>
            </li>
          ))}
        </ol>

        <div className="rounded-2xl bg-slate-50/90 p-4 text-xs text-slate-600">
          <p className="text-sm font-semibold text-slate-700">教练提示</p>
          <p className="mt-1 leading-relaxed">{template.coachTip}</p>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p>能量系统：{template.energySystem}</p>
            <p>适用班级：{template.recommended}</p>
          </div>
          <button className="inline-flex items-center justify-center rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-900">
            应用此模板
          </button>
        </footer>
      </div>
    </article>
  );
}
