// Types for Dashboard appointments and related data

export interface Appointment {
  time: string;
  patientName: string;
  type: string;
  specialty?: string;
  status: 'confirmed' | 'waiting' | 'current';
}

export interface StatData {
  icon: string;
  iconBgColor: string;
  iconTextColor: string;
  label: string;
  value: string | number;
  badge?: {
    text: string;
    type: 'success' | 'danger' | 'neutral';
  };
}

export interface InfoData {
  icon: string;
  iconBgColor: string;
  iconTextColor: string;
  label: string;
  value: string | number;
}
