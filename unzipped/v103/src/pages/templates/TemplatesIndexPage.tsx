import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { templatesRepo } from '../../store/repositories/templatesRepo';
import { classesRepo } from '../../store/repositories/classesRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { puzzlesRepo } from '../../store/repositories/puzzlesRepo';
import { db } from '../../store/db';
import type { ClassEntity, Student, TrainingTemplate } from '../../types';
import type { MissionProgress, PuzzleTemplate } from '../../types.gamify';

const periodLabel: Record<TrainingTemplate['period'], string> = {
  PREP: '准备期',
  SPEC: '专项准备期',
  COMP: '比赛期',
};

export function TemplatesIndexPage() {
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<MissionProgress[]>([]);
  const [puzzles, setPuzzles] = useState<PuzzleTemplate[]>([]);

  const loadTemplates = useCallback(() => {
    setLoading(true);
    Promise.all([
      templatesRepo.list(),
      classesRepo.list(),
      studentsRepo.list(),
      db.missionsProgress.where('status').equals('assigned').toArray(),
      puzzlesRepo.listTemplates(),
    ])
      .then(([templateList, classList, studentList, assignmentList, puzzleTemplates]) => {
        setTemplates(templateList);
        setClasses(classList);
        setStudents(studentList);
        setAssignments(assignmentList);
        setPuzzles(puzzleTemplates);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('确认删除该挑战任务卡？删除后训练营将不再引用它。');
    if (!confirmed) return;
    await templatesRepo.remove(id);
    await db.missionsProgress.where('missionId').equals(id).delete();
    setTemplates((prev) => prev.filter((item) => item.id !== id));
    setAssignments((prev) => prev.filter((item) => item.missionId !== id));
    const affectedClasses = classes.filter((cls) => cls.templateId === id);
    if (affectedClasses.length) {
      await Promise.all(
        affectedClasses.map((cls) => classesRepo.upsert({ ...cls, templateId: undefined })),
      );
      setClasses((prev) => prev.map((cls) => (cls.templateId === id ? { ...cls, templateId: undefined } : cls)));
    }
  };

  const handleAssign = async (template: TrainingTemplate) => {
    if (!classes.length && !students.length) {
      window.alert('尚未创建训练营或学员，无法派发任务卡。');
      return;
    }

    const mode = window.prompt('选择派发对象类型：输入 1 派发班级，输入 2 派发学员');
    if (!mode) return;

    if (mode.trim() === '2') {
      if (!students.length) {
        window.alert('暂无学员可派发，请先添加学员。');
        return;
      }
      const studentOptions = students
        .map((stu, index) => `${index + 1}. ${stu.name}`)
        .join('\n');
      const input = window.prompt(`选择要派发的学员编号：\n${studentOptions}`);
      if (!input) return;
      const index = Number(input) - 1;
      const selectedStudent = students[index];
      if (!selectedStudent) {
        window.alert('未找到对应的学员编号');
        return;
      }
      const duplicate = assignments.find(
        (record) => record.studentId === selectedStudent.id && record.missionId === template.id,
      );
      if (duplicate) {
        const confirmed = window.confirm('该学员已拥有此任务卡，是否重新派发？');
        if (!confirmed) return;
        if (duplicate.id) {
          await db.missionsProgress.delete(duplicate.id);
        }
      }
      const relatedClass = classes.find((cls) => cls.studentIds.includes(selectedStudent.id));
      const record: MissionProgress = {
        studentId: selectedStudent.id,
        classId: relatedClass?.id ?? 'personal',
        missionId: template.id,
        date: new Date().toISOString(),
        stars: 0,
        energy: 0,
        status: 'assigned',
      };
      const id = await db.missionsProgress.add(record);
      setAssignments((prev) => [
        ...prev.filter((item) =>
          duplicate?.id ? item.id !== duplicate.id : !(item.studentId === record.studentId && item.missionId === record.missionId),
        ),
        { ...record, id },
      ]);
      window.alert(`已为 ${selectedStudent.name} 派发「${template.name}」任务卡`);
      return;
    }

    if (!classes.length) {
      window.alert('尚未创建训练营，无法派发任务卡。');
      return;
    }

    const classOptions = classes.map((cls, index) => `${index + 1}. ${cls.name}`).join('\n');
    const input = window.prompt(`选择要派发的训练营编号：\n${classOptions}`);
    if (!input) return;
    const index = Number(input) - 1;
    const selectedClass = classes[index];
    if (!selectedClass) {
      window.alert('未找到对应的训练营编号');
      return;
    }
    if (selectedClass.templateId && selectedClass.templateId !== template.id) {
      const activeTemplate = templates.find((item) => item.id === selectedClass.templateId);
      const confirmed = window.confirm(
        `该训练营当前使用「${activeTemplate?.name ?? '其它任务卡'}」，是否替换为「${template.name}」？`,
      );
      if (!confirmed) return;
    }
    await classesRepo.upsert({ ...selectedClass, templateId: template.id });
    setClasses((prev) =>
      prev.map((cls) => (cls.id === selectedClass.id ? { ...selectedClass, templateId: template.id } : cls)),
    );
    window.alert(`已将「${template.name}」派发至 ${selectedClass.name}`);
  };

  const assignmentLookup = useMemo(() => {
    const studentNameMap = new Map(students.map((stu) => [stu.id, stu.name]));
    const classNameMap = new Map(classes.map((cls) => [cls.id, cls.name]));
    const map = new Map<string, { classes: string[]; students: string[] }>();
    templates.forEach((template) => {
      map.set(template.id, { classes: [], students: [] });
    });
    classes.forEach((cls) => {
      if (!cls.templateId) return;
      const entry = map.get(cls.templateId);
      if (!entry) return;
      if (!entry.classes.includes(cls.name)) {
        entry.classes.push(cls.name);
      }
    });
    assignments.forEach((assignment) => {
      const entry = map.get(assignment.missionId);
      if (!entry) return;
      const studentName = studentNameMap.get(assignment.studentId);
      if (studentName && !entry.students.includes(studentName)) {
        entry.students.push(studentName);
      }
      const className =
        assignment.classId === 'personal' ? '个人任务' : classNameMap.get(assignment.classId);
      if (className && !entry.classes.includes(className)) {
        entry.classes.push(className);
      }
    });
    return map;
  }, [assignments, classes, students, templates]);

  const puzzleLookup = useMemo(() => {
    const map = new Map<string, PuzzleTemplate>();
    puzzles.forEach((puzzle) => map.set(puzzle.id, puzzle));
    return map;
  }, [puzzles]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">挑战任务卡库</h1>
          <p className="text-sm text-slate-500">维护成长路线图与挑战要点，支持编辑与复制应用。</p>
        </div>
        <Link
          to="/templates/new"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          新建任务卡
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          正在加载任务卡...
        </div>
      ) : (
        <DataTable
          data={templates}
          columns={[
            {
              key: 'name',
              header: '任务卡名称',
              cell: (item) => item.name,
            },
            {
              key: 'period',
              header: '周期',
              cell: (item) => periodLabel[item.period],
            },
            {
              key: 'stage',
              header: '成长阶段',
              cell: (item) => item.resolvedStage?.name ?? '—',
            },
            {
              key: 'planMeta',
              header: '周期资产',
              cell: (item) =>
                item.resolvedPlan
                  ? `${item.resolvedPlan.name} · ${item.resolvedPlan.durationWeeks} 周`
                  : '自定义编排',
            },
            {
              key: 'structure',
              header: '结构',
              cell: (item) => (
                <div className="text-xs text-slate-600">
                  <div>单元：{item.unitIds.length}</div>
                  <div>段落：{item.blocks.length}</div>
                </div>
              ),
            },
            {
              key: 'puzzles',
              header: '主线谜题',
              cell: (item) => {
                const bindings = item.blocks.filter((block) => block.puzzleTemplateId);
                if (!bindings.length) {
                  return <span className="text-slate-400">未关联</span>;
                }
                const summary = new Map<string, number>();
                bindings.forEach((block) => {
                  if (!block.puzzleTemplateId) return;
                  const puzzle = puzzleLookup.get(block.puzzleTemplateId);
                  const count = block.puzzleCardIds?.length ?? puzzle?.cards.length ?? 0;
                  summary.set(block.puzzleTemplateId, (summary.get(block.puzzleTemplateId) ?? 0) + count);
                });
                return (
                  <div className="space-y-1 text-xs text-slate-600">
                    {Array.from(summary.entries()).map(([puzzleId, count]) => {
                      const puzzle = puzzleLookup.get(puzzleId);
                      return (
                        <div key={puzzleId} className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-700">{puzzle?.name ?? puzzleId}</span>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-600">
                            {count} 张
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              },
            },
            {
              key: 'createdAt',
              header: '创建日期',
              cell: (item) => new Date(item.createdAt).toLocaleDateString(),
            },
            {
              key: 'assigned',
              header: '已派发',
              cell: (item) => {
                const assigned = assignmentLookup.get(item.id);
                if (!assigned || (!assigned.classes.length && !assigned.students.length)) {
                  return '—';
                }
                return (
                  <div className="space-y-1 text-xs text-slate-600">
                    {assigned.classes.length > 0 && (
                      <div>
                        <span className="font-semibold text-slate-500">班级：</span>
                        {assigned.classes.join('、')}
                      </div>
                    )}
                    {assigned.students.length > 0 && (
                      <div>
                        <span className="font-semibold text-slate-500">学员：</span>
                        {assigned.students.join('、')}
                      </div>
                    )}
                  </div>
                );
              },
            },
            {
              key: 'actions',
              header: '操作',
              cell: (item) => (
                <div className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => handleAssign(item)}
                    className="text-amber-600 hover:text-amber-500"
                  >
                    派发
                  </button>
                  <Link to={`/templates/${item.id}/edit`} className="text-brand-600 hover:text-brand-500">
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
          emptyMessage="暂无任务卡"
        />
      )}
    </div>
  );
}
