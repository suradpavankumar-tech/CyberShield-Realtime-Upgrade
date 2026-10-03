import api from "./api";

import type {
  DashboardResponse,
  DashboardTrendsResponse,
} from "../types/dashboard";

export async function getDashboard(): Promise<DashboardResponse> {
  const response = await api.get<DashboardResponse>(
    "/analysis/dashboard",
  );

  return response.data;
}

export async function getDashboardTrends(
  days = 7,
): Promise<DashboardTrendsResponse> {
  const response =
    await api.get<DashboardTrendsResponse>(
      "/analysis/dashboard/trends",
      {
        params: {
          days,
        },
      },
    );

  return response.data;
}