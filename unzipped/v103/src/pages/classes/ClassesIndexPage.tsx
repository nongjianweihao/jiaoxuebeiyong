import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { classesRepo } from '../../store/repositories/classesRepo';
import type { ClassEntity } from '../../types';
import { DataTable } from '../../components/DataTable';

export function ClassesIndexPage() {
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClasses = useCallback(() => {
    setLoading(true);
    classesRepo
      .list()
      .then(setClasses)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('确认解散该训练营？关联的成长记录将保留，但训练营将无法访问。');
    if (!confirmed) return;
    await classesRepo.remove(id);
    setClasses((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">勇士训练营</h1>
          <p className="text-sm text-slate-500">掌控每日签到、上课出勤与能量条进度，随时调整训练阵容。</p>
        </div>
        <Link
          to="/classes/new"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          新建训练营
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          正在加载训练营...
        </div>
      ) : (
        <DataTable
          data={classes}
          columns={[
            {
              key: 'name',
              header: '训练营',
              cell: (item) => (
                <Link to={`/classes/${item.id}`} className="font-medium text-brand-600">
                  {item.name}
                </Link>
              ),
            },
            {
              key: 'coach',
              header: '主教练',
              cell: (item) => item.coachName,
            },
            {
              key: 'schedule',
              header: '训练时间',
              cell: (item) => item.schedule ?? '未设置',
            },
            {
              key: 'students',
              header: '勇士人数',
              cell: (item) => item.studentIds.length,
            },
            {
              key: 'actions',
              header: '操作',
              cell: (item) => (
                <div className="flex items-center gap-2 text-sm">
                  <Link to={`/classes/${item.id}/edit`} className="text-brand-600 hover:text-brand-500">
                    编辑
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    删除
                  </button>
                </div>
              ),
            },
          ]}
          emptyMessage="尚未创建训练营"
        />
      )}
    </div>
  );
}
