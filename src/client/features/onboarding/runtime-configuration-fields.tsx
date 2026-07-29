import type { OnboardingForm } from "./onboarding-types";

function RuntimeField({
  label,
  envName,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  envName: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
          {label}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-zinc-600">
          {envName}
        </span>
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        spellCheck={false}
        className="h-12 w-full rounded-sm border border-white/15 bg-white/5 px-3.5 font-mono text-xs text-white outline-none transition placeholder:text-zinc-600 hover:border-white/30 focus:border-white focus:bg-white/10 focus:ring-2 focus:ring-white/10"
      />
    </label>
  );
}

export function RuntimeConfigurationFields({
  form,
  update,
}: {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
}) {
  return (
    <div className="space-y-9">
      <section>
        <div className="mb-5 flex items-center gap-3">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Core runtime
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <div className="grid gap-y-5">
          <RuntimeField
            label="Data directory"
            envName="DATA_DIR"
            value={form.dataDir}
            onChange={(dataDir) => update({ dataDir })}
            required
          />
          <RuntimeField
            label="Public URL"
            envName="PUBLIC_URL"
            value={form.publicUrl}
            onChange={(publicUrl) => update({ publicUrl })}
            placeholder="https://aeroplane.example.com"
            required
          />
          <RuntimeField
            label="Port"
            envName="PORT"
            value={form.port}
            onChange={(port) => update({ port })}
            type="number"
            required
          />
          <RuntimeField
            label="Secret key"
            envName="AEROPLANE_SECRET_KEY"
            value={form.secretKey}
            onChange={(secretKey) => update({ secretKey })}
            placeholder="Generated automatically when blank"
          />
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center gap-3">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Build &amp; routing
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <div className="grid gap-y-5">
          <RuntimeField
            label="BuildKit host"
            envName="BUILDKIT_HOST"
            value={form.buildkitHost}
            onChange={(buildkitHost) => update({ buildkitHost })}
            required
          />
          <RuntimeField
            label="Runtime network"
            envName="AEROPLANE_RUNTIME_NETWORK"
            value={form.runtimeNetworkName}
            onChange={(runtimeNetworkName) => update({ runtimeNetworkName })}
            required
          />
          <RuntimeField
            label="Caddy config path"
            envName="CADDY_CONFIG_PATH"
            value={form.caddyConfigPath}
            onChange={(caddyConfigPath) => update({ caddyConfigPath })}
            required
          />
          <RuntimeField
            label="Caddy data directory"
            envName="CADDY_DATA_DIR"
            value={form.caddyDataDir}
            onChange={(caddyDataDir) => update({ caddyDataDir })}
            required
          />
          <RuntimeField
            label="Caddy reload command"
            envName="CADDY_RELOAD_CMD"
            value={form.caddyReloadCmd}
            onChange={(caddyReloadCmd) => update({ caddyReloadCmd })}
            required
          />
        </div>
      </section>

      <label className="flex cursor-pointer items-start justify-between gap-5 border-y border-white/10 py-5">
        <span>
          <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-200">
            Dry-run deployments
          </span>
          <span className="mt-1.5 block max-w-sm text-xs leading-5 text-zinc-500">
            Rehearse host setup without creating real deployments.
          </span>
        </span>
        <input
          type="checkbox"
          checked={form.deployDryRun}
          onChange={(event) => update({ deployDryRun: event.target.checked })}
          className="mt-1 h-4 w-4 flex-none appearance-none rounded-full border border-white/30 bg-black transition checked:border-white checked:bg-white"
        />
      </label>
    </div>
  );
}
