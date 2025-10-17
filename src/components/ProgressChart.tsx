import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export type SeriesPoint = { date: string; score: number };

export type LineSeries = {
  label: string;
  color?: string;
  data: SeriesPoint[];
};

type SeriesInput = SeriesPoint[] | LineSeries[];

interface ProgressChartProps {
  series: SeriesInput;
  title?: string;
  yDomain?: [number, number] | ['auto', 'auto'];
  yTicks?: number[];
  color?: string;
  allowDecimals?: boolean;
  lineType?: 'monotone' | 'linear' | 'stepAfter' | 'basis' | 'cardinal' | 'natural';
}

export function ProgressChart({
  series,
  title,
  yDomain,
  yTicks,
  color,
  allowDecimals,
  lineType,
}: ProgressChartProps) {
  const toLineSeries = (input: SeriesInput): LineSeries[] => {
    if (!input.length) return [];
    const first = input[0] as SeriesPoint | LineSeries;
    if (first && (first as LineSeries).data) {
      return input as LineSeries[];
    }
    return [
      {
        label: '得分',
        color,
        data: input as SeriesPoint[],
      },
    ];
  };

  const lines = toLineSeries(series);

  const hasData = lines.some((line) => line.data.length > 0);
  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
        暂无数据
      </div>
    );
  }

  const palette = ['#2563eb', '#f97316', '#10b981', '#ec4899', '#6366f1', '#14b8a6'];
  const formattedLines = lines.map((line, index) => ({
    ...line,
    color: line.color ?? palette[index % palette.length],
    key: `series${index}`,
  }));

  const allDates = Array.from(
    new Set(
      formattedLines.flatMap((line) => line.data.map((point) => point.date)),
    ),
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const chartData = allDates.map((date) => {
    const row: Record<string, number | string | null> = { date };
    formattedLines.forEach((line) => {
      const point = line.data.find((item) => item.date === date);
      row[line.key] = point ? point.score : null;
    });
    return row;
  });

  const formatDateLabel = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-semibold text-slate-600">{title}</h3>}
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 24, right: 16, left: 0, bottom: 16 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-15}
              textAnchor="end"
              height={50}
              tickFormatter={formatDateLabel}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={yDomain ?? ['auto', 'auto']}
              ticks={yTicks}
              allowDecimals={allowDecimals ?? (yTicks ? false : true)}
            />
            <Tooltip labelFormatter={(value) => formatDateLabel(String(value))} />
            {formattedLines.length > 1 && (
              <Legend
                verticalAlign="top"
                height={20}
                wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
              />
            )}
            {formattedLines.map((line) => (
              <Line
                key={line.key}
                type={lineType ?? 'monotone'}
                dataKey={line.key}
                name={line.label}
                stroke={line.color ?? '#0a96f0'}
                strokeWidth={2}
                dot
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
