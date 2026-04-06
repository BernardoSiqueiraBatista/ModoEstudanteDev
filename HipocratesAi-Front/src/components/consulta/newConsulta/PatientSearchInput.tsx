import React from 'react';

interface PatientSearchInputProps {
  value: string;
  onChange?: (value: string) => void;
  onNewPatient?: () => void;
}

export default function PatientSearchInput({
  value,
  onChange,
  onNewPatient,
}: PatientSearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 group">
        <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors text-base">
          search
        </span>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          className="w-full pl-7 pr-3 py-1.5 bg-transparent border-b border-slate-200 focus:border-primary focus:outline-none transition-all placeholder:text-slate-300 font-light text-sm"
          placeholder="Nome do paciente ou CPF..."
        />
      </div>
      <button
        onClick={onNewPatient}
        className="p-1.5 text-slate-400 hover:text-primary transition-all cursor-pointer"
        title="Novo Paciente"
        type="button"
      >
        <span className="material-symbols-outlined text-xl">add_circle</span>
      </button>
    </div>
  );
}