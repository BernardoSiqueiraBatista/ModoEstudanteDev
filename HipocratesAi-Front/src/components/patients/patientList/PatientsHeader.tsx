import React, { useState } from 'react';

interface PatientsHeaderProps {
  onSearch?: (query: string) => void;
  onNewPatient?: () => void;
}

export default function PatientsHeader({ onSearch, onNewPatient }: PatientsHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header className="flex items-end justify-between mb-16">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-title mb-3">
          Lista de Pacientes
        </h1>
        <p className="text-subtitle font-light text-lg">
          Gestão clínica de alto padrão e inteligência preditiva.
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="glass-search flex items-center px-4 py-2.5 rounded-2xl w-80">
          <span className="material-icon text-subtitle text-xl mr-3">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 p-0 text-body-sm text-slate-600 placeholder:text-slate-300 w-full"
            placeholder="Buscar paciente ou prontuário..."
            type="text"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* New Patient Button */}
        <button
          className="glass-search hover:bg-white/90 px-6 py-2.5 rounded-2xl text-label-sm font-semibold text-title flex items-center gap-2 transition-all cursor-pointer hover:border-black"
          onClick={onNewPatient}
        >
          <span className="material-icon text-lg">add</span>
          Novo Paciente
        </button>
      </div>
    </header>
  );
}
