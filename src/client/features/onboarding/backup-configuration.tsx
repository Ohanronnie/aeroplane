import { LinkSquare02Icon } from "@hugeicons/core-free-icons";
import type { BackupScheduleTrigger } from "../../api";
import { AppIcon } from "../../components/ui/primitives";
import type { OnboardingForm } from "./onboarding-types";

const accountIdDocsUrl =
  "https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids/";
const r2TokenDocsUrl = "https://developers.cloudflare.com/r2/api/tokens/";

const scheduleOptions: Array<{
  trigger: BackupScheduleTrigger;
  label: string;
  retention: string;
}> = [
  { trigger: "daily", label: "Daily", retention: "Keep for 6 days" },
  { trigger: "weekly", label: "Weekly", retention: "Keep for 31 days" },
  { trigger: "monthly", label: "Monthly", retention: "Keep for 90 days" },
];

function BackupField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  docsUrl,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  docsUrl?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
        {label}
        {docsUrl ? (
          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-600 transition hover:text-white"
            aria-label={`Open documentation for ${label}`}
            onClick={(event) => event.stopPropagation()}
          >
            <AppIcon icon={LinkSquare02Icon} size={11} />
          </a>
        ) : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="h-12 w-full rounded-sm border border-white/15 bg-white/5 px-3.5 font-mono text-xs text-white outline-none transition placeholder:text-zinc-600 hover:border-white/30 focus:border-white focus:bg-white/10 focus:ring-2 focus:ring-white/10"
      />
    </label>
  );
}

export function BackupConfiguration({
  form,
  update,
}: {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
}) {
  const hasR2Input = [
    form.r2AccountId,
    form.r2Bucket,
    form.r2AccessKeyId,
    form.r2SecretAccessKey,
  ].some((value) => value.trim());

  function updateSchedule(
    trigger: BackupScheduleTrigger,
    enabled: boolean,
  ) {
    update({
      databaseBackupScheduleDefaults: {
        ...form.databaseBackupScheduleDefaults,
        [trigger]: enabled,
      },
    });
  }

  function skipR2() {
    update({
      r2AccountId: "",
      r2Bucket: "",
      r2AccessKeyId: "",
      r2SecretAccessKey: "",
      r2CreateBucket: false,
    });
  }

  return (
    <div className="space-y-9">
      <section>
        <div className="mb-5 flex items-center gap-3">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Default schedule
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <div className="grid gap-3">
          {scheduleOptions.map((option) => {
            const enabled =
              form.databaseBackupScheduleDefaults[option.trigger];
            return (
              <button
                key={option.trigger}
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => updateSchedule(option.trigger, !enabled)}
                className={`flex items-center justify-between gap-4 rounded-sm border px-4 py-3.5 text-left transition ${
                  enabled
                    ? "border-white/35 bg-white/10"
                    : "border-white/10 bg-black/20 hover:border-white/20"
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold text-white">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    {option.retention}
                  </span>
                </span>
                <span
                  className={`relative h-6 w-11 flex-none rounded-full border transition ${
                    enabled
                      ? "border-white bg-white"
                      : "border-white/20 bg-black"
                  }`}
                >
                  <span
                    className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition ${
                      enabled
                        ? "left-[22px] bg-black"
                        : "left-[3px] bg-zinc-600"
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <span className="whitespace-nowrap font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Cloudflare R2
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-zinc-600">
            Optional
          </span>
        </div>

        <p className="mb-5 text-xs leading-5 text-zinc-500">
          Store database backups away from this server. Leave every field blank
          to use local storage only.
        </p>

        {hasR2Input ? (
          <div className="mb-5 flex items-center justify-between gap-4 border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-xs leading-5 text-zinc-400">
              R2 configuration in progress
            </span>
            <button
              type="button"
              onClick={skipR2}
              className="flex-none font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400 transition hover:text-white"
            >
              Clear &amp; skip
            </button>
          </div>
        ) : null}

        <div className="grid gap-y-5">
          <BackupField
            label="Account ID"
            value={form.r2AccountId}
            onChange={(r2AccountId) => update({ r2AccountId })}
            placeholder="Cloudflare account ID"
            docsUrl={accountIdDocsUrl}
          />
          <BackupField
            label="Bucket"
            value={form.r2Bucket}
            onChange={(r2Bucket) => update({ r2Bucket })}
            placeholder="aeroplane-backups"
          />
          <BackupField
            label="Access key ID"
            value={form.r2AccessKeyId}
            onChange={(r2AccessKeyId) => update({ r2AccessKeyId })}
            placeholder="Access key from your R2 API token"
            docsUrl={r2TokenDocsUrl}
          />
          <BackupField
            label="Secret access key"
            value={form.r2SecretAccessKey}
            onChange={(r2SecretAccessKey) => update({ r2SecretAccessKey })}
            placeholder="Secret key from your R2 API token"
            type="password"
            docsUrl={r2TokenDocsUrl}
          />
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={form.r2CreateBucket}
          onClick={() => update({ r2CreateBucket: !form.r2CreateBucket })}
          className="mt-5 flex w-full items-start justify-between gap-5 border-y border-white/10 py-5 text-left"
        >
          <span>
            <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
              Create or verify bucket
            </span>
            <span className="mt-1.5 block text-xs leading-5 text-zinc-500">
              Check the R2 connection during setup when credentials are filled.
            </span>
          </span>
          <span
            className={`mt-0.5 relative h-6 w-11 flex-none rounded-full border transition ${
              form.r2CreateBucket
                ? "border-white bg-white"
                : "border-white/20 bg-black"
            }`}
          >
            <span
              className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition ${
                form.r2CreateBucket
                  ? "left-[22px] bg-black"
                  : "left-[3px] bg-zinc-600"
              }`}
            />
          </span>
        </button>
      </section>
    </div>
  );
}
