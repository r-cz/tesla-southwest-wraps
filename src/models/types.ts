export interface WrapModel {
  /** Folder name in Tesla's custom-wraps repo, e.g. `modely-2025-performance`. */
  id: string;
  /** Human-readable vehicle name. */
  name: string;
  /** Template canvas size in pixels. */
  width: number;
  height: number;
  /** SVG markup for the design, in template pixel coordinates. */
  design: () => string;
}
