import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { templatesRepo } from '../../store/repositories/templatesRepo';
import type { TrainingTemplate } from '../../types';
import { TemplateForm } from '../../components/forms/TemplateForm';

export function TemplateEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<TrainingTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    templatesRepo
      .get(id)
      .then((record) => setTemplate(record ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (updated: TrainingTemplate) => {
    await templatesRepo.upsert(updated);
    navigate('/templates');
  };

  const handleDelete = async () => {
    if (!id) return;
    await templatesRepo.remove(id);
    navigate('/templates', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-slate-500">
        正在加载任务卡数据...
      </div>
    );
  }

  if (!template) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        未找到该任务卡，可能已被移除。
      </div>
    );
  }

  return (
    <TemplateForm
      initialValue={template}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      submitLabel="保存任务卡"
      title="编辑挑战任务卡"
      description="调整任务卡结构、周期与挑战段配置。"
    />
  );
}
