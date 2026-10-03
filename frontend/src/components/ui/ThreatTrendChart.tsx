import type { TrendPoint } from "../../types/dashboard";

interface ThreatTrendChartProps {
  trends: TrendPoint[];
}

function ThreatTrendChart({
  trends,
}: ThreatTrendChartProps) {
  const maxValue = Math.max(
    1,
    ...trends.map((item) => item.total_scans),
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Threat activity
        </p>

        <h2 className="mt-1 text-lg font-semibold text-white">
          7-day investigation trend
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Daily scan volume and classified risk levels
        </p>
      </div>

      <div className="mt-8 overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex h-56 gap-3">
            <div className="flex w-8 flex-col justify-between pb-6 text-right text-[9px] text-slate-600">
              <span>{maxValue}</span>
              <span>{Math.round(maxValue / 2)}</span>
              <span>0</span>
            </div>

            <div className="relative flex flex-1 items-end gap-3 border-b border-white/10 pb-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
                <span className="border-t border-dashed border-white/[0.05]" />
                <span className="border-t border-dashed border-white/[0.05]" />
                <span className="border-t border-dashed border-white/[0.05]" />
              </div>

              {trends.map((item) => {
                const height =
                  item.total_scans === 0
                    ? 2
                    : Math.max(
                        4,
                        (item.total_scans / maxValue) * 100,
                      );

                return (
                  <div
                    key={item.date}
                    className="relative z-10 flex h-full flex-1 items-end justify-center"
                  >
                    <div className="flex w-full max-w-12 flex-col items-center gap-2">
                      <span className="text-[9px] font-semibold text-slate-500">
                        {item.total_scans}
                      </span>

                      <div
                        className="w-full overflow-hidden rounded-t-lg bg-cyan-400/20"
                        style={{
                          height: `${height}%`,
                        }}
                        title={`${item.total_scans} scans`}
                      >
                        <div className="flex h-full flex-col justify-end">
                          <div
                            className="bg-red-400/80"
                            style={{
                              height:
                                item.total_scans > 0
                                  ? `${(item.high_risk / item.total_scans) * 100}%`
                                  : "0%",
                            }}
                          />

                          <div
                            className="bg-amber-400/80"
                            style={{
                              height:
                                item.total_scans > 0
                                  ? `${(item.medium_risk / item.total_scans) * 100}%`
                                  : "0%",
                            }}
                          />

                          <div
                            className="bg-emerald-400/80"
                            style={{
                              height:
                                item.total_scans > 0
                                  ? `${(item.low_risk / item.total_scans) * 100}%`
                                  : "0%",
                            }}
                          />
                        </div>
                      </div>

                      <span className="absolute -bottom-5 text-[9px] text-slate-600">
                        {new Date(
                          `${item.date}T00:00:00`,
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-[10px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              High risk
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Medium risk
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Low risk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThreatTrendChart;