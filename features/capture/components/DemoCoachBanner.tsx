type Props = {
  kicker: string;
  caption: string;
  compact?: boolean;
};

export function DemoCoachBanner({ kicker, caption, compact = false }: Props) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 bg-linear-to-b from-black/70 to-transparent text-white ${
        compact
          ? "px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-8"
          : "px-5 pt-5 pb-12"
      }`}
    >
      <p className="text-[11px] font-semibold tracking-[0.28em] uppercase">
        {kicker}
      </p>
      <p
        className={`mt-2 max-w-xl font-medium leading-6 ${
          compact ? "text-sm line-clamp-3" : "text-base"
        }`}
      >
        {caption}
      </p>
    </div>
  );
}
