// components/agenda/NewAppointmentModal.tsx
import React, { useState } from 'react';
import type { Patient } from '../../types/PatientTypes';
import type { EventType } from './week/Calendarevent';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: {
    patientId: string;
    date: string;
    startTime: string;
    endTime: string;
    type: EventType;
    description?: string;
  }) => void;
  patients: Patient[]; // Lista de pacientes para selecionar
}

export default function NewAppointmentModal({ 
  isOpen, 
  onClose, 
  onSave,
  patients 
}: NewAppointmentModalProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    startTime: '',
    endTime: '',
    type: 'consulta' as EventType,
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      patientId: formData.patientId,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      type: formData.type,
      description: formData.description || undefined,
    });
    
    // Reset form
    setFormData({
      patientId: '',
      date: '',
      startTime: '',
      endTime: '',
      type: 'consulta',
      description: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative liquid-glass rounded-bubble max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="edge-refraction"></div>
        
        <div className="p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-heading-1 text-title">Nova Consulta</h2>
            <button 
              onClick={onClose}
              className="size-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
            >
              <span className="material-icon text-subtitle">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selecionar Paciente */}
            <div>
              <label className="block text-caption-bold text-subtitle uppercase tracking-widest mb-2">
                Paciente <span className="text-title">*</span>
              </label>
              <select
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-title focus:outline-none focus:border-graphite focus:ring-1 focus:ring-graphite/20 transition-all text-body-sm appearance-none"
              >
                <option value="">Selecione um paciente</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} - {patient.recordNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Data e Tipo em grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Data */}
              <div>
                <label className="block text-caption-bold text-subtitle uppercase tracking-widest mb-2">
                  Data <span className="text-title">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-title focus:outline-none focus:border-graphite focus:ring-1 focus:ring-graphite/20 transition-all text-body-sm"
                />
              </div>

              {/* Tipo de Evento */}
              <div>
                <label className="block text-caption-bold text-subtitle uppercase tracking-widest mb-2">
                  Tipo <span className="text-title">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-title focus:outline-none focus:border-graphite focus:ring-1 focus:ring-graphite/20 transition-all text-body-sm appearance-none"
                >
                  <option value="consulta">Consulta</option>
                  <option value="urgencia">Urgência</option>
                  <option value="compromisso">Compromisso</option>
                  <option value="video">Vídeo Consulta</option>
                </select>
              </div>
            </div>

            {/* Horário Início e Fim */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-caption-bold text-subtitle uppercase tracking-widest mb-2">
                  Horário Início <span className="text-title">*</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-title focus:outline-none focus:border-graphite focus:ring-1 focus:ring-graphite/20 transition-all text-body-sm"
                />
              </div>
              <div>
                <label className="block text-caption-bold text-subtitle uppercase tracking-widest mb-2">
                  Horário Fim <span className="text-title">*</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-title focus:outline-none focus:border-graphite focus:ring-1 focus:ring-graphite/20 transition-all text-body-sm"
                />
              </div>
            </div>

            {/* Descrição (opcional) */}
            <div>
              <label className="block text-caption-bold text-subtitle uppercase tracking-widest mb-2">
                Descrição <span className="text-subtitle font-normal">(opcional)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-title placeholder:text-slate-400 focus:outline-none focus:border-graphite focus:ring-1 focus:ring-graphite/20 transition-all text-body-sm resize-none"
                placeholder="Informações adicionais sobre a consulta..."
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl border border-slate-300 bg-white text-slate-600 font-semibold text-label-sm hover:bg-slate-50 hover:border-graphite transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl text-white font-semibold text-label-sm bg-black transition-all flex items-center gap-2"
              >
                <span className="material-icon text-sm">add</span>
                Agendar Consulta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}