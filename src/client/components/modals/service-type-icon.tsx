import { DatabaseIcon, FunctionIcon } from "@hugeicons/core-free-icons";
import { GitHubLogo } from "../ui/github-logo";
import { AppIcon } from "../ui/primitives";

export type ServiceType = "git" | "database" | "docker-image" | "function";

export function ServiceTypeIcon({ type, className = "" }: { type: ServiceType; className?: string }) {
  if (type === "git") {
    return <GitHubLogo className={className} />;
  }

  if (type === "docker-image") {
    return (
      <img
        src="/api/assets/framework-icons/docker.svg"
        alt=""
        aria-hidden="true"
        className={className}
        loading="lazy"
      />
    );
  }

  return (
    <AppIcon
      icon={type === "database" ? DatabaseIcon : FunctionIcon}
      size={20}
      className={className}
    />
  );
}
