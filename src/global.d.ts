export {};

declare global {
  interface Window {
    __VTW_REACT_NAVIGATE__?: (path: string) => void;
  }
}
