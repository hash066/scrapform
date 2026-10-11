export type Grain = 'long' | 'cross' | 'none';
export type Rect = { x: number; y: number; width: number; height: number };
export type Stock = { id: string; label: string; width: number; height: number; thickness: number; grain: Grain; defects: Rect[] };
export type Part = { id: string; label: string; width: number; height: number; thickness: number; grain: Grain; color: string };
export type Placement = Part & Rect & { stockId: string; rotated: boolean };
export type Plan = { placements: Placement[]; unplaced: Part[]; utilization: number; valid: boolean; errors: string[]; elapsedMs: number };
export type ProductKey = 'organizer' | 'shelf' | 'tray';
