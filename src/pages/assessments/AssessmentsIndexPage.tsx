import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';


import type { Column } from '../../components/DataTable';
import { EnergyBoard } from '../../components/EnergyBoard';
import { RewardToast } from '../../components/RewardToast';
import { AssessmentReportPanel } from '../../components/assessment/AssessmentReportPanel';
import { AssessmentReportModal } from '../../components/assessment/AssessmentReportModal';


import { studentsRepo } from '../../store/repositories/studentsRepo';
import { testsRepo } from '../../store/repositories/testsRepo';
import { sessionsRepo } from '../../store/repositories/sessionsRepo';
import { generateId } from '../../store/repositories/utils';
import { AwardEngine } from '../../gamify/awardEngine';
import { maybeUpgradeRank } from '../../utils/calc';
import { pointEventsRepo } from '../../store/repositories/pointEventsRepo';
import { sumFreestyleRewards } from '../../config/freestyleRewards';
import { db } from '../../store/db';
import { ASSESSMENT_METRICS } from '../../config/assessment';
import { calculateWarriorAssessmentReport } from '../../utils/warriorAssessment';
import type {
  FitnessTestResult,
  RankExamRecord,
  RankMove,
  SessionRecord,
  Student,
} from '../../types';



const METRIC_KEYS = [
  'height',
  'weight',
  'run50m',
  'sitAndReach',
  'longJump',
  'sitUps',
  'pullUps',
  'pushUps',
  'vitalCapacity',
  'ropeEndurance',
  'ropeSkipSpeed',
  'sr30',
  'sr60',
  'du30',
] as const;

type MetricKey = (typeof METRIC_KEYS)[number];

interface AssessmentFormState {
  studentId: string;
  date: string;
  coachComment: string;
  [key: string]: string;
}

const createAssessmentForm = (studentId: string): AssessmentFormState => {
  const base: AssessmentFormState = {
    studentId,
    date: new Date().toISOString().slice(0, 10),
    coachComment: '',
  };
  METRIC_KEYS.forEach((key) => {
    base[key] = '';
  });
  return base;
};

