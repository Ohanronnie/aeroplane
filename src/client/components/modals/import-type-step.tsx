import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { AppIcon } from "../ui/primitives";
import { ServiceTypeIcon, type ServiceType } from "./service-type-icon";

export type { ServiceType } from "./service-type-icon";

type ServiceTypeOption = {
  key: ServiceType;
  name: string;
};

const SERVICE_TYPE_OPTIONS: ServiceTypeOption[] = [
  {
    key: "git",
    name: "Git Repository"
  },
  {
    key: "database",
    name: "Database"
  },
  {
    key: "docker-image",
    name: "Docker Image"
  },
  {
    key: "function",
    name: "Function"
  }
];

export function ImportTypeStep({ onSelect }: { onSelect: (type: ServiceType) => void }) {
  return (
    <div className="min-h-0 flex-1">
      <div className="grid border border-white/10 sm:grid-cols-2">
        {SERVICE_TYPE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onSelect(option.key)}
            className="group flex min-h-20 items-center gap-3 border-b border-white/10 px-4 py-3 text-left transition last:border-b-0 hover:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white/30 sm:odd:border-r sm:[&:nth-last-child(-n+2)]:border-b-0"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center text-zinc-500 transition group-hover:text-white">
              <ServiceTypeIcon
                type={option.key}
                className={option.key === "docker-image" ? "h-6 w-6 object-contain" : "h-5 w-5"}
              />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-300 transition group-hover:text-white">{option.name}</span>
            <AppIcon icon={ArrowLeft01Icon} size={14} className="rotate-180 text-zinc-700 transition group-hover:text-zinc-300" />
          </button>
        ))}
      </div>
    </div>
  );
}
