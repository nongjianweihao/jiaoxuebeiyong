import { useMemo, useState, type ChangeEvent } from 'react';
import type { LessonPackage, PaymentRecord, Student } from '../../types';
import { generateId } from '../../store/repositories/utils';
import { StudentAvatar } from '../StudentAvatar';
import { AVATAR_PRESETS, DEFAULT_AVATAR_PRESET_ID } from '../../config/avatarPresets';

interface StudentFormProps {
  initialValue?: Student;
  onSubmit: (student: Student, packageInfo?: { pkg: LessonPackage; payment: PaymentRecord }) => Promise<void>;
  submitLabel: string;
  title: string;
  description: string;
  onDelete?: () => Promise<void>;
}

export function StudentForm({
  initialValue,
  onSubmit,
  submitLabel,
  title,
  description,
  onDelete,
}: StudentFormProps) {
  const [form, setForm] = useState<Partial<Student>>({
    id: initialValue?.id ?? generateId(),
    name: initialValue?.name ?? '',
    gender: initialValue?.gender ?? 'F',
    birth: initialValue?.birth,
    avatarUrl: initialValue?.avatarUrl,
    avatarPresetId: initialValue?.avatarPresetId ?? DEFAULT_AVATAR_PRESET_ID,
    currentRank: initialValue?.currentRank ?? 1,
    guardian: initialValue?.guardian,
    joinDate: initialValue?.joinDate ?? new Date().toISOString(),
    tags: initialValue?.tags ?? [],
  });
  const [packageForm, setPackageForm] = useState({
    lessons: 0,
    price: 0,
    method: 'wechat' as PaymentRecord['method'],
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const canSubmit = useMemo(() => Boolean(form.name?.trim()), [form.name]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const student: Student = {
        id: form.id as string,
        name: form.name!.trim(),
        gender: form.gender as Student['gender'],
        birth: form.birth,
        avatarUrl: form.avatarUrl,
        avatarPresetId: form.avatarPresetId,
        currentRank: Number(form.currentRank) || undefined,
        guardian: form.guardian,
        joinDate: form.joinDate,
        tags: form.tags ?? [],
      };

      let packageInfo: { pkg: LessonPackage; payment: PaymentRecord } | undefined;
      if (packageForm.lessons > 0 && packageForm.price > 0) {
        const packageId = generateId();
        packageInfo = {
          pkg: {
            id: packageId,
            studentId: student.id,
            purchasedLessons: Number(packageForm.lessons),
            price: Number(packageForm.price),
            unitPrice: Number(packageForm.price) / Number(packageForm.lessons),
            purchasedAt: new Date().toISOString(),
          },
          payment: {
            id: generateId(),
            studentId: student.id,
            packageId,
            amount: Number(packageForm.price),
            method: packageForm.method,
            paidAt: new Date().toISOString(),
          },
        };
      }

      await onSubmit(student, packageInfo);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = window.confirm('确认移除该勇士？所有相关数据将被清除。');
    if (!confirmed) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('请上传图片文件');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('请上传小于 2MB 的图片');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, avatarUrl: reader.result as string, avatarPresetId: undefined }));
      setAvatarError(null);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handlePresetSelect = (presetId: string) => {
    setForm((prev) => ({ ...prev, avatarPresetId: presetId, avatarUrl: undefined }));
    setAvatarError(null);
  };

  const handleAvatarClear = () => {
    setForm((prev) => ({ ...prev, avatarUrl: undefined }));
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
            {deleting ? '移除中...' : '移除勇士'}
          </button>
        )}
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <StudentAvatar
            name={form.name ?? '新勇士'}
            avatarUrl={form.avatarUrl}
            avatarPresetId={form.avatarPresetId}
            size="md"
            className="flex-shrink-0"
          />
          <div className="space-y-2 text-sm text-slate-600">
            <p className="font-medium text-slate-800">专属头像</p>
            <p>
              上传一张勇士照片，或从官方漫画头像中挑选一位守护者。头像会显示在班级、排行榜与成长档案中。
            </p>
            {avatarError ? <p className="text-xs text-red-500">{avatarError}</p> : null}
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-600">
                上传头像
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
              {form.avatarUrl ? (
                <button
                  type="button"
                  onClick={handleAvatarClear}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800"
                >
                  使用漫画头像
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">官方漫画头像</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {AVATAR_PRESETS.map((preset) => {
              const selected = form.avatarPresetId === preset.id && !form.avatarUrl;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                    selected
                      ? 'border-brand-400 bg-brand-50 text-brand-700 shadow'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600'
                  }`}
                >
                  <StudentAvatar name={preset.label} avatarPresetId={preset.id} size="xs" />
                  <div>
                    <p className="text-sm font-semibold">{preset.label}</p>
                    <p className="text-xs text-slate-400">{preset.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">勇士姓名</span>
            <input
              required
              value={form.name ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">性别</span>
            <select
              value={form.gender}
              onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value as Student['gender'] }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="F">女</option>
              <option value="M">男</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">出生日期</span>
            <input
              type="date"
              value={form.birth ? form.birth.slice(0, 10) : ''}
              onChange={(event) => setForm((prev) => ({ ...prev, birth: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">当前段位</span>
            <input
              type="number"
              min={1}
              max={9}
              value={form.currentRank ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, currentRank: Number(event.target.value) }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">监护人</span>
          <input
            value={form.guardian?.name ?? ''}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                guardian: { ...prev.guardian, name: event.target.value },
              }))
            }
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">联系电话</span>
          <input
            value={form.guardian?.phone ?? ''}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                guardian: { ...prev.guardian, phone: event.target.value },
              }))
            }
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">特质标签</span>
          <input
            value={form.tags?.join(',') ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) }))}
            className="rounded-lg border border-slate-200 px-3 py-2"
            placeholder="例如：敏捷,爆发,花样达人"
          />
        </label>
      </section>

      <section className="space-y-4 rounded-xl border border-brand-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">成长能量（可选）</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">课时 / 能量数</span>
            <input
              type="number"
              min={0}
              value={packageForm.lessons}
              onChange={(event) => setPackageForm((prev) => ({ ...prev, lessons: Number(event.target.value) }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">实付金额（元）</span>
            <input
              type="number"
              min={0}
              value={packageForm.price}
              onChange={(event) => setPackageForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">支付方式</span>
            <select
              value={packageForm.method}
              onChange={(event) => setPackageForm((prev) => ({ ...prev, method: event.target.value as PaymentRecord['method'] }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="wechat">微信</option>
              <option value="alipay">支付宝</option>
              <option value="cash">现金</option>
              <option value="card">刷卡</option>
              <option value="other">其他</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-slate-500">留空则仅保存勇士档案，不生成能量包与流水。</p>
      </section>

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
