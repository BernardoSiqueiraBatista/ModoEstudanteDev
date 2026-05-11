import React from 'react';

export type PatientSortBy =
  | 'name-asc'
  | 'name-desc'
  | 'age-asc'
  | 'age-desc';

export type PatientSexFilter = 'male' | 'female' | 'other';
export type PatientAgeRange = '0-17' | '18-39' | '40-59' | '60+';

export interface PatientsFilterOptions {
  sex: PatientSexFilter[];
  ageRanges: PatientAgeRange[];
  sortBy: PatientSortBy | null;
}

export const EMPTY_PATIENTS_FILTER: PatientsFilterOptions = {
  sex: [],
  ageRanges: [],
  sortBy: null,
};

interface PatientsFilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: PatientsFilterOptions) => void;
  onReset: () => void;
  currentFilters: PatientsFilterOptions;
}

const SEX_OPTIONS: { value: PatientSexFilter; label: string; icon: string }[] = [
  { value: 'male', label: 'Masculino', icon: 'male' },
  { value: 'female', label: 'Feminino', icon: 'female' },
  { value: 'other', label: 'Outro', icon: 'transgender' },
];

const AGE_OPTIONS: { value: PatientAgeRange; label: string }[] = [
  { value: '0-17', label: '0 – 17 anos' },
  { value: '18-39', label: '18 – 39 anos' },
  { value: '40-59', label: '40 – 59 anos' },
  { value: '60+', label: '60+ anos' },
];

const SORT_OPTIONS: { value: PatientSortBy; label: string; icon: string }[] = [
  { value: 'name-asc', label: 'Nome (A-Z)', icon: 'sort_by_alpha' },
  { value: 'name-desc', label: 'Nome (Z-A)', icon: 'sort_by_alpha' },
  { value: 'age-asc', label: 'Idade (menor → maior)', icon: 'arrow_upward' },
  { value: 'age-desc', label: 'Idade (maior → menor)', icon: 'arrow_downward' },
];

export default function PatientsFilterDropdown({
  isOpen,
  onApply,
  onReset,
  currentFilters,
}: PatientsFilterDropdownProps) {
  const [sex, setSex] = React.useState<PatientSexFilter[]>(currentFilters.sex);
  const [ageRanges, setAgeRanges] = React.useState<PatientAgeRange[]>(
    currentFilters.ageRanges,
  );
  const [sortBy, setSortBy] = React.useState<PatientSortBy | null>(
    currentFilters.sortBy,
  );

  React.useEffect(() => {
    if (isOpen) {
      setSex(currentFilters.sex);
      setAgeRanges(currentFilters.ageRanges);
      setSortBy(currentFilters.sortBy);
    }
  }, [isOpen, currentFilters.sex, currentFilters.ageRanges, currentFilters.sortBy]);

  const toggleSex = (value: PatientSexFilter) => {
    setSex((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const toggleAge = (value: PatientAgeRange) => {
    setAgeRanges((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const selectSort = (value: PatientSortBy) => {
    setSortBy((prev) => (prev === value ? null : value));
  };

  const handleApply = () => onApply({ sex, ageRanges, sortBy });
  const handleReset = () => {
    setSex([]);
    setAgeRanges([]);
    setSortBy(null);
    onReset();
  };

  if (!isOpen) return null;

  const totalSelected = sex.length + ageRanges.length + (sortBy ? 1 : 0);

  let itemIdx = 0;
  const nextDelay = () => `${60 + itemIdx++ * 30}ms`;

  return (
    <div className="w-72 max-h-[70vh] overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-200 filter-dropdown-enter">
      {/* Sexo */}
      <div className="p-2">
        <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Sexo
        </p>
        {SEX_OPTIONS.map((opt) => {
          const isActive = sex.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleSex(opt.value)}
              className={`filter-item-enter w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/5 text-primary font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              style={{ animationDelay: nextDelay() }}
            >
              <span
                className={`material-icon text-lg ${
                  isActive ? 'text-primary' : 'text-slate-400'
                }`}
              >
                {opt.icon}
              </span>
              <span
                className={`text-sm ${isActive ? 'font-semibold' : 'font-normal'}`}
              >
                {opt.label}
              </span>
              {isActive && (
                <span className="ml-auto material-icon text-sm text-primary">
                  check_circle
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t border-slate-100" />

      {/* Faixa etária */}
      <div className="p-2">
        <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Faixa etária
        </p>
        {AGE_OPTIONS.map((opt) => {
          const isActive = ageRanges.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleAge(opt.value)}
              className={`filter-item-enter w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/5 text-primary font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              style={{ animationDelay: nextDelay() }}
            >
              <span
                className={`material-icon text-lg ${
                  isActive ? 'text-primary' : 'text-slate-400'
                }`}
              >
                cake
              </span>
              <span
                className={`text-sm ${isActive ? 'font-semibold' : 'font-normal'}`}
              >
                {opt.label}
              </span>
              {isActive && (
                <span className="ml-auto material-icon text-sm text-primary">
                  check_circle
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t border-slate-100" />

      {/* Ordenar por */}
      <div className="p-2">
        <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Ordenar por
        </p>
        {SORT_OPTIONS.map((opt) => {
          const isActive = sortBy === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => selectSort(opt.value)}
              className={`filter-item-enter w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/5 text-primary font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              style={{ animationDelay: nextDelay() }}
            >
              <span
                className={`material-icon text-lg ${
                  isActive ? 'text-primary' : 'text-slate-400'
                }`}
              >
                {opt.icon}
              </span>
              <span
                className={`text-sm ${isActive ? 'font-semibold' : 'font-normal'}`}
              >
                {opt.label}
              </span>
              {isActive && (
                <span className="ml-auto material-icon text-sm text-primary">
                  radio_button_checked
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 sticky bottom-0 flex items-center gap-2">
        <button
          onClick={handleReset}
          disabled={totalSelected === 0}
          className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 active:scale-[0.98] transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="material-icon text-sm">filter_alt_off</span>
          Limpar filtro
        </button>
        <button
          onClick={handleApply}
          className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 active:scale-[0.98] transition-colors"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
