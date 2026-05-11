import { DashboardRepository } from './dashboard.repository';

export class DashboardService {
  constructor(private readonly repo = new DashboardRepository()) {}

  async getStats(userId: string) {
    const [todayCount, activePatients, totalPatients, pending, followUps, todayAppointments] = await Promise.all([
      this.repo.countTodayAppointments(userId),
      this.repo.countActivePatients(userId),
      this.repo.countTotalPatients(userId),
      this.repo.countPendingAppointments(userId),
      this.repo.countFollowUpPatients(userId),
      this.repo.getTodayAppointments(userId),
    ]);

    return {
      consultasHoje: todayCount,
      pacientesAtivos: activePatients,
      totalPacientes: totalPatients,
      pendencias: pending,
      followUps,
      agendaHoje: todayAppointments,
    };
  }
}
