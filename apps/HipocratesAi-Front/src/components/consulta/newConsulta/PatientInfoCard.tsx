
interface PatientInfoCardProps {
  name: string;
  initials: string;
  age: number;
  lastAccess: string;
  status?: string;
  gender?: string;
  recordNumber?: string;
  mainDiagnosis?: string;
}

export default function PatientInfoCard({
  name,
  initials,
  age,
  lastAccess,
  status = 'Prontuário Ativo',
  gender,
  recordNumber,
  mainDiagnosis,
}: PatientInfoCardProps) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100">
      <div className="size-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-gray-200 flex items-center justify-center">
        <span className="text-base font-medium text-gray-600">{initials}</span>
      </div>

      <div className="flex-1">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="text-base font-normal text-gray-800 tracking-tight">{name}</h2>
          <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {status}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-gray-500">
          {gender && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">person</span>
              {gender}
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">cake</span>
            {age} anos
          </span>
          {recordNumber && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">badge</span>
              {recordNumber}
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">history</span>
            Último acesso: {lastAccess}
          </span>
        </div>
        {mainDiagnosis && (
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-medium">Diagnóstico:</span> {mainDiagnosis}
          </p>
        )}
      </div>
    </div>
  );
}
