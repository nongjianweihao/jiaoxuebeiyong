import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classesRepo } from '../../store/repositories/classesRepo';
import { templatesRepo } from '../../store/repositories/templatesRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import type { ClassEntity, Student, TrainingTemplate } from '../../types';
import { ClassForm, type ClassFormValue } from '../../components/forms/ClassForm';

export function ClassNewPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([studentsRepo.list(), templatesRepo.list()])
      .then(([studentsData, templateData]) => {
        setStudents(studentsData);
        setTemplates(templateData);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (value: ClassFormValue) => {
    const entity: ClassEntity = {
      id: value.id,
      name: value.name,
      coachName: value.coachName,
      schedule: value.schedule,
      templateId: value.templateId,
      studentIds: value.studentIds,
    };
    await classesRepo.upsert(entity);
    navigate(`/classes/${entity.id}`);
  };

  const memoizedStudents = useMemo(() => students, [students]);
  const memoizedTemplates = useMemo(() => templates, [templates]);

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-slate-500">
        正在加载数据...
      </div>
    );
  }

  return (
    <ClassForm
      students={memoizedStudents}
      templates={memoizedTemplates}
      onSubmit={handleSubmit}
      submitLabel="创建训练营并进入作战台"
      title="创建勇士训练营"
      description="配置主教练、成长路线图与参战勇士。"
    />
  );
}
