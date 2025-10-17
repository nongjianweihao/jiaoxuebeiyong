import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: ReactNode;
}

export function DataTable<T>({ data, columns, emptyMessage }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        {emptyMessage ?? '暂无数据'}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-50/60">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-sm text-slate-700">
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
