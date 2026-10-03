import api from "./api";
export interface EmailHeaderResult{scan_id:number;status:string;risk_score:number|null;risk_level:string|null;confidence:number|null;threat_category:string|null;headers:Record<string,string|string[]>;authentication:Record<string,string|null>;findings:any[];evidence:Record<string,unknown>;recommendations:string[];created_at:string;completed_at:string|null}
export interface MobileResult{scan_id:number;filename:string;package_name:string|null;status:string;risk_score:number|null;risk_level:string|null;confidence:number|null;permissions:string[];findings:any[];recommendations:string[];evidence:Record<string,unknown>;created_at:string;completed_at:string|null}
export interface VulnerabilityResult{scan_id:number;target:string;port_spec:string;status:string;risk_score:number|null;risk_level:string|null;confidence:number|null;findings:any[];services:any[];evidence:Record<string,unknown>;recommendations:string[];error_message:string|null;created_at:string;completed_at:string|null}
export interface Campaign{campaign_id:number;name:string;description:string|null;template_name:string;training_topic:string;status:string;created_at:string;started_at:string|null;completed_at:string|null;metrics:any}
export async function analyzeEmailHeaders(raw_headers:string){return(await api.post<EmailHeaderResult>("/email-headers",{raw_headers})).data}
export async function uploadMobileApk(file:File){const f=new FormData();f.append("file",file);return(await api.post<MobileResult>("/mobile",f,{headers:{"Content-Type":"multipart/form-data"}})).data}
export async function startVulnerabilityScan(data:any){return(await api.post<VulnerabilityResult>("/vulnerabilities",data)).data}
export async function createCampaign(data:any){return(await api.post<Campaign>("/security-campaigns",data)).data}
export async function listCampaigns(){return(await api.get<{total:number;campaigns:Campaign[]}>("/security-campaigns")).data}
export async function startCampaign(id:number){return(await api.post<Campaign>("/security-campaigns/"+id+"/start")).data}
export async function completeCampaign(id:number){return(await api.post<Campaign>("/security-campaigns/"+id+"/complete")).data}
export async function getTraining(id:number){return(await api.get<{lessons:string[]}>("/security-campaigns/"+id+"/training")).data}
