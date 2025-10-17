import { useMemo, useState } from 'react';
import type { ClassEntity, Student, TrainingTemplate } from '../../types';
import { generateId } from '../../store/repositories/utils';

export interface ClassFormValue {
  id: string;
  name: string;
  coachName: string;
  schedule?: string;
  templateId?: string;
  studentIds: string[];
}

interface ClassFormProps {
  students: Student[];
  templates: TrainingTemplate[];
  initialValue?: ClassEntity;
  onSubmit: (value: ClassFormValue) => Promise<void>;
  submitLabel: string;
  title: string;
  description: string;
  onDelete?: () => Promise<void>;
}

export function ClassForm({
  students,
  templates,
  initialValue,
  onSubmit,
  submitLabel,
  title,
  description,
  onDelete,
}: ClassFormProps) {
  const [form, setForm] = useState({
    id: initialValue?.id ?? generateId(),
    name: initialValue?.name ?? '',
    coachName: initialValue?.coachName ?? '',
    schedule: initialValue?.schedule ?? '',
    templateId: initialValue?.templateId ?? '',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>(initialValue?.studentIds ?? []);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canSubmit = useMemo(() => form.name.trim().length > 0 && form.coachName.trim().length > 0, [form]);

  const toggleStudent = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((sid) => sid !== id) : [...current, id]));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await onSubmit({
        id: form.id,
        name: form.name.trim(),
        coachName: form.coachName.trim(),
        schedule: form.schedule.trim() || undefined,
        templateId: form.templateId || undefined,
        studentIds: selectedIds,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = window.confirm('确认解散该训练营？操作不可恢复。');
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
            {deleting ? '解散中...' : '解散训练营'}
          </button>
        )}
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-700">训练营名称</span>
          <input
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-700">主教练</span>
          <input
            required
            value={form.coachName}
            onChange={(event) => setForm((prev) => ({ ...prev, coachName: event.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-700">训练时间</span>
          <input
            value={form.schedule}
            onChange={(event) => setForm((prev) => ({ ...prev, schedule: event.target.value }))}
            placeholder="例如：每周二 · 周五 18:30"
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-700">默认任务卡路线</span>
          <select
            value={form.templateId}
            onChange={(event) => setForm((prev) => ({ ...prev, templateId: event.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">暂不选择</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">召集勇士</h2>
        <p className="text-sm text-slate-500">可多选添加勇士，后续也可在作战台进行调整。</p>
        <div className="mt-4 grid gap-2">
          {students.map((student) => (
            <label
              key={student.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{student.name}</p>
                <p className="text-xs text-slate-500">段位 L{student.currentRank ?? '-'}</p>
              </div>
              <input
                type="checkbox"
                checked={selectedIds.includes(student.id)}
                onChange={() => toggleStudent(student.id)}
                className="h-4 w-4 rounded border-slate-300 text-brand-500"
              />
            </label>
          ))}
          {!students.length && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              暂无勇士，请先前往「勇士成长册」创建。
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? '保存中...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
