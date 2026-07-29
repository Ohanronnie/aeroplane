import { BrandMark } from "../components/ui/brand-mark";
import { LoginForm } from "../components/auth/login-form";
import { usePageTitle } from "../lib/page-title";

export function LoginPage() {
  usePageTitle("Login");

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="hero-noise pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.07),transparent_28%)]"
      />

      <div className="relative z-10 grid min-h-dvh w-full lg:grid-cols-[minmax(0,1.12fr)_minmax(480px,0.88fr)]">
        <section className="relative flex min-h-[420px] flex-col overflow-hidden border-b border-white/10 px-6 py-6 sm:px-10 lg:min-h-dvh lg:border-b-0 lg:border-r lg:px-16 lg:pb-14 lg:pt-8">
          <div className="relative z-10 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10">
              <BrandMark className="h-[18px] w-[18px] brightness-0 invert" />
            </span>
            <div>
              <div className="font-hero text-sm tracking-[-0.02em] text-white">
                aeroplane
              </div>
              <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.25em] text-zinc-500">
                Control plane
              </div>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-44 -left-40 h-[680px] w-[680px] opacity-90"
          >
            <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
            <div className="absolute inset-[90px] rounded-full border border-white/[0.08]" />
            <div className="absolute inset-[180px] rounded-full border border-white/10" />
            <div className="absolute inset-[265px] grid place-items-center rounded-full border border-white/20 bg-white/[0.04]">
              <BrandMark className="h-8 w-8 rotate-[-18deg] brightness-0 invert opacity-80" />
            </div>
            <div className="absolute right-[73px] top-[305px] h-2 w-2 rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,0.65)]" />
            <div className="absolute left-[210px] top-[182px] h-1.5 w-1.5 rounded-full bg-white/60" />
            <div className="absolute left-[246px] top-[285px] h-28 w-px rotate-[44deg] bg-gradient-to-b from-transparent via-white/40 to-transparent" />
          </div>

          <div className="relative z-10 mt-auto max-w-xs">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Private deployment platform
            </p>
            <div className="mt-3 h-px w-16 bg-white/20" />
          </div>
        </section>

        <section className="flex items-center justify-start bg-zinc-950 px-5 py-10 sm:px-10 lg:min-h-dvh lg:px-8">
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
