import { FormInput } from "../ui/primitives";
import { RuntimeModeControl, type RuntimeMode } from "../ui/runtime-mode-control";

const settingsLabelClass = "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600";
const settingsInputClass = "!h-9 border-white/15 bg-black text-xs";

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
    <>
      <div>
        <label htmlFor="function-service-name" className={settingsLabelClass}>Service name</label>
        <FormInput id="function-service-name" name="name" value={settings.name} onChange={(event) => onChange({ name: event.target.value })} variant="monochrome" className={settingsInputClass} />
      </div>
      <div className="xl:col-span-2">
        <span className={settingsLabelClass}>Service type</span>
        <RuntimeModeControl value={settings.runtimeMode} onChange={(runtimeMode) => onChange({ runtimeMode })} />
      </div>
      {settings.runtimeMode !== "worker" ? (
        <div>
          <label htmlFor="function-service-port" className={settingsLabelClass}>App port</label>
          <FormInput
            id="function-service-port"
            name="internalPort"
            type="number"
            min={1}
            max={65535}
            value={settings.internalPort}
            onChange={(event) => onChange({ internalPort: Number(event.target.value) })}
            variant="monochrome"
            className={settingsInputClass}
          />
        </div>
      ) : null}
    </>
  );
}
