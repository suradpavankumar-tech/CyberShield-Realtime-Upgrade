import type { LucideIcon } from "lucide-react";

interface DashboardStatCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
}

function DashboardStatCard({
  label,
  value,
  description,
  icon: Icon,
  iconClassName = "text-cyan-400 bg-cyan-400/10",
}: DashboardStatCardProps) {
  return (
    <div className="cyber-card cyber-corner-bracket group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/35 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]">
      {/* Ambient hover light gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/[0.06] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80 cyber-beacon-cyan" />
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 group-hover:text-cyan-300 transition-colors">
              {label}
            </p>
          </div>

          <p className="mt-3 font-mono text-3xl font-black tracking-tight text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.15)]">
            {value}
          </p>

          <p className="mt-2 text-xs font-medium text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/10 transition-all duration-300 group-hover:scale-110 group-hover:ring-cyan-500/40 group-hover:shadow-[0_0_12px_rgba(0,240,255,0.25)] ${iconClassName}`}
        >
          <Icon size={20} />
        </div>
      </div>

      {/* Micro telemetry footer line */}
      <div className="relative z-10 mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-2 font-mono text-[9px] text-slate-500">
        <span className="tracking-wider">FEED: REALTIME</span>
        <span className="text-cyan-500/70">SEC // 0X</span>
      </div>
    </div>
  );
}

export default DashboardStatCard;