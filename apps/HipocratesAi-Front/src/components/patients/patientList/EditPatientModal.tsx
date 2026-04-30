import type { PatientApiItem, UpdatePatientDto } from '@hipo/contracts';
import PatientFormModal from './PatientFormModal';

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientApiItem | null;
  onSave?: (payload: UpdatePatientDto) => void | Promise<void>;
}

export default function EditPatientModal({
  isOpen,
  onClose,
  patient,
  onSave,
}: EditPatientModalProps) {
  return (
    <PatientFormModal
      isOpen={isOpen}
      onClose={onClose}
      mode="edit"
      patient={patient}
      onUpdate={onSave}
    />
  );
}
