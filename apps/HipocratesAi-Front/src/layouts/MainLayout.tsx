import Dashboard from '../views/dashboard/DashboardView';
import HeroHeader from '../components/HeroHeader';
import AgendaView from '../views/agenda/AgendaView';
import PatientList from '../views/patient/PatientListView';
import PatientProfileView from '../views/patient/PatientProfileView';
import ActiveConsultationView from '../views/consulta/ActiveConsultationView';
import ClinicalReasoningMaximizedView from '../views/consulta/ClinicalReasoningMaximizedView';
import ConsultationClosureView from '../views/consulta/ConsultationClosureView';
import SimuladosDashboard from '../views/simulados/SimuladosDashboardView';
import SimuladosResultado from '../views/simulados/SimuladosResultadoView';
import SimuladosRapido from '../views/simulados/SimuladosRapidoView';
import SimuladosIniciar from '../views/simulados/SimuladosIniciarView';
import SimuladosExecutar from '../views/simulados/SimuladosExecutarView';

import { useLocation } from 'react-router-dom';

const PLACEHOLDER_LABELS: Record<string, string> = {
  '/relatorios': 'Relatórios',
  '/vision': 'Vision',
  '/financas': 'Finanças',
  '/questoes': 'Questões',
  '/consultas-simuladas': 'Consultas Simuladas',
  '/flashcards': 'Flashcards',
  '/paper': 'Paper',
};

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="size-16 rounded-2xl bg-slate-900/5 dark:bg-white/5 flex items-center justify-center mb-5">
        <span className="material-icon text-[32px] text-slate-400">construction</span>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{label}</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        Esta área está em desenvolvimento e estará disponível em breve.
      </p>
    </div>
  );
}

export default function MainLayout() {
  const location = useLocation();
  const placeholderLabel = PLACEHOLDER_LABELS[location.pathname];

  // Rotas de consulta usam tela cheia, sem o navbar global e sem o pt-24,
  // para que o ConsultationHeader e a transcrição fiquem corretamente
  // posicionados (área scrollável interna ao invés de scroll da página).
  const isConsultationRoute = location.pathname.startsWith('/consulta/');

  if (isConsultationRoute) {
    return (
      <div className="h-screen w-full overflow-hidden bg-background-light dark:bg-slate-950">
        {location.pathname.startsWith('/consulta/ativa/') && <ActiveConsultationView />}
        {location.pathname.startsWith('/consulta/raciocinio/') && (
          <ClinicalReasoningMaximizedView />
        )}
        {location.pathname.startsWith('/consulta/encerramento/') && <ConsultationClosureView />}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background-light dark:bg-slate-950">
      <HeroHeader />

      <main className="pt-24">
        {location.pathname === '/dashboard' && <Dashboard />}
        {location.pathname === '/agenda' && <AgendaView />}
        {location.pathname === '/pacientes' && <PatientList />}
        {location.pathname.startsWith('/pacientes/') && location.pathname !== '/pacientes' && (
          <PatientProfileView />
        )}
        {location.pathname === '/simulados' && <SimuladosDashboard />}
        {location.pathname.startsWith('/simulados/rapido') && (
          <SimuladosRapido />
        )}
        {location.pathname.startsWith('/simulados/resultado/') && (
          <SimuladosResultado />
        )}
        {location.pathname.startsWith('/simulados/iniciar') && (
          <SimuladosIniciar />
        )}
        {location.pathname.startsWith('/simulados/executar/') && (
          <SimuladosExecutar />
        )}
        {placeholderLabel && <ComingSoon label={placeholderLabel} />}
      </main>
    </div>
  );
}
