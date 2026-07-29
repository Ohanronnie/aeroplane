import {
  ArrowLeft01Icon,
  Refresh03Icon
} from "@hugeicons/core-free-icons";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import type { AuthUser } from "../../api";
import { useAuthStatus } from "../../components/auth/auth-context";
import { SignOutButton } from "../../components/auth/sign-out-button";
import { BrandMark } from "../../components/ui/brand-mark";
import { AppIcon } from "../../components/ui/primitives";
import { usePageTitle } from "../../lib/page-title";
import { SettingsPanelContent } from "./settings-panel-content";
import {
  settingsPageForSlug,
  settingsPages,
  type SettingsPageSlug
} from "./settings-pages";

function userInitials(user: AuthUser | null) {
  const source = user?.name || user?.email || "A";
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SettingsPage({ requestedPage }: { requestedPage: SettingsPageSlug }) {
  const navigate = useNavigate();
  const authStatus = useAuthStatus();
  const currentUser = authStatus?.user ?? null;
  const requestedDefinition = settingsPageForSlug(requestedPage);
  const owner = currentUser?.role === "owner";
  const availablePages = useMemo(
    () => settingsPages.filter((page) => owner || !page.ownerOnly),
    [owner]
  );
  const activePage =
    !owner && requestedDefinition.ownerOnly
      ? settingsPageForSlug("ai")
      : requestedDefinition;

  usePageTitle([activePage.label, "Settings"]);

  useEffect(() => {
    if (owner || !requestedDefinition.ownerOnly) return;
    void navigate({
      to: "/settings/$settingsPage",
      params: { settingsPage: "ai" },
      replace: true
    });
  }, [navigate, owner, requestedDefinition.ownerOnly]);

  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="grid min-h-dvh lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="relative z-20 flex border-b border-white/10 bg-black lg:sticky lg:top-0 lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r">
          <div className="flex w-full flex-col px-5 py-5 lg:h-full lg:px-5 lg:py-6">
            <div className="flex items-center justify-between gap-4 lg:block">
              <Link to="/" className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center border border-white/20 bg-white/10">
                  <BrandMark className="h-[18px] w-[18px] brightness-0 invert" />
                </span>
                <span>
                  <span className="block font-hero text-sm tracking-[-0.02em] text-white">
                    aeroplane
                  </span>
                  <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.25em] text-zinc-500">
                    Settings
                  </span>
                </span>
              </Link>

              <Link
                to="/"
                className="inline-flex h-10 items-center gap-2 border border-white/10 px-3 text-xs text-zinc-400 transition hover:border-white/25 hover:bg-white/5 hover:text-white lg:mt-8 lg:w-full"
              >
                <AppIcon icon={ArrowLeft01Icon} size={15} />
                Back to projects
              </Link>
            </div>

            <nav
              aria-label="Settings"
              className="mt-5 flex gap-1 overflow-x-auto pb-1 lg:mt-7 lg:block lg:overflow-visible lg:pb-0"
            >
              {availablePages.map((page) => {
                const active = activePage.slug === page.slug;
                return (
                  <Link
                    key={page.slug}
                    to="/settings/$settingsPage"
                    params={{ settingsPage: page.slug }}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "flex h-11 shrink-0 items-center gap-3 border-l-2 border-white bg-white/10 px-3 text-sm text-white"
                        : "flex h-11 shrink-0 items-center gap-3 border-l-2 border-transparent px-3 text-sm text-zinc-500 transition hover:bg-white/5 hover:text-white"
                    }
                  >
                    <AppIcon icon={page.icon} size={16} />
                    {page.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-5 hidden border-t border-white/10 pt-5 lg:mt-auto lg:block">
              {owner ? (
                <Link
                  to="/onboarding"
                  className="flex h-11 w-full items-center gap-3 px-3 text-sm text-zinc-500 transition hover:bg-white/5 hover:text-white"
                >
                  <AppIcon icon={Refresh03Icon} size={16} />
                  Restart onboarding
                </Link>
              ) : null}
            </div>

            <div className="mt-4 hidden items-center gap-3 border-t border-white/10 pt-4 lg:flex">
              <span className="grid h-9 w-9 flex-none place-items-center bg-white text-xs text-black">
                {userInitials(currentUser)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs text-white">
                  {currentUser?.name || "Aeroplane user"}
                </span>
                <span className="mt-0.5 block truncate font-mono text-[8px] uppercase tracking-[0.14em] text-zinc-600">
                  {currentUser?.role || "Member"}
                </span>
              </span>
              <SignOutButton className="bg-transparent hover:border-white/25 hover:bg-white/5 hover:text-white" />
            </div>
          </div>
        </aside>

        <section className="min-w-0 bg-zinc-950">
          <header className="border-b border-white/10 px-5 py-6 sm:px-8 lg:px-10">
            <h1 className="text-3xl font-normal tracking-[-0.04em] text-white sm:text-4xl">
              {activePage.label}
            </h1>
          </header>

          <div className="settings-page-content mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
            <SettingsPanelContent activeTab={activePage.tab} owner={owner} />
          </div>
        </section>
      </div>
    </main>
  );
}
