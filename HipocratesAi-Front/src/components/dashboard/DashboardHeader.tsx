import React, { useState } from 'react';

interface DashboardHeaderProps {
  userName?: string;
  title?: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
  notificationCount?: number;
  onNotificationClick?: () => void;
}

export default function DashboardHeader({
  userName = 'Dr. Hipócrates',
  title = 'Main Dashboard',
  subtitle = 'Bem-vindo, Dr. Hipócrates. Veja o que temos para hoje.',
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
    <header className="flex items-center justify-between px-8 py-6 top-0 bg-background-light/80 z-10 border-b border-light">
      <div>
        <h1 className="text-heading-1 text-title tracking-tight">{title}</h1>
        <p className="text-subtitle text-body-sm">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <span className="material-icon absolute left-3 top-1/2 -translate-y-1/2 text-subtitle">
            search
          </span>
          <input
            className="pl-10 pr-4 py-2 bg-surface border-none rounded-lg text-body-sm w-72 focus:ring-2 focus:ring-primary shadow-sm"
            placeholder="Pesquisar prontuário, CID ou paciente..."
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Notifications Button */}
        <button
          className="relative p-2 text-subtitle bg-surface rounded-lg shadow-sm"
          onClick={onNotificationClick}
        >
          <span className="material-icon">notifications</span>
          {notificationCount > 0 && (
            <span className="absolute top-2 right-2 size-2 bg-red-500 border-2 border-white rounded-full"></span>
          )}
        </button>
      </div>
    </header>
  );
}
