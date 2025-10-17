import type { AttendanceItem, Student } from '../types';
import { StudentAvatar } from './StudentAvatar';

interface AttendanceGridProps {
  students: Student[];
  value: AttendanceItem[];
  onChange: (items: AttendanceItem[]) => void;
  consumeOverrides?: Record<string, number | undefined>;
  lessonConsume?: number;
  onOverrideChange?: (studentId: string, consume?: number) => void;
}

const overrideOptions = [0, 0.5, 1, 1.5, 2] as const;

export function AttendanceGrid({
  students,
  value,
  onChange,
  consumeOverrides,
  lessonConsume = 1,
  onOverrideChange,
}: AttendanceGridProps) {
  const map = new Map(value.map((item) => [item.studentId, item]));

  const update = (studentId: string, updater: (item: AttendanceItem) => AttendanceItem) => {
    const existing = map.get(studentId) ?? { studentId, present: true };
    map.set(studentId, updater(existing));
    onChange(Array.from(map.values()));
  };

  return (
    <div className="grid gap-2">
      {students.map((student) => {
        const attendance = map.get(student.id) ?? { studentId: student.id, present: true };
        return (
          <div
            key={student.id}
            className={`flex items-center justify-between rounded-lg border bg-white px-4 py-3 ${
              attendance.present ? 'border-brand-200' : 'border-slate-200 opacity-70'
            }`}
          >
            <div className="flex items-center gap-3">
              <StudentAvatar
                name={student.name}
                avatarUrl={student.avatarUrl}
                avatarPresetId={student.avatarPresetId}
                size="xs"
                badge={student.currentRank ? `L${student.currentRank}` : undefined}
              />
              <div>
                <p className="text-sm font-medium text-slate-900">{student.name}</p>
                {attendance.remark && <p className="text-xs text-slate-500">{attendance.remark}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  attendance.present ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}
                onClick={() => update(student.id, () => ({ ...attendance, present: true }))}
              >
                到课
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  !attendance.present ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}
                onClick={() => update(student.id, () => ({ ...attendance, present: false }))}
              >
                请假
              </button>
              <input
                value={attendance.remark ?? ''}
                onChange={(event) =>
                  update(student.id, (item) => ({ ...item, remark: event.target.value }))
                }
                placeholder="备注"
                className="w-32 rounded-md border border-slate-200 px-2 py-1 text-xs"
              />
              {onOverrideChange && (
                <select
                  value={
                    consumeOverrides?.[student.id] === undefined
                      ? 'default'
                      : String(consumeOverrides?.[student.id])
                  }
                  onChange={(event) => {
                    if (event.target.value === 'default') {
                      onOverrideChange?.(student.id, undefined);
                    } else {
                      onOverrideChange?.(student.id, Number(event.target.value));
                    }
                  }}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
                >
                  <option value="default">默认 {lessonConsume} 节</option>
                  {overrideOptions.map((option) => (
                    <option key={option} value={option}>
                      {option} 节
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
