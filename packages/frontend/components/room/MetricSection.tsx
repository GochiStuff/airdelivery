import { ArrowDown, ArrowUp, Gauge } from "lucide-react";

export function MetricsSection({ meta }: { meta: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4  p-4 sm:p-6 rounded-3xl">
      <MetricCard
        label="Total Sent"
        value={`${(meta.totalSent / 1e9).toFixed(2)} GB`}
        icon={<ArrowUp className="w-4 h-4 " />}
        iconBg="bg-blue-400"
        cardBg="bg-white"
      />
      <MetricCard
        label="Total Received"
        value={`${(meta.totalReceived / 1e9).toFixed(2)} GB`}
        icon={<ArrowDown className="w-4 h-4 " />}
        iconBg="bg-green-400"
        cardBg="bg-white"
      />
      <MetricCard
        label="Current Speed"
        value={
          meta.speedBps >= 1048576
            ? `${(meta.speedBps / 1048576).toFixed(2)} MB/s`
            : `${(meta.speedBps / 1024).toFixed(2)} KB/s`
        }
        icon={<Gauge className="w-4 h-4 " />}
        iconBg="bg-yellow-400"
        cardBg="bg-white"
        
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  iconBg,
  cardBg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  cardBg: string;
}) {
  return (
    <div
      className={`rounded-2xl p-4 flex flex-col justify-between shadow border border-zinc-200 ${cardBg}`}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-sm text-zinc-700 font-medium">{label}</span>
        <div className={`p-2 rounded-full ${iconBg}`}>{icon}</div>
      </div>
      <span className="text-xl sm:text-2xl text-nowrap  font-semibold  text-zinc-900">{value}</span>
    </div>
  );
}
