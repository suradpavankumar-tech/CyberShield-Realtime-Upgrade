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
    <div className="group rounded-2xl border border-white/10 bg-[#0a1220] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#0c1525]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

export default DashboardStatCard;