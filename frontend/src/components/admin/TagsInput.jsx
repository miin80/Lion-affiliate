import { useState } from 'react';

export default function TagsInput({ value = [], onChange, placeholder = 'Thêm tag, Enter để xác nhận' }) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim().replace(/,$/, '');
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setInput('');
  };

  return (
    <div>
      <label className="text-sm font-bold">Tags</label>
      <div className="mt-2 flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-2xl border border-brand-ink-200 bg-white px-3 py-2">
        {value.map((tag, i) => (
          <span
            key={tag + i}
            className="inline-flex items-center gap-1 rounded-full bg-brand-orange-100 px-2.5 py-1 text-xs font-semibold text-brand-orange-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="text-brand-orange-500 hover:text-red-500"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => {
            const v = e.target.value;
            setInput(v);
            if (v.endsWith(',') || v.endsWith(' ')) add();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            } else if (e.key === 'Backspace' && !input && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={add}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-brand-ink-400"
        />
      </div>
    </div>
  );
}
