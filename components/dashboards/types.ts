/**
 * Types partagés par les tableaux de bord.
 * Leur forme correspond exactement à la réponse de `GET /api/dashboard/stats` :
 * aucune donnée n'est inventée côté interface.
 */

export type DashboardStats = {
  totalEleves: number;
  totalEtablissements: number;
  totalEnseignants: number;
  totalClasses: number;
  totalProvinces: number;
  totalDossiers: number;
  totalVisites: number;
  totalSousProvinciales: number;
  totalDocuments: number;
  totalNotifications: number;
};

export type BreakdownItem = { label: string; value: number; sublabel: string };
export type ChartItem = { label: string; value: number };

export type DashboardScope = 'national' | 'provincial' | 'sousProvincial' | 'school';

export type DashboardStatsResponse = {
  stats: DashboardStats;
  breakdown: BreakdownItem[];
  chartData: ChartItem[];
  activite: string[];
  scope: DashboardScope;
  provinceLabel: string | null;
};
