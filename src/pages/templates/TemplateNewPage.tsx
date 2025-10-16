import { useNavigate } from 'react-router-dom';
import { templatesRepo } from '../../store/repositories/templatesRepo';
import type { TrainingTemplate } from '../../types';
import { TemplateForm } from '../../components/forms/TemplateForm';

export function TemplateNewPage() {
  const navigate = useNavigate();

  const handleSubmit = async (template: TrainingTemplate) => {
    await templatesRepo.upsert({ ...template, createdAt: template.createdAt ?? new Date().toISOString() });
    navigate('/templates');
  };

  return (
    <TemplateForm
      onSubmit={handleSubmit}
      submitLabel="保存任务卡"
      title="创建挑战任务卡"
      description="设计成长任务卡结构，可供多个训练营复用。"
    />
  );
}
