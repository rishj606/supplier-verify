import type { Recommendation } from "@/lib/types";

interface TrustScoreProps {
  score: number;
  recommendation: Recommendation;
}

const config: Record<
  Recommendation,
  { bg: string; text: string; badge: string; label: string }
> = {
  approve: {
    bg: "bg-green-50 border-green-200",
    text: "text-green-700",
    badge: "bg-green-100 text-green-800",
    label: "Recommended",
  },
  caution: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800",
    label: "Use Caution",
  },
  reject: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800",
    label: "Do Not Proceed",
  },
};

export default function TrustScore({ score, recommendation }: TrustScoreProps) {
  const c = config[recommendation];

  return (
    <div className={`flex items-center gap-5 p-5 rounded-xl border ${c.bg}`}>
      <div className="text-center min-w-[72px]">
        <div className={`text-5xl font-bold tabular-nums ${c.text}`}>
          {score}
        </div>
        <div className="text-xs text-gray-400 mt-1">/ 100</div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span
          className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold w-fit ${c.badge}`}
        >
          {c.label}
        </span>
        <p className="text-xs text-gray-500">AI-generated vendor trust score</p>
      </div>
    </div>
  );
}
