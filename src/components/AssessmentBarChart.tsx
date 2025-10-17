import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface AssessmentBarChartProps {
  data: Array<{
    label: string;
    latest: number | null | undefined;
    previous: number | null | undefined;
  }>;
  latestLabel?: string;
  previousLabel?: string;
}

export function AssessmentBarChart({
  data,
  latestLabel = '本次测评',
  previousLabel = '上次测评',
}: AssessmentBarChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
        暂无测评数据
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
            <Tooltip
              formatter={(value: number | null | undefined) =>
                value === null || value === undefined ? '—' : `${value} 分`
              }
              labelFormatter={(label) => `${label}`}
            />
            <Legend formatter={(_value, entry) => (entry?.dataKey === 'latest' ? latestLabel : previousLabel)} />
            <Bar dataKey="latest" name={latestLabel} fill="#ec4899" radius={[6, 6, 0, 0]} maxBarSize={38} />
            <Bar dataKey="previous" name={previousLabel} fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={38} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
