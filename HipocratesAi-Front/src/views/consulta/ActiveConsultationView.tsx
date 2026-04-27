// ActiveConsultationView.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ConsultationHeader from '../../components/consulta/active/ConsultationHeader';
import MessageThread from '../../components/consulta/active/MessageThread';
import FloatingActions from '../../components/consulta/active/FloatingActions';
import CognitiveSupport from '../../components/consulta/active/CognitiveSupport';
import ClinicalReasoningPopup from '../../components/consulta/active/ClinicalReasoningPopUp';
import { patients } from '../../data/PatientsData';
import { getConsultationData } from '../../data/ConsultationData';
import type { Patient } from '../../types/PatientTypes';

export default function ActiveConsultationView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [duration, setDuration] = useState('00:00');
  const [seconds, setSeconds] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isPopupMinimized, setIsPopupMinimized] = useState(false);
  
  const consultationData = id ? getConsultationData(id) : null;

  // Buscar dados do paciente
  useEffect(() => {
    const foundPatient = patients.find(p => p.id === id);
    if (!foundPatient) {
      navigate('/pacientes');
      return;
    }
    setPatient(foundPatient);
  }, [id, navigate]);

  // Timer da consulta
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => {
        const newSeconds = prev + 1;
        const minutes = Math.floor(newSeconds / 60);
        const remainingSeconds = newSeconds % 60;
        setDuration(`${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`);
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleEndSession = () => {
    if (confirm('Deseja realmente encerrar esta consulta?')) {
      navigate(`/consulta/encerramento/${id}`);
    }
  };

  const handleToggleChat = () => {
    if (isPopupOpen && !isPopupMinimized) {
      setIsPopupMinimized(true);
    } else if (isPopupOpen && isPopupMinimized) {
      setIsPopupMinimized(false);
    } else {
      setIsPopupOpen(true);
      setIsPopupMinimized(false);
    }
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setIsPopupMinimized(false);
  };

  const handleMinimizePopup = () => {
    setIsPopupMinimized(true);
  };

  const handleExpandPopup = () => {
    setIsPopupMinimized(false);
  };

  const handleMaximizePopup = () => {
    // Fecha o popup e navega para a tela maximizada
    setIsPopupOpen(false);
    navigate(`/consulta/raciocinio/${id}`, { 
      state: { 
        patientName: patient?.name,
        duration: duration 
      } 
    });
  };

  if (!patient || !consultationData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Carregando consulta...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full relative">
      <main className="flex-1 flex overflow-hidden">
        <section className="flex-1 flex flex-col relative bg-gradient-to-b from-white to-slate-50/30 dark:from-black dark:to-slate-950/20">
          <ConsultationHeader
            patientName={patient.name}
            age={patient.age}
            mainComplaint={patient.mainDiagnosis || 'Consulta em andamento'}
            duration={duration}
          />
          
          <MessageThread messages={consultationData.messages} />
          
          <FloatingActions 
            onEndSession={handleEndSession} 
            onToggleChat={handleToggleChat}
          />
        </section>
        
        <CognitiveSupport data={consultationData} />
      </main>

      <ClinicalReasoningPopup 
        isOpen={isPopupOpen}
        isMinimized={isPopupMinimized}
        isMaximized={false}
        patientName={patient.name}
        duration={duration}
        onClose={handleClosePopup}
        onMinimize={handleMinimizePopup}
        onExpand={handleExpandPopup}
        onMaximize={handleMaximizePopup}
      />
    </div>
  );
}
