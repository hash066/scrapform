import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

const root = new URL('./2dpacklib/BENG/BENG/', import.meta.url).pathname.slice(1);
const files = readdirSync(root).filter((f) => f.endsWith('.ins2D')).sort();
function parse(file) {
  const lines=readFileSync(join(root,file),'utf8').trim().split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const count=+lines[0]; const [width,height]=lines[1].split(/\s+/).map(Number); const items=[];
  for(const line of lines.slice(2,2+count)){const [,w,h,d]=line.split(/\s+/).map(Number);for(let i=0;i<d;i++)items.push({w,h});}
  return {file,width,height,items};
}
function ffd(instance){const bins=[];for(const item of [...instance.items].sort((a,b)=>b.h-a.h||b.w-a.w)){let placed=false;for(const bin of bins){for(const shelf of bin.shelves){if(item.h<=shelf.height&&shelf.used+item.w<=instance.width){shelf.used+=item.w;placed=true;break;}}if(placed)break;const usedHeight=bin.shelves.reduce((s,x)=>s+x.height,0);if(usedHeight+item.h<=instance.height){bin.shelves.push({height:item.h,used:item.w});placed=true;break;}}if(!placed)bins.push({shelves:[{height:item.h,used:item.w}]});}return bins.length;}
const rows=files.map(file=>{const input=parse(file);const started=performance.now();const bins=ffd(input);const ms=performance.now()-started;const area=input.items.reduce((s,i)=>s+i.w*i.h,0);const lower=Math.ceil(area/(input.width*input.height));return {instance:file,items:input.items.length,bins,areaLowerBound:lower,gapToAreaLowerBound:bins-lower,utilization:+(area/(bins*input.width*input.height)*100).toFixed(1),runtimeMs:+ms.toFixed(3)};});
const report={source:'2DPackLib BENG, University of Bologna',algorithm:'first-fit decreasing shelf baseline',generatedAt:new Date().toISOString(),rows};
writeFileSync(new URL('./report.json',import.meta.url),JSON.stringify(report,null,2));
console.table(rows);
