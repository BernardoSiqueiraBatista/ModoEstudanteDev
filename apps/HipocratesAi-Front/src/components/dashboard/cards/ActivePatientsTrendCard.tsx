import { useMemo, useRef, useState } from 'react';
import type { WeeklyActivePatientsPoint } from '../../../hooks/useWeeklyActivePatientsTrend';

interface ActivePatientsTrendCardProps {
  data: WeeklyActivePatientsPoint[];
  current: number;
  deltaPct: number;
  isLoading?: boolean;
}

const VIEW_W = 1000;
const VIEW_H = 200;
const PAD_TOP = 20;
const PAD_BOTTOM = 30;

function buildSmoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return { line: '', area: '' };
  if (points.length === 1) {
    const p = points[0]!;
    const line = `M${p.x},${p.y}`;
    const area = `${line} L${p.x},${VIEW_H} Z`;
    return { line, area };
  }
  let line = `M${points[0]!.x},${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const dx = (p1.x - p0.x) / 2;
    line += ` C${p0.x + dx},${p0.y} ${p1.x - dx},${p1.y} ${p1.x},${p1.y}`;
  }
  const last = points[points.length - 1]!;
  const first = points[0]!;
  const area = `${line} L${last.x},${VIEW_H} L${first.x},${VIEW_H} Z`;
  return { line, area };
}

export default function ActivePatientsTrendCard({
  data,
  current,
  deltaPct,
  isLoading = false,
}: ActivePatientsTrendCardProps) {
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { points, line, area, lastPoint } = useMemo(() => {
    const counts = data.map((d) => d.count);
    const maxC = Math.max(...counts, 1);
    const minC = Math.min(...counts, 0);
    const range = Math.max(maxC - minC, 1);

    const pts = data.map((d, i) => ({
      x:
        data.length === 1
          ? VIEW_W / 2
          : (i / (data.length - 1)) * VIEW_W,
      y:
        PAD_TOP + (1 - (d.count - minC) / range) * (VIEW_H - PAD_TOP - PAD_BOTTOM),
    }));

    const path = buildSmoothPath(pts);
    return {
      points: pts,
      line: path.line,
      area: path.area,
      lastPoint: pts[pts.length - 1] ?? { x: VIEW_W, y: PAD_TOP },
    };
  }, [data]);

  const handlePointerAt = (clientX: number) => {
    const el = chartAreaRef.current;
    if (!el || points.length === 0) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetX = ratio * VIEW_W;
    let closest = 0;
    let minDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - targetX);
      if (d < minDist) {
        minDist = d;
        closest = i;
      }
    });
    setActiveIndex(closest);
  };

  const handleMouseMove = (e: React.MouseEvent) => handlePointerAt(e.clientX);
  const handleMouseLeave = () => setActiveIndex(null);
  const handleTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) handlePointerAt(t.clientX);
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) handlePointerAt(t.clientX);
  };
  const handleTouchEnd = () => setActiveIndex(null);

  const deltaPositive = deltaPct >= 0;
  const activePoint = activeIndex !== null ? points[activeIndex] : null;
  const activeData = activeIndex !== null ? data[activeIndex] : null;

  // Posições em % do container do chart (SVG estica com preserveAspectRatio="none")
  const activeXPct = activePoint ? (activePoint.x / VIEW_W) * 100 : 0;
  const activeYPct = activePoint ? (activePoint.y / VIEW_H) * 100 : 0;

  return (
    <div
      className="relative w-full h-[320px] rounded-[2rem] overflow-hidden bg-white/85 backdrop-blur-xl ring-1 ring-white/60 shadow-[0_12px_40px_rgba(41,52,58,0.06)]"
      style={{
        backgroundImage:
          'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(240,244,248,0.4) 100%)',
      }}
    >
      {/* Background Texture Layer */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--electric-cyan)]/15 via-transparent to-[var(--medical-navy)]/10"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] rounded-full bg-[var(--electric-cyan)]/20 blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[70%] rounded-full bg-[var(--medical-navy)]/15 blur-[80px]"></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 h-full w-full flex flex-col p-10 justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[11px] font-bold tracking-[0.15em] text-slate-500 uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--electric-cyan)] animate-pulse shadow-[0_0_8px_var(--electric-cyan)]"></span>
              <span>Pacientes Ativos</span>
            </p>
            <h3 className="text-4xl font-black text-[var(--medical-navy)] tracking-tighter">
              {isLoading ? '—' : (activeData?.count ?? current).toLocaleString('pt-BR')}
            </h3>
            <p className="text-[11px] font-medium text-slate-400 tracking-wide h-3">
              {activeData ? `Pacientes únicos · ${activeData.label}` : ''}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-2xl backdrop-blur-md flex items-center gap-2 ${
              deltaPositive ? 'bg-[var(--electric-cyan)]/15' : 'bg-rose-500/10'
            }`}
          >
            <span
              className={`material-symbols-outlined text-xl ${
                deltaPositive ? 'text-[var(--medical-navy)]' : 'text-rose-500'
              }`}
            >
              {deltaPositive ? 'trending_up' : 'trending_down'}
            </span>
            <span
              className={`font-bold text-lg ${
                deltaPositive ? 'text-[var(--medical-navy)]' : 'text-rose-500'
              }`}
            >
              {deltaPositive ? '+' : ''}
              {deltaPct}%
            </span>
            <span className="text-slate-500 text-xs font-medium ml-1">vs sem. anterior</span>
          </div>
        </div>

        {/* Line Chart + Hover Layer */}
        <div className="flex-1 w-full pt-6 px-1 flex flex-col">
          <div ref={chartAreaRef} className="relative flex-1 select-none touch-none">
            <svg
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
              preserveAspectRatio="none"
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            >
              <defs>
                <linearGradient id="trend-line-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="var(--medical-navy)" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="var(--medical-navy)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="var(--electric-cyan)" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="trend-fill-gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--electric-cyan)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--electric-cyan)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Area under line */}
              <path d={area} fill="url(#trend-fill-gradient)" />

              {/* Main line */}
              <path
                className="glow-line"
                d={line}
                fill="none"
                stroke="url(#trend-line-gradient)"
                strokeLinecap="round"
                strokeWidth="4"
              />

              {/* Intermediate point markers (subtle) */}
              {points.slice(0, -1).map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill="var(--medical-navy)"
                  fillOpacity={activeIndex === idx ? 1 : 0.5}
                />
              ))}

              {/* End point marker (sempre destacado) */}
              <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="12"
                fill="var(--electric-cyan)"
                fillOpacity="0.2"
              />
              <circle
                className={activeIndex === null ? 'animate-pulse' : ''}
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="6"
                fill="var(--electric-cyan)"
              />
            </svg>

            {/* Linha guia vertical */}
            {activePoint && (
              <div
                className="absolute top-0 bottom-0 w-px bg-[var(--medical-navy)]/30 pointer-events-none transition-opacity duration-150"
                style={{ left: `${activeXPct}%` }}
              />
            )}

            {/* Halo + dot ativo */}
            {activePoint && (
              <>
                <div
                  className="absolute pointer-events-none transition-all duration-150"
                  style={{
                    left: `${activeXPct}%`,
                    top: `${activeYPct}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="size-5 rounded-full bg-[var(--electric-cyan)]/25 absolute -inset-[6px]"></div>
                  <div className="size-3 rounded-full bg-[var(--electric-cyan)] ring-2 ring-white shadow-[0_0_12px_var(--electric-cyan)]"></div>
                </div>

                {/* Tooltip */}
                <div
                  className="absolute pointer-events-none z-20"
                  style={{
                    left: `${activeXPct}%`,
                    top: `${activeYPct}%`,
                    transform: 'translate(-50%, calc(-100% - 18px))',
                  }}
                >
                  <div className="relative px-3 py-2 rounded-xl bg-[var(--medical-navy)] text-white shadow-[0_8px_24px_rgba(15,23,42,0.25)] whitespace-nowrap">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">
                      {activeData?.label}
                    </p>
                    <p className="text-base font-bold tabular-nums leading-tight">
                      {activeData?.count.toLocaleString('pt-BR')}{' '}
                      <span className="text-[10px] font-medium text-white/60">
                        pac.
                      </span>
                    </p>
                    {/* Arrow */}
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 size-2 rotate-45 bg-[var(--medical-navy)]"></div>
                  </div>
                </div>
              </>
            )}

            {/* Hover/touch capture layer (acima de tudo) */}
            <div
              className="absolute inset-0 cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            />
          </div>

          {/* X-Axis Labels */}
          <div className="flex justify-between w-full mt-4 pointer-events-none">
            {data.map((d, i) => (
              <span
                key={i}
                className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-150 ${
                  activeIndex === i
                    ? 'text-[var(--medical-navy)]'
                    : 'text-slate-400'
                }`}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Subtle Decorative Element */}
      <div className="absolute bottom-3 left-6 text-[9px] font-medium text-slate-400/60 uppercase tracking-[0.3em] z-10 pointer-events-none">
        Real-time clinical telemetry active
      </div>
    </div>
  );
}
