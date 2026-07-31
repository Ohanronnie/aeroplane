import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { type FormEvent, useState } from "react";
import {
  FUNCTION_REPO_URL,
  defaultFunctionSource,
  functionRepoFullName,
  functionRuntimeFileNames,
  type FunctionRuntime
} from "../../../shared/service-functions";
import type { ServiceFormPayload } from "../../features/services/service-form-types";
import { FunctionSourceEditor } from "../../features/services/function-source-editor";
import { FunctionRuntimeDropdown } from "../../features/services/function-runtime-dropdown";
import { RuntimeModeControl, type RuntimeMode } from "../ui/runtime-mode-control";
import { AppIcon, FieldLabel, FormInput } from "../ui/primitives";

export function FunctionConfigureStep({
  onBack,
  onSubmit,
  busy
}: {
  onBack: () => void;
  onSubmit: (payload: ServiceFormPayload) => Promise<void>;
  busy: boolean;
}) {
  const [name, setName] = useState("function");
  const [runtime, setRuntime] = useState<FunctionRuntime>("node");
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>("web");
  const [internalPort, setInternalPort] = useState(8080);
  const [sourceCode, setSourceCode] = useState(defaultFunctionSource.node);
  const [error, setError] = useState("");

  function selectRuntime(nextRuntime: FunctionRuntime) {
    const previousRuntime = runtime;
    setRuntime(nextRuntime);
    setSourceCode((current) => current === defaultFunctionSource[previousRuntime] ? defaultFunctionSource[nextRuntime] : current);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sourceCode.trim()) {
      setError("Function source code is required");
      return;
    }

    setError("");
    await onSubmit({
      name,
      repoFullName: functionRepoFullName(runtime),
      repoUrl: FUNCTION_REPO_URL,
      branch: "main",
      functionRuntime: runtime,
      sourceCode,
      runtimeMode,
      internalPort,
      env: []
    });
  }

  return (
    <form onSubmit={submit} className="flex min-h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <FieldLabel>Runtime</FieldLabel>
              <FunctionRuntimeDropdown value={runtime} onChange={selectRuntime} disabled={busy} />
            </div>
            <div>
              <FieldLabel>Service name</FieldLabel>
              <FormInput value={name} onChange={(event) => setName(event.target.value)} placeholder="resize-image" required variant="monochrome" className="!h-9 border-white/15 bg-black text-xs" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <FieldLabel>Service type</FieldLabel>
              <RuntimeModeControl value={runtimeMode} onChange={setRuntimeMode} disabled={busy} />
            </div>
            {runtimeMode !== "worker" ? (
              <div>
                <FieldLabel>App port</FieldLabel>
                <FormInput
                  type="number"
                  min={1}
                  max={65535}
                  value={internalPort}
                  onChange={(event) => setInternalPort(Number(event.target.value))}
                  required
                  variant="monochrome"
                  className="!h-9 border-white/15 bg-black text-xs"
                />
              </div>
            ) : null}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <FieldLabel>Source code</FieldLabel>
              <span className="font-mono text-[9px] tracking-[0.1em] text-zinc-600">
                {functionRuntimeFileNames[runtime]}
              </span>
            </div>
            <FunctionSourceEditor runtime={runtime} value={sourceCode} onChange={setSourceCode} height="420px" disabled={busy} />
            {error ? <div className="mt-2 border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</div> : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <button type="button" className="inline-flex h-8 items-center justify-center gap-2 px-3 text-xs text-zinc-500 transition hover:bg-white/[0.05] hover:text-white" onClick={onBack}>
          <AppIcon icon={ArrowLeft01Icon} size={16} />
          Back
        </button>
        <button type="submit" className="inline-flex h-8 items-center justify-center bg-white px-4 text-xs text-black transition hover:bg-zinc-200 disabled:opacity-40" disabled={busy}>
          Create function
        </button>
      </div>
    </form>
  );
}
