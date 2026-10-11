import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { BadgeIndianRupee, Box, CheckCircle2, ChevronDown, CircleAlert, Download, Layers3, Plus, Ruler, Store, Trash2, WandSparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { exportCsv, exportDxf, exportListing, exportSvg } from './export';
import { buildParts, productNames } from './products';
import { solve } from './solver';
import type { Placement, ProductKey, Stock } from './types';
import './styles.css';

const initialStocks: Stock[] = [
  { id:'S-01', label:'Birch offcut A', width:760, height:430, thickness:18, grain:'long', defects:[{x:520,y:45,width:72,height:64}] },
  { id:'S-02', label:'Birch offcut B', width:620, height:310, thickness:18, grain:'cross', defects:[{x:55,y:210,width:85,height:42}] },
  { id:'S-03', label:'Birch offcut C', width:540, height:360, thickness:18, grain:'none', defects:[] }
];

function Assembly({ placements }: { placements: Placement[] }) {
  return <>{placements.map((p,i) => <mesh key={p.id} position={[(i%3-.8)*1.35, Math.floor(i/3)*.55-.3, i%2*.55-.3]} rotation={[0.12,0.25+(i%2)*.5,0.04]} castShadow><boxGeometry args={[Math.max(.38,p.width/360),.09,Math.max(.3,p.height/300)]}/><meshStandardMaterial color={p.color} roughness={.6}/></mesh>)}</>;
}

export default function App() {
  const [stocks,setStocks]=useState(initialStocks); const [product,setProduct]=useState<ProductKey>('organizer');
  const [width,setWidth]=useState(420); const [depth,setDepth]=useState(220); const [height,setHeight]=useState(180); const [kerf,setKerf]=useState(3);
  const [price,setPrice]=useState(1299); const [makerCost,setMakerCost]=useState(620);
  const parts=useMemo(()=>buildParts(product,width,depth,height,18),[product,width,depth,height]);
  const plan=useMemo(()=>solve(parts,stocks,kerf),[parts,stocks,kerf]);
  const removeStock=(id:string)=>setStocks(s=>s.filter(x=>x.id!==id));
  const addStock=()=>setStocks(s=>[...s,{id:`S-${String(s.length+1).padStart(2,'0')}`,label:'New measured offcut',width:600,height:400,thickness:18,grain:'none',defects:[]}]);
  const updateStock=(id:string,key:'width'|'height',value:number)=>setStocks(s=>s.map(x=>x.id===id?{...x,[key]:Math.max(100,value)}:x));
  return <main>
    <header><div className="brand"><span>SF</span><div><strong>ScrapForm</strong><small>Material-to-design workbench</small></div></div><div className="source"><CheckCircle2 size={15}/> measured inventory <b>v1.0</b></div></header>
    <section className="workspace">
      <aside className="panel inventory"><div className="panel-title"><div><small>01 / STOCK</small><h2>Measured offcuts</h2></div><button className="icon" onClick={addStock} title="Add measured stock"><Plus/></button></div>
        <div className="stock-list">{stocks.map((s,i)=><article className="stock" key={s.id}><div className="stock-head"><span className={`swatch s${i}`}/><div><strong>{s.label}</strong><small>{s.id} · {s.thickness} mm · {s.grain} grain</small></div><button className="icon quiet" onClick={()=>removeStock(s.id)} title={`Remove ${s.label}`}><Trash2/></button></div><div className="dimensions"><label>W <input aria-label={`${s.label} width`} type="number" value={s.width} onChange={e=>updateStock(s.id,'width',+e.target.value)}/> mm</label><span>×</span><label>H <input aria-label={`${s.label} height`} type="number" value={s.height} onChange={e=>updateStock(s.id,'height',+e.target.value)}/> mm</label></div>{s.defects.length>0&&<div className="defect"><CircleAlert size={13}/>{s.defects.length} excluded defect zone</div>}</article>)}</div>
        <div className="measurement-note"><Ruler/><p><b>Enter measured dimensions.</b><br/>Plans are only as accurate as the stock record.</p></div>
      </aside>
      <section className="stage"><div className="stage-bar"><div><small>ASSEMBLY PREVIEW</small><h1>{productNames[product]}</h1></div><div className="segmented" aria-label="View mode"><button className="active"><Box/>3D</button><button><Layers3/>Layout</button></div></div><div className="canvas-wrap"><Canvas camera={{position:[4,3.4,5],fov:36}} shadows><color attach="background" args={['#e9e5dc']}/><ambientLight intensity={1.7}/><directionalLight position={[4,6,2]} intensity={2.2} castShadow/><Assembly placements={plan.placements}/><Environment preset="warehouse"/><OrbitControls enablePan={false}/></Canvas><div className="canvas-caption"><span>drag to inspect</span><span>{parts.length} parts · 18 mm plywood</span></div></div>
        <div className="layout-strip"><div className="layout-summary"><small>CUTTING PLAN</small><strong>{Math.round(plan.utilization*100)}% material utilization</strong><span>{plan.elapsedMs.toFixed(1)} ms solve</span></div><div className="mini-layout">{stocks.map(s=><svg key={s.id} viewBox={`0 0 ${s.width} ${s.height}`} role="img" aria-label={`Cut layout for ${s.label}`}><rect width={s.width} height={s.height} className="stock-bg"/>{s.defects.map((d,i)=><rect key={i} {...d} className="defect-zone"/>)}{plan.placements.filter(p=>p.stockId===s.id).map(p=><g key={p.id}><rect x={p.x} y={p.y} width={p.width} height={p.height} fill={p.color}/><text x={p.x+10} y={p.y+22}>{p.label}</text></g>)}</svg>)}</div></div>
      </section>
      <aside className="panel controls"><div className="panel-title"><div><small>02 / PRODUCT</small><h2>Design constraints</h2></div><WandSparkles/></div>
        <label className="field">Product<select value={product} onChange={e=>setProduct(e.target.value as ProductKey)}>{Object.entries(productNames).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><ChevronDown/></label>
        <div className="measure-grid"><label>Width<input type="number" value={width} onChange={e=>setWidth(+e.target.value)}/><span>mm</span></label><label>Depth<input type="number" value={depth} onChange={e=>setDepth(+e.target.value)}/><span>mm</span></label><label>Height<input type="number" value={height} onChange={e=>setHeight(+e.target.value)}/><span>mm</span></label><label>Kerf<input type="number" value={kerf} min="0" max="10" onChange={e=>setKerf(+e.target.value)}/><span>mm</span></label></div>
        <div className={`result ${plan.valid?'valid':'invalid'}`}>{plan.valid?<CheckCircle2/>:<CircleAlert/>}<div><strong>{plan.valid?'Plan independently validated':'No feasible complete plan'}</strong><small>{plan.valid?'Boundary, kerf, grain and part-count checks passed.':`${plan.unplaced.length} part(s) could not be placed.`}</small></div></div>
        <div className="parts"><small>PART SCHEDULE</small>{parts.map(p=><div key={p.id}><span className="part-dot" style={{background:p.color}}/><b>{p.label}</b><span>{p.width} × {p.height}</span></div>)}</div>
        <section className="exchange"><div className="exchange-title"><Store/><div><small>SCRAPFORM EXCHANGE</small><b>Maker opportunity</b></div><span>{plan.valid?'READY':'BLOCKED'}</span></div><div className="commerce-grid"><label>Target price <span><BadgeIndianRupee/>₹</span><input aria-label="Target selling price" type="number" value={price} onChange={e=>setPrice(+e.target.value)}/></label><label>Maker cost <span><BadgeIndianRupee/>₹</span><input aria-label="Estimated maker cost" type="number" value={makerCost} onChange={e=>setMakerCost(+e.target.value)}/></label></div><div className="margin"><span>Projected gross margin</span><strong>₹{Math.max(0,price-makerCost).toLocaleString('en-IN')}</strong><small>{Math.max(0,Math.round((price-makerCost)/Math.max(1,price)*100))}% before delivery and platform costs</small></div><div className="impact-row"><span><b>{plan.placements.reduce((sum,p)=>sum+p.width*p.height*p.thickness*0.00000065,0).toFixed(1)} kg</b> reclaimed</span><span><b>{Math.round(plan.utilization*100)}%</b> utilized</span></div><button className="listing" disabled={!plan.valid} onClick={()=>exportListing(plan,productNames[product],price,makerCost)}><Download/>Download maker listing</button><p>Commercial figures are editable assumptions. No checkout or order is created.</p></section>
        <div className="exports"><small>FABRICATION EXPORTS</small><div><button disabled={!plan.valid} onClick={()=>exportSvg(plan,stocks)}><Download/>SVG</button><button disabled={!plan.valid} onClick={()=>exportDxf(plan)}><Download/>DXF</button><button disabled={!plan.valid} onClick={()=>exportCsv(plan)}><Download/>CSV</button></div></div>
      </aside>
    </section>
  </main>;
}
