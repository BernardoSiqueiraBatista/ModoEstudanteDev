import React, { useState } from 'react';

interface DashboardHeaderProps {
  onSearch?: (query: string) => void;
  notificationCount?: number;
  onNotificationClick?: () => void;
}

export default function DashboardHeader({
  onSearch,
  notificationCount = 0,
  onNotificationClick,
}: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="flex items-center justify-between px-8 py-6 bg-transparent">
      <div className="flex items-center gap-4">
        <span className="logo-text text-xl font-bold text-[var(--medical-navy)] dark:text-white tracking-tight">
          Hipócrates.ai
        </span>
        <span className="h-4 w-px bg-slate-200 dark:bg-white/10"></span>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
          Clinical Hub
        </span>
      </div>

      <div className="flex items-center gap-6">
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-3 px-5 py-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm w-80 group transition-all hover:shadow-md dark:hover:bg-white/10"
        >
          <span className="material-icon text-slate-300 dark:text-slate-500 text-lg group-hover:text-[var(--electric-cyan)] dark:group-hover:text-[var(--electric-cyan)] transition-colors">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="text-sm text-slate-600 dark:text-slate-300 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-transparent focus:shadow-none p-0 w-full"
            placeholder="Procurar paciente..."
          />
        </form>

        <div className="flex items-center gap-3">
          <button
            onClick={onNotificationClick}
            className="relative size-10 flex items-center justify-center bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-slate-400 dark:text-slate-500 hover:text-[var(--medical-navy)] dark:hover:text-white shadow-sm transition-colors"
          >
            <span className="material-icon text-[20px]">notifications</span>
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
