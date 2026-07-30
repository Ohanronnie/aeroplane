import { SkeletonBlock, SkeletonText } from "../../components/ui/skeleton";

function ServiceCardSkeleton() {
  return (
    <article className="min-h-52 border border-white/10 bg-black p-4">
      <div className="flex items-start gap-3">
        <SkeletonBlock className="h-10 w-10 shrink-0 border border-white/10" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SkeletonBlock className="h-5 w-32" />
              <SkeletonBlock className="mt-2 h-3 w-44 max-w-full" />
            </div>
            <SkeletonBlock className="h-3 w-16 shrink-0" />
          </div>
        </div>
      </div>

      <SkeletonBlock className="mt-5 h-3 w-44 max-w-full" />
      <SkeletonBlock className="mt-3 h-3 w-32 max-w-full" />
      <div className="mt-8 border-t border-white/10 pt-4">
        <SkeletonBlock className="h-3 w-24" />
      </div>
    </article>
  );
}

export function ProjectPageSkeleton() {
  return (
    <div role="status" aria-label="Loading project" className="contents">
      <span className="sr-only">Loading project</span>
      <section className="border-b border-white/10 pb-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <SkeletonBlock className="h-9 w-9 border border-white/10" />
          <SkeletonBlock className="h-9 w-44 max-w-full border border-white/10" />
        </div>
        <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <SkeletonBlock className="h-10 w-64 max-w-full" />
            <div className="mt-3 max-w-xl">
              <SkeletonText rows={1} widths={["w-72"]} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-10 w-32" />
            <SkeletonBlock className="h-10 w-10 border border-white/10" />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ServiceCardSkeleton key={index} />
        ))}
      </section>
    </div>
  );
}
