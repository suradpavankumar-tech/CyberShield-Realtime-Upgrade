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

/* ==================================================
   IDENTITYSHIELD INTERFACES & API
================================================== */
export interface BreachRecord {
  id: string;
  title: string;
  breach_date: string;
  pwn_count: number;
  description: string;
  data_classes: string[];
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  is_verified: boolean;
  source: string;
}

export interface EmailBreachResponse {
  email: string;
  is_compromised: boolean;
  breach_count: number;
  risk_score: number;
  risk_level: string;
  data_classes_exposed: string[];
  breaches: BreachRecord[];
  recommendations: string[];
  checked_at: string;
}

export interface PwnedPasswordPrefixResponse {
  prefix: string;
  count: number;
  suffixes: Array<{
    hash_suffix: string;
    count: number;
  }>;
}

export async function checkEmailBreach(email: string) {
  return (
    await api.post<EmailBreachResponse>("/identity/check-email", { email })
  ).data;
}

export async function checkPwnedPasswordPrefix(prefix: string) {
  return (
    await api.get<PwnedPasswordPrefixResponse>(
      "/identity/pwned-password-range/" + prefix
    )
  ).data;
}

/* ==================================================
   THREATGRAPH INTERFACES & API
================================================== */
export interface GraphNode {
  id: string;
  type: "URL" | "DOMAIN" | "IP_ADDRESS" | "SSL_CERTIFICATE" | "TARGET_BRAND" | "CAMPAIGN" | "VULNERABILITY";
  label: string;
  full_name: string;
  risk_level: string;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
}

export interface ThreatGraphResponse {
  target: string;
  scan_id: number | null;
  graph_id: string;
  node_count: number;
  edge_count: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  generated_at: string;
}

export interface RecentGraphTarget {
  scan_id: number;
  target: string;
  risk_level: string;
  risk_score: number;
  threat_category: string | null;
  created_at: string | null;
}

export async function analyzeThreatGraph(target: string) {
  return (
    await api.post<ThreatGraphResponse>("/threat-graph/analyze", { target })
  ).data;
}

export async function getScanThreatGraph(scanId: number) {
  return (
    await api.get<ThreatGraphResponse>("/threat-graph/scan/" + scanId)
  ).data;
}

export async function getRecentGraphTargets() {
  return (
    await api.get<RecentGraphTarget[]>("/threat-graph/recent-targets")
  ).data;
}

/* ==================================================
   REAL-TIME ALERTS & WEBHOOK DISPATCHER
================================================== */
export interface TestAlertRequest {
  channel_type: "generic" | "slack" | "discord" | "telegram";
  webhook_url?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  sample_target?: string;
}

export interface TestAlertResponse {
  id: string;
  delivered: boolean;
  channel_type: string;
  destination: string;
  status_code: number | null;
  latency_ms: number;
  mode: string;
  message: string;
  payload: Record<string, any>;
}

export interface DispatchScanAlertRequest {
  scan_id: number;
  channel_type: "generic" | "slack" | "discord" | "telegram";
  webhook_url?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
}

export interface AlertAuditLogItem {
  id: string;
  timestamp: string;
  channel_type: string;
  destination: string;
  severity: string;
  status: "DELIVERED" | "FAILED";
  status_code: number | null;
  latency_ms: number;
  message: string;
}

export interface AlertAuditLogResponse {
  total: number;
  logs: AlertAuditLogItem[];
}

export async function testAlertChannel(data: TestAlertRequest) {
  return (await api.post<TestAlertResponse>("/alerts/test", data)).data;
}

export async function dispatchScanAlert(data: DispatchScanAlertRequest) {
  return (await api.post<any>("/alerts/dispatch-scan", data)).data;
}

export async function getRecentAlertLogs() {
  return (await api.get<AlertAuditLogResponse>("/alerts/recent")).data;
}

export async function getAlertTemplates() {
  return (await api.get<Record<string, any>>("/alerts/templates")).data;
}


