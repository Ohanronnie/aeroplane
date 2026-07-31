import { useEffect, useState } from "react";
import { api } from "../../api";
import { isWildcardRootDomain } from "../../lib/root-domain";
import { ControlPlaneDomainInstructions } from "./control-plane-domain-instructions";
import type { OnboardingForm } from "./onboarding-types";
import { RootDomainInstructions } from "./root-domain-instructions";

function DomainField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="none"
        className="h-12 w-full rounded-sm border border-white/15 bg-white/5 px-3.5 font-mono text-xs text-white outline-none transition placeholder:text-zinc-600 hover:border-white/30 focus:border-white focus:bg-white/10 focus:ring-2 focus:ring-white/10"
      />
    </label>
  );
}

export function DomainConfiguration({
  form,
  update,
}: {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
}) {
  const [publicIp, setPublicIp] = useState("");

  useEffect(() => {
    let cancelled = false;
    void api
      .authStatus()
      .then((status) => {
        if (!cancelled) setPublicIp(status.publicIp ?? "");
      })
      .catch(() => {
        if (!cancelled) setPublicIp("");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasDashboardDomain = Boolean(form.controlPlaneHostname.trim());
  const hasRootDomain = Boolean(form.rootDomain.trim());
  const rootDomainValid = isWildcardRootDomain(form.rootDomain);

  return (
    <div className="space-y-7">
      <div className="grid gap-y-5">
        <DomainField
          label="Dashboard domain"
          value={form.controlPlaneHostname}
          onChange={(controlPlaneHostname) => update({ controlPlaneHostname })}
          placeholder="pilot.aeroplane.run"
        />
        <DomainField
          label="Wildcard service domain"
          value={form.rootDomain}
          onChange={(rootDomain) => update({ rootDomain })}
          placeholder="*.pilot.aeroplane.run"
        />
        {hasRootDomain && !rootDomainValid ? (
          <p className="-mt-3 border-l-2 border-white px-3 text-xs leading-5 text-zinc-300">
            Include the wildcard prefix, for example
            {" "}
            <span className="font-mono text-white">
              *.pilot.aeroplane.run
            </span>
            .
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 border-y border-white/10 py-4">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Detected server IP
        </span>
        <span className="font-mono text-xs text-zinc-200">
          {publicIp || "Unavailable"}
        </span>
      </div>

      {hasDashboardDomain ? (
        <ControlPlaneDomainInstructions
          hostname={form.controlPlaneHostname}
          publicIp={publicIp}
        />
      ) : null}

      {hasRootDomain && rootDomainValid ? (
        <RootDomainInstructions
          rootDomain={form.rootDomain}
          publicIp={publicIp}
        />
      ) : null}

      {!hasDashboardDomain && !hasRootDomain ? (
        <div className="border border-dashed border-white/15 px-4 py-5 text-xs leading-5 text-zinc-500">
          DNS records are optional. Setup instructions will appear here as you
          enter a dashboard or wildcard domain.
        </div>
      ) : null}
    </div>
  );
}
