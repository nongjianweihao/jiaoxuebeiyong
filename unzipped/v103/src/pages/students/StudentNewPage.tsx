import { useNavigate } from 'react-router-dom';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { billingRepo } from '../../store/repositories/billingRepo';
import type { LessonPackage, PaymentRecord, Student } from '../../types';
import { StudentForm } from '../../components/forms/StudentForm';

export function StudentNewPage() {
  const navigate = useNavigate();

  const handleSubmit = async (student: Student, packageInfo?: { pkg: LessonPackage; payment: PaymentRecord }) => {
    await studentsRepo.upsert(student);
    if (packageInfo) {
      await billingRepo.addPackage(packageInfo.pkg);
      await billingRepo.addPayment(packageInfo.payment);
    }
    navigate(`/students/${student.id}`);
  };

  return (
    <StudentForm
      onSubmit={handleSubmit}
      submitLabel="保存勇士档案"
      title="新增勇士"
      description="录入勇士基础信息，可选同步首购能量与实付金额。"
    />
  );
}
