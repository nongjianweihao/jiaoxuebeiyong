import { useState } from 'react';
import type { TrainingNote } from '../types';
import { generateId } from '../store/repositories/utils';

interface CommentEditorProps {
  studentId: string;
  onSave: (note: TrainingNote) => void;
}

const tags = ['专注', '积极', '配合', '节奏', '技术'];

export function CommentEditor({ studentId, onSave }: CommentEditorProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(4);
  const [comments, setComments] = useState('');

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  };

  const handleSave = () => {
    onSave({
      id: generateId(),
      studentId,
      rating,
      comments,
      tags: selectedTags,
    });
    setComments('');
    setSelectedTags([]);
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>课堂表现</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => setRating(score)}
              className={`h-8 w-8 rounded-full border text-sm font-semibold ${
                score <= rating
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600'
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              {score}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`rounded-full px-3 py-1 font-medium ${
              selectedTags.includes(tag)
                ? 'bg-brand-100 text-brand-600'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>
      <textarea
        value={comments}
        onChange={(event) => setComments(event.target.value)}
        placeholder="写下今日亮点或改进建议..."
        className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={handleSave}
        className="w-full rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600"
      >
        保存评语
      </button>
    </div>
  );
}
