import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  icon: string;
  label: string;
  path: string;
}

interface SidebarProps {
  navItems?: NavItem[];
  userAvatar?: string;
  children?: React.ReactNode;
}

const defaultNavItems: NavItem[] = [
  { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { icon: 'calendar_today', label: 'Agenda', path: '/agenda' },
  { icon: 'group', label: 'Pacientes', path: '/pacientes' },
  { icon: 'stethoscope', label: 'Consultas', path: '/consultas' },
  { icon: 'bar_chart', label: 'Relatórios', path: '/relatorios' },
];

export default function Sidebar({
  navItems = defaultNavItems,
  userAvatar,
  children,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActiveRoute = (path: string) => {
    // Para a agenda, consideram-se ambas as rotas (/agenda/dia e /agenda/semana) como ativas
    if (path === '/agenda/dia') {
      return location.pathname.startsWith('/agenda/');
    }
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen w-full bg-background-light relative">
      {/* Sidebar - Posição fixa com margem esquerda e bordas arredondadas */}
      <aside className="group fixed left-4 top-4 bottom-4 w-20 hover:w-64 py-6 bg-surface border-r border-light z-50 transition-all duration-700 ease-in-out shadow-lg rounded-3xl hover:rounded-[32px]">
        {/* Logo */}
        <div className="mb-10 pl-5 pr-3 overflow-hidden cursor-pointer"
          onClick={() => navigate('/dashboard')}>
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white flex-shrink-0">
              <span className="material-icon text-2xl">health_metrics</span>
            </div>
            <h2 className="text-heading-3 text-title font-bold whitespace-nowrap transform translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-in-out">
              Hipócrates.ai
            </h2>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col flex-1 gap-3 pl-5 pr-3 overflow-hidden">
          {navItems.map((item, index) => {
            const active = isActiveRoute(item.path);

            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`
                  flex items-center gap-4 p-3 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden
                  ${active ? 'bg-primary/10 text-primary' : 'text-subtitle hoverSidebar'}
                `}
              >
                <span className="material-icon flex-shrink-0">{item.icon}</span>
                <span className="text-label-sm font-medium whitespace-nowrap transform translate-x-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700 ease-in-out">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="flex flex-col gap-3 mt-auto overflow-hidden absolute bottom-6 left-0 right-0 pl-5 pr-3">
          <button
            onClick={() => navigate('/configuracoes')}
            className={`
              flex items-center gap-4 p-3 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden
              ${
                location.pathname === '/configuracoes'
                  ? 'bg-primary/10 text-primary'
                  : 'text-subtitle hover:bg-surface-light'
              }
            `}
          >
            <span className="material-icon flex-shrink-0">settings</span>
            <span className="text-label-sm font-medium whitespace-nowrap transform translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-in-out">
              Configurações
            </span>
          </button>

          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-light transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="size-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-slate-100 flex-shrink-0">
              {userAvatar ? (
                <img className="w-full h-full object-cover" src={userAvatar} alt="User avatar" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-subtitle">
                  <span className="material-icon">person</span>
                </div>
              )}
            </div>
            <div className="transform translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-in-out overflow-hidden min-w-0">
              <p className="text-label-sm font-semibold text-title whitespace-nowrap">
                Dr. Hipócrates
              </p>
              <p className="text-caption text-subtitle whitespace-nowrap">Ver perfil</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Espaçador ajustado para nova margem */}
      <div className="w-24 flex-shrink-0"></div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
