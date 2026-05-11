import { dashboardStatsSchema, type DashboardStats } from '@hipo/contracts';
import { httpClient } from '../lib/http';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return httpClient.get<DashboardStats>('/dashboard/stats', {
    schema: dashboardStatsSchema,
  });
}
