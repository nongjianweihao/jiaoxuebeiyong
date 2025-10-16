import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import type { WarriorAssessmentReport } from '../../utils/warriorAssessment';
import { buildGraduationStatus } from '../../utils/warriorAssessment';
import { AssessmentShareCard } from './AssessmentShareCard';

interface AssessmentReportPanelProps {
  report: WarriorAssessmentReport | null;
  onOpenReport: () => void;
}

export function AssessmentReportPanel({ report, onOpenReport }: AssessmentReportPanelProps) {
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!report) {
    return (
      <div className="rounded-3xl border border-dashed border-rose-300 bg-white/70 p-6 text-center text-sm text-rose-500">
        暂无测评数据，完成测评后可生成勇士成长报告。
      </div>
    );
  }

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null });
      const image = canvas.toDataURL('image/png');
      const newWindow = window.open('');
      if (newWindow) {
        newWindow.document.write(`<img src="${image}" alt="分享卡片" style="width:100%" />`);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white/80 p-6 shadow-md backdrop-blur">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-rose-500">最新测评</p>
          <h3 className="text-2xl font-bold text-slate-900">
            {report.student?.name ?? '勇士'} · {new Date(report.date).toLocaleDateString()}
          </h3>
          <p className="mt-2 text-sm text-slate-500">{buildGraduationStatus(report.totalScore)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-full bg-gradient-to-r from-rose-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow"
            onClick={onOpenReport}
          >
            查看完整报告
          </button>
          <button
            type="button"
            disabled={sharing}
            onClick={handleShare}
            className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sharing ? '生成中...' : '生成分享卡片'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="综合得分" value={`${Math.round(report.totalScore)}`} accent="text-rose-600" />
        <StatCard label="等级称号" value={report.level.title} accent="text-purple-600" />
        <StatCard label="荣誉称号" value={report.honorTitle} accent="text-amber-500" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {report.progressBars.map((row) => (
          <div key={row.title} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{row.title}</span>
              <span className="font-semibold text-rose-500">{row.percentage}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-400 to-purple-400"
                style={{ width: `${row.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-dashed border-rose-200 p-4 text-xs text-slate-400">
        <p>提示：点击“查看完整报告”可导出 PDF；点击“生成分享卡片”可生成图片并保存分享。</p>
      </div>

      <div className="pointer-events-none fixed left-[-9999px] top-[-9999px]">
        <AssessmentShareCard ref={cardRef} report={report} />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 text-center shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent ?? 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
