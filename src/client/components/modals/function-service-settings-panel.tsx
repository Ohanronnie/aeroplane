import { FunctionIcon } from "@hugeicons/core-free-icons";
import { AppIcon, FieldLabel, FormInput } from "../ui/primitives";
import { RuntimeModeControl, type RuntimeMode } from "../ui/runtime-mode-control";

type FunctionServiceSettings = {
  name: string;
  runtimeMode: RuntimeMode;
  internalPort: number;
};

export function FunctionServiceSettingsPanel({
  settings,
  onChange
}: {
  settings: FunctionServiceSettings;
  onChange: (settings: Partial<FunctionServiceSettings>) => void;
}) {
  return (
    <div className="xl:col-span-2 border border-zinc-700 bg-zinc-900/88 p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center border border-zinc-800 bg-zinc-950 text-[#7fe3dd]">
          <AppIcon icon={FunctionIcon} size={16} />
        </span>
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Function service</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>Service name</FieldLabel>
          <FormInput name="name" value={settings.name} onChange={(event) => onChange({ name: event.target.value })} />
        </div>
        <div>
          <FieldLabel>Service type</FieldLabel>
          <RuntimeModeControl value={settings.runtimeMode} onChange={(runtimeMode) => onChange({ runtimeMode })} />
        </div>
        {settings.runtimeMode !== "worker" ? (
          <div>
            <FieldLabel>App port</FieldLabel>
            <FormInput
              name="internalPort"
              type="number"
              min={1}
              max={65535}
              value={settings.internalPort}
              onChange={(event) => onChange({ internalPort: Number(event.target.value) })}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
