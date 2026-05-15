import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import logoUrl from '../assets/e95d58e0-3e5e-4c89-bd99-e4803e12dba0.png';

interface NavItem {
  name: string;
  href: string;
  match?: (pathname: string) => boolean;
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard' },
  {
    name: 'Médico',
    href: '/agenda',
    match: (p) =>
      p.startsWith('/agenda') ||
      p.startsWith('/pacientes') ||
      p.startsWith('/vision') ||
      p.startsWith('/financas') ||
      p.startsWith('/consulta'),
    subItems: [
      { name: 'Agenda', href: '/agenda' },
      {
        name: 'Pacientes',
        href: '/pacientes',
        match: (p) => p === '/pacientes' || p.startsWith('/pacientes/'),
      },
      { name: 'Vision', href: '/vision' },
      { name: 'Finanças', href: '/financas' },
    ],
  },
  {
    name: 'Estudante',
    href: '/questoes',
    match: (p) =>
      p.startsWith('/questoes') ||
      p.startsWith('/consultas-simuladas') ||
      p.startsWith('/flashcards') ||
      p.startsWith('/paper') ||
      p.startsWith('/plan') ||
      p.startsWith('/simulados'),
    subItems: [
      { name: 'Plano', href: '/plan' },
      { name: 'Simulados', href: '/simulados' },
      { name: 'Questões', href: '/questoes' },
      { name: 'Consultas Simuladas', href: '/consultas-simuladas' },
      { name: 'Flashcards', href: '/flashcards' },
      { name: 'Paper', href: '/paper' },
    ],
  },
  { name: 'Relatórios', href: '/relatorios' },
];

