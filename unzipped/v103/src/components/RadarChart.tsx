import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RadarChartProps {
  data?: Record<string, number>;
  reference?: Record<string, number>;
  valueLabel?: string;
  referenceLabel?: string;
}

const QUALITY_LABELS: Record<string, string> = {
  speed: '速度',
  power: '爆发力',
  endurance: '耐力',
  coordination: '协调',
  agility: '灵敏',
  balance: '平衡',
  flexibility: '柔韧',
  core: '核心',
  accuracy: '精准度',
  morphology: '体态',
};

export function RadarChart({
  data,
  reference,
  valueLabel = '当前',
  referenceLabel = '参考',
}: RadarChartProps) {
  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
        暂无雷达数据
      </div>
    );
  }

  const entries = Object.entries(data).map(([quality, value]) => ({
    quality,
    label: QUALITY_LABELS[quality] ?? quality,
    value,
    reference: reference?.[quality] ?? null,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <RechartsRadar data={entries} outerRadius="70%">
          <PolarGrid />
          <PolarAngleAxis dataKey="label" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Tooltip />
          {reference && (
            <Radar
              name={referenceLabel}
              dataKey="reference"
              stroke="#94a3b8"
              fill="#94a3b8"
              fillOpacity={0.15}
            />
          )}
          <Radar name={valueLabel} dataKey="value" stroke="#0a96f0" fill="#38b4ff" fillOpacity={0.4} />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
