// views/consulta/ClinicalReasoningMaximizedView.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MaximizedHeader from '../../components/consulta/active/maximizedClinicalReasoning/MaximizedHeader';
import MaximizedMessageList from '../../components/consulta/active/maximizedClinicalReasoning/MaximizedMessageList';
import MaximizedInputArea from '../../components/consulta/active/maximizedClinicalReasoning/MaximizedInputArea';
import { patients } from '../../data/PatientsData';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

export default function ClinicalReasoningMaximizedView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [patientName, setPatientName] = useState('Carregando...');
  const [duration, setDuration] = useState('00:00');
  const [isLoading, setIsLoading] = useState(false);

  // Buscar dados do paciente
  useEffect(() => {
    const patient = patients.find(p => p.id === id);
    if (patient) {
      setPatientName(patient.name);
    }
  }, [id]);

  // Mensagem inicial
  useEffect(() => {
    if (patientName !== 'Carregando...') {
      setMessages([
        {
          id: '1',
          text: `Olá! Sou seu assistente de raciocínio clínico. Como posso ajudar na análise do caso da paciente ${patientName}?`,
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    }
  }, [patientName]);

  // Timer da consulta
  useEffect(() => {
    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      setDuration(`${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    navigate(`/consulta/ativa/${id}`);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Analisando sua questão... Com base nas informações disponíveis, recomendo considerar os seguintes pontos para sua decisão clínica. Gostaria de aprofundar algum aspecto específico?',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      <MaximizedHeader
        patientName={patientName}
        duration={duration}
        onBack={handleBack}
      />
      
      <MaximizedMessageList messages={messages} />
      
      <MaximizedInputArea
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
        isLoading={isLoading}
      />
    </div>
  );
}