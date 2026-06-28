import { api } from "../api";

type ManifestMessage = {
  source: "aeroplane-github-manifest";
  ok: boolean;
  message: string;
};

function isManifestMessage(data: unknown): data is ManifestMessage {
  return Boolean(data) && typeof data === "object" && (data as ManifestMessage).source === "aeroplane-github-manifest";
}

/**
 * Drives GitHub's App Manifest "one-click" flow. Opens a popup, POSTs a
 * pre-filled App manifest to GitHub, and resolves once GitHub redirects the
 * popup back to our callback (which posts a message and closes itself).
 *
 * Using a popup keeps the current page — e.g. an in-progress onboarding form —
 * intact instead of navigating away from it.
 */
export async function startGitHubAppManifestFlow(options: {
  redirectTo: "onboarding" | "settings";
  organization?: string;
}): Promise<{ ok: boolean; message: string }> {
  const popup = window.open("", "aeroplane-github-app", "width=1024,height=768,menubar=no,toolbar=no");
  if (!popup) {
    throw new Error("Could not open the GitHub window. Allow pop-ups for this site and try again.");
  }
  popup.document.write("Connecting to GitHub…");

  let manifest: { postUrl: string; manifest: string };
  try {
    manifest = await api.githubManifest({ redirectTo: options.redirectTo, organization: options.organization });
  } catch (error) {
    popup.close();
    throw error;
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = manifest.postUrl;
  form.target = "aeroplane-github-app";
  form.style.display = "none";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "manifest";
  input.value = manifest.manifest;
  form.appendChild(input);

  document.body.appendChild(form);
  form.submit();
  form.remove();

  return await new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(closedTimer);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !isManifestMessage(event.data)) return;
      settled = true;
      cleanup();
      resolve({ ok: event.data.ok, message: event.data.message });
    };

    // The popup may be closed by the user before completing the flow.
    const closedTimer = window.setInterval(() => {
      if (popup.closed && !settled) {
        cleanup();
        reject(new Error("GitHub connection was cancelled."));
      }
    }, 600);

    window.addEventListener("message", onMessage);
  });
}
