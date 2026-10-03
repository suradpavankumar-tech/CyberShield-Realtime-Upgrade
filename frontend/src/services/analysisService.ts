import api from "./api";

import type {
  AnalysisRequest,
  AnalysisResponse,
  InputType,
  ScanListParams,
  ScanListResponse,
} from "../types/analysis";

export async function analyzeInput(
  payload: AnalysisRequest,
): Promise<AnalysisResponse> {
  const response = await api.post<AnalysisResponse>(
    "/analysis",
    payload,
  );

  return response.data;
}

export async function analyzeUrl(
  content: string,
): Promise<AnalysisResponse> {
  const response = await api.post<AnalysisResponse>(
    "/analysis/url",
    {
      input_type: "URL",
      content,
    },
  );

  return response.data;
}

export async function analyzeMessage(
  content: string,
): Promise<AnalysisResponse> {
  const response = await api.post<AnalysisResponse>(
    "/analysis/message",
    {
      input_type: "MESSAGE",
      content,
    },
  );

  return response.data;
}

export async function analyzeEmail(
  content: string,
): Promise<AnalysisResponse> {
  const response = await api.post<AnalysisResponse>(
    "/analysis/email",
    {
      input_type: "EMAIL",
      content,
    },
  );

  return response.data;
}

export async function analyze(
  inputType: InputType,
  content: string,
): Promise<AnalysisResponse> {
  switch (inputType) {
    case "URL":
      return analyzeUrl(content);

    case "MESSAGE":
      return analyzeMessage(content);

    case "EMAIL":
      return analyzeEmail(content);

    default:
      throw new Error("Unsupported analysis type.");
  }
}

export async function getScan(
  scanId: number,
): Promise<AnalysisResponse> {
  const response = await api.get<AnalysisResponse>(
    `/analysis/${scanId}`,
  );

  return response.data;
}

export async function getScans(
  params?: ScanListParams,
): Promise<ScanListResponse> {
  const response = await api.get<ScanListResponse>(
    "/analysis",
    {
      params,
    },
  );

  return response.data;
}

export async function deleteScan(
  scanId: number,
): Promise<void> {
  await api.delete(`/analysis/${scanId}`);
}