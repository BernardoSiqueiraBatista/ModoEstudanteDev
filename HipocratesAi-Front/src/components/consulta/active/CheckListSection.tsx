import React, { useState } from 'react';
import type { ChecklistItem } from '../../../data/ConsultationData';

interface ChecklistSectionProps {
  items: ChecklistItem[];
}

export default function ChecklistSection({ items: initialItems }: ChecklistSectionProps) {
  const [items, setItems] = useState(initialItems);

  const toggleItem = (id: string) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  return (
    <div className="space-y-5">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-ultra px-1">
        Differential Checklist
      </h3>
      <div className="space-y-2">
        {items.map(item => (
          <label
            key={item.id}
            className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/40 dark:hover:bg-white/5 cursor-pointer transition-all border border-transparent"
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleItem(item.id)}
              className="size-3.5 rounded-full border-slate-200 text-black focus:ring-0 transition-all bg-transparent"
            />
            <span
              className={`text-xs ${
                item.checked
                  ? 'text-slate-400 line-through decoration-slate-200 font-normal'
                  : 'text-slate-700 dark:text-slate-300 font-normal'
              }`}
            >
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
