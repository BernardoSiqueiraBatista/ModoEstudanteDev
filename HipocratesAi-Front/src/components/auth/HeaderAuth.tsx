import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const isCadastroPage = location.pathname === '/cadastro';

  return (
    <div className="flex items-center gap-3 mb-12">
      <div
        className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm cursor-pointer"
        onClick={() => navigate('/login')}
      >
        <span className="material-symbols-outlined text-navy-deep text-2xl font-light">
          neurology
        </span>
      </div>
      <span
        className="text-xl font-bold tracking-tight text-navy-deep cursor-pointer"
        onClick={() => navigate('/login')}
      >
        Hipócrates<span className="font-light text-slate-400">.ai</span>
      </span>
    </div>
  );
}
