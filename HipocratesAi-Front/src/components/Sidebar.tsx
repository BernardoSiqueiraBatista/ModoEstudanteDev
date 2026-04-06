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
  { icon: 'stethoscope', label: 'Consultas', path: '/consulta/nova' },
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
    if (path === '/agenda/dia') {
      return location.pathname.startsWith('/agenda/');
    }
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-slate-950 relative">
      {/* Sidebar */}
      <aside className="group fixed left-0 top-0 bottom-0 w-20 hover:w-64 py-6 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transition-all duration-300 ease-out overflow-visible">
        {/* Logo */}
        <div className="mb-10 pl-5 pr-3 overflow-hidden cursor-pointer"
          onClick={() => navigate('/dashboard')}>
          <div className="flex items-center gap-3">
            <div className="size-10 bg-slate-800 dark:bg-slate-700 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-lg">
              <span className="material-icon text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>health_metrics</span>
            </div>
            <h2 className="text-heading-3 text-title font-bold whitespace-nowrap transform translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
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
                  flex items-center gap-4 p-3 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden w-full
                  ${active 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                <span className="material-icon flex-shrink-0">{item.icon}</span>
                <span className="text-label-sm font-medium whitespace-nowrap transform translate-x-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section - Ajustado para não cortar o avatar */}
        <div className="flex flex-col gap-3 mt-auto absolute bottom-6 left-0 right-0 px-3">
          <button
            onClick={() => navigate('/configuracoes')}
            className={`
              flex items-center gap-4 p-3 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden w-full
              ${location.pathname === '/configuracoes'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }
            `}
          >
            <span className="material-icon flex-shrink-0">settings</span>
            <span className="text-label-sm font-medium whitespace-nowrap transform translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
              Configurações
            </span>
          </button>

          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer overflow-visible">
            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-2 ring-white dark:ring-slate-800 flex-shrink-0">
              {userAvatar ? (
                <img className="w-full h-full object-cover grayscale-[0.2]" src={userAvatar} alt="User avatar" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-subtitle">
                  <span className="material-icon">person</span>
                </div>
              )}
            </div>
            <div className="transform translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden min-w-0">
              <p className="text-label-sm font-semibold text-title whitespace-nowrap">
                Dr. Hipócrates
              </p>
              <p className="text-caption text-subtitle whitespace-nowrap">Ver perfil</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Espaçador */}
      <div className="w-20 flex-shrink-0"></div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
