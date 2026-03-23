export default function SecurityInfo() {
  return (
    <div className="mt-6 pt-6 border-t border-subtle">
      <div className="flex items-start gap-3 text-left">
        <span className="material-icon text-primary text-xl mt-0.5">shield</span>
        <div className="flex flex-col">
          <p className="text-title text-caption-bold">Segurança de Nível Institucional</p>
          <p className="text-subtitle text-caption">
            Esta plataforma está em plena conformidade LGPD. Todas as consultas aos pacientes são
            criptografadas de ponta a ponta e permanecem estritamente confidenciais.
          </p>
        </div>
      </div>
    </div>
  );
}
