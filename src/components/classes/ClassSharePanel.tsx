import { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { ClassShareCard, type ClassShareCardProps } from './ClassShareCard';

interface ClassSharePanelProps extends ClassShareCardProps {}

export function ClassSharePanel(props: ClassSharePanelProps) {
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hiddenCardRef = useRef<HTMLDivElement>(null);

  const summary = useMemo(() => {
    return {
      attendance: `${props.presentCount}/${props.totalCount}`,
      averageStars:
        typeof props.averageStars === 'number' && Number.isFinite(props.averageStars)
          ? props.averageStars.toFixed(1)
          : '-',
      highlightCount: props.highlights.length,
    };
  }, [props.presentCount, props.totalCount, props.averageStars, props.highlights.length]);

  const handleShare = async () => {
    if (!hiddenCardRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(hiddenCardRef.current, { scale: 2, backgroundColor: null });
      const image = canvas.toDataURL('image/png');
      const newWindow = window.open('');
      if (newWindow) {
        newWindow.document.write(`<img src="${image}" alt="班级课后速报" style="width:100%" />`);
        setToast('分享卡片已生成，请长按保存图片。');
      }
    } finally {
      setSharing(false);
      setTimeout(() => setToast(null), 3200);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">课后速报</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">一键生成班级分享卡片</h2>
          <p className="mt-2 text-sm text-slate-500">
            出勤 {summary.attendance} · 平均星级 {summary.averageStars} · 亮点 {summary.highlightCount} 条
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sharing ? '生成中…' : '生成分享图片'}
          </button>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto">
        <div className="inline-block">
          <ClassShareCard {...props} />
        </div>
      </div>
      {toast ? (
        <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-600">{toast}</div>
      ) : null}
      <div className="pointer-events-none fixed left-[-9999px] top-[-9999px]">
        <ClassShareCard ref={hiddenCardRef} {...props} />
      </div>
    </section>
  );
}
