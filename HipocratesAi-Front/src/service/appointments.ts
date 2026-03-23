export interface AppointmentApiItem {
    id: string;
    orgId: string | null;
    patientId: string;
    patientName: string;
    patientPhone: string | null;
    patientDocument: string | null;
    patientBirthDate: string | null;
    patientSex: string | null;
    doctorUserId: string;
    startAt: string;
    endAt: string;
    status: 'scheduled' | 'canceled' | 'done' | 'no_show';
    source: 'manual' | 'google';
    externalEventId: string | null;
  }
  
  const API_BASE_URL = 'http://127.0.0.1:3333';
  
  export async function fetchAppointmentsByDoctor(params: {
    date: string;
    doctorUserId: string;
  }): Promise<AppointmentApiItem[]> {
    const query = new URLSearchParams({
      date: params.date,
      doctorUserId: params.doctorUserId,
    });
  
    const response = await fetch(`${API_BASE_URL}/appointments?${query.toString()}`);
  
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.message ?? 'Erro ao buscar agendamentos.');
    }
  
    return response.json();
  }
  
  export async function createAppointment(payload: {
    patientId: string;
    doctorUserId: string;
    startAt: string;
    endAt: string;
    source?: 'manual' | 'google';
  }): Promise<AppointmentApiItem> {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        source: payload.source ?? 'manual',
      }),
    });
  
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.message ?? 'Erro ao criar agendamento.');
    }
  
    return response.json();
  }