const toQuarter = (date: Date) => {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}Q${quarter}`;
};

export function AssessmentsIndexPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<FitnessTestResult[]>([]);
  const [rankExams, setRankExams] = useState<RankExamRecord[]>([]);
  const [rankMoves, setRankMoves] = useState<RankMove[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assessmentForm, setAssessmentForm] = useState<AssessmentFormState>(createAssessmentForm(''));
  const [examForm, setExamForm] = useState({ studentId: '', toRank: 1, passed: true, notes: '' });
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [savingAssessment, setSavingAssessment] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);


  useEffect(() => {
    async function bootstrap() {
      const studentList = await studentsRepo.list();
      const defaultStudentId = studentList[0]?.id ?? '';

      const existingItems = await db.fitnessTestItems.toArray();
      const missing = ASSESSMENT_METRICS.filter(
        (metric) => !existingItems.some((item) => item.id === metric.id),
      );
      if (missing.length) {
        await db.fitnessTestItems.bulkPut(
          missing.map((metric) => ({
            id: metric.id,
            name: metric.label,
            quality: metric.quality,
            unit: metric.unit,
          })),
        );
      }

      const [rankMoveList, allResults, allExams] = await Promise.all([
        db.rankMoves.toArray(),
        Promise.all(studentList.map((student) => testsRepo.listResultsByStudent(student.id))),
        Promise.all(studentList.map((student) => testsRepo.listRankExams(student.id))),
      ]);

      setStudents(studentList);
      setSelectedStudentId(defaultStudentId);
      setAssessmentForm(createAssessmentForm(defaultStudentId));
      setExamForm((prev) => ({ ...prev, studentId: defaultStudentId }));
      setRankMoves(rankMoveList);
      setResults(
        allResults
          .flat()
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      );
      setRankExams(
        allExams
          .flat()
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      );
    }
    void bootstrap();
  }, []);



  useEffect(() => {
    if (!selectedStudentId) return;
    sessionsRepo
      .listByStudent(selectedStudentId)
      .then((list) =>
        setSessions(
          list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        ),
      )
      .catch((error) => {
        console.error('加载课堂数据失败', error);
      });
  }, [selectedStudentId]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  const studentResults = useMemo(
    () =>
      results
        .filter((result) => result.studentId === selectedStudentId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [results, selectedStudentId],
  );

  const latestResult = studentResults[0] ?? null;

  const report = useMemo(() => {
    if (!latestResult || !selectedStudent) return null;
    return calculateWarriorAssessmentReport({
      student: selectedStudent,
      result: latestResult,
      sessions,
      rankMoves,
    });
  }, [latestResult, selectedStudent, sessions, rankMoves]);

  const historyRows = useMemo(() => {
    if (!selectedStudent) return [] as Array<{ result: FitnessTestResult; totalScore: number; level: string }>;
    return studentResults.map((result) => {
      const computed = calculateWarriorAssessmentReport({
        student: selectedStudent,
        result,
        sessions,
        rankMoves,
      });
      return { result, totalScore: computed.totalScore, level: computed.level.title };
    });
  }, [studentResults, selectedStudent, sessions, rankMoves]);

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setAssessmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAssessment = async (event: React.FormEvent) => {


    event.preventDefault();
    if (!assessmentForm.studentId) return;

    const metrics: Partial<Record<MetricKey, number>> = {};
    METRIC_KEYS.forEach((key) => {
      const value = Number(assessmentForm[key]);
      if (Number.isFinite(value)) metrics[key] = value;
    });

    if (!metrics.height || !metrics.weight) {
      window.alert('请至少填写身高与体重，便于生成完整报告。');
      return;
    }

    setSavingAssessment(true);
    try {
      const assessmentDate = assessmentForm.date ? new Date(assessmentForm.date) : new Date();
      const result: FitnessTestResult = {
        id: generateId(),
        studentId: assessmentForm.studentId,
        quarter: toQuarter(assessmentDate),
        date: assessmentDate.toISOString(),
        items: Object.entries(metrics).map(([itemId, value]) => ({
          itemId,
          value: Number(value),
        })),
        radar: {} as FitnessTestResult['radar'],
        coachComment: assessmentForm.coachComment || undefined,
      };

      const student = students.find((item) => item.id === assessmentForm.studentId) ?? null;
      const studentSessions =
        assessmentForm.studentId === selectedStudentId
          ? sessions
          : await sessionsRepo.listByStudent(assessmentForm.studentId);
      const computed = calculateWarriorAssessmentReport({
        student,
        result,
        sessions: studentSessions,
        rankMoves,
      });
      result.radar = computed.radar;

      await testsRepo.upsertResult(result);
      setResults((prev) =>
        [result, ...prev].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );
      setToastMessage('测评记录已保存，可查看完整报告。');

      const ropeSpeed = metrics.sr30 ?? metrics.ropeSkipSpeed;
      if (ropeSpeed && student) {
        const before = student.currentRank ?? 0;
        const updatedRank = maybeUpgradeRank({ ...student }, ropeSpeed);
        if (updatedRank > before) {
          await studentsRepo.upsert({ ...student, currentRank: updatedRank });
          setStudents((prev) =>
            prev.map((item) => (item.id === student.id ? { ...item, currentRank: updatedRank } : item)),
          );
        }
      }
    } finally {
      setSavingAssessment(false);
    }
  };



  const handleStudentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedStudentId(value);
    setAssessmentForm((prev) => ({ ...prev, studentId: value }));
    setExamForm((prev) => ({ ...prev, studentId: value }));


  };

  const handleDeleteResult = async (resultId: string) => {
    const confirmed = window.confirm('确定删除该测评记录吗？');
    if (!confirmed) return;
    await testsRepo.removeResult(resultId);
    setResults((prev) => prev.filter((item) => item.id !== resultId));
  };

  const handleSaveExam = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!examForm.studentId) return;
    const existing = editingExamId ? rankExams.find((record) => record.id === editingExamId) : undefined;
    const nowIso = new Date().toISOString();
    const record: RankExamRecord = {
      id: editingExamId ?? generateId(),
      studentId: examForm.studentId,
      date: editingExamId ? existing?.date ?? nowIso : nowIso,
      fromRank:
        existing?.fromRank ??
        (students.find((student) => student.id === examForm.studentId)?.currentRank ?? 0),
      toRank: examForm.toRank,
      passed: examForm.passed,
      notes: examForm.notes,
    };
    await testsRepo.upsertRankExam(record);
    setRankExams((prev) => {
      const next = prev.filter((item) => item.id !== record.id);
      return [record, ...next].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    if (record.passed) {
      const student = await studentsRepo.get(record.studentId);
      if (student) {
        const before = student.currentRank ?? 0;
        await studentsRepo.upsert({ ...student, currentRank: record.toRank });
        setStudents((prev) =>
          prev.map((item) => (item.id === student.id ? { ...item, currentRank: record.toRank } : item)),
        );
        if (record.toRank > before) {
          const reward = await AwardEngine.awardAssessmentRankUp(
            record.studentId,
            `RANK_${record.toRank}`,
            `段位 L${record.toRank}`,
          );
          setToastMessage(`段位晋级 +${reward} 能量`);
        }
      }

      const previouslyReached = existing?.passed ? existing.toRank : record.fromRank;
      if (record.toRank > previouslyReached) {
        const ranksToReward = Array.from(
          { length: record.toRank - previouslyReached },
          (_, index) => previouslyReached + index + 1,
        );
        const totals = sumFreestyleRewards(ranksToReward);
        const sessionId = `rank-exam:${record.id}`;

        if (totals.points > 0) {
          await pointEventsRepo.add({
            id: generateId(),
            studentId: record.studentId,
            sessionId,
            date: record.date,
            type: 'freestyle_pass',
            points: totals.points,
            reason: `段位测评通关 L${previouslyReached} → L${record.toRank}`,
          });
        }

        if (totals.energy > 0) {
          await AwardEngine.grantEnergy(
            record.studentId,
            totals.energy,
            'freestyle_pass',
            sessionId,
            {
              fromRank: previouslyReached,
              toRank: record.toRank,
            },
            new Date(record.date),
          );
        }
      }
    }

    setEditingExamId(null);
  };

  const handleDeleteExam = async (id: string) => {

    const confirmed = window.confirm('确定删除该段位记录吗？');

    if (!confirmed) return;
    await testsRepo.removeRankExam(id);
    setRankExams((prev) => prev.filter((item) => item.id !== id));
    if (editingExamId === id) setEditingExamId(null);
  };

  type HistoryRow = { result: FitnessTestResult; totalScore: number; level: string };

  const historyColumns: Column<HistoryRow>[] = [
    {
      key: 'date',
      header: '测评日期',
      cell: (row) => new Date(row.result.date).toLocaleDateString(),
    },
    {
      key: 'score',
      header: '综合得分',
      cell: (row) => Math.round(row.totalScore),
    },
    {
      key: 'level',
      header: '等级称号',
      cell: (row) => row.level,
    },
    {
      key: 'actions',
      header: '操作',
      cell: (row) => (
        <button
          type="button"
          className="text-sm font-semibold text-rose-500 hover:text-rose-600"
          onClick={() => handleDeleteResult(row.result.id)}
        >
          删除
        </button>
      ),
    },
  ];

  const examColumns: Column<RankExamRecord>[] = [
    {
      key: 'date',
      header: '日期',
      cell: (row: RankExamRecord) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: 'student',
      header: '学员',
      cell: (row: RankExamRecord) => students.find((item) => item.id === row.studentId)?.name ?? '—',
    },
    {
      key: 'rank',
      header: '段位',
      cell: (row: RankExamRecord) => `L${row.fromRank} → L${row.toRank}`,
    },
    {
      key: 'notes',
      header: '备注',
      cell: (row: RankExamRecord) => row.notes ?? '—',
    },
    {
      key: 'exam-actions',
      header: '操作',
      cell: (row: RankExamRecord) => (
        <div className="flex gap-3">
          <button
            type="button"
            className="text-sm text-purple-600 hover:text-purple-700"
            onClick={() => {
              setEditingExamId(row.id);
              setExamForm({
                studentId: row.studentId,
                toRank: row.toRank,
                passed: row.passed,
                notes: row.notes ?? '',
              });
            }}
          >
            编辑
          </button>
          <button
            type="button"
            className="text-sm text-rose-500 hover:text-rose-600"
            onClick={() => handleDeleteExam(row.id)}
          >
            删除
          </button>
        </div>
      ),
    },
  ];

  return (


    <div className="space-y-8">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🏆 勇士试炼场</h1>
          <p className="text-sm text-slate-500">测评 → 晋级 → 报告 → 分享，一站式完成</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-500">选择勇士</label>
          <select
            value={selectedStudentId}
            onChange={handleStudentChange}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-rose-400 focus:outline-none"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <EnergyBoard students={students} />

      <section className="rounded-3xl bg-white/80 p-6 shadow-md backdrop-blur">
        <h2 className="text-xl font-semibold text-slate-900">录入测评数据</h2>
        <p className="mt-1 text-sm text-slate-500">填写最新体能数据，系统自动生成星级与成长报告。</p>
        <form onSubmit={handleSaveAssessment} className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <InputField label="测评日期" name="date" type="date" value={assessmentForm.date} onChange={handleFormChange} />
            <InputField label="身高（厘米）" name="height" value={assessmentForm.height} onChange={handleFormChange} required />
            <InputField label="体重（千克）" name="weight" value={assessmentForm.weight} onChange={handleFormChange} required />
            <InputField label="50米跑（秒）" name="run50m" value={assessmentForm.run50m} onChange={handleFormChange} />
            <InputField label="坐位体前屈（厘米）" name="sitAndReach" value={assessmentForm.sitAndReach} onChange={handleFormChange} />
            <InputField label="立定跳远（厘米）" name="longJump" value={assessmentForm.longJump} onChange={handleFormChange} />
            <InputField label="仰卧起坐（次）" name="sitUps" value={assessmentForm.sitUps} onChange={handleFormChange} />
            <InputField label="引体向上（次）" name="pullUps" value={assessmentForm.pullUps} onChange={handleFormChange} />
            <InputField label="俯卧撑（次）" name="pushUps" value={assessmentForm.pushUps} onChange={handleFormChange} />
            <InputField label="肺活量（毫升）" name="vitalCapacity" value={assessmentForm.vitalCapacity} onChange={handleFormChange} />
            <InputField label="3分钟单摇（次）" name="ropeEndurance" value={assessmentForm.ropeEndurance} onChange={handleFormChange} />
            <InputField label="30秒单摇（次）" name="ropeSkipSpeed" value={assessmentForm.ropeSkipSpeed} onChange={handleFormChange} />
            <InputField label="SR30 极速测试（次）" name="sr30" value={assessmentForm.sr30} onChange={handleFormChange} />
            <InputField label="SR60 节奏耐力（次）" name="sr60" value={assessmentForm.sr60} onChange={handleFormChange} />
            <InputField label="DU30 双摇（次）" name="du30" value={assessmentForm.du30} onChange={handleFormChange} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">教练寄语</label>
            <textarea
              name="coachComment"
              value={assessmentForm.coachComment}
              onChange={handleFormChange}
              placeholder="写下对勇士的鼓励与下一步目标..."
              className="mt-1 w-full rounded-2xl border border-slate-300 bg-white/70 p-3 text-sm shadow-sm focus:border-rose-400 focus:outline-none"
              rows={3}


            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingAssessment}
              className="rounded-full bg-gradient-to-r from-rose-500 to-purple-500 px-6 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-60"
            >

              {savingAssessment ? '保存中...' : '保存测评并生成报告'}

            </button>
          </div>
        </form>
      </section>


      <AssessmentReportPanel report={report} onOpenReport={() => setModalOpen(true)} />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">测评历史</h2>
        <DataTable data={historyRows} columns={historyColumns} emptyMessage="暂未记录测评数据" />
      </section>

      <section className="rounded-3xl bg-white/80 p-6 shadow-md backdrop-blur">
        <h2 className="text-xl font-semibold text-slate-900">段位试炼记录</h2>
        <form onSubmit={handleSaveExam} className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">学员</label>

            <select
              value={examForm.studentId}
              onChange={(event) => setExamForm((prev) => ({ ...prev, studentId: event.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-400 focus:outline-none"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
          <InputField
            label="晋级段位"
            name="toRank"
            type="number"
            min={1}
            value={String(examForm.toRank)}
            onChange={(event) => setExamForm((prev) => ({ ...prev, toRank: Number(event.target.value) }))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">是否通过</label>
            <select
              value={examForm.passed ? 'true' : 'false'}
              onChange={(event) => setExamForm((prev) => ({ ...prev, passed: event.target.value === 'true' }))}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-400 focus:outline-none"
            >
              <option value="true">通过</option>
              <option value="false">未通过</option>
            </select>
          </div>
          <InputField
            label="备注"
            name="notes"
            value={examForm.notes}
            onChange={(event) => setExamForm((prev) => ({ ...prev, notes: event.target.value }))}
          />
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-gradient-to-r from-purple-500 to-violet-500 px-5 py-2 text-sm font-semibold text-white shadow"
            >

              {editingExamId ? '更新试炼记录' : '保存试炼记录'}

            </button>
          </div>
        </form>


        <div className="mt-6">
          <DataTable data={rankExams} columns={examColumns} emptyMessage="暂无段位记录" />
        </div>
      </section>


      <AssessmentReportModal open={modalOpen} onClose={() => setModalOpen(false)} report={report} />

      <RewardToast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required,
  min,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  type?: string;
  required?: boolean;
  min?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        min={min}
        onChange={onChange}
        className="rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm shadow-sm focus:border-rose-400 focus:outline-none"
      />


    </div>
  );
}
