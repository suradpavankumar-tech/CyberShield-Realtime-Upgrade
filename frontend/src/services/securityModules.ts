import api from "./api";

export interface EmailHeaderResult {
  scan_id: number;
  status: string;
  risk_score: number | null;
  risk_level: string | null;
  confidence: number | null;
  threat_category: string | null;
  headers: Record<string, string | string[]>;
  authentication: Record<string, string | null>;
  findings: any[];
  evidence: Record<string, unknown>;
  recommendations: string[];
  created_at: string;
  completed_at: string | null;
}

export interface EmailHeaderSummary {
  scan_id: number;
  status: string;
  risk_score: number | null;
  risk_level: string | null;
  confidence: number | null;
  threat_category: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface MobileResult {
  scan_id: number;
  filename: string;
  package_name: string | null;
  status: string;
  risk_score: number | null;
  risk_level: string | null;
  confidence: number | null;
  permissions: string[];
  findings: any[];
  recommendations: string[];
  evidence: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

export interface MobileSummary {
  scan_id: number;
  filename: string;
  package_name: string | null;
  status: string;
  risk_score: number | null;
  risk_level: string | null;
  confidence: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface VulnerabilityResult {
  scan_id: number;
  target: string;
  port_spec: string;
  status: string;
  risk_score: number | null;
  risk_level: string | null;
  confidence: number | null;
  findings: any[];
  services: any[];
  evidence: Record<string, unknown>;
  recommendations: string[];
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface VulnerabilitySummary {
  scan_id: number;
  target: string;
  port_spec: string;
  status: string;
  risk_score: number | null;
  risk_level: string | null;
  confidence: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface Campaign {
  campaign_id: number;
  name: string;
  description: string | null;
  template_name: string;
  training_topic: string;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  metrics: any;
}

export async function analyzeEmailHeaders(raw_headers: string) {
  return (
    await api.post<EmailHeaderResult>("/email-headers", {
      raw_headers,
    })
  ).data;
}

export async function listEmailHeaders() {
  return (
    await api.get<{
      total: number;
      scans: EmailHeaderSummary[];
    }>("/email-headers")
  ).data;
}

export async function deleteEmailHeader(id: number) {
  await api.delete("/email-headers/" + id);
}

export async function uploadMobileApk(file: File) {
  const f = new FormData();
  f.append("file", file);

  return (
    await api.post<MobileResult>("/mobile", f, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  ).data;
}

export async function listMobileScans() {
  return (
    await api.get<{
      total: number;
      scans: MobileSummary[];
    }>("/mobile")
  ).data;
}

export async function deleteMobileScan(id: number) {
  await api.delete("/mobile/" + id);
}

export async function startVulnerabilityScan(
  data: {
    target: string;
    port_spec: string;
    authorization_note: string;
  }
) {
  return (
    await api.post<VulnerabilityResult>("/vulnerabilities", data)
  ).data;
}

/* NEW: Get the current status/result of one vulnerability scan */
export async function getVulnerabilityScan(scanId: number) {
  return (
    await api.get<VulnerabilityResult>(
      "/vulnerabilities/" + scanId
    )
  ).data;
}

export async function listVulnerabilityScans() {
  return (
    await api.get<{
      total: number;
      scans: VulnerabilitySummary[];
    }>("/vulnerabilities")
  ).data;
}

export async function deleteVulnerabilityScan(id: number) {
  await api.delete("/vulnerabilities/" + id);
}

export async function createCampaign(data: any) {
  return (
    await api.post<Campaign>("/security-campaigns", data)
  ).data;
}

export async function listCampaigns() {
  return (
    await api.get<{
      total: number;
      campaigns: Campaign[];
    }>("/security-campaigns")
  ).data;
}

export async function startCampaign(id: number) {
  return (
    await api.post<Campaign>(
      "/security-campaigns/" + id + "/start"
    )
  ).data;
}

export async function completeCampaign(id: number) {
  return (
    await api.post<Campaign>(
      "/security-campaigns/" + id + "/complete"
    )
  ).data;
}

export async function deleteCampaign(id: number) {
  await api.delete("/security-campaigns/" + id);
}

export async function getTraining(id: number) {
  return (
    await api.get<{ lessons: string[] }>(
      "/security-campaigns/" + id + "/training"
    )
  ).data;
}

export interface ThreatCampaign {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  weekly_change_pct: number;
  threat_vector: string;
  target_audience: string;
  summary: string;
  modus_operandi: string;
  red_flags: string[];
  containment_action: string;
  source: string;
  last_updated: string;
}

export interface ThreatPulseResponse {
  status: string;
  national_threat_level: string;
  updated_at: string;
  telemetry: {
    total_threats_analyzed: number;
    critical_threat_ratio_pct: number;
    active_campaign_count: number;
    emergency_helpline: string;
    official_portal: string;
  };
  campaigns: ThreatCampaign[];
  threat_categories: Array<{
    category: string;
    share_pct: number;
    trend: string;
    severity: string;
  }>;
  advisory_sources: Array<{
    name: string;
    agency: string;
    verified: boolean;
  }>;
}

export async function getThreatPulseTrends() {
  return (await api.get<ThreatPulseResponse>("/threat-pulse/trends")).data;
}

