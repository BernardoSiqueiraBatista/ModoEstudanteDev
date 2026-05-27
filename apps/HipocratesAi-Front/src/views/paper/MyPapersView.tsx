import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
const API = 'http://localhost:3333';

interface Session {
  id: string;
  titulo: string;
  criado_em: string;
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `HÁ ${minutes}MIN`;
  if (hours < 24) return `HÁ ${hours}H`;
  if (days === 1) return 'ONTEM';
  return `HÁ ${days} DIAS`;
}

export default function MyPapers() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);

  useEffect(() => {
    fetch(`${API}/student/${STUDENT_ID}/paperlab/sessions`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function handleCreate() {
    const title = newTitle.trim();
    if (!title) return;
    setLoadingCreate(true);
    try {
      const res = await fetch(`${API}/student/${STUDENT_ID}/paperlab/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: title }),
      });
      if (!res.ok) throw new Error();
      const session: Session = await res.json();
      setSessions(prev => [session, ...prev]);
      setCreating(false);
      setNewTitle('');
      navigate(`/paper/${session.id}`, { state: session });
    } catch {
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, sessionId: string) {
    e.stopPropagation();
    await fetch(`${API}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}`, { method: 'DELETE' });
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }

  return (
    <div className="bg-background min-h-screen text-on-surface font-body">
      <div className="pt-10 pb-16 px-4 md:px-6">
        <main className="max-w-[1280px] mx-auto">
          <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-[3rem] leading-none font-extrabold tracking-tight mb-2">
                Laboratório de Estudo
              </h1>
              <p className="text-on-surface-variant max-w-xl text-sm font-medium leading-relaxed">
                Organize seus materiais de estudo em notebooks inteligentes com IA.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* CREATE */}
            <button
              onClick={() => setCreating(true)}
              className="group relative h-[320px] rounded-[2rem] bg-surface-container-low border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center hover:border-primary/50 hover:bg-white transition-all active:scale-[0.98]"
            >
              <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center mb-3 group-hover:bg-primary-container transition-colors">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-primary">
                  add
                </span>
              </div>
              <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary transition-colors">
                Criar novo notebook
              </span>
            </button>

            {/* SESSION CARDS */}
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`/paper/${session.id}`, { state: session })}
                className="group relative h-[320px] rounded-[2rem] p-5 flex flex-col overflow-hidden border border-white/40 bg-white/70 backdrop-blur-xl shadow-[0_10px_30px_rgba(41,52,58,0.05)] hover:-translate-y-1 transition-all cursor-pointer"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-container opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      menu_book
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full hover:bg-error/10 flex items-center justify-center transition-all"
                  >
                    <span className="material-symbols-outlined text-error text-[18px]">delete</span>
                  </button>
                </div>

                <h3 className="text-[1.85rem] leading-[1.05] font-extrabold tracking-tight mb-3 line-clamp-3">
                  {session.titulo}
                </h3>

                <div className="mt-auto pt-3 border-t border-surface-container flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wide text-outline">
                    {formatRelative(session.criado_em)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Create notebook modal */}
      {creating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => { setCreating(false); setNewTitle(''); }} />
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => { setCreating(false); setNewTitle(''); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">Novo Notebook</h2>
              <p className="text-sm text-slate-400">Dê um nome ao seu laboratório de estudo.</p>
            </div>

            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Ex: Cardiologia Avançada 2024"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-sm"
            />

            <div className="flex flex-col gap-3">
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || loadingCreate}
                className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-blue-700 text-white font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingCreate ? 'Criando...' : 'Criar Notebook'}
              </button>
              <button
                onClick={() => { setCreating(false); setNewTitle(''); }}
                className="w-full py-3 text-slate-400 font-semibold hover:text-slate-600 transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes zoom-in-95 { from { transform: scale(0.95) } to { transform: scale(1) } }
        .animate-in { animation: fade-in 0.2s ease, zoom-in-95 0.2s ease; }
      `}</style>
    </div>
  );
}
