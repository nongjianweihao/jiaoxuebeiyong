import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { classesRepo } from '../../store/repositories/classesRepo';
import type { Student } from '../../types';
import { StudentAvatar } from '../../components/StudentAvatar';

export function StudentsIndexPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStudents = useCallback(() => {
    setLoading(true);
    studentsRepo
      .list()
      .then(setStudents)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('确认移除该勇士？相关课时与成绩记录不会自动删除。');
    if (!confirmed) return;
    await studentsRepo.remove(id);
    const classList = await classesRepo.list();
    await Promise.all(
      classList
        .filter((cls) => cls.studentIds.includes(id))
        .map((cls) =>
          classesRepo.upsert({
            ...cls,
            studentIds: cls.studentIds.filter((studentId) => studentId !== id),
          }),
        ),
    );
    setStudents((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">勇士成长册</h1>
          <p className="text-sm text-slate-500">追踪勇士星级、勋章与成长能量，随时查看个人档案。</p>
        </div>
        <Link
          to="/students/new"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          新增勇士
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          正在加载勇士...
        </div>
      ) : (
        <DataTable
          data={students}
          columns={[
            {
              key: 'name',
              header: '勇士',
              cell: (item) => (
                <Link to={`/students/${item.id}`} className="flex items-center gap-2 font-medium text-brand-600">
                  <StudentAvatar
                    name={item.name}
                    avatarUrl={item.avatarUrl}
                    avatarPresetId={item.avatarPresetId}
                    size="xs"
                    badge={item.currentRank ? `L${item.currentRank}` : undefined}
                  />
                  <span>{item.name}</span>
                </Link>
              ),
            },
            {
              key: 'gender',
              header: '性别',
              cell: (item) => (item.gender === 'F' ? '女' : item.gender === 'M' ? '男' : '未填'),
            },
            {
              key: 'rank',
              header: '段位',
              cell: (item) => (item.currentRank ? `L${item.currentRank}` : '未设置'),
            },
            {
              key: 'tags',
              header: '特质标签',
              cell: (item) => (item.tags?.length ? item.tags.join(' / ') : '无'),
            },
            {
              key: 'actions',
              header: '操作',
              cell: (item) => (
                <div className="flex items-center gap-2 text-sm">
                  <Link to={`/students/${item.id}/edit`} className="text-brand-600 hover:text-brand-500">
                    编辑
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    移除
                  </button>
                </div>
              ),
            },
          ]}
          emptyMessage="暂未记录勇士"
        />
      )}
    </div>
  );
}
