import { FormEvent, useMemo, useState } from 'react';
import type { LessonLedgerEntry, LessonLedgerEntryType } from '../../types';

export interface LessonLedgerFormValues {
  date: string;
  type: LessonLedgerEntryType;
  lessons: string;
  summary?: string;
}

interface LessonLedgerPanelProps {
  entries: LessonLedgerEntry[];
  onCreate(values: LessonLedgerFormValues): Promise<void>;
  onUpdate(id: string, values: LessonLedgerFormValues): Promise<void>;
  onDelete(id: string): Promise<void>;
}

const TYPE_OPTIONS: Array<{ value: LessonLedgerEntryType; label: string }> = [
  { value: 'consume', label: '课时消耗' },
  { value: 'makeup', label: '补课结算' },
  { value: 'gift', label: '赠课 / 补偿' },
  { value: 'transfer', label: '调课调整' },
  { value: 'adjust', label: '余额校准' },
  { value: 'other', label: '其他记录' },
];

type LedgerTypeFilter = 'all' | LessonLedgerEntryType;

function createDefaultFormValues(): LessonLedgerFormValues {
  return {
    date: new Date().toISOString().slice(0, 10),
    type: 'consume',
    lessons: '-1',
    summary: '',
  };
}

function formatDateInput(value: string): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

export function LessonLedgerPanel({ entries, onCreate, onUpdate, onDelete }: LessonLedgerPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<LessonLedgerFormValues>(() => createDefaultFormValues());
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<LedgerTypeFilter>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const typeLabelLookup = useMemo(
    () => Object.fromEntries(TYPE_OPTIONS.map((option) => [option.value, option.label])),
    [],
  );

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        if (entry.lessons >= 0) {
          acc.added += entry.lessons;
        } else {
          acc.consumed += Math.abs(entry.lessons);
        }
        return acc;
      },
      { added: 0, consumed: 0 },
    );
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const list = [...entries].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const term = searchTerm.trim().toLowerCase();
    return list.filter((entry) => {
      if (typeFilter !== 'all' && entry.type !== typeFilter) {
        return false;
      }
      if (from && entry.date < from) {
        return false;
      }
      if (to && entry.date > to) {
        return false;
      }
      if (!term) return true;
      const summary = entry.summary?.toLowerCase() ?? '';
      const typeLabel = typeLabelLookup[entry.type]?.toLowerCase() ?? entry.type.toLowerCase();
      return summary.includes(term) || typeLabel.includes(term);
    });
  }, [entries, from, to, searchTerm, typeFilter, typeLabelLookup]);

  const netChange = totals.added - totals.consumed;

  const resetForm = () => {
    setEditingId(null);
    setFormValues(createDefaultFormValues());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    let succeeded = false;
    try {
      if (editingId === '__new__') {
        await onCreate(formValues);
        succeeded = true;
      } else if (editingId) {
        await onUpdate(editingId, formValues);
        succeeded = true;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save lesson ledger entry', error);
    } finally {
      setSaving(false);
      if (succeeded) {
        resetForm();
      }
    }
  };

  const handleEdit = (entry: LessonLedgerEntry) => {
    setEditingId(entry.id);
    setFormValues({
      date: formatDateInput(entry.date),
      type: entry.type,
      lessons: entry.lessons.toString(),
      summary: entry.summary ?? '',
    });
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('确认删除该课时记录吗？');
    if (!confirmed) return;
    await onDelete(id);
    if (editingId && editingId !== '__new__' && editingId === id) {
      resetForm();
    }
  };

  const startNew = () => {
    setEditingId('__new__');
    setFormValues(createDefaultFormValues());
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">课时记录</h2>
          <p className="text-xs text-slate-500">手动补录课时增减与概要说明，保证余额准确。</p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600"
        >
          新增记录
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="rounded-full bg-slate-100 px-3 py-1">
          累计增加 {numberFormatter.format(totals.added)} 课时
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1">
          累计消耗 {numberFormatter.format(totals.consumed)} 课时
        </span>
        <span
          className={`rounded-full px-3 py-1 font-semibold ${
            netChange >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}
        >
          净变动 {netChange >= 0 ? '+' : '-'}{numberFormatter.format(Math.abs(netChange))} 课时
        </span>
      </div>

      {editingId ? (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-[140px_1fr_120px]">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            日期
            <input
              type="date"
              value={formValues.date}
              onChange={(event) => setFormValues((prev) => ({ ...prev, date: event.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              类型
              <select
                value={formValues.type}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, type: event.target.value as LessonLedgerEntryType }))
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              课时变动
              <input
                type="number"
                step="0.5"
                value={formValues.lessons}
                onChange={(event) => setFormValues((prev) => ({ ...prev, lessons: event.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 md:col-span-full">
            概要
            <textarea
              value={formValues.summary ?? ''}
              onChange={(event) => setFormValues((prev) => ({ ...prev, summary: event.target.value }))}
              rows={2}
              placeholder="例如：2053 夏季集训调课，补扣 1.5 课时"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-center justify-end gap-2 md:col-span-full">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white"
              disabled={saving}
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
            >
              {saving ? '保存中…' : '保存记录'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="搜索类型或概要"
          className="w-full max-w-xs rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as LedgerTypeFilter)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">全部类型</option>
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          placeholder="起始日期"
        />
        <input
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          placeholder="结束日期"
        />
        <button
          type="button"
          onClick={() => {
            setSearchTerm('');
            setTypeFilter('all');
            setFrom('');
            setTo('');
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-600 hover:bg-white"
        >
          清除筛选
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">日期</th>
              <th className="px-4 py-3 text-left">类型</th>
              <th className="px-4 py-3 text-left">课时变动</th>
              <th className="px-4 py-3 text-left">概要</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredEntries.length ? (
              filteredEntries.map((entry) => {
                const value = numberFormatter.format(Math.abs(entry.lessons));
                const sign = entry.lessons >= 0 ? '+' : '-';
                const tone = entry.lessons >= 0 ? 'text-emerald-600' : 'text-rose-600';
                return (
                  <tr key={entry.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(entry.date).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {typeLabelLookup[entry.type] ?? '自定义'}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${tone}`}>
                      {sign}
                      {value}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {entry.summary?.trim() ? entry.summary : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(entry)}
                          className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white"
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(entry.id)}
                          className="rounded-md border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                  暂无课时记录，可点击「新增记录」补录。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
