import { createFileRoute } from "@tanstack/react-router";
import { SettingsIndexPage } from "../../features/settings/settings-index-page";
import { SettingsPage } from "../../features/settings/settings-page";
import { isSettingsPageSlug } from "../../features/settings/settings-pages";

export const Route = createFileRoute("/settings/$settingsPage")({
  component: SettingsPageRoute
});

function SettingsPageRoute() {
  const { settingsPage } = Route.useParams();
  if (!isSettingsPageSlug(settingsPage)) return <SettingsIndexPage />;

  return <SettingsPage requestedPage={settingsPage} />;
}
