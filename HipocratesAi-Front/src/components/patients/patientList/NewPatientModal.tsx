import React from 'react';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (patientData: {
    name: string;
    gender: string;
    age: number;
    status: 'ativo' | 'followup' | 'pendente';
    mainDiagnosis?: string;
    observations?: string;
  }) => void;
}

type NewPatientFormData = {
  fullName: string;
  document: string;
  birthDate: string;
  sex: string;
  phoneNumber: string;
  insuranceProvider: string;
  insuranceNumber: string;
  chiefComplaint: string;
  allergies: string;
  currentMedications: string;
  notes: string;
};

const initialFormData: NewPatientFormData = {
  fullName: '',
  document: '',
  birthDate: '',
  sex: '',
  phoneNumber: '',
  insuranceProvider: '',
  insuranceNumber: '',
  chiefComplaint: '',
  allergies: '',
  currentMedications: '',
  notes: '',
};

export default function NewPatientModal({ isOpen, onClose, onSave }: NewPatientModalProps) {
  const [formData, setFormData] = React.useState<NewPatientFormData>(initialFormData);
  const [isUploadExpanded, setIsUploadExpanded] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [extractError, setExtractError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setIsUploadExpanded(false);
      setSelectedFile(null);
      setIsExtracting(false);
      setExtractError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateField = (field: keyof NewPatientFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOverlayClick = () => {
    onClose();
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setExtractError(null);
  };

  const handleExtractPdf = async () => {
    if (!selectedFile) return;

    try {
      setIsExtracting(true);
      setExtractError(null);

      // placeholder até ligarmos o backend
      await new Promise(resolve => setTimeout(resolve, 1200));

      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || 'Nome extraído do PDF',
        chiefComplaint: prev.chiefComplaint || 'Informação importada da ficha clínica',
        notes: prev.notes || 'Texto clínico extraído automaticamente do PDF.',
      }));
    } catch (error) {
      setExtractError(error instanceof Error ? error.message : 'Erro ao processar PDF.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.birthDate || !formData.sex || !formData.phoneNumber) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    try {
      setIsSaving(true);

      // Calcular idade a partir da data de nascimento
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Preparar dados no formato esperado pelo Patient
      const patientData = {
        name: formData.fullName,
        gender:
          formData.sex === 'male' ? 'Masculino' : formData.sex === 'female' ? 'Feminino' : 'Outro',
        age,
        status: 'ativo' as const,
        mainDiagnosis: formData.chiefComplaint || undefined,
        observations: formData.notes || undefined,
      };

      console.log('Novo paciente:', patientData);
      onSave?.(patientData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
      alert('Erro ao salvar paciente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[20px] px-4"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] border border-white/50 bg-white/85 shadow-2xl backdrop-blur-[30px]"
        onClick={handleModalClick}
      >
        <div className="flex items-center justify-between px-10 pt-10 pb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Novo Paciente</h1>
            <p className="mt-1 text-sm text-slate-500">
              Insira os dados cadastrais e clínicos do paciente.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 transition hover:bg-slate-900/5"
          >
            <svg
              className="h-6 w-6 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-10 pb-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <section>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Informações Pessoais
              </h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                <div className="md:col-span-8">
                  <label className="mb-1.5 ml-1 block text-xs font-medium text-slate-500">
                    NOME COMPLETO *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={e => updateField('fullName', e.target.value)}
                    placeholder="Ex: João da Silva Santos"
                    className="h-12 w-full rounded-xl border border-black/5 bg-white/50 px-4 text-sm outline-none transition focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="mb-1.5 ml-1 block text-xs font-medium text-slate-500">
                    DOCUMENTO (CPF/RG)
                  </label>
                  <input
                    type="text"
                    value={formData.document}
                    onChange={e => updateField('document', e.target.value)}
                    placeholder="000.000.000-00"
                    className="h-12 w-full rounded-xl border border-black/5 bg-white/50 px-4 text-sm outline-none transition focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="mb-1.5 ml-1 block text-xs font-medium text-slate-500">
                    DATA DE NASCIMENTO *
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={e => updateField('birthDate', e.target.value)}
                    className="h-12 w-full rounded-xl border border-black/5 bg-white/50 px-4 text-sm outline-none transition focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="mb-1.5 ml-1 block text-xs font-medium text-slate-500">
                    SEXO *
                  </label>
                  <select
                    value={formData.sex}
                    onChange={e => updateField('sex', e.target.value)}
                    className="h-12 w-full rounded-xl border border-black/5 bg-white/50 px-4 text-sm outline-none transition focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5"
                  >
                    <option value="">Selecione</option>
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="mb-1.5 ml-1 block text-xs font-medium text-slate-500">
                    TELEFONE *
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={e => updateField('phoneNumber', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="h-12 w-full rounded-xl border border-black/5 bg-white/50 px-4 text-sm outline-none transition focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5"
                  />
                </div>
              </div>
            </section>

            <section>
              <button
                type="button"
                onClick={() => setIsUploadExpanded(prev => !prev)}
                className="flex w-full items-center justify-between py-2 group"
              >
                <div className="text-left">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Documentação do Paciente
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Importar arquivos complementares e ficha clínica
                  </p>
                </div>

                <div className="flex items-center gap-2 text-slate-400 transition group-hover:text-slate-900">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Importar ficha clínica
                  </span>
                  <span
                    className={`text-lg transition-transform duration-300 ${
                      isUploadExpanded ? 'rotate-180' : 'rotate-0'
                    }`}
                  >
                    ▾
                  </span>
                </div>
              </button>

              {isUploadExpanded && (
                <div className="mt-4 rounded-3xl border border-dashed border-black/10 bg-black/[0.02] p-8 text-center transition hover:border-black/30 hover:bg-black/[0.04]">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-600"
                  />

                  {selectedFile && (
                    <p className="mt-3 text-sm text-slate-500">
                      Arquivo selecionado: {selectedFile.name}
                    </p>
                  )}

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleExtractPdf}
                      disabled={!selectedFile || isExtracting}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isExtracting ? 'Extraindo...' : 'Extrair dados'}
                    </button>
                  </div>

                  {extractError && <p className="mt-3 text-sm text-red-600">{extractError}</p>}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Convênio & Plano
              </h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 ml-1 block text-xs font-medium text-slate-500">
                    CONVÊNIO
                  </label>
                  <input
                    type="text"
                    value={formData.insuranceProvider}
                    onChange={e => updateField('insuranceProvider', e.target.value)}
                    placeholder="Ex: Bradesco Saúde, Unimed..."
                    className="h-12 w-full rounded-xl border border-black/5 bg-white/50 px-4 text-sm outline-none transition focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5"
                  />
                </div>

                <div>
                  <label className="mb-1.5 ml-1 block text-xs font-medium text-slate-500">
                    NÚMERO DA CARTEIRINHA
                  </label>
                  <input
                    type="text"
                    value={formData.insuranceNumber}
                    onChange={e => updateField('insuranceNumber', e.target.value)}
                    placeholder="Digitar número"
                    className="h-12 w-full rounded-xl border border-black/5 bg-white/50 px-4 text-sm outline-none transition focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Dados Clínicos
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 ml-1 block text-xs font-medium text-slate-500">
                    DIAGNÓSTICO OU QUEIXA PRINCIPAL
                  </label>
                  <input
                    type="text"
                    value={formData.chiefComplaint}
                    onChange={e => updateField('chiefComplaint', e.target.value)}
                    placeholder="Ex: Hipertensão, Dor lombar crônica..."
                    className="h-12 w-full rounded-xl border border-black/5 bg-white/50 px-4 text-sm outline-none transition focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 ml-1 block text-xs font-medium text-slate-500">
                      ALERGIAS
                    </label>
                    <input
                      type="text"
                      value={formData.allergies}
                      onChange={e => updateField('allergies', e.target.value)}
                      placeholder="Ex: Dipirona, Penicilina..."
                      className="h-12 w-full rounded-xl border border-black/5 bg-white/50 px-4 text-sm outline-none transition focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 ml-1 block text-xs font-medium text-slate-500">
                      MEDICAÇÕES EM USO
                    </label>
                    <input
                      type="text"
                      value={formData.currentMedications}
                      onChange={e => updateField('currentMedications', e.target.value)}
                      placeholder="Ex: Losartana 50mg..."
                      className="h-12 w-full rounded-xl border border-black/5 bg-white/50 px-4 text-sm outline-none transition focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 ml-1 block text-xs font-medium text-slate-500">
                    OBSERVAÇÕES ADICIONAIS
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={e => updateField('notes', e.target.value)}
                    placeholder="Informações relevantes sobre o histórico do paciente..."
                    className="w-full resize-none rounded-2xl border border-black/5 bg-white/50 p-4 text-sm outline-none transition focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5"
                  />
                </div>
              </div>
            </section>

            <div className="sticky bottom-0 flex items-center justify-end gap-4 border-t border-black/5 bg-white/30 px-0 py-8">
              <button
                type="button"
                onClick={onClose}
                className="h-12 rounded-xl px-8 text-sm font-medium text-slate-500 transition hover:bg-black/5"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-12 items-center rounded-xl bg-slate-900 px-10 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:scale-[1.02] hover:shadow-black/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="mr-2 text-base">+</span>
                {isSaving ? 'Salvando...' : 'Salvar Paciente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
