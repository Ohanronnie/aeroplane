import { SkeletonBlock } from "../../components/ui/skeleton";

function ServicePanelSkeleton() {
  return (
    <div className="space-y-4">
      <section className="border border-white/10 bg-black">
        <div className="flex flex-col gap-5 border-b border-white/10 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3">
              <SkeletonBlock className="h-10 w-10 shrink-0 border border-white/10" />
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-6 w-48 max-w-full" />
                <SkeletonBlock className="mt-2 h-3 w-64 max-w-full" />
              </div>
            </div>
          </div>
          <SkeletonBlock className="h-9 w-24" />
        </div>
        <div className="grid gap-5 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="mt-3 h-4 w-28" />
              <SkeletonBlock className="mt-2 h-3 w-24" />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="border border-white/10 bg-black p-4"
          >
            <div className="mb-4 flex items-center gap-2">
              <SkeletonBlock className="h-4 w-4" />
              <SkeletonBlock className="h-3 w-36" />
            </div>
            <div className="space-y-3">
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-4/5" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export function ServicePageSkeleton() {
  const tabs = ["w-28", "w-32", "w-20", "w-28", "w-24", "w-24"];

  return (
    <main className="h-dvh overflow-hidden bg-black text-zinc-100">
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)] lg:grid-rows-1">
        <aside className="hidden border-r border-white/10 bg-black px-5 py-6 lg:block">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 border border-white/10" />
            <div>
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="mt-2 h-2 w-20" />
            </div>
          </div>
        </aside>

        <div
          role="status"
          aria-label="Loading service"
          className="mx-auto flex h-full w-full max-w-[1680px] flex-col px-5 py-6 sm:px-8 lg:px-10"
        >
        <span className="sr-only">Loading service</span>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <SkeletonBlock className="h-9 w-9 border border-white/10" />
            <SkeletonBlock className="h-9 w-52 max-w-full border border-white/10" />
          </div>
        </div>
        <div className="flex gap-3 overflow-hidden border-b border-white/10">
          {tabs.map((width, index) => (
            <SkeletonBlock
              key={index}
              className={`h-10 ${width}`}
            />
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pt-5">
          <ServicePanelSkeleton />
        </div>
        </div>
      </div>
    </main>
  );
}
