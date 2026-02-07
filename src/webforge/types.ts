export type ComponentType =
  | "Full Page"
  | "Header"
  | "Hero Section"
  | "Feature Section"
  | "Card Component"
  | "Pricing Table"
  | "Footer";
export type AppMode = "CLONE" | "FORGE";

export interface StylePreferences {
  primaryColor: string;
  fontFamily: string;
  spacing: "Compact" | "Normal" | "Relaxed";
}

export interface GeneratedCode {
  html: string;
  explanation: string;
  title: string;
}

export interface AppState {
  mode: AppMode;
  isAnalyzing: boolean;
  progress: number;
  screenshot: string | null;
  result: GeneratedCode | null;
  error: string | null;
  preferences: StylePreferences;
  componentType: ComponentType;
  customContent: string;
  forgeSections: {
    header: boolean;
    main: boolean;
    footer: boolean;
  };
  forgeDescription: string;
}

export enum TabType {
  PREVIEW = "PREVIEW",
  CODE = "CODE",
}
