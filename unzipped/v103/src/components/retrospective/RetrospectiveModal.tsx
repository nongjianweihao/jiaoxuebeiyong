import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ClassEntity, SessionRecord, SessionReview, RetrospectiveActionItem, RetrospectiveHighlight, Student } from '../../types';
import { RETRO_FOCUS_TAGS, RETRO_MOODS, RETRO_PROMPTS } from '../../config/retrospective';
import { generateId } from '../../store/repositories/utils';

interface RetrospectiveModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (review: SessionReview) => Promise<void>;
  classes: ClassEntity[];
  studentsByClass: Record<string, Student[]>;
  sessionsByClass: Record<string, SessionRecord[]>;
  initial?: SessionReview | null;
  defaultClassId?: string;
  defaultSessionId?: string;
  defaults?: Partial<SessionReview>;
}

const emptyHighlightDraft = (studentId?: string): RetrospectiveHighlight => ({
  id: generateId(),
  studentId: studentId ?? '',
  note: '',
});

const emptyActionDraft = (owner: RetrospectiveActionItem['owner'] = 'coach'): RetrospectiveActionItem => ({
  id: generateId(),
  owner,
  studentId: undefined,
  content: '',
  status: 'pending',
});

function listToMultiline(lines: string[] | undefined) {
  return (lines ?? []).join('\n');
}

