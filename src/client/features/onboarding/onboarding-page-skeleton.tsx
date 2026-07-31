import { BrandMark } from "../../components/ui/brand-mark";
import { SkeletonBlock } from "../../components/ui/skeleton";

export function OnboardingPageSkeleton() {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="hero-noise pointer-events-none absolute inset-0"
      />
      <div
        role="status"
        aria-label="Loading onboarding"
        className="relative z-10 grid min-h-dvh lg:grid-cols-[minmax(0,1.12fr)_minmax(480px,0.88fr)]"
      >
        <span className="sr-only">Loading onboarding</span>
        <section className="flex min-h-[560px] flex-col px-6 py-6 sm:px-10 lg:px-16 lg:py-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10">
              <BrandMark className="h-[18px] w-[18px] brightness-0 invert" />
            </span>
            <div>
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="mt-2 h-2 w-20" />
            </div>
          </div>

          <div className="mt-24 w-full max-w-xs">
            <div className="mb-7 flex items-center justify-between">
              <SkeletonBlock className="h-2.5 w-28" />
              <SkeletonBlock className="h-2.5 w-12" />
            </div>
            <div className="grid gap-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4">
                  <SkeletonBlock className="h-7 w-7 rounded-full" />
                  <SkeletonBlock className="h-2.5 w-28" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-zinc-950 px-5 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-8">
          <div className="w-full max-w-[520px]">
            <SkeletonBlock className="h-10 w-10 rounded-full" />
            <SkeletonBlock className="mt-5 h-2.5 w-28" />
            <SkeletonBlock className="mt-3 h-8 w-80 max-w-full" />
            <SkeletonBlock className="mt-7 h-4 w-full" />
            <SkeletonBlock className="mt-2 h-4 w-4/5" />
            <div className="mt-8 grid gap-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>
                  <SkeletonBlock className="h-2.5 w-24" />
                  <SkeletonBlock className="mt-2 h-12 w-full border border-white/10" />
                </div>
              ))}
            </div>
            <SkeletonBlock className="mt-8 h-14 w-full" />
          </div>
        </section>
      </div>
    </main>
  );
}
