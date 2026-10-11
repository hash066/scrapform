import type { Part, ProductKey } from './types';
const palette = ['#c57d41', '#dc9f62', '#e7b77d', '#ad6736', '#f0c99a', '#8e5732'];
export const productNames: Record<ProductKey, string> = { organizer: 'Desk organizer', shelf: 'Desktop shelf', tray: 'Cable tray' };
export function buildParts(product: ProductKey, width: number, depth: number, height: number, thickness: number): Part[] {
  const p = (id: string, label: string, w: number, h: number, grain: Part['grain'] = 'none', i = 0): Part => ({ id, label, width: Math.round(w), height: Math.round(h), thickness, grain, color: palette[i % palette.length] });
  if (product === 'shelf') return [p('top','Top',width,depth,'long',0),p('side-l','Left side',depth,height,'cross',1),p('side-r','Right side',depth,height,'cross',2),p('brace','Back brace',width - 2 * thickness,Math.max(70,height * .35),'long',3)];
  if (product === 'tray') return [p('base','Tray base',width,depth,'long',0),p('front','Front rail',width,height * .28,'long',1),p('back','Back rail',width,height * .65,'long',2),p('end-l','Left end',depth,height,'cross',3),p('end-r','Right end',depth,height,'cross',4)];
  return [p('base','Base',width,depth,'long',0),p('back','Back',width,height,'long',1),p('side-l','Left side',depth,height,'cross',2),p('side-r','Right side',depth,height,'cross',3),p('divider','Divider',depth,height * .72,'cross',4),p('front','Front lip',width,height * .28,'long',5)];
}
