export type InventoryStatus =
  | "live"
  | "secondary"
  | "orphaned"
  | "missing"
  | "protected";

export type InventorySourceType =
  | "react-route"
  | "json-config"
  | "static-html"
  | "admin-page"
  | "asset"
  | "download";

export interface InventoryWarning {
  code: string;
  message: string;
  route: string;
}

export interface InventoryItem {
  id: string;
  title: string;
  route: string;
  status: InventoryStatus;
  section: string;
  sourceType: InventorySourceType;
  sourcePath: string;
  authority: string;
  editable: boolean;
  warnings: InventoryWarning[];
  details: string[];
}

export interface InventorySection {
  id: string;
  title: string;
  itemCount: number;
  warningCount: number;
}

export interface EditableSource {
  path: string;
  title: string;
  sourcePath: string;
}

export interface InventorySummary {
  totalItems: number;
  totalLivePages: number;
  totalHiddenOrOrphaned: number;
  totalMissingReferences: number;
  totalProtected: number;
  recommendations: string[];
}

export interface ContentInventoryPayload {
  generatedAt: string;
  summary: InventorySummary;
  sections: InventorySection[];
  items: InventoryItem[];
  warnings: InventoryWarning[];
  editableSources: EditableSource[];
}

export interface InventorySourcePayload {
  path: string;
  title: string;
  sourcePath: string;
  editable: boolean;
  overridden: boolean;
  content: unknown;
}

export const STATUS_OPTIONS: Array<{
  value: "all" | InventoryStatus;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "live", label: "Live" },
  { value: "secondary", label: "Secondary" },
  { value: "orphaned", label: "Orphaned" },
  { value: "missing", label: "Missing" },
  { value: "protected", label: "Protected" },
];
