export type AiWosStatus = "live" | "foundation" | "planned";

export type AiWosItemKind =
  | "module"
  | "command-category"
  | "blueprint"
  | "theme"
  | "automation"
  | "site"
  | "security"
  | "deployment"
  | "doc";

export interface AiWosLink {
  label: string;
  href: string;
}

export interface AiWosItem {
  id: string;
  kind: AiWosItemKind;
  section: string;
  title: string;
  subtitle: string;
  status: AiWosStatus;
  description: string;
  badges: string[];
  files: string[];
  commands: string[];
  details: string[];
  links: AiWosLink[];
}

export interface AiWosSection {
  id: string;
  title: string;
  description: string;
  itemCount: number;
}

export interface AiWosSummary {
  totalItems: number;
  liveItems: number;
  foundationItems: number;
  plannedItems: number;
  commandCount: number;
  blueprintCount: number;
  themeCount: number;
  automationCount: number;
  recommendations: string[];
}

export interface AiWosProduct {
  name: string;
  shortName: string;
  version: string;
  runtime: string;
  deploymentModel: string;
  commandEndpoint: string;
  dashboardRoute: string;
  actionSchemaPath: string;
}

export interface AiWosManifest {
  generatedAt: string;
  product: AiWosProduct;
  summary: AiWosSummary;
  sections: AiWosSection[];
  items: AiWosItem[];
}

export const AI_WOS_STATUS_OPTIONS: Array<{
  value: "all" | AiWosStatus;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "live", label: "Live" },
  { value: "foundation", label: "Foundation" },
  { value: "planned", label: "Planned" },
];
