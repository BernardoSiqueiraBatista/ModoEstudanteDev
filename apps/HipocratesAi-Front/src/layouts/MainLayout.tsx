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
import CentralEstudos from '../views/simulados/CentralEstudosView';
import Summary from '../views/simulados/SummaryView';
import MyPapers from '../views/paper/MyPapersView';
import PlanosEstudo from '../views/paper/PlanosEstudoView';
import CalendarioView from '../views/plan/CalendarioView';
import Flashcard from '../views/flashcard/GeraFlashcardView';
import LabEstudos from '../views/paper/LabEstudosView';
import DashboardCases from '../views/cases/DashboardCasesView';
import OsceCaseView from '../views/cases/OsceCaseView';
import HMCaseView from '../views/cases/HMCaseView';

import { useLocation } from 'react-router-dom';

const PLACEHOLDER_LABELS: Record<string, string> = {
  '/relatorios': 'Relatórios',
  '/vision': 'Vision',
  '/financas': 'Finanças',
  '/questoes': 'Questões',
  '/consultas-simuladas': 'Consultas Simuladas',
};

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="size-16 rounded-2xl bg-slate-900/5 flex items-center justify-center mb-5">
        <span className="material-icon text-[32px] text-slate-400">construction</span>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900">{label}</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
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
  const isFullScreenRoute =
    isConsultationRoute ||
    location.pathname.startsWith('/simulados/executar') ||
    location.pathname.startsWith('/simulados/resultado');

  if (location.pathname === '/summary') {
    return <Summary />;
  }

  if (isConsultationRoute) {
    return (
      <div className="h-screen w-full overflow-hidden bg-background-light">
        {location.pathname.startsWith('/consulta/ativa/') && <ActiveConsultationView />}
        {location.pathname.startsWith('/consulta/raciocinio/') && (
          <ClinicalReasoningMaximizedView />
        )}
        {location.pathname.startsWith('/consulta/encerramento/') && <ConsultationClosureView />}
      </div>
    );
  }

  if (isFullScreenRoute) {
    return (
      <div className="h-screen w-full overflow-hidden bg-surface">
        {location.pathname.startsWith('/simulados/executar') && <SimuladosExecutar />}
        {location.pathname.startsWith('/simulados/resultado') && <SimuladosResultado />}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background-light">
      <HeroHeader />

      <main className="pt-24">
        {location.pathname === '/dashboard' && <Dashboard />}
        {location.pathname === '/agenda' && <AgendaView />}
        {location.pathname === '/pacientes' && <PatientList />}
        {location.pathname.startsWith('/pacientes/') && location.pathname !== '/pacientes' && (
          <PatientProfileView />
        )}
        {location.pathname === '/central-de-estudos' && <CentralEstudos />}
        {(location.pathname === '/planos-estudo' || location.pathname === '/plan') && <PlanosEstudo />}
        {location.pathname === '/plan/calendario' && <CalendarioView />}
        {location.pathname === '/paper' && <MyPapers />}
        {location.pathname.startsWith('/paper/') && <LabEstudos />}
        {location.pathname === '/flashcards' && <Flashcard />}
        {location.pathname === '/cases' && <DashboardCases />}
        {location.pathname === '/osce' && <OsceCaseView />}
        {location.pathname === '/hm' && <HMCaseView />}
        {location.pathname === '/simulados' && <SimuladosDashboard />}
        {location.pathname.startsWith('/simulados/rapido') && (
          <SimuladosRapido />
        )}
        {location.pathname.startsWith('/simulados/resultado') && (
          <SimuladosResultado />
        )}
        {location.pathname.startsWith('/simulados/iniciar') && (
          <SimuladosIniciar />
        )}
        {location.pathname.startsWith('/simulados/executar') && (
          <SimuladosExecutar />
        )}
        {placeholderLabel && <ComingSoon label={placeholderLabel} />}
      </main>
    </div>
  );
}
