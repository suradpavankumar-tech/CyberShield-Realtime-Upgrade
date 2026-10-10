import { ShieldAlert } from "lucide-react";
import type { RiskDistribution } from "../../types/dashboard";
import type { ReactNode } from "react";
interface RiskDistributionChartProps {
  distribution: RiskDistribution;
}

function RiskDistributionChart({
  distribution,
}: RiskDistributionChartProps) {
  const total =
    distribution.high +
    distribution.medium +
    distribution.low;

  const items = [
    {
      label: "High",
      value: distribution.high,
      className: "bg-red-400",
      textClassName: "text-red-300",
    },
    {
      label: "Medium",
      value: distribution.medium,
      className: "bg-amber-400",
      textClassName: "text-amber-300",
    },
    {
      label: "Low",
      value: distribution.low,
      className: "bg-emerald-400",
      textClassName: "text-emerald-300",
    },
  ];

  return (
    <div className="cyber-card cyber-corner-bracket p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 cyber-beacon-cyan" />
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              // TELEMETRY: RISK PROFILE
            </p>
          </div>

          <h2 className="mt-1 text-lg font-bold text-white tracking-tight">
            Classified Investigations
          </h2>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-400/10 text-red-300 ring-1 ring-red-400/20">
          <ShieldAlert size={18} />
        </div>
      </div>

      <div className="mt-7 flex items-center gap-7">
        <div className="relative h-36 w-36 shrink-0">
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full -rotate-90"
          >
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="10"
            />

            {total > 0 &&
              items.reduce(
                (segments, item) => {
                  const circumference = 2 * Math.PI * 38;
                  const length =
                    (item.value / total) * circumference;

                  const offset = segments.offset;

                  segments.elements.push(
                    <circle
                      key={item.label}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      className={item.className.replace(
                        "bg-",
                        "stroke-",
                      )}
                      strokeWidth="10"
                      strokeDasharray={`${length} ${circumference}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="butt"
                    />,
                  );

                  segments.offset += length;

                  return segments;
                },
                {
                  elements: [] as ReactNode[],
                  offset: 0,
                },
              ).elements}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {total}
            </span>

            <span className="text-[9px] uppercase tracking-wider text-slate-600">
              scored
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          {items.map((item) => {
            const percentage =
              total > 0
                ? Math.round((item.value / total) * 100)
                : 0;

            return (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${item.className}`}
                    />

                    <span className="text-slate-400">
                      {item.label}
                    </span>
                  </div>

                  <span className={`font-semibold ${item.textClassName}`}>
                    {item.value}
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className={`h-full rounded-full ${item.className}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RiskDistributionChart;