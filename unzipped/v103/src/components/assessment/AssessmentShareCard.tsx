import { forwardRef } from 'react';
import type { WarriorAssessmentReport } from '../../utils/warriorAssessment';
import { buildGraduationStatus, getBranding } from '../../utils/warriorAssessment';

interface AssessmentShareCardProps {
  report: WarriorAssessmentReport;
}

export const AssessmentShareCard = forwardRef<HTMLDivElement, AssessmentShareCardProps>(
  ({ report }, ref) => {
    const branding = getBranding();
    const progress = report.progressBars;
    return (
      <div
        ref={ref}
        className="w-[360px] rounded-3xl bg-slate-900 p-6 text-slate-100 shadow-2xl"
      >
        <header className="flex items-center gap-3 border-b border-slate-700 pb-4">
          <img
            src={branding.logoUrl}
            alt={branding.organization}
            className="h-12 w-12 rounded-full border border-white/10 bg-white object-contain"
          />
          <div>
            <p className="text-xs uppercase tracking-widest text-pink-300">{branding.organization}</p>
            <h3 className="text-lg font-bold">勇士成就报告</h3>
          </div>
        </header>

        <section className="mt-5 flex items-center gap-4">
          <div className="h-20 w-20 rounded-full border-4 border-pink-500 bg-slate-800 flex items-center justify-center text-2xl font-bold">
            {report.student?.name?.slice(0, 1) ?? '勇'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xl font-semibold">
              <span>{report.student?.name ?? '勇士'}</span>
              <span className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-2 py-0.5 text-xs text-white">
                {report.level.title}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {new Date(report.date).toLocaleDateString()} · {report.honorTitle}
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-slate-800 p-4 text-center">
          <div className="text-[32px] font-extrabold text-emerald-400 tracking-tight">
            {Math.round(report.totalScore)}
          </div>
          <div className="text-xs text-slate-400">综合战力 · 超越 {Math.round(report.totalScore)}% 的勇士</div>
          <div className="mt-1 text-xs font-semibold text-emerald-300">
            {buildGraduationStatus(report.totalScore)}
          </div>
        </section>

        <section className="mt-4 space-y-3">
          {progress.map((row) => (
            <div key={row.title}>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{row.title}</span>
                <span>{row.percentage}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500"
                  style={{ width: `${row.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </section>

        <section className="mt-5 rounded-2xl bg-slate-800/80 p-4 text-sm leading-relaxed text-slate-200">
          <p className="font-semibold text-pink-300">教练寄语</p>
          <p className="mt-2 whitespace-pre-wrap text-xs text-slate-300">{report.advice}</p>
        </section>

        <footer className="mt-5 flex items-center justify-between text-[10px] text-slate-500">
          <div>
            <p>{branding.tagline}</p>
            {branding.website && (
              <p>官网：{branding.website.replace(/^https?:\/\//, '')}</p>
            )}
          </div>
          <div className="text-right">
            <p>扫码加入勇士训练营</p>
            <p>{branding.phone}</p>
          </div>
        </footer>
      </div>
    );
  },
);

AssessmentShareCard.displayName = 'AssessmentShareCard';
