import type { ReactNode } from 'react';

export default function SetupPlanoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#001c3b]/10 backdrop-blur-sm">
      {/* BACKGROUND GLOWS ORIGINAIS */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-tertiary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* CONTAINER FIXO (Mesmo tamanho para todas as etapas) */}
      <div className="relative w-full max-w-[640px] h-[85vh] max-h-[760px] min-h-[640px] overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/75 backdrop-blur-[28px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] flex flex-col">
        
        {/* Glow interno (dos steps 3 e 4) */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/5 blur-[60px] pointer-events-none" />

        {/* O conteúdo dinâmico de cada etapa será renderizado aqui */}
        {children}
      </div>
    </div>
  );
}