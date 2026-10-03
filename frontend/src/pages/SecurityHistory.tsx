import {useEffect,useState} from "react";
import {History,RefreshCw,Trash2,MailCheck,Smartphone,Radar,GraduationCap} from "lucide-react";
import {
  listEmailHeaders,listMobileScans,listVulnerabilityScans,listCampaigns,
  deleteEmailHeader,deleteMobileScan,deleteVulnerabilityScan,deleteCampaign,
  type EmailHeaderSummary,type MobileSummary,type VulnerabilitySummary,type Campaign
} from "../services/securityModules";

type Tab="EMAIL"|"MOBILE"|"VULNERABILITY"|"AWARENESS";

function riskClass(level:string|null){return level==="HIGH"||level==="CRITICAL"?"text-red-300":level==="MEDIUM"?"text-amber-300":"text-emerald-300"}
function date(v:string|null){return v?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v)):"—"}

export default function SecurityHistory(){
 const[tab,setTab]=useState<Tab>("EMAIL"); const[loading,setLoading]=useState(true); const[refreshing,setRefreshing]=useState(false);
 const[email,setEmail]=useState<EmailHeaderSummary[]>([]); const[mobile,setMobile]=useState<MobileSummary[]>([]);
 const[vuln,setVuln]=useState<VulnerabilitySummary[]>([]); const[campaigns,setCampaigns]=useState<Campaign[]>([]);
 async function load(refresh=false){try{refresh?setRefreshing(true):setLoading(true);const[a,b,c,d]=await Promise.all([listEmailHeaders(),listMobileScans(),listVulnerabilityScans(),listCampaigns()]);setEmail(a.scans);setMobile(b.scans);setVuln(c.scans);setCampaigns(d.campaigns)}finally{setLoading(false);setRefreshing(false)}}
 useEffect(()=>{void load()},[]);
 async function remove(kind:Tab,id:number){if(!window.confirm("Delete this security record?"))return; if(kind==="EMAIL")await deleteEmailHeader(id);if(kind==="MOBILE")await deleteMobileScan(id);if(kind==="VULNERABILITY")await deleteVulnerabilityScan(id);if(kind==="AWARENESS")await deleteCampaign(id);await load(true)}
 const tabs:[Tab,string,any][]=[["EMAIL","Email headers",MailCheck],["MOBILE","Mobile APKs",Smartphone],["VULNERABILITY","Vulnerability",Radar],["AWARENESS","Awareness",GraduationCap]];
 if(loading)return <section className="p-5 sm:p-6"><div className="mx-auto flex min-h-[600px] max-w-[1400px] items-center justify-center text-sm text-slate-500">Loading security module history…</div></section>;
 return <section className="p-5 sm:p-6"><div className="mx-auto max-w-[1400px]">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-cyan-400"><History size={15}/>Security module history</div><h1 className="mt-2 text-3xl font-bold text-white">Security activity</h1><p className="mt-2 text-sm text-slate-500">Review real records produced by the expanded CyberShield security modules.</p></div><button onClick={()=>void load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-4 py-2.5 text-xs font-semibold text-slate-300"><RefreshCw size={14} className={refreshing?"animate-spin":""}/>Refresh</button></div>
  <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#0a1220] p-2 sm:grid-cols-4">{tabs.map(([key,label,Icon])=><button key={key} onClick={()=>setTab(key)} className={["flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-semibold",tab===key?"bg-cyan-400/10 text-cyan-300":"text-slate-500 hover:text-white"].join(" ")}><Icon size={15}/>{label}</button>)}</div>
  <div className="mt-4 rounded-2xl border border-white/10 bg-[#0a1220]">
   {tab==="EMAIL"&&email.map(x=><div key={x.scan_id} className="flex items-center gap-4 border-b border-white/[.06] p-4 last:border-0"><MailCheck size={18} className="text-cyan-400"/><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white">Header scan #{x.scan_id}</p><p className="text-[10px] text-slate-600">{date(x.created_at)} • {x.threat_category||"Unclassified"}</p></div><span className={`text-xs font-bold ${riskClass(x.risk_level)}`}>{x.risk_level||"—"} {x.risk_score??"—"}</span><button onClick={()=>void remove("EMAIL",x.scan_id)} className="text-slate-600 hover:text-red-300"><Trash2 size={15}/></button></div>)}
   {tab==="MOBILE"&&mobile.map(x=><div key={x.scan_id} className="flex items-center gap-4 border-b border-white/[.06] p-4 last:border-0"><Smartphone size={18} className="text-cyan-400"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{x.filename}</p><p className="text-[10px] text-slate-600">{x.package_name||"Package unavailable"} • {date(x.created_at)}</p></div><span className={`text-xs font-bold ${riskClass(x.risk_level)}`}>{x.risk_level||"—"} {x.risk_score??"—"}</span><button onClick={()=>void remove("MOBILE",x.scan_id)} className="text-slate-600 hover:text-red-300"><Trash2 size={15}/></button></div>)}
   {tab==="VULNERABILITY"&&vuln.map(x=><div key={x.scan_id} className="flex items-center gap-4 border-b border-white/[.06] p-4 last:border-0"><Radar size={18} className="text-cyan-400"/><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white">{x.target}</p><p className="text-[10px] text-slate-600">{x.port_spec} • {x.status} • {date(x.created_at)}</p></div><span className={`text-xs font-bold ${riskClass(x.risk_level)}`}>{x.risk_level||"—"} {x.risk_score??"—"}</span><button onClick={()=>void remove("VULNERABILITY",x.scan_id)} className="text-slate-600 hover:text-red-300"><Trash2 size={15}/></button></div>)}
   {tab==="AWARENESS"&&campaigns.map(x=><div key={x.campaign_id} className="flex items-center gap-4 border-b border-white/[.06] p-4 last:border-0"><GraduationCap size={18} className="text-cyan-400"/><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white">{x.name}</p><p className="text-[10px] text-slate-600">{x.training_topic} • {x.status} • {date(x.created_at)}</p></div><span className="text-xs font-semibold text-slate-300">{x.metrics?.recipients??0} recipients</span><button onClick={()=>void remove("AWARENESS",x.campaign_id)} className="text-slate-600 hover:text-red-300"><Trash2 size={15}/></button></div>)}
   {((tab==="EMAIL"&&email.length===0)||(tab==="MOBILE"&&mobile.length===0)||(tab==="VULNERABILITY"&&vuln.length===0)||(tab==="AWARENESS"&&campaigns.length===0))&&<div className="p-12 text-center text-sm text-slate-600">No records in this module yet.</div>}
  </div>
 </div></section>
}
