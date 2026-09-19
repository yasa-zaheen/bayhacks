type Props = {
  kicker: string;
  caption: string;
};

export function DemoCoachBanner({ kicker, caption }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 bg-linear-to-b from-black/70 to-transparent px-5 pt-5 pb-12 text-white">
      <p className="text-[11px] font-semibold tracking-[0.28em] uppercase">
        {kicker}
      </p>
      <p className="mt-2 max-w-xl text-base font-medium leading-6">{caption}</p>
    </div>
  );
}
