export default function PatientsInsightsFooter() {
  return (
    <footer className="mt-12 flex justify-between items-center text-slate-400 px-2">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-[#0066FF]"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Sincronização Ativa
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">
          v4.2.0-Elite
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="material-icon text-sm">shield</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Dados Criptografados de Ponta a Ponta
        </span>
      </div>
    </footer>
  );
}
