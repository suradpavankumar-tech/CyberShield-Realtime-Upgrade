export type InputType = "URL" | "MESSAGE" | "EMAIL";

export type ScanStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED";

export type RiskLevel =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export interface AnalysisRequest {
  input_type: InputType;
  content: string;
}

export interface ThreatIndicator {
  id: number;
  indicator_type: string;
  name: string;
  description: string | null;
  severity: string;
  score: number;
  source: string;
}

export interface AnalysisResponse {
  scan_id: number;
  input_type: InputType;
  status: ScanStatus;

  risk_score: number | null;
  risk_level: RiskLevel | null;
  threat_category: string | null;
  confidence: number | null;

  error_message: string | null;

  created_at: string;
  completed_at: string | null;
  verdict: string | null;
  analysis_details: Record<string, any> | null;

  indicators: ThreatIndicator[];
}

export interface ScanSummary {
  scan_id: number;
  input_type: InputType;
  status: ScanStatus;

  risk_score: number | null;
  risk_level: RiskLevel | null;
  threat_category: string | null;
  confidence: number | null;

  created_at: string;
  completed_at: string | null;
}

export interface ScanListResponse {
  /**
   * Total number of records after backend filters
   * and before pagination.
   */
  total: number;

  /**
   * Current page of scan records.
   */
  scans: ScanSummary[];
}

/**
 * Query parameters supported by:
 *
 * GET /api/v1/analysis
 */
export interface ScanListParams {
  risk_level?: RiskLevel;
  input_type?: InputType;
  status_filter?: ScanStatus;
  page?: number;
  page_size?: number;
}