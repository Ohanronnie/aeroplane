import { useMemo } from "react";
import { validateDockerImageReference } from "../../../shared/service-source";
import { FormInput } from "../ui/primitives";
import { RuntimeModeControl } from "../ui/runtime-mode-control";

const settingsLabelClass = "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600";
const settingsInputClass = "!h-9 border-white/15 bg-black text-xs";

type DockerImageServiceSettings = {
  name: string;
  dockerImage: string;
  runtimeMode: "web" | "worker";
  internalPort: number;
};

export function DockerImageServiceSettingsPanel({
  settings,
  hostPort,
  onChange
}: {
  settings: DockerImageServiceSettings;
  hostPort?: number;
  onChange: (settings: Partial<DockerImageServiceSettings>) => void;
}) {
  const imageValidation = useMemo(() => validateDockerImageReference(settings.dockerImage), [settings.dockerImage]);

  return (
    <>
      <div>
        <label htmlFor="docker-service-name" className={settingsLabelClass}>Service name</label>
        <FormInput id="docker-service-name" name="name" value={settings.name} onChange={(event) => onChange({ name: event.target.value })} required variant="monochrome" className={settingsInputClass} />
      </div>
      <div className="xl:col-span-2">
        <span className={settingsLabelClass}>Runtime mode</span>
        <RuntimeModeControl value={settings.runtimeMode} onChange={(runtimeMode) => onChange({ runtimeMode })} />
      </div>
      {settings.runtimeMode !== "worker" ? (
        <div>
          <label htmlFor="docker-service-port" className={settingsLabelClass}>Internal port</label>
          <FormInput
            id="docker-service-port"
            type="number"
            min={1}
            max={65535}
            name="internalPort"
            value={settings.internalPort}
            onChange={(event) => onChange({ internalPort: Number(event.target.value) })}
            required
            variant="monochrome"
            className={settingsInputClass}
          />
          {hostPort ? <p className="mt-2 text-xs text-zinc-500">Traffic is routed through host port {hostPort}.</p> : null}
        </div>
      ) : (
        <input type="hidden" name="internalPort" value={settings.internalPort} />
      )}
      <div className="xl:col-span-2">
        <label htmlFor="docker-image-reference" className={settingsLabelClass}>Image reference</label>
        <FormInput id="docker-image-reference" name="dockerImage" value={settings.dockerImage} onChange={(event) => onChange({ dockerImage: event.target.value })} placeholder="ghcr.io/org/app:latest" required variant="monochrome" className={`${settingsInputClass} font-mono`} />
        {settings.dockerImage.trim() && !imageValidation.ok ? (
          <p className="mt-2 text-xs text-rose-300">{imageValidation.error}</p>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">Private images use the host Docker daemon's registry login.</p>
        )}
      </div>
    </>
  );
}
