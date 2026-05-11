import type { CreatePatientDto } from '@hipo/contracts';
import PatientFormModal from './PatientFormModal';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (patientData: CreatePatientDto) => void | Promise<void>;
}

export default function NewPatientModal({ isOpen, onClose, onSave }: NewPatientModalProps) {
  return (
    <PatientFormModal
      isOpen={isOpen}
      onClose={onClose}
      mode="create"
      onCreate={onSave}
    />
  );
}
