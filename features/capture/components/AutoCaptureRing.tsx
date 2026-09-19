"use client";

type Props = {
  progress: number;
  stable: boolean;
  ready: boolean;
  analyzing: boolean;
  mobile?: boolean;
};

export function AutoCaptureRing({
  progress,
  stable,
  ready,
  analyzing,
  mobile = false,
}: Props) {
  const size = mobile ? 104 : 96;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);
  const accent = ready ? "#007d48" : stable ? "#1151ff" : "#e85d04";
  const pct = Math.round(clamped * 100);

  return (
    <div
      className={
        mobile
          ? "pointer-events-none absolute inset-x-0 bottom-28 z-10 flex justify-center lg:bottom-auto lg:inset-x-auto lg:right-4 lg:top-1/2 lg:-translate-y-1/2"
          : "pointer-events-none absolute top-1/2 right-4 z-10 -translate-y-1/2"
      }
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="rgba(0,0,0,0.42)"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 280ms ease-out, stroke 240ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase sm:text-[11px]">
            {analyzing ? "QC" : ready ? "Lock" : "Hold"}
          </p>
          <p className="font-mono text-xl font-semibold leading-none sm:text-2xl">{pct}</p>
        </div>
      </div>
    </div>
  );
}
