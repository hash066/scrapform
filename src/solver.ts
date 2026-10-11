import type { Part, Placement, Plan, Rect, Stock } from './types';

const intersects = (a: Rect, b: Rect, gap = 0) =>
  a.x < b.x + b.width + gap && a.x + a.width + gap > b.x && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;

function orientations(part: Part, stock: Stock) {
  const base = [{ width: part.width, height: part.height, rotated: false }];
  if (part.width !== part.height && part.grain === 'none') base.push({ width: part.height, height: part.width, rotated: true });
  if (part.grain !== 'none' && stock.grain !== 'none' && part.grain !== stock.grain) return [];
  return base;
}

export function solve(parts: Part[], stocks: Stock[], kerf: number): Plan {
  const started = performance.now();
  const placements: Placement[] = [];
  const unplaced: Part[] = [];
  const ordered = [...parts].sort((a, b) => b.width * b.height - a.width * a.height);

  for (const part of ordered) {
    let best: Placement | undefined;
    let bestWaste = Number.POSITIVE_INFINITY;
    for (const stock of stocks.filter((s) => s.thickness === part.thickness)) {
      for (const shape of orientations(part, stock)) {
        const xs = new Set([0, ...placements.filter((p) => p.stockId === stock.id).flatMap((p) => [p.x + p.width + kerf]), ...stock.defects.map((d) => d.x + d.width + kerf)]);
        const ys = new Set([0, ...placements.filter((p) => p.stockId === stock.id).flatMap((p) => [p.y + p.height + kerf]), ...stock.defects.map((d) => d.y + d.height + kerf)]);
        for (const y of [...ys].sort((a, b) => a - b)) for (const x of [...xs].sort((a, b) => a - b)) {
          const candidate: Placement = { ...part, ...shape, x, y, stockId: stock.id };
          if (x + shape.width > stock.width || y + shape.height > stock.height) continue;
          if (stock.defects.some((d) => intersects(candidate, d, kerf))) continue;
          if (placements.some((p) => p.stockId === stock.id && intersects(candidate, p, kerf))) continue;
          const waste = y * stock.width + x + (stock.width * stock.height - shape.width * shape.height) * 0.0001;
          if (waste < bestWaste) { best = candidate; bestWaste = waste; }
        }
      }
    }
    if (best) placements.push(best); else unplaced.push(part);
  }

  const errors = validatePlan(parts, stocks, placements, kerf);
  const available = stocks.reduce((sum, stock) => sum + stock.width * stock.height - stock.defects.reduce((a, d) => a + d.width * d.height, 0), 0);
  const used = placements.reduce((sum, p) => sum + p.width * p.height, 0);
  return { placements, unplaced, utilization: available ? used / available : 0, valid: errors.length === 0 && unplaced.length === 0, errors, elapsedMs: performance.now() - started };
}

export function validatePlan(parts: Part[], stocks: Stock[], placements: Placement[], kerf: number) {
  const errors: string[] = [];
  for (const p of placements) {
    const stock = stocks.find((s) => s.id === p.stockId);
    if (!stock) { errors.push(`${p.label}: stock is missing`); continue; }
    if (p.x < 0 || p.y < 0 || p.x + p.width > stock.width || p.y + p.height > stock.height) errors.push(`${p.label}: outside stock boundary`);
    if (stock.thickness !== p.thickness) errors.push(`${p.label}: thickness mismatch`);
    if (p.grain !== 'none' && stock.grain !== 'none' && p.grain !== stock.grain) errors.push(`${p.label}: grain mismatch`);
    if (stock.defects.some((d) => intersects(p, d, kerf))) errors.push(`${p.label}: overlaps a defect`);
  }
  for (let i = 0; i < placements.length; i++) for (let j = i + 1; j < placements.length; j++) {
    if (placements[i].stockId === placements[j].stockId && intersects(placements[i], placements[j], kerf)) errors.push(`${placements[i].label} overlaps ${placements[j].label}`);
  }
  for (const part of parts) if (placements.filter((p) => p.id === part.id).length !== 1) errors.push(`${part.label}: expected one placed part`);
  return [...new Set(errors)];
}