function multilineToList(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function RetrospectiveModal({
  open,
  onClose,
  onSave,
  classes,
  studentsByClass,
  sessionsByClass,
  initial,
  defaultClassId,
  defaultSessionId,
  defaults,
}: RetrospectiveModalProps) {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState<typeof RETRO_MOODS[number]['id']>('steady');
  const [focusTags, setFocusTags] = useState<string[]>([]);
  const [energyPulse, setEnergyPulse] = useState<number | undefined>(undefined);
  const [winsText, setWinsText] = useState('');
  const [blockersText, setBlockersText] = useState('');
  const [experimentsText, setExperimentsText] = useState('');
  const [highlights, setHighlights] = useState<RetrospectiveHighlight[]>([emptyHighlightDraft()]);
  const [actions, setActions] = useState<RetrospectiveActionItem[]>([emptyActionDraft()]);
  const [saving, setSaving] = useState(false);

  const classOptions = useMemo(
    () => [...classes].sort((a, b) => a.name.localeCompare(b.name)),
    [classes],
  );

  const currentStudents = useMemo(() => studentsByClass[selectedClassId] ?? [], [studentsByClass, selectedClassId]);
  const currentSessions = useMemo(() => {
    const list = sessionsByClass[selectedClassId] ?? [];
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessionsByClass, selectedClassId]);

  useEffect(() => {
    if (!open) return;
    const baseline = initial ?? defaults ?? null;
    const firstClass = classOptions[0]?.id ?? '';
    const baseClassId = initial?.classId ?? defaults?.classId ?? defaultClassId ?? firstClass;
    setSelectedClassId(baseClassId);
    const baseSession = initial?.sessionId ?? defaults?.sessionId ?? defaultSessionId ?? '';
    setSessionId(baseSession);
    const baseDate = initial?.date ?? defaults?.date ?? new Date().toISOString();
    setDate(baseDate.slice(0, 10));
    setTitle(initial?.title ?? defaults?.title ?? '课后复盘记录');
    setMood(initial?.mood ?? (baseline?.mood ?? 'steady'));
    setFocusTags(initial?.focusTags ?? defaults?.focusTags ?? []);
    setEnergyPulse(initial?.energyPulse ?? defaults?.energyPulse);
    setWinsText(listToMultiline(initial?.wins ?? defaults?.wins));
    setBlockersText(listToMultiline(initial?.blockers ?? defaults?.blockers));
    setExperimentsText(listToMultiline(initial?.experiments ?? defaults?.experiments));
    const highlightSource = initial?.studentHighlights ?? defaults?.studentHighlights ?? [];
    setHighlights(
      highlightSource.length
        ? highlightSource.map((item) => ({ ...item }))
        : [emptyHighlightDraft(currentStudents[0]?.id)],
    );
    const actionSource = initial?.nextActions ?? defaults?.nextActions ?? [];
    setActions(actionSource.length ? actionSource.map((item) => ({ ...item })) : [emptyActionDraft()]);
  }, [
    open,
    initial,
    defaults,
    classOptions,
    defaultClassId,
    defaultSessionId,
    currentStudents,
  ]);

  useEffect(() => {
    if (!open) return;
    // Ensure session id exists when switching class
    const sessionExists = currentSessions.some((session) => session.id === sessionId);
    if (!sessionExists) {
      const fallback = currentSessions[0]?.id ?? '';
      setSessionId(fallback);
      if (fallback) {
        const selected = currentSessions.find((session) => session.id === fallback);
        if (selected) {
          setDate(selected.date.slice(0, 10));
        }
      }
    }

    const availableStudentIds = new Set(currentStudents.map((student) => student.id));
    setHighlights((prev) => {
      const filtered = prev.filter((item) => !item.studentId || availableStudentIds.has(item.studentId));
      return filtered.length ? filtered : [emptyHighlightDraft(currentStudents[0]?.id)];
    });
    setActions((prev) =>
      prev.map((item) =>
        item.owner === 'student' && item.studentId && !availableStudentIds.has(item.studentId)
          ? { ...item, studentId: undefined }
          : item,
      ),
    );
  }, [currentSessions, currentStudents, sessionId, open]);

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-r from-purple-100 via-rose-100 to-pink-100 px-8 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">课后复盘引擎</p>
            <h2 className="text-2xl font-bold text-slate-900">记录勇士训练复盘</h2>
            <p className="text-sm text-slate-500">3分钟完成复盘——亮点、阻碍、下一步，助力下一场更好。</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              disabled={saving}
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:from-purple-600 hover:to-pink-600 disabled:opacity-70"
            >
              {saving ? '保存中...' : '保存复盘'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-purple-50/50 to-rose-50/60 p-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <section className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm backdrop-blur">
                <h3 className="text-sm font-semibold text-slate-700">基础信息</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">训练营</span>
                    <select
                      value={selectedClassId}
                      onChange={(event) => setSelectedClassId(event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2"
                    >
                      {classOptions.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">对应课程</span>
                    <select
                      value={sessionId}
                      onChange={(event) => setSessionId(event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <option value="">— 选择课堂记录（可选） —</option>
                      {currentSessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {new Date(session.date).toLocaleDateString()} · {session.templateId ? '任务卡执行' : '自由安排'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">复盘日期</span>
                    <input
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">标题</span>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2"
                      placeholder="例如：周三力量闯关复盘"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm backdrop-blur">
                <h3 className="text-sm font-semibold text-slate-700">课次结论</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {RETRO_MOODS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMood(item.id)}
                      className={`rounded-2xl border px-3 py-4 text-left transition shadow-sm ${
                        mood === item.id
                          ? 'border-transparent bg-gradient-to-r ' + item.accent + ' text-white'
                          : 'border-slate-200 bg-white hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span className="text-lg" aria-hidden="true">
                          {item.icon}
                        </span>
                        {item.label}
                      </div>
                      <p className={`mt-2 text-xs ${mood === item.id ? 'text-white/80' : 'text-slate-500'}`}>
                        {item.description}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">课堂节奏评分</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setEnergyPulse(score === energyPulse ? undefined : score)}
                        className={`rounded-full border px-3 py-1 ${
                          energyPulse && energyPulse >= score
                            ? 'border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'border-purple-200 bg-white text-purple-500'
                        }`}
                      >
                        {score} ✦
                      </button>
                    ))}
                    <span className="text-xs text-slate-400">（1=偏低，5=能量满格）</span>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm backdrop-blur">
                <h3 className="text-sm font-semibold text-slate-700">复盘三问</h3>
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{RETRO_PROMPTS.wins}</span>
                      <span className="text-xs text-slate-400">每行一条</span>
                    </div>
                    <textarea
                      value={winsText}
                      onChange={(event) => setWinsText(event.target.value)}
                      className="mt-2 h-24 w-full rounded-xl border border-slate-200 px-3 py-2"
                      placeholder="课堂氛围、勇士表现、家长反馈..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{RETRO_PROMPTS.blockers}</span>
                      <span className="text-xs text-slate-400">每行一条</span>
                    </div>
                    <textarea
                      value={blockersText}
                      onChange={(event) => setBlockersText(event.target.value)}
                      className="mt-2 h-24 w-full rounded-xl border border-slate-200 px-3 py-2"
                      placeholder="课堂秩序、动作质量、时间分配..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{RETRO_PROMPTS.experiments}</span>
                      <span className="text-xs text-slate-400">每行一条</span>
                    </div>
                    <textarea
                      value={experimentsText}
                      onChange={(event) => setExperimentsText(event.target.value)}
                      className="mt-2 h-24 w-full rounded-xl border border-slate-200 px-3 py-2"
                      placeholder="下次课的策略、补课方案、家校沟通..."
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm backdrop-blur">
                <h3 className="text-sm font-semibold text-slate-700">勇士闪光时刻</h3>
                <div className="mt-4 space-y-3 text-sm">
                  {highlights.map((item, index) => (
                    <div key={item.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 p-3 md:flex-row md:items-center">
                      <div className="flex-1">
                        <label className="text-xs text-slate-400">勇士</label>
                        <select
                          value={item.studentId}
                          onChange={(event) =>
                            setHighlights((prev) =>
                              prev.map((row) =>
                                row.id === item.id ? { ...row, studentId: event.target.value } : row,
                              ),
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                        >
                          <option value="">— 选择 —</option>
                          {currentStudents.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-slate-400">表现亮点</label>
                        <input
                          value={item.note}
                          onChange={(event) =>
                            setHighlights((prev) =>
                              prev.map((row) =>
                                row.id === item.id ? { ...row, note: event.target.value } : row,
                              ),
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                          placeholder="例如：双摇首次成功"
                        />
                      </div>
                      <div className="flex items-center justify-center md:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setHighlights((prev) =>
                              prev.filter((row) => row.id !== item.id).length
                                ? prev.filter((row) => row.id !== item.id)
                                : [emptyHighlightDraft(currentStudents[0]?.id)],
                            )
                          }
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500 hover:bg-slate-100"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setHighlights((prev) => [...prev, emptyHighlightDraft(currentStudents[0]?.id)])}
                    className="w-full rounded-2xl border border-dashed border-purple-300 py-2 text-sm font-semibold text-purple-500 hover:bg-purple-50"
                  >
                    + 添加勇士亮点
                  </button>
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <section className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-sm backdrop-blur">
                <h3 className="text-sm font-semibold text-slate-700">关注焦点</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {RETRO_FOCUS_TAGS.map((tag) => {
                    const active = focusTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          setFocusTags((prev) =>
                            active ? prev.filter((item) => item !== tag.id) : [...prev, tag.id],
                          )
                        }
                        className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          active
                            ? 'border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow'
                            : 'border-purple-200 bg-white text-purple-500 hover:bg-purple-50'
                        }`}
                      >
                        <span aria-hidden="true">{tag.icon}</span>
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-sm backdrop-blur">
                <h3 className="text-sm font-semibold text-slate-700">行动待办</h3>
                <div className="mt-3 space-y-3 text-sm">
                  {actions.map((action) => (
                    <div key={action.id} className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-3">
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <select
                          value={action.owner}
                          onChange={(event) =>
                            setActions((prev) =>
                              prev.map((row) =>
                                row.id === action.id
                                  ? { ...row, owner: event.target.value as RetrospectiveActionItem['owner'] }
                                  : row,
                              ),
                            )
                          }
                          className="rounded-lg border border-slate-200 px-2 py-1"
                        >
                          <option value="coach">教练执行</option>
                          <option value="team">训练营共同执行</option>
                          <option value="student">指定勇士</option>
                        </select>
                        {action.owner === 'student' && (
                          <select
                            value={action.studentId ?? ''}
                            onChange={(event) =>
                              setActions((prev) =>
                                prev.map((row) =>
                                  row.id === action.id
                                    ? { ...row, studentId: event.target.value || undefined }
                                    : row,
                                ),
                              )
                            }
                            className="rounded-lg border border-slate-200 px-2 py-1"
                          >
                            <option value="">选择勇士</option>
                            {currentStudents.map((student) => (
                              <option key={student.id} value={student.id}>
                                {student.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <input
                        value={action.content}
                        onChange={(event) =>
                          setActions((prev) =>
                            prev.map((row) =>
                              row.id === action.id ? { ...row, content: event.target.value } : row,
                            ),
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2"
                        placeholder="例如：下周加练双摇30次"
                      />
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <label className="flex items-center gap-2">
                          <span>截止日期</span>
                          <input
                            type="date"
                            value={action.dueDate ? action.dueDate.slice(0, 10) : ''}
                            onChange={(event) =>
                              setActions((prev) =>
                                prev.map((row) =>
                                  row.id === action.id
                                    ? {
                                        ...row,
                                        dueDate: event.target.value
                                          ? new Date(event.target.value).toISOString()
                                          : undefined,
                                      }
                                    : row,
                                ),
                              )
                            }
                            className="rounded-lg border border-slate-200 px-2 py-1"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setActions((prev) =>
                              prev.filter((row) => row.id !== action.id).length
                                ? prev.filter((row) => row.id !== action.id)
                                : [emptyActionDraft()],
                            )
                          }
                          className="rounded-lg border border-slate-200 px-2 py-1 text-slate-500 hover:bg-slate-100"
                        >
                          移除
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setActions((prev) => [...prev, emptyActionDraft()])}
                    className="w-full rounded-2xl border border-dashed border-purple-300 py-2 text-sm font-semibold text-purple-500 hover:bg-purple-50"
                  >
                    + 添加行动项
                  </button>
                </div>
              </section>

              <section className="rounded-3xl border border-dashed border-purple-200 bg-purple-50/60 p-6 text-sm text-purple-600">
                <h3 className="text-sm font-semibold text-purple-700">复盘提示</h3>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>亮点 × 阻碍 × 下一步 = 完整闭环</li>
                  <li>每条行动项建议 1 句即可，落地为主</li>
                  <li>若想推送给家长，可在学生档案中查看复盘摘记</li>
                </ul>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);

  async function handleSubmit() {
    if (!selectedClassId) {
      window.alert('请选择训练营再保存复盘。');
      return;
    }
    if (!date) {
      window.alert('请填写复盘日期。');
      return;
    }
    const isoDate = new Date(date).toISOString();
    const wins = multilineToList(winsText);
    const blockers = multilineToList(blockersText);
    const experiments = multilineToList(experimentsText);
    const cleanHighlights = highlights
      .filter((item) => item.studentId && item.note.trim())
      .map((item) => ({ ...item, note: item.note.trim() }));
    const cleanActions = actions
      .filter((item) => item.content.trim())
      .map((item) => ({ ...item, content: item.content.trim() }));

    const review: SessionReview = {
      id: initial?.id ?? generateId(),
      classId: selectedClassId,
      sessionId: sessionId || undefined,
      date: isoDate,
      title: title.trim() || '课后复盘记录',
      mood,
      focusTags,
      wins,
      blockers,
      experiments,
      studentHighlights: cleanHighlights,
      nextActions: cleanActions,
      energyPulse,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      await onSave(review);
      onClose();
    } finally {
      setSaving(false);
    }
  }
}
