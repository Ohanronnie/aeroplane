import { Settings01Icon } from "@hugeicons/core-free-icons";
import { Link, useLocation } from "@tanstack/react-router";
import { AppIcon } from "../ui/primitives";

function shouldHideSettingsButton(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/settings")
  );
}

export function GlobalSystemSettings() {
  const location = useLocation();
  if (shouldHideSettingsButton(location.pathname)) return null;

  return (
    <Link
      to="/settings/$settingsPage"
      params={{ settingsPage: "domains" }}
      className="fixed right-5 top-5 z-40 inline-flex h-10 w-10 items-center justify-center border border-white/15 bg-black text-zinc-400 transition-colors hover:border-white/35 hover:bg-zinc-900 hover:text-white"
      title="System settings"
      aria-label="System settings"
    >
      <AppIcon icon={Settings01Icon} size={16} />
    </Link>
  );
}
