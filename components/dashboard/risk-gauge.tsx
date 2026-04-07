"use client";

type RiskGaugeProps = {
  score: number;
  size?: number;
};

function getColor(score: number) {
  if (score <= 20) return "#EF4444";
  if (score <= 35) return "#F97316";
  if (score <= 50) return "#EAB308";
  if (score <= 65) return "#A3E635";
  if (score <= 80) return "#22C55E";
  return "#10B981";
}

function getLabel(score: number) {
  if (score <= 20) return "Risc Extrem";
  if (score <= 35) return "Risc Ridicat";
  if (score <= 50) return "Risc Moderat";
  if (score <= 65) return "Neutru";
  if (score <= 80) return "Favorabil";
  return "Foarte Favorabil";
}

export function RiskGauge({ score, size = 220 }: RiskGaugeProps) {
  const color = getColor(score);
  const label = getLabel(score);
  const radius = (size - 24) / 2;
  const circumference = Math.PI * radius; // half circle
  const progress = (score / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center">
      <svg height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`} width={size}>
        {/* Background arc */}
        <path
          d={`M 12 ${size * 0.55} A ${radius} ${radius} 0 0 1 ${size - 12} ${size * 0.55}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeLinecap="round"
          strokeWidth={12}
        />
        {/* Progress arc */}
        <path
          d={`M 12 ${size * 0.55} A ${radius} ${radius} 0 0 1 ${size - 12} ${size * 0.55}`}
          fill="none"
          stroke={color}
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          strokeWidth={12}
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`,
            transition: "stroke-dasharray 1s ease-out",
          }}
        />
        {/* Score number */}
        <text
          dominantBaseline="central"
          fill="white"
          fontFamily="var(--font-orbitron), monospace"
          fontSize={size * 0.22}
          fontWeight="bold"
          textAnchor="middle"
          x={center}
          y={size * 0.35}
        >
          {score}
        </text>
        {/* Label */}
        <text
          dominantBaseline="central"
          fill={color}
          fontSize={size * 0.06}
          fontWeight="600"
          textAnchor="middle"
          x={center}
          y={size * 0.5}
        >
          {label}
        </text>
      </svg>
      {/* Scale labels */}
      <div className="flex w-full justify-between px-2 text-xs text-slate-600" style={{ maxWidth: size }}>
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
}
