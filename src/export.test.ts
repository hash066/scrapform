import {describe,expect,it} from 'vitest';
import {buildCsv,buildDxf,buildListing,buildSvg} from './export';
import type {Plan,Stock} from './types';
const stocks:Stock[]=[{id:'S-1',label:'A & B',width:500,height:300,thickness:18,grain:'none',defects:[]}];
const plan:Plan={placements:[{id:'p-1',label:'Top, "wide"',width:200,height:100,thickness:18,grain:'none',color:'#fff',stockId:'S-1',x:0,y:0,rotated:false}],unplaced:[],utilization:0.13,valid:true,errors:[],elapsedMs:1};
describe('fabrication exports',()=>{
  it('quotes CSV and includes traceable ids',()=>{const output=buildCsv(plan);expect(output).toContain('"p-1"');expect(output).toContain('"Top, ""wide"""');});
  it('escapes SVG labels and emits DXF entities',()=>{expect(buildSvg(plan,stocks)).toContain('A &amp; B');expect(buildDxf(plan)).toContain('ENTITIES');});
  it('calculates batch contribution without claiming observed sales',()=>{const listing=buildListing(plan,{product:'Shelf',quantity:2,pricePerUnit:1000,makerCostPerUnit:400,shippingPerUnit:100,channelFeePercent:10,leadDays:5});expect(listing.economics.projectedContributionInr).toBe(800);expect(listing.assumptions.channelFeePercent).toBe(10);expect(listing.disclaimer).toContain('assumptions');});
});
