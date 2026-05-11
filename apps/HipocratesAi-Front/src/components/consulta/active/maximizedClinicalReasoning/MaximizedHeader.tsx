
interface MaximizedHeaderProps {
  patientName: string;
  duration: string;
  onBack: () => void;
}

export default function MaximizedHeader({ patientName, duration, onBack }: MaximizedHeaderProps) {
  return (
    <header className="h-20 flex items-center justify-between px-10 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center gap-5">
        <button
          onClick={onBack}
          className="size-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined text-xl text-gray-600">arrow_back</span>
        </button>
        <div className="size-9 bg-gray-900 rounded-full flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-lg">clinical_notes</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-sm tracking-tight text-gray-900">Hipócrates.ai</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">Raciocínio Clínico</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Paciente</span>
            <span className="text-xs font-medium text-gray-900">{patientName}</span>
          </div>
          <div className="w-px h-6 bg-gray-200"></div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Duração</span>
            <span className="text-xs font-medium text-gray-900 tabular-nums">{duration}</span>
          </div>
        </div>
      </div>
    </header>
  );
}