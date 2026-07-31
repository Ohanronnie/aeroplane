import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStatus } from "../../components/auth/auth-context";
import { usePageTitle } from "../../lib/page-title";

export function SettingsIndexPage() {
  const navigate = useNavigate();
  const authStatus = useAuthStatus();
  usePageTitle("Settings");

  useEffect(() => {
    void navigate({
      to: "/settings/$settingsPage",
      params: {
        settingsPage: authStatus?.user?.role === "owner" ? "domains" : "ai"
      },
      replace: true
    });
  }, [authStatus?.user?.role, navigate]);

  return (
    <main className="grid min-h-dvh place-items-center bg-black text-white">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        Loading settings
      </div>
    </main>
  );
}
