import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import Papa from 'papaparse';
import { db } from '../../store/db';

type StatusState =
  | { type: 'idle' }
  | { type: 'loading'; message: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

interface ImportSummary {
  table: string;
  count: number;
}

const formatDateForFile = (date: Date) => {
  return date.toISOString().replace(/[:.]/g, '-');
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export function DataHubPage() {
  const [status, setStatus] = useState<StatusState>({ type: 'idle' });
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableStats, setTableStats] = useState<Record<string, number>>({});

  const tables = useMemo(() => db.tables.map((table) => table.name).sort(), []);

  useEffect(() => {
    if (tables.length > 0 && !selectedTable) {
      setSelectedTable(tables[0]);
    }
  }, [selectedTable, tables]);

  const refreshStats = useCallback(async () => {
    const entries = await Promise.all(
      db.tables.map(async (table) => {
        const count = await table.count();
        return [table.name, count] as const;
      }),
    );
    setTableStats(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  const handleExportJson = useCallback(async () => {
    try {
      setStatus({ type: 'loading', message: '正在导出全部数据...' });
      const data: Record<string, unknown[]> = {};
      for (const table of db.tables) {
        data[table.name] = await table.toArray();
      }

      const payload = {
        version: db.verno,
        exportedAt: new Date().toISOString(),
        data,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const filename = `coach-backup-${formatDateForFile(new Date())}.json`;
      downloadBlob(blob, filename);
      setStatus({ type: 'success', message: `已导出全部数据到 ${filename}` });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: '导出失败，请重试。' });
    }
  }, []);

  const handleExportCsv = useCallback(async () => {
    if (!selectedTable) {
      return;
    }

    try {
      setStatus({ type: 'loading', message: `正在导出 ${selectedTable} 表...` });
      const table = db.tables.find((item) => item.name === selectedTable);
      if (!table) {
        throw new Error('无法找到数据表');
      }
      const rows = await table.toArray();
      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const filename = `${selectedTable}-${formatDateForFile(new Date())}.csv`;
      downloadBlob(blob, filename);
      setStatus({ type: 'success', message: `已导出 ${selectedTable} 表为 CSV` });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'CSV 导出失败，请重试。' });
    }
  }, [selectedTable]);

  const handleImportJson = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setStatus({ type: 'loading', message: `正在导入 ${file.name} ...` });

    try {
      const content = await file.text();
      const parsed = JSON.parse(content) as {
        data?: Record<string, unknown[]>;
      } | null;

      const payload = parsed?.data && typeof parsed.data === 'object' ? parsed.data : (parsed as Record<string, unknown[]> | null);
      if (!payload || typeof payload !== 'object') {
        throw new Error('无效的备份格式');
      }

      const summaries: ImportSummary[] = [];

      await db.transaction('rw', db.tables, async () => {
        for (const table of db.tables) {
          const dataForTable = payload[table.name];
          if (Array.isArray(dataForTable) && dataForTable.length > 0) {
            await table.bulkPut(dataForTable as any[]);
            summaries.push({ table: table.name, count: dataForTable.length });
          }
        }
      });

      await refreshStats();

      if (summaries.length === 0) {
        setStatus({ type: 'success', message: '导入完成，未检测到需要写入的数据。' });
      } else {
        const detail = summaries.map((item) => `${item.table} × ${item.count}`).join('，');
        setStatus({ type: 'success', message: `导入完成：${detail}` });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: '导入失败，请检查文件格式后重试。' });
    } finally {
      event.target.value = '';
    }
  }, [refreshStats]);

  return (
    <div className="space-y-10">
      <header className="rounded-3xl bg-white/80 p-8 shadow-xl shadow-blue-100/70 ring-1 ring-blue-100">
        <h1 className="text-3xl font-bold text-slate-800">数据管家中心</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          一键导出或导入全部成长数据，支持 JSON 备份与单表 CSV。用于跨设备迁移、定期备份或线下分析。
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl bg-white/90 p-8 shadow-lg shadow-slate-100 ring-1 ring-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">全库备份</h2>
          <p className="mt-2 text-sm text-slate-600">导出 IndexedDB 中的全部数据，生成带时间戳的 JSON 文件。</p>
          <button
            type="button"
            onClick={() => {
              void handleExportJson();
            }}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-300/40"
          >
            导出 JSON 备份
          </button>
        </div>

        <div className="rounded-3xl bg-white/90 p-8 shadow-lg shadow-slate-100 ring-1 ring-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">按表导出 CSV</h2>
          <p className="mt-2 text-sm text-slate-600">选择一个数据表生成 CSV 文件，方便导入 Excel 或 BI 工具。</p>
          <label className="mt-4 block text-xs font-medium text-slate-500" htmlFor="table-select">
            选择数据表
          </label>
          <select
            id="table-select"
            value={selectedTable}
            onChange={(event) => setSelectedTable(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            {tables.map((table) => (
              <option value={table} key={table}>
                {table}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              void handleExportCsv();
            }}
            className="mt-6 w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-400/30 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedTable}
          >
            导出所选 CSV
          </button>
        </div>

        <div className="rounded-3xl bg-white/90 p-8 shadow-lg shadow-slate-100 ring-1 ring-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">导入备份</h2>
          <p className="mt-2 text-sm text-slate-600">
            支持从 JSON 备份恢复数据，自动按表合并（相同主键会被覆盖）。
          </p>
          <label className="mt-6 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/60 px-6 py-8 text-center text-sm font-semibold text-purple-700 hover:border-purple-300">
            <span>上传 JSON 备份</span>
            <input type="file" accept="application/json" className="hidden" onChange={handleImportJson} />
          </label>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            建议在导入前先导出一份备份。导入操作不可撤销，将覆盖相同 ID 的记录。
          </p>
        </div>
      </section>

      <section className="rounded-3xl bg-white/70 p-6 shadow-inner ring-1 ring-slate-100">
        <h2 className="text-lg font-semibold text-slate-700">当前数据量概览</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tables.map((table) => (
            <div
              key={table}
              className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm shadow-sm"
            >
              <div className="font-medium text-slate-600">{table}</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{tableStats[table] ?? 0}</div>
            </div>
          ))}
        </div>
      </section>

      <section aria-live="polite">
        {status.type !== 'idle' && (
          <div
            className={`rounded-3xl border px-6 py-4 text-sm font-medium shadow ${
              status.type === 'loading'
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : status.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {status.message}
          </div>
        )}
      </section>
    </div>
  );
}
