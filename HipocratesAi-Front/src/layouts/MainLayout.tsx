import Dashboard from '../views/dashboard/DashboardView';
import Sidebar from '../components/Sidebar';
import AgendaView from '../views/agenda/AgendaView';
import PatientList from '../views/patient/PatientListView';
import NewConsultationView from '../views/consulta/NewConsultationView';
import PatientProfileView from '../views/patient/PatientProfileView';
import { useLocation} from 'react-router-dom';



export default function MainLayout() {
  const location = useLocation();

  return (
    <Sidebar userAvatar="https://lh3.googleusercontent.com/aida-public/AB6AXuB7QME21h8e4JQoEFQJbUBtsyflL02QJdML6L5J4pnOv_XnLEAVc2dCaHJoD1Bw65YNtLER82n3NM7d5DMvDKu2Lbr4XBEydqnyvcvXhSoyapj1rjDWxmujmArHirrm5Z2TWeUvx3uOXqkTz3SDSgBxgmnkh7waX8kouMVrjxPGJhEkPLloXbk6gn9cpyYsPijR-aUK9g4pyA1tn7PGyLx4ayDRIs0K0RmPt04bWaypb2ICsdNdijHBq2sqaGnU0BplslrBLlbhCOmp">
      {location.pathname === '/dashboard' && <Dashboard />}
      {location.pathname === '/agenda' && <AgendaView />}
      {location.pathname === '/pacientes' && <PatientList />}
      {location.pathname === '/consulta/nova' && <NewConsultationView />}
      {location.pathname.startsWith('/pacientes/') && location.pathname !== '/pacientes' && <PatientProfileView />}
    </Sidebar>
  );
}
