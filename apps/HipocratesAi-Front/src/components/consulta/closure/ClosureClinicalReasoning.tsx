import ClosureDiagnosisItem from './ClosureDiagnosisItem';

export interface ClosureDiagnosis {
  id: string;
  title: string;
  description: string;
  status: 'confirmed' | 'considered' | 'discarded';
}

interface ClosureClinicalReasoningProps {
  diagnoses: ClosureDiagnosis[];
}

export default function ClosureClinicalReasoning({ diagnoses }: ClosureClinicalReasoningProps) {
  return (
    <section className="liquid-glass p-10 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-medical-navy">analytics</span>
          <h2 className="text-xs font-bold text-medical-navy uppercase tracking-[0.2em]">Raciocínio Clínico</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
          <div className="size-1.5 rounded-full bg-medical-navy animate-pulse"></div>
          <span className="text-[9px] font-bold text-medical-navy uppercase tracking-tighter">AI Analysis Core</span>
        </div>
      </div>
      <div className="space-y-3">
        {diagnoses.map((diagnosis) => (
          <ClosureDiagnosisItem
            key={diagnosis.id}
            title={diagnosis.title}
            description={diagnosis.description}
            status={diagnosis.status}
          />
        ))}
      </div>
    </section>
  );
}