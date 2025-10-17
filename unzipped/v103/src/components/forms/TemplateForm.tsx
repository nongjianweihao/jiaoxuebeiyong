import { useState } from 'react';
import type { TrainingTemplate } from '../../types';
import { generateId } from '../../store/repositories/utils';
import { TemplateBuilder } from '../TemplateBuilder';

interface TemplateFormProps {
  initialValue?: TrainingTemplate;
  onSubmit: (template: TrainingTemplate) => Promise<void>;
  submitLabel: string;
  title: string;
  description: string;
  onDelete?: () => Promise<void>;
}

export function TemplateForm({
  initialValue,
  onSubmit,
  submitLabel,
  title,
  description,
  onDelete,
}: TemplateFormProps) {
  const [template, setTemplate] = useState<TrainingTemplate>(
    initialValue
      ? {
          ...initialValue,
          unitIds: Array.isArray(initialValue.unitIds) ? initialValue.unitIds : [],
          blocks: Array.isArray(initialValue.blocks) ? initialValue.blocks : [],
        }
      : {
          id: generateId(),
          name: '新任务卡',
          period: 'PREP',
          weeks: 4,
          unitIds: [],
          blocks: [],
          createdAt: new Date().toISOString(),
        },
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit(template);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = window.confirm('确认删除该挑战任务卡？');
    if (!confirmed) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? '删除中...' : '删除任务卡'}
          </button>
        )}
      </div>
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">任务卡名称</span>
            <input
              value={template.name}
              onChange={(event) => setTemplate((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">训练周期</span>
            <select
              value={template.period}
              onChange={(event) => setTemplate((prev) => ({ ...prev, period: event.target.value as TrainingTemplate['period'] }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="PREP">准备期</option>
              <option value="SPEC">专项准备期</option>
              <option value="COMP">比赛期</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">建议挑战周数</span>
            <input
              type="number"
              value={template.weeks ?? 4}
              onChange={(event) => setTemplate((prev) => ({ ...prev, weeks: Number(event.target.value) }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
        <TemplateBuilder value={template} onChange={setTemplate} />
      </section>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? '保存中...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
