import type { PatientApiItem } from '@hipo/contracts';
import type { TabType } from '../../../views/patient/PatientProfileView';

interface PatientProfileHeaderProps {
  patient: PatientApiItem;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function PatientProfileHeader({
  patient,
  activeTab,
  onTabChange,
}: PatientProfileHeaderProps) {
  const tabs = [
    { id: 'historico' as const, label: 'Histórico' },
    { id: 'hipoteses' as const, label: 'Hipóteses' },
    { id: 'tratamentos' as const, label: 'Tratamentos' },
  ];

  const getStatusLabel = () => {
    switch (patient.status) {
      case 'ativo':
        return 'Prontuário Ativo';
      case 'followup':
        return 'Em Acompanhamento';
      case 'pendente':
        return 'Pendente';
      default:
        return patient.status;
    }
  };

  const getStatusColor = () => {
    switch (patient.status) {
      case 'ativo':
        return 'text-emerald-600';
      case 'followup':
        return 'text-blue-600';
      case 'pendente':
        return 'text-amber-600';
      default:
        return 'text-gray-500';
    }
  };

  const formatLastConsultationDate = (date: string) => {
    if (date === 'Ontem, 16:45') return date;
    const parts = date.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return date;
  };

  return (
    <header className="px-8 py-6 bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-semibold tracking-[0.2em] text-gray-400 uppercase">
              Raciocínio Clínico do Paciente
            </span>
          </div>
          <h1 className="text-2xl font-light text-gray-800 tracking-tight">{patient.name}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
            <span>
              {patient.gender}, {patient.age} anos
            </span>
            <span>•</span>
            <span>Prontuário: {patient.recordNumber}</span>
            <span>•</span>
            <span className={getStatusColor()}>{getStatusLabel()}</span>
          </div>
          {patient.mainDiagnosis && (
            <p className="text-sm text-gray-500 mt-2">
              <span className="font-medium">Diagnóstico:</span> {patient.mainDiagnosis}
            </p>
          )}
          {patient.lastConsultation ? (
            <p className="text-xs text-gray-400 mt-1">
              Última consulta: {formatLastConsultationDate(patient.lastConsultation.date)} com{' '}
              {patient.lastConsultation.doctor}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1 italic">Sem consultas anteriores.</p>
          )}
          {patient.observations && (
            <p className="text-xs text-gray-400 mt-1 italic">Obs: {patient.observations}</p>
          )}
        </div>

        <div className="flex items-center gap-6 text-[11px] font-medium text-gray-400 uppercase tracking-widest">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`pb-1 border-b transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'text-gray-700 border-gray-700'
                  : 'hover:text-gray-600 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
