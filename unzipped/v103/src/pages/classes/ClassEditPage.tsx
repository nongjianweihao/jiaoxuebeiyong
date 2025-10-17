import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { classesRepo } from '../../store/repositories/classesRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { templatesRepo } from '../../store/repositories/templatesRepo';
import type { ClassEntity, Student, TrainingTemplate } from '../../types';
import { ClassForm, type ClassFormValue } from '../../components/forms/ClassForm';

export function ClassEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<ClassEntity | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([classesRepo.get(id), studentsRepo.list(), templatesRepo.list()])
      .then(([cls, studentsData, templateData]) => {
        setEntity(cls ?? null);
        setStudents(studentsData);
        setTemplates(templateData);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (value: ClassFormValue) => {
    const updated: ClassEntity = {
      id: value.id,
      name: value.name,
      coachName: value.coachName,
      schedule: value.schedule,
      templateId: value.templateId,
      studentIds: value.studentIds,
    };
    await classesRepo.upsert(updated);
    navigate(`/classes/${updated.id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    await classesRepo.remove(id);
    navigate('/classes', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-slate-500">
        正在加载训练营数据...
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        未找到该训练营，可能已被解散。
      </div>
    );
  }

  return (
    <ClassForm
      initialValue={entity}
      students={students}
      templates={templates}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      submitLabel="保存训练营信息"
      title="编辑勇士训练营"
      description="更新训练营基础信息、默认任务卡路线与参战勇士。"
    />
  );
}
