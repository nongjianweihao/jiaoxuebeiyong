import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { billingRepo } from '../../store/repositories/billingRepo';
import { classesRepo } from '../../store/repositories/classesRepo';
import type { LessonPackage, PaymentRecord, Student } from '../../types';
import { StudentForm } from '../../components/forms/StudentForm';

export function StudentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    studentsRepo
      .get(id)
      .then((record) => setStudent(record ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (value: Student, packageInfo?: { pkg: LessonPackage; payment: PaymentRecord }) => {
    await studentsRepo.upsert(value);
    if (packageInfo) {
      await billingRepo.addPackage(packageInfo.pkg);
      await billingRepo.addPayment(packageInfo.payment);
    }
    navigate(`/students/${value.id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
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
    navigate('/students', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-slate-500">
        正在加载勇士数据...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        未找到该勇士，可能已被移除。
      </div>
    );
  }

  return (
    <StudentForm
      initialValue={student}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      submitLabel="保存勇士信息"
      title="编辑勇士"
      description="更新勇士成长档案与能量记录。"
    />
  );
}
