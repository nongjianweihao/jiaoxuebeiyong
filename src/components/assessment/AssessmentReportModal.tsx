import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { RadarChart } from '../RadarChart';
import { AssessmentShareCard } from './AssessmentShareCard';
import { ExportPdfButton } from '../ExportPdfButton';
import type { WarriorAssessmentReport } from '../../utils/warriorAssessment';
import { buildGraduationStatus, getBranding } from '../../utils/warriorAssessment';

interface AssessmentReportModalProps {
  open: boolean;
  onClose: () => void;
  report: WarriorAssessmentReport | null;
}

export function AssessmentReportModal({ open, onClose, report }: AssessmentReportModalProps) {
  if (!open || !report) return null;
  const branding = getBranding();
  const targetId = `assessment-report-${report.student?.id ?? 'anonymous'}`;
  const freestyleStages = useMemo(() => {
    if (!report.freestyle.length) return [];
    return report.freestyle.map((row) => ({
      rank: row.rank,
      completed: row.mastered >= row.total && row.total > 0,
      percent: row.total ? Math.round((row.mastered / row.total) * 100) : 0,
    }));
  }, [report.freestyle]);

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-rose-100 via-pink-100 to-purple-100 px-8 py-6">
          <div className="flex items-center gap-4">
            <img
              src={branding.logoUrl}
              alt={branding.organization}
              className="h-12 w-12 rounded-full border border-white/80 bg-white object-contain"
            />
            <div>
              <p className="text-sm font-semibold text-rose-600">{branding.organization}</p>
              <h2 className="text-2xl font-bold text-slate-900">勇士试炼成长报告</h2>
              <p className="text-xs text-slate-500">{branding.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ExportPdfButton targetId={targetId} filename={`${report.student?.name ?? 'warrior'}-report.pdf`} />
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              关闭
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-rose-50 to-purple-50 p-8">
          <div id={targetId} className="space-y-8">
            <section className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl bg-white/90 p-6 shadow-md backdrop-blur lg:col-span-2">
                <h3 className="text-lg font-semibold text-slate-800">勇士概览</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <SummaryStat label="综合得分" value={`${Math.round(report.totalScore)}`} accent="text-rose-600" />
                  <SummaryStat label="等级称号" value={report.level.title} accent="text-purple-600" />
                  <SummaryStat label="荣誉勋章" value={report.honorTitle} accent="text-amber-500" />
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  测评时间：{new Date(report.date).toLocaleDateString()} · 教练团队：{branding.organization}
                </p>
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700">
                  <p className="font-semibold">✨ 能量金句</p>
                  <p className="mt-2 text-rose-600">{buildGraduationStatus(report.totalScore)}</p>
                </div>
              </div>
              <div className="rounded-3xl bg-slate-900 p-4 text-white shadow-lg">
                <p className="text-xs uppercase tracking-widest text-rose-300">分享卡片预览</p>
                <div className="mt-3 flex justify-center">
                  <AssessmentShareCard report={report} />
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-white/90 p-6 shadow-md backdrop-blur">
                <h3 className="text-lg font-semibold text-slate-800">核心能力雷达图</h3>
                <div className="mt-4">
                  <RadarChart data={report.radar} valueLabel="当前" />
                </div>
              </div>
              <div className="rounded-3xl bg-white/90 p-6 shadow-md backdrop-blur">
                <h3 className="text-lg font-semibold text-slate-800">勇士成长之路</h3>
                {freestyleStages.length ? (
                  <div className="mt-4 space-y-3">
                    {freestyleStages.map((stage) => (
                      <div key={stage.rank} className="rounded-2xl border border-white/40 bg-gradient-to-r from-white to-rose-100 p-4">
                        <div className="flex items-center justify-between text-sm font-semibold text-rose-700">
                          <span>段位 L{stage.rank}</span>
                          <span>{stage.percent}%</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                          <div
                            className={`h-full rounded-full ${
                              stage.completed ? 'bg-rose-500' : 'bg-rose-300'
                            }`}
                            style={{ width: `${stage.percent}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-rose-500">
                          {stage.completed ? '已掌握全部花样动作' : '继续挑战，解锁全部花样动作'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-rose-200 p-6 text-center text-sm text-rose-400">
                    暂无花样挑战数据
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl bg-white/95 p-6 shadow-md backdrop-blur">
              <h3 className="text-lg font-semibold text-slate-800">能力详情分析</h3>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                {report.categories.map((category) => (
                  <div key={category.title} className="rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-700">{category.title}</h4>
                    <div className="mt-3 space-y-3">
                      {Object.entries(category.items).map(([label, metric]) => (
                        <div key={label}>
                          <div className="flex items-center justify-between text-sm text-slate-600">
                            <span>{label}</span>
                            <span className="font-semibold text-rose-500">{metric.score}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                            <span>{metric.value ? `${metric.value}${metric.unit ?? ''}` : '未测试'}</span>
                            <span>{metric.rating}</span>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-pink-400 to-purple-400"
                              style={{ width: `${metric.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white/95 p-6 shadow-md backdrop-blur">
              <h3 className="text-lg font-semibold text-slate-800">教练建议与成长寄语</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700">
                  <p className="font-semibold text-rose-600">教练寄语</p>
                  <p className="mt-2 whitespace-pre-wrap text-xs text-rose-500">{report.advice}</p>
                </div>
                <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 text-sm text-purple-700">
                  <p className="font-semibold text-purple-600">成长节点</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-purple-500">
                    <li>等级提升：{report.level.title}</li>
                    <li>荣誉称号：{report.honorTitle}</li>
                    <li>花样段位：L{report.highestDan || 0}</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function SummaryStat({ label, value, accent }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white via-rose-50 to-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent ?? 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
