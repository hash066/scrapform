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
  const usableKerf = Number.isFinite(kerf) ? Math.max(0, kerf) : 0;
  const usableStocks = stocks.filter((stock) => Number.isFinite(stock.width) && Number.isFinite(stock.height) && stock.width > 0 && stock.height > 0);
  const ordered = [...parts].filter((part) => Number.isFinite(part.width) && Number.isFinite(part.height) && part.width > 0 && part.height > 0).sort((a, b) => b.width * b.height - a.width * a.height);

  for (const part of ordered) {
    let best: Placement | undefined;
    let bestWaste = Number.POSITIVE_INFINITY;
    for (const stock of usableStocks.filter((s) => s.thickness === part.thickness)) {
      for (const shape of orientations(part, stock)) {
        const xs = new Set([0, ...placements.filter((p) => p.stockId === stock.id).flatMap((p) => [p.x + p.width + usableKerf]), ...stock.defects.map((d) => d.x + d.width + usableKerf)]);
        const ys = new Set([0, ...placements.filter((p) => p.stockId === stock.id).flatMap((p) => [p.y + p.height + usableKerf]), ...stock.defects.map((d) => d.y + d.height + usableKerf)]);
        for (const y of [...ys].sort((a, b) => a - b)) for (const x of [...xs].sort((a, b) => a - b)) {
          const candidate: Placement = { ...part, ...shape, x, y, stockId: stock.id };
          if (x + shape.width > stock.width || y + shape.height > stock.height) continue;
          if (stock.defects.some((d) => intersects(candidate, d, usableKerf))) continue;
          if (placements.some((p) => p.stockId === stock.id && intersects(candidate, p, usableKerf))) continue;
          const waste = y * stock.width + x + (stock.width * stock.height - shape.width * shape.height) * 0.0001;
          if (waste < bestWaste) { best = candidate; bestWaste = waste; }
        }
      }
    }
    if (best) placements.push(best); else unplaced.push(part);
  }

  for (const part of parts) if (!ordered.includes(part)) unplaced.push(part);
  const errors = validatePlan(parts, stocks, placements, usableKerf);
  const available = usableStocks.reduce((sum, stock) => sum + Math.max(0, stock.width * stock.height - stock.defects.reduce((a, d) => a + Math.max(0,d.width)*Math.max(0,d.height), 0)), 0);
  const used = placements.reduce((sum, p) => sum + p.width * p.height, 0);
  return { placements, unplaced, utilization: available ? used / available : 0, valid: errors.length === 0 && unplaced.length === 0, errors, elapsedMs: performance.now() - started };
}

export function validatePlan(parts: Part[], stocks: Stock[], placements: Placement[], kerf: number) {
  const errors: string[] = [];
  if (!Number.isFinite(kerf) || kerf < 0) errors.push('Kerf must be a non-negative number');
  const duplicateStockIds = stocks.filter((stock,index)=>stocks.findIndex(candidate=>candidate.id===stock.id)!==index).map(stock=>stock.id);
  if (duplicateStockIds.length) errors.push(`Duplicate stock IDs: ${[...new Set(duplicateStockIds)].join(', ')}`);
  for (const stock of stocks) {
    if (![stock.width,stock.height,stock.thickness].every(value=>Number.isFinite(value)&&value>0)) errors.push(`${stock.label}: stock dimensions and thickness must be positive`);
    for (const defect of stock.defects) if (![defect.x,defect.y,defect.width,defect.height].every(Number.isFinite) || defect.x < 0 || defect.y < 0 || defect.width <= 0 || defect.height <= 0 || defect.x + defect.width > stock.width || defect.y + defect.height > stock.height) errors.push(`${stock.label}: defect is outside stock boundary`);
  }
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
  for (const part of parts) {
    if (![part.width,part.height,part.thickness].every(value=>Number.isFinite(value)&&value>0)) errors.push(`${part.label}: part dimensions and thickness must be positive`);
    if (placements.filter((p) => p.id === part.id).length !== 1) errors.push(`${part.label}: expected one placed part`);
  }
  return [...new Set(errors)];
}
