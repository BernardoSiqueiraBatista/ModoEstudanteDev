// views/consulta/ConsultationClosureView.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ClosureHeader from '../../components/consulta/closure/ClosureHeader';
import ClosureSummarySection from '../../components/consulta/closure/ClosureSummarySection';
import ClosureClinicalReasoning from '../../components/consulta/closure/ClosureClinicalReasoning';
import ClosureFooter from '../../components/consulta/closure/ClosureFooter';
import { getClosureData } from '../../data/ClosureData';
import type { ClosureData } from '../../data/ClosureData'; // <-- IMPORTE COMO TIPO

export default function ConsultationClosureView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);
  const [closureData, setClosureData] = useState<ClosureData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const data = getClosureData(id);
      setClosureData(data);
      setIsLoading(false);
    }
  }, [id]);

  const handleCloseConsultation = () => {
    if (confirm('Deseja realmente encerrar esta consulta? Esta ação não poderá ser desfeita.')) {
      setIsClosing(true);
      setTimeout(() => {
        console.log('Consulta encerrada:', closureData);
        navigate(`/pacientes/${id}`);
      }, 800);
    }
  };

  if (isLoading || !closureData) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white">
      <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center py-20 px-8 bg-[#fdfdfe]">
        <div className="max-w-4xl w-full space-y-12 pb-24">
          <ClosureHeader 
            patientName={closureData.patientName} 
            patientId={closureData.patientId} 
          />
          
          <ClosureSummarySection summary={closureData.summary} />
          
          <ClosureClinicalReasoning diagnoses={closureData.diagnoses} />
          
          <ClosureFooter 
            onCloseConsultation={handleCloseConsultation}
            isClosing={isClosing}
          />
        </div>
      </main>
    </div>
  );
}