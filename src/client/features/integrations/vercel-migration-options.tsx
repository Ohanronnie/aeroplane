import { Checkbox } from "../../components/ui/checkbox";

type VercelMigrationOptionsProps = {
  busy: boolean;
  excludeSystemVars: boolean;
  autoDeploy: boolean;
  onExcludeSystemVarsChange: (checked: boolean) => void;
  onAutoDeployChange: (checked: boolean) => void;
};

export function VercelMigrationOptions({
  busy,
  excludeSystemVars,
  autoDeploy,
  onExcludeSystemVarsChange,
  onAutoDeployChange
}: VercelMigrationOptionsProps) {
  return (
    <div className="flex flex-col justify-end space-y-2.5 pb-1">
      <Checkbox
        variant="monochrome"
        checked={excludeSystemVars}
        onChange={onExcludeSystemVarsChange}
        disabled={busy}
        label="Exclude VERCEL_* variables"
      >
        <span className="text-xs text-zinc-300 font-semibold font-mono uppercase tracking-wider">
          Exclude VERCEL_* variables
        </span>
      </Checkbox>

      <Checkbox
        variant="monochrome"
        checked={autoDeploy}
        onChange={onAutoDeployChange}
        disabled={busy}
        label="Auto-deploy service"
      >
        <span className="text-xs text-zinc-300 font-semibold font-mono uppercase tracking-wider">
          Auto-deploy service
        </span>
      </Checkbox>
    </div>
  );
}
