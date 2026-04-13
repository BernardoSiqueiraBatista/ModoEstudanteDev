import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PatientProfileHeader from '../../components/patients/patientProfile/PatientProfileHeader';
import CognitiveSummary from '../../components/patients/patientProfile/CognitiveSummary';
import FloatingActions from '../../components/patients/patientProfile/FloatingActions';
import HistoricoTab from '../../components/patients/patientProfile/historico/HistoricoTab';
import HipotesesTab from '../../components/patients/patientProfile/hipoteses/HipotesesTab';
import TratamentosTab from '../../components/patients/patientProfile/tratamentos/TratamentosTab';
import { patients } from '../../data/PatientsData';
import { getCognitiveSummaryByPatientId } from '../../data/ClinicalData';

export type TabType = 'historico' | 'hipoteses' | 'tratamentos';

export default function PatientProfileView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('historico');

  const patient = patients.find(p => p.id === id);
  const cognitiveSummary = patient ? getCognitiveSummaryByPatientId(patient.id) : undefined;

  React.useEffect(() => {
    if (!patient && id) {
      navigate('/pacientes');
    }
  }, [patient, id, navigate]);

  if (!patient) {
    return (
      <div className="flex-1 flex items-center justify-center bg-elite-bg">
        <p className="text-elite-gray">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full relative bg-white">
      <main className="flex-1 flex flex-col overflow-hidden bg-[#fcfcfc]">
        <PatientProfileHeader patient={patient} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 relative">
          <div className="max-w-4xl mx-auto py-12 relative">
            {activeTab === 'historico' && <HistoricoTab patientId={patient.id} />}
            {activeTab === 'hipoteses' && <HipotesesTab patientId={patient.id} />}
            {activeTab === 'tratamentos' && <TratamentosTab patientId={patient.id} />}
          </div>
        </div>

        <FloatingActions />
      </main>

      <CognitiveSummary summary={cognitiveSummary} />
    </div>
  );
}
