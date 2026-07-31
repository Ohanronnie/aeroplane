import { AiSettingsPanel } from "../../components/modals/ai-settings-panel";
import { ApiAccessSettingsPanel } from "../../components/modals/api-access-settings-panel";
import { ControlPlaneDomainSettingsPanel } from "../../components/modals/control-plane-domain-settings-panel";
import { DeploymentSettingsPanel } from "../../components/modals/deployment-settings-panel";
import { DnsManagementPanel } from "../../components/modals/dns-management-panel";
import { GitHubSettingsPanel } from "../../components/modals/github-settings-panel";
import { MaintenanceSettingsPanel } from "../../components/modals/maintenance-settings-panel";
import { MigrationSettingsPanel } from "../../components/modals/migration-settings-panel";
import { R2StorageSettingsPanel } from "../../components/modals/r2-storage-settings-panel";
import { RootDomainSettingsPanel } from "../../components/modals/root-domain-settings-panel";
import { UpdatesSettingsPanel } from "../../components/modals/updates-settings-panel";
import { UsersSettingsPanel } from "../../components/modals/users-settings-panel";
import type { SystemSettingsTab } from "./settings-pages";

export function SettingsPanelContent({
  activeTab,
  owner
}: {
  activeTab: SystemSettingsTab;
  owner: boolean;
}) {
  if (activeTab === "root-domain") {
    return (
      <div className="mx-auto max-w-5xl overflow-hidden border border-white/10 bg-black">
        <ControlPlaneDomainSettingsPanel open />
        <div className="border-t border-white/10">
          <RootDomainSettingsPanel open />
        </div>
      </div>
    );
  }

  if (activeTab === "dns") return <DnsManagementPanel />;
  if (activeTab === "github") return <GitHubSettingsPanel open />;
  if (activeTab === "ai") return <AiSettingsPanel />;
  if (activeTab === "api-access") return <ApiAccessSettingsPanel open />;
  if (activeTab === "users") return <UsersSettingsPanel open />;
  if (activeTab === "storage") {
    return <R2StorageSettingsPanel open mode={owner ? "system" : "account"} />;
  }
  if (activeTab === "migration") return <MigrationSettingsPanel />;
  if (activeTab === "maintenance") return <MaintenanceSettingsPanel open />;
  if (activeTab === "deployments") return <DeploymentSettingsPanel open />;
  if (activeTab === "updates") return <UpdatesSettingsPanel open />;

  return null;
}
