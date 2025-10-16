import { ChangeEvent, FormEvent, useCallback, useMemo, useRef, useState } from 'react';
import type { LessonLedgerEntry, LessonLedgerEntryType } from '../../types';

export interface LessonLedgerFormValues {
  date: string;
  type: LessonLedgerEntryType;
  lessons: string;
  summary?: string;
}

export interface LessonSessionRecord {
  id: string;
  date: string;
  lessons: number;
  summary: string;
  detail?: string;
  sourceLabel?: string;
  createdAt?: string;
}

interface LessonLedgerPanelProps {
  entries: LessonLedgerEntry[];
  sessions: LessonSessionRecord[];
  onCreate(values: LessonLedgerFormValues): Promise<void>;
  onUpdate(id: string, values: LessonLedgerFormValues): Promise<void>;
  onDelete(id: string): Promise<void>;
  onImport?(rows: LessonLedgerFormValues[]): Promise<void>;
}

const TYPE_OPTIONS: Array<{ value: LessonLedgerEntryType; label: string }> = [
  { value: 'consume', label: '课时消耗' },
  { value: 'makeup', label: '补课结算' },
  { value: 'gift', label: '赠课 / 补偿' },
  { value: 'transfer', label: '调课调整' },
  { value: 'adjust', label: '余额校准' },
  { value: 'other', label: '其他记录' },
];

const FILTER_OPTIONS: Array<{ value: LedgerTypeFilter; label: string }> = [
  { value: 'all', label: '全部类型' },
  ...TYPE_OPTIONS,
  { value: 'session', label: '课堂记录' },
];

type LedgerTypeFilter = 'all' | LessonLedgerEntryType | 'session';

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