function getInitials(name: string): string {
  const parts = name
    .trim()
    .replace(/^Dr\.?\s+/i, '')
    .replace(/^Dra\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function matchesItem(item: NavItem, pathname: string): boolean {
  return item.match ? item.match(pathname) : pathname === item.href;
}

export default function HeroHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [pinnedGroup, setPinnedGroup] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, doctor } = useAuth();

  const navInnerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const hoverCloseTimer = useRef<number | null>(null);

  const [pill, setPill] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    ready: boolean;
  }>({ top: 0, left: 0, width: 0, height: 0, ready: false });

  const isGroupOpen = (name: string) =>
    hoveredGroup === name || pinnedGroup === name;

  const openDropdown = (name: string) => {
    if (hoverCloseTimer.current !== null) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
    setHoveredGroup(name);
  };

  const scheduleClose = () => {
    if (hoverCloseTimer.current !== null) {
      window.clearTimeout(hoverCloseTimer.current);
    }
    hoverCloseTimer.current = window.setTimeout(() => {
      setHoveredGroup(null);
      hoverCloseTimer.current = null;
    }, 140);
  };

  const togglePinned = (name: string) => {
    setPinnedGroup((prev) => (prev === name ? null : name));
  };

  // Fecha pinned ao clicar fora da nav
  useEffect(() => {
    if (!pinnedGroup) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!navInnerRef.current?.contains(e.target as Node)) {
        setPinnedGroup(null);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [pinnedGroup]);

  // ESC fecha qualquer dropdown
  useEffect(() => {
    if (!pinnedGroup && !hoveredGroup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinnedGroup(null);
        setHoveredGroup(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pinnedGroup, hoveredGroup]);

  useEffect(() => {
    return () => {
      if (hoverCloseTimer.current !== null) {
        window.clearTimeout(hoverCloseTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setHoveredGroup(null);
    setPinnedGroup(null);
    setMobileExpanded(null);
  }, [location.pathname]);

  // O pill agora segue o item top-level ativo (grupo ou folha) — o sub-row foi
  // substituído pelo dropdown vertical.
  const pillTarget = useMemo<NavItem | undefined>(() => {
    for (const item of navItems) {
      if (matchesItem(item, location.pathname)) return item;
      if (item.subItems?.some((s) => matchesItem(s, location.pathname))) {
        return item;
      }
    }
    return undefined;
  }, [location.pathname]);

  const measurePill = () => {
    const inner = navInnerRef.current;
    if (!inner || !pillTarget) {
      setPill((p) => ({ ...p, ready: false }));
      return;
    }
    const el = itemRefs.current[pillTarget.href];
    if (!el) return;
    const innerRect = inner.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setPill({
      top: elRect.top - innerRect.top,
      left: elRect.left - innerRect.left,
      width: elRect.width,
      height: elRect.height,
      ready: true,
    });
  };

  useLayoutEffect(() => {
    measurePill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pillTarget?.href, scrolled]);

  useEffect(() => {
    const onResize = () => measurePill();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pillTarget?.href]);

  const handleNavClick = () => {
    setMenuOpen(false);
    setHoveredGroup(null);
    setPinnedGroup(null);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const displayName = doctor?.full_name ?? 'Dr. Hipócrates';
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none">
      <nav className="pointer-events-auto relative mx-auto max-w-5xl">
        {/* Liquid glass capsule */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[28px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_10px_40px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.55)] ring-1 ring-white/40 dark:ring-white/10 pointer-events-none"
          style={{
            opacity: scrolled ? 1 : 0,
            backgroundImage:
              'linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 60%, rgba(255,255,255,0.12) 100%)',
            transition: 'opacity 700ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />

        <div ref={navInnerRef} className="relative">
          {/* Sliding pill */}
          <div
            aria-hidden="true"
            className="absolute rounded-full bg-white/70 dark:bg-white/15 shadow-sm ring-1 ring-white/60 dark:ring-white/10 pointer-events-none"
            style={{
              top: pill.top,
              left: pill.left,
              width: pill.width,
              height: pill.height,
              opacity: pill.ready ? 1 : 0,
              transition: pill.ready
                ? 'top 460ms cubic-bezier(0.22, 1, 0.36, 1), left 460ms cubic-bezier(0.22, 1, 0.36, 1), width 460ms cubic-bezier(0.22, 1, 0.36, 1), height 460ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out'
                : 'opacity 150ms ease-out',
            }}
          />

          {/* Top row: Logo · Nav · Avatar */}
          <div className="relative flex h-20 items-center justify-between gap-4 pl-4 pr-3">
            <Link
              to="/dashboard"
              className="flex items-center flex-shrink-0 will-change-transform"
              style={{
                transform: scrolled ? 'translate(0, 5px)' : 'translate(-3rem, 5px)',
                transition: 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              onClick={handleNavClick}
              aria-label="Hipocrates - Página inicial"
            >
              <img
                src={logoUrl}
                alt="Hipocrates"
                decoding="async"
                className="h-20 sm:h-24 md:h-28 w-auto object-contain select-none dark:brightness-0 dark:invert drop-shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
                draggable={false}
              />
            </Link>

            <ul className="relative hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                const groupActive =
                  !!item.subItems &&
                  (matchesItem(item, location.pathname) ||
                    item.subItems.some((s) => matchesItem(s, location.pathname)));
                const leafActive =
                  !item.subItems && matchesItem(item, location.pathname);
                const groupOpen = !!item.subItems && isGroupOpen(item.name);

                return (
                  <li
                    key={item.href}
                    ref={(el) => {
                      itemRefs.current[item.href] = el;
                    }}
                    className="relative"
                    onMouseEnter={
                      item.subItems ? () => openDropdown(item.name) : undefined
                    }
                    onMouseLeave={item.subItems ? scheduleClose : undefined}
                  >
                    {item.subItems ? (
                      <button
                        type="button"
                        onClick={() => togglePinned(item.name)}
                        onFocus={() => openDropdown(item.name)}
                        aria-expanded={groupOpen}
                        aria-haspopup="menu"
                        className={`relative z-10 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-200 ${
                          groupActive || groupOpen
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {item.name}
                        <span
                          aria-hidden
                          className={`material-icon text-[14px] leading-none transition-transform duration-300 ${
                            groupOpen ? 'rotate-180 opacity-90' : 'opacity-50'
                          }`}
                        >
                          expand_more
                        </span>
                      </button>
                    ) : (
                      <Link
                        to={item.href}
                        onClick={handleNavClick}
                        className={`relative z-10 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-200 ${
                          leafActive
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {item.name}
                      </Link>
                    )}

                    {/* Dropdown vertical (lista ordenada) */}
                    {item.subItems && (
                      <div
                        role="menu"
                        aria-label={item.name}
                        aria-hidden={!groupOpen}
                        className="absolute left-1/2 top-full z-30 pt-2"
                        style={{ transform: 'translateX(-50%)' }}
                        onMouseEnter={() => openDropdown(item.name)}
                        onMouseLeave={scheduleClose}
                      >
                        <div
                          className="min-w-[200px] rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-white/50 dark:ring-white/10 shadow-[0_12px_40px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.55)] overflow-hidden"
                          style={{
                            opacity: groupOpen ? 1 : 0,
                            transform: groupOpen
                              ? 'translateY(0) scale(1)'
                              : 'translateY(-6px) scale(0.96)',
                            transformOrigin: 'top center',
                            pointerEvents: groupOpen ? 'auto' : 'none',
                            transition:
                              'opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
                          }}
                        >
                          <ol className="flex flex-col py-1.5">
                            {item.subItems.map((sub, idx) => {
                              const subActive = matchesItem(sub, location.pathname);
                              const delay = groupOpen ? 60 + idx * 40 : 0;
                              return (
                                <li key={sub.href}>
                                  <Link
                                    to={sub.href}
                                    role="menuitem"
                                    onClick={handleNavClick}
                                    className={`flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium transition-colors duration-150 ${
                                      subActive
                                        ? 'text-slate-900 dark:text-white bg-white/70 dark:bg-white/10'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                                    }`}
                                    style={{
                                      opacity: groupOpen ? 1 : 0,
                                      transform: groupOpen
                                        ? 'translateY(0)'
                                        : 'translateY(-6px)',
                                      transition: `opacity 220ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 260ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, color 150ms, background-color 150ms`,
                                    }}
                                  >
                                    <span>{sub.name}</span>
                                    {subActive && (
                                      <span
                                        aria-hidden
                                        className="ml-auto material-icon text-[14px] text-slate-500 dark:text-slate-400"
                                      >
                                        check
                                      </span>
                                    )}
                                  </Link>
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div
              className="flex items-center gap-2 will-change-transform"
              style={{
                transform: scrolled ? 'translateX(0)' : 'translateX(3rem)',
                transition: 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <button
                type="button"
                className="relative size-9 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                aria-label="Notificações"
              >
                <span className="material-icon text-[20px]">notifications</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((s) => !s)}
                  className="size-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-200 dark:to-white text-white dark:text-slate-900 text-[13px] font-semibold flex items-center justify-center shadow-md ring-1 ring-white/40 dark:ring-white/20 hover:scale-105 transition-transform"
                  aria-label="Perfil"
                  aria-expanded={profileOpen}
                >
                  {initials}
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 top-12 min-w-[200px] rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl ring-1 ring-white/50 dark:ring-white/10 shadow-[0_8px_32px_rgba(15,23,42,0.15)] overflow-hidden"
                    onMouseLeave={() => setProfileOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-slate-200/60 dark:border-white/10">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </p>
                      {doctor?.email && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {doctor.email}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/5 transition-colors"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="md:hidden size-9 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                onClick={() => setMenuOpen((s) => !s)}
                aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={menuOpen}
              >
                <span className="material-icon">{menuOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden px-3 pb-3 relative">
            <ul className="flex flex-col gap-1 pt-2 border-t border-white/30 dark:border-white/10">
              {navItems.map((item) => {
                const active = matchesItem(item, location.pathname);
                const expanded =
                  !!item.subItems &&
                  (mobileExpanded === item.name ||
                    item.subItems.some((s) => matchesItem(s, location.pathname)));

                return (
                  <li key={item.href} className="flex flex-col">
                    {item.subItems ? (
                      <button
                        type="button"
                        onClick={() =>
                          setMobileExpanded((prev) =>
                            prev === item.name ? null : item.name,
                          )
                        }
                        aria-expanded={expanded}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          active || expanded
                            ? 'text-slate-900 dark:text-white bg-white/60 dark:bg-white/10'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                        }`}
                      >
                        <span>{item.name}</span>
                        <span
                          aria-hidden
                          className={`material-icon text-[18px] transition-transform duration-300 ${
                            expanded ? 'rotate-180 opacity-90' : 'opacity-60'
                          }`}
                        >
                          expand_more
                        </span>
                      </button>
                    ) : (
                      <Link
                        to={item.href}
                        onClick={handleNavClick}
                        className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          active
                            ? 'text-slate-900 dark:text-white bg-white/60 dark:bg-white/10'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                        }`}
                      >
                        {item.name}
                      </Link>
                    )}
                    {item.subItems && (
                      <div
                        className="overflow-hidden transition-[max-height,opacity] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{
                          maxHeight: expanded ? `${item.subItems.length * 44 + 8}px` : '0px',
                          opacity: expanded ? 1 : 0,
                        }}
                        aria-hidden={!expanded}
                      >
                        <ol className="pl-3 mt-1 flex flex-col gap-0.5">
                          {item.subItems.map((sub, idx) => {
                            const subActive = matchesItem(sub, location.pathname);
                            const delay = expanded ? 40 + idx * 30 : 0;
                            return (
                              <li key={sub.href}>
                                <Link
                                  to={sub.href}
                                  onClick={handleNavClick}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
                                    subActive
                                      ? 'text-slate-900 dark:text-white bg-white/50 dark:bg-white/10'
                                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/30'
                                  }`}
                                  style={{
                                    opacity: expanded ? 1 : 0,
                                    transform: expanded
                                      ? 'translateY(0)'
                                      : 'translateY(-4px)',
                                    transition: `opacity 220ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 240ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, color 150ms, background-color 150ms`,
                                  }}
                                >
                                  <span>{sub.name}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}
