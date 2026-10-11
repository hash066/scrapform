import type { Plan, Stock } from './types';

type ListingInput = {
  product: string;
  quantity: number;
  pricePerUnit: number;
  makerCostPerUnit: number;
  channelFeePercent: number;
  shippingPerUnit: number;
  leadDays: number;
};

const save = (name: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
const csv = (value: string | number | boolean) => `"${String(value).replaceAll('"', '""')}"`;
const xml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function buildCsv(plan: Plan) {
  const header = ['part_id','part','stock','x_mm','y_mm','width_mm','height_mm','thickness_mm','rotated'];
  return [header.map(csv).join(','), ...plan.placements.map((p) => [p.id,p.label,p.stockId,p.x,p.y,p.width,p.height,p.thickness,p.rotated].map(csv).join(','))].join('\n');
}
export function exportCsv(plan: Plan) { save('scrapform-cut-list.csv', buildCsv(plan), 'text/csv;charset=utf-8'); }

export function buildListing(plan: Plan, input: ListingInput) {
  const recoveredKg = plan.placements.reduce((sum,p)=>sum+p.width*p.height*p.thickness*0.00000065,0);
  const revenue = input.pricePerUnit * input.quantity;
  const fees = revenue * input.channelFeePercent / 100;
  const variableCost = (input.makerCostPerUnit + input.shippingPerUnit) * input.quantity + fees;
  return {
    schemaVersion: '1.0',
    status: plan.valid ? 'ready-for-maker-review' : 'blocked-invalid-layout',
    generatedAt: new Date().toISOString(),
    product: input.product,
    batchQuantity: input.quantity,
    offer: { currency: 'INR', pricePerUnit: input.pricePerUnit, leadTimeDays: input.leadDays },
    assumptions: { makerCostPerUnitInr: input.makerCostPerUnit, shippingPerUnitInr: input.shippingPerUnit, channelFeePercent: input.channelFeePercent },
    economics: { revenueInr: revenue, variableCostInr: +variableCost.toFixed(2), projectedContributionInr: +(revenue-variableCost).toFixed(2) },
    reclaimedMaterialKg: +recoveredKg.toFixed(2),
    materialAssumptions: { plywoodDensityKgM3: 650 },
    utilizationPercent: +(plan.utilization*100).toFixed(1),
    validation: { passed: plan.valid, errors: plan.errors, modelVersion: 'scrapform-layout-v1' },
    parts: plan.placements.map(p=>({id:p.id,label:p.label,stockId:p.stockId,widthMm:p.width,heightMm:p.height,thicknessMm:p.thickness,xMm:p.x,yMm:p.y,rotated:p.rotated})),
    disclaimer: 'Cost, price, fees, shipping and lead time are maker-entered assumptions. Structural performance has not been certified.'
  };
}
export function exportListing(plan: Plan, input: ListingInput) { save('scrapform-maker-listing.json', JSON.stringify(buildListing(plan,input),null,2), 'application/json'); }

export function buildSvg(plan: Plan, stocks: Stock[]) {
  const gap = 40; let y = 20;
  const width = Math.max(1, ...stocks.map(s=>s.width)) + 40;
  const body = stocks.map((s) => { const sy = y; y += s.height + gap; return `<g transform="translate(20 ${sy})"><title>${xml(s.label)}</title><rect width="${s.width}" height="${s.height}" fill="#f5efe6" stroke="#292b26"/>${s.defects.map(d=>`<rect x="${d.x}" y="${d.y}" width="${d.width}" height="${d.height}" fill="#d9d4cb"/>`).join('')}${plan.placements.filter(p=>p.stockId===s.id).map(p=>`<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" fill="${p.color}" stroke="#292b26"/><text x="${p.x+5}" y="${p.y+16}" font-size="12">${xml(p.label)}</text>`).join('')}</g>`; }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${y}" viewBox="0 0 ${width} ${y}">${body}</svg>`;
}
export function exportSvg(plan: Plan, stocks: Stock[]) { save('scrapform-layout.svg', buildSvg(plan,stocks), 'image/svg+xml'); }

export function buildDxf(plan: Plan) { const lines = plan.placements.flatMap((p) => { const pts=[[p.x,p.y],[p.x+p.width,p.y],[p.x+p.width,p.y+p.height],[p.x,p.y+p.height],[p.x,p.y]]; return pts.slice(0,-1).map((a,i)=>`0\nLINE\n8\n${p.stockId}\n10\n${a[0]}\n20\n${a[1]}\n11\n${pts[i+1][0]}\n21\n${pts[i+1][1]}`).join('\n'); }); return `0\nSECTION\n2\nENTITIES\n${lines.join('\n')}\n0\nENDSEC\n0\nEOF`; }
export function exportDxf(plan: Plan) { save('scrapform-layout.dxf', buildDxf(plan), 'application/dxf'); }