function toCsvCell(value: string) {
  if (value === undefined || value === null) {
    return '';
  }
  const needsEscape = /[",\r\n]/.test(value);
  if (needsEscape) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function createCsvContent(rows: string[][]) {
  return rows.map((row) => row.map((cell) => toCsvCell(cell ?? '')).join(',')).join('\r\n');
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const trimmed = text.replace(/^\uFEFF/, '');
  let current: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < trimmed.length; i += 1) {
    const char = trimmed[i];
    if (char === '"') {
      if (inQuotes && trimmed[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      current.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && trimmed[i + 1] === '\n') {
        i += 1;
      }
      current.push(field);
      rows.push(current);
      current = [];
      field = '';
    } else {
      field += char;
    }
  }
  current.push(field);
  if (current.length > 1 || current[0]) {
    rows.push(current);
  }
  return rows.filter((row) => row.some((cell) => cell.trim() !== ''));
}

export function LessonLedgerPanel({
  entries,
  sessions,
  onCreate,
  onUpdate,
  onDelete,
  onImport,
}: LessonLedgerPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<LessonLedgerFormValues>(() => createDefaultFormValues());
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<LedgerTypeFilter>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const typeLabelLookup = useMemo(() => {
    const map: Record<string, string> = Object.fromEntries(
      TYPE_OPTIONS.map((option) => [option.value, option.label]),
    );
    map.session = '课堂记录';
    return map;
  }, []);

  const manualTotals = useMemo(() => {
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

  const sessionTotals = useMemo(() => {
    return sessions.reduce(
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
  }, [sessions]);

  type ManualRow = {
    kind: 'manual';
    id: string;
    date: string;
    createdAt: string;
    type: LessonLedgerEntryType;
    lessons: number;
    summary: string;
    detail: string;
    sourceLabel: string;
    original: LessonLedgerEntry;
  };

  type SessionRow = {
    kind: 'session';
    id: string;
    date: string;
    createdAt: string;
    type: 'session';
    lessons: number;
    summary: string;
    detail: string;
    sourceLabel: string;
  };

  type LedgerRow = ManualRow | SessionRow;

  const rows = useMemo<LedgerRow[]>(() => {
    const manual: ManualRow[] = entries.map((entry) => ({
      kind: 'manual' as const,
      id: entry.id,
      date: entry.date,
      createdAt: entry.createdAt,
      type: entry.type,
      lessons: entry.lessons,
      summary: entry.summary ?? '',
      detail: '手动录入',
      sourceLabel: '手动录入',
      original: entry,
    }));
    const auto: SessionRow[] = sessions.map((session) => ({
      kind: 'session' as const,
      id: session.id,
      date: session.date,
      createdAt: session.createdAt ?? session.date,
      type: 'session' as const,
      lessons: session.lessons,
      summary: session.summary,
      detail: session.detail ?? '',
      sourceLabel: session.sourceLabel ?? '课堂挑战',
    }));
    return [...manual, ...auto].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt ?? b.date).getTime() - new Date(a.createdAt ?? a.date).getTime();
    });
  }, [entries, sessions]);

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rows.filter((entry) => {
      if (typeFilter !== 'all') {
        if (entry.kind === 'session') {
          if (typeFilter !== 'session') return false;
        } else if (entry.type !== typeFilter) {
          return false;
        }
      }
      if (from && entry.date < from) {
        return false;
      }
      if (to && entry.date > to) {
        return false;
      }
      if (!term) return true;
      const summary = entry.summary.toLowerCase();
      const detail = entry.detail.toLowerCase();
      const typeLabel = typeLabelLookup[entry.type]?.toLowerCase() ?? entry.type.toLowerCase();
      const source = entry.sourceLabel?.toLowerCase() ?? '';
      return (
        summary.includes(term) ||
        detail.includes(term) ||
        typeLabel.includes(term) ||
        source.includes(term)
      );
    });
  }, [rows, from, to, searchTerm, typeFilter, typeLabelLookup]);

  const manualNetChange = manualTotals.added - manualTotals.consumed;

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

  const handleDownloadTemplate = useCallback(() => {
    const rows: string[][] = [
      ['date', 'type', 'lessons', 'summary'],
      [
        new Date().toISOString().slice(0, 10),
        'consume',
        '-1',
        '常规课堂扣除 1 课时',
      ],
    ];
    const blob = new Blob([createCsvContent(rows)], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lesson-ledger-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleExport = useCallback(() => {
    if (!entries.length) {
      window.alert('暂无可导出的手动课时记录');
      return;
    }
    const rows: string[][] = [
      ['date', 'type', 'lessons', 'summary'],
      ...entries.map((entry) => [
        entry.date,
        entry.type,
        String(entry.lessons),
        entry.summary ?? '',
      ]),
    ];
    const blob = new Blob([createCsvContent(rows)], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lesson-ledger-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [entries]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const parsed = parseCsv(text);
        if (!parsed.length) {
          window.alert('未检测到可导入的数据');
          return;
        }
        const [headerRow, ...dataRows] = parsed;
        const headers = headerRow.map((cell) => cell.trim().toLowerCase());
        const findColumn = (candidates: string[]) =>
          candidates
            .map((candidate) => headers.indexOf(candidate))
            .find((index) => index >= 0);
        const dateIndex = findColumn(['date', '日期']);
        const typeIndex = findColumn(['type', '类型']);
        const lessonsIndex = findColumn(['lessons', 'lesson', '课时', '变动']);
        const summaryIndex = findColumn(['summary', '概要', '备注']);
        if (typeIndex === undefined || lessonsIndex === undefined) {
          window.alert('模板缺少必要的 type 或 lessons 列');
          return;
        }
        const validRows: LessonLedgerFormValues[] = [];
        const errors: string[] = [];
        dataRows.forEach((row, rowIndex) => {
          const lineNumber = rowIndex + 2;
          const rawType = (row[typeIndex] ?? '').trim();
          const typeOption = TYPE_OPTIONS.find(
            (option) => option.value === rawType || option.label === rawType,
          );
          if (!typeOption) {
            errors.push(`第 ${lineNumber} 行的类型无效：${rawType}`);
            return;
          }
          const rawLessons = (row[lessonsIndex] ?? '').trim();
          if (!rawLessons) {
            errors.push(`第 ${lineNumber} 行缺少课时变动数值`);
            return;
          }
          const parsedNumber = Number(rawLessons);
          if (Number.isNaN(parsedNumber)) {
            errors.push(`第 ${lineNumber} 行课时变动无法解析：${rawLessons}`);
            return;
          }
          const rawDate = dateIndex !== undefined ? (row[dateIndex] ?? '').trim() : '';
          const normalizedDate = formatDateInput(rawDate) || new Date().toISOString().slice(0, 10);
          const summary = summaryIndex !== undefined ? row[summaryIndex]?.trim() ?? '' : '';
          validRows.push({
            date: normalizedDate,
            type: typeOption.value,
            lessons: rawLessons,
            summary,
          });
        });
        if (!validRows.length) {
          window.alert(errors.length ? errors.join('\n') : '未找到有效的课时记录');
          return;
        }
        if (onImport) {
          await onImport(validRows);
        } else {
          for (const row of validRows) {
            // eslint-disable-next-line no-await-in-loop
            await onCreate(row);
          }
        }
        resetForm();
        const message = [`成功导入 ${validRows.length} 条记录`];
        if (errors.length) {
          message.push(`忽略 ${errors.length} 条错误：`, ...errors.slice(0, 5));
          if (errors.length > 5) {
            message.push(`……共 ${errors.length} 条错误已省略`);
          }
        }
        window.alert(message.join('\n'));
      } catch (error) {
        window.alert(`导入失败：${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
        setImporting(false);
      }
    },
    [onCreate, onImport],
  );

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">课时 & 挑战记录</h2>
          <p className="text-xs text-slate-500">
            汇总课堂挑战消耗与手动补录的课时变动，支持筛选、导入导出和概要备注。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={startNew}
            className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600"
          >
            新增记录
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white"
          >
            导出记录
          </button>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white"
          >
            下载模板
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-60"
            disabled={importing}
          >
            {importing ? '导入中…' : '导入记录'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="rounded-full bg-slate-100 px-3 py-1">
          课堂累计消耗 {numberFormatter.format(sessionTotals.consumed)} 课时
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1">
          手动补充 {numberFormatter.format(manualTotals.added)} 课时
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1">
          手动消耗 {numberFormatter.format(manualTotals.consumed)} 课时
        </span>
        <span
          className={`rounded-full px-3 py-1 font-semibold ${
            manualNetChange >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}
        >
          手动净变动 {manualNetChange >= 0 ? '+' : '-'}{numberFormatter.format(Math.abs(manualNetChange))} 课时
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
          {FILTER_OPTIONS.map((option) => (
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
              <th className="px-4 py-3 text-right">来源</th>
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
                    <td className="px-4 py-3 text-slate-600">
                      <div className="text-sm font-medium text-slate-700">
                        {entry.summary?.trim() ? entry.summary : '—'}
                      </div>
                      {entry.detail?.trim() ? (
                        <div className="mt-1 text-xs text-slate-400">{entry.detail}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {entry.sourceLabel}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.kind === 'manual' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(entry.original)}
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
                      ) : (
                        <span className="text-xs text-slate-400">自动记录</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">
                  暂无课时记录，可点击「新增记录」或导入模板补录。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
