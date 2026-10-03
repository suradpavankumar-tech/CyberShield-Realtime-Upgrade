export interface RiskDistribution {
  high: number;
  medium: number;
  low: number;
}

export interface StatusDistribution {
  completed: number;
  failed: number;
  pending: number;
}

export interface InputDistribution {
  url: number;
  message: number;
  email: number;
}

export interface ThreatIntelligence {
  top_category: string | null;
  top_category_count: number;
}

export interface DashboardScan {
  scan_id: number;

  input_type:
    | "URL"
    | "MESSAGE"
    | "EMAIL";

  status:
    | "COMPLETED"
    | "FAILED"
    | "PENDING";

  risk_score: number | null;

  risk_level:
    | "HIGH"
    | "MEDIUM"
    | "LOW"
    | null;

  threat_category: string | null;

  confidence: number | null;

  created_at: string;

  completed_at: string | null;
}

export interface DashboardResponse {
  total_scans: number;

  average_risk_score: number | null;

  risk_distribution: RiskDistribution;

  status_distribution: StatusDistribution;

  input_distribution: InputDistribution;

  threat_categories: Record<
    string,
    number
  >;

  threat_intelligence: ThreatIntelligence;

  highest_risk_scan:
    | DashboardScan
    | null;

  recent_scans: DashboardScan[];
}

export interface TrendPoint {
  date: string;

  total_scans: number;

  high_risk: number;

  medium_risk: number;

  low_risk: number;
}

export interface DashboardTrendsResponse {
  period_days: number;

  trends: TrendPoint[];
}