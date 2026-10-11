const intersects = (a,b,gap=0) => a.x < b.x+b.width+gap && a.x+a.width+gap > b.x && a.y < b.y+b.height+gap && a.y+a.height+gap > b.y;

function orientations(part,stock){
  if(part.grain!=='none' && stock.grain!=='none' && part.grain!==stock.grain) return [];
  const shapes=[{width:part.width,height:part.height,rotated:false}];
  if(part.width!==part.height && part.grain==='none') shapes.push({width:part.height,height:part.width,rotated:true});
  return shapes;
}

export function validateScenario(input){
  if(!input || typeof input!=='object') throw new Error('Scenario must be a JSON object');
  if(!Array.isArray(input.parts) || !input.parts.length || input.parts.length>250) throw new Error('parts must contain 1-250 items');
  if(!Array.isArray(input.stocks) || !input.stocks.length || input.stocks.length>50) throw new Error('stocks must contain 1-50 items');
  const kerf=Number(input.kerfMm ?? input.kerf ?? 0);
  if(!Number.isFinite(kerf) || kerf<0 || kerf>20) throw new Error('kerfMm must be between 0 and 20');
  const ids=new Set();
  for(const part of input.parts){
    if(!part.id || ids.has(part.id)) throw new Error('Every part must have a unique id');
    ids.add(part.id);
    if(![part.width,part.height,part.thickness].every(value=>Number.isFinite(value)&&value>0)) throw new Error(`${part.id}: dimensions must be positive numbers`);
  }
  for(const stock of input.stocks){
    if(!stock.id || ![stock.width,stock.height,stock.thickness].every(value=>Number.isFinite(value)&&value>0)) throw new Error('Every stock item needs an id and positive dimensions');
    if(!Array.isArray(stock.defects)) stock.defects=[];
  }
  return {...input,kerfMm:kerf};
}

export function solveScenario(raw){
  const input=validateScenario(structuredClone(raw));
  const started=performance.now(); const placements=[]; const unplaced=[];
  const parts=[...input.parts].sort((a,b)=>b.width*b.height-a.width*a.height);
  for(const part of parts){
    let best; let score=Infinity;
    for(const stock of input.stocks.filter(item=>item.thickness===part.thickness)) for(const shape of orientations(part,stock)){
      const onStock=placements.filter(item=>item.stockId===stock.id);
      const xs=new Set([0,...onStock.map(item=>item.x+item.width+input.kerfMm),...stock.defects.map(defect=>defect.x+defect.width+input.kerfMm)]);
      const ys=new Set([0,...onStock.map(item=>item.y+item.height+input.kerfMm),...stock.defects.map(defect=>defect.y+defect.height+input.kerfMm)]);
      for(const y of [...ys].sort((a,b)=>a-b)) for(const x of [...xs].sort((a,b)=>a-b)){
        const candidate={...part,...shape,x,y,stockId:stock.id};
        if(x+shape.width>stock.width || y+shape.height>stock.height) continue;
        if(stock.defects.some(defect=>intersects(candidate,defect,input.kerfMm)) || onStock.some(other=>intersects(candidate,other,input.kerfMm))) continue;
        const nextScore=y*stock.width+x;
        if(nextScore<score){best=candidate;score=nextScore;}
      }
    }
    if(best) placements.push(best); else unplaced.push({id:part.id,label:part.label});
  }
  const errors=[];
  for(const placement of placements){
    const stock=input.stocks.find(item=>item.id===placement.stockId);
    if(!stock) errors.push(`${placement.id}: stock missing`);
    else {
      if(placement.x<0||placement.y<0||placement.x+placement.width>stock.width||placement.y+placement.height>stock.height) errors.push(`${placement.id}: outside stock`);
      if(stock.thickness!==placement.thickness) errors.push(`${placement.id}: thickness mismatch`);
      if(placement.grain!=='none'&&stock.grain!=='none'&&placement.grain!==stock.grain) errors.push(`${placement.id}: grain mismatch`);
      if(stock.defects.some(defect=>intersects(placement,defect,input.kerfMm))) errors.push(`${placement.id}: intersects defect`);
    }
  }
  for(let i=0;i<placements.length;i++) for(let j=i+1;j<placements.length;j++) if(placements[i].stockId===placements[j].stockId&&intersects(placements[i],placements[j],input.kerfMm)) errors.push(`${placements[i].id}: overlaps ${placements[j].id}`);
  for(const part of input.parts) if(placements.filter(item=>item.id===part.id).length!==1) errors.push(`${part.id}: expected one placement`);
  const availableArea=input.stocks.reduce((sum,stock)=>sum+Math.max(0,stock.width*stock.height-stock.defects.reduce((area,defect)=>area+defect.width*defect.height,0)),0);
  const usedArea=placements.reduce((sum,item)=>sum+item.width*item.height,0);
  const offer=input.offer&&typeof input.offer==='object'?{
    currency:'INR',
    projectedRevenue:Number(input.offer.pricePerUnit||0)*Number(input.offer.quantity||1),
    projectedContribution:Number(input.offer.pricePerUnit||0)*Number(input.offer.quantity||1)-(Number(input.offer.makerCostPerUnit||0)+Number(input.offer.shippingPerUnit||0))*Number(input.offer.quantity||1)-Number(input.offer.pricePerUnit||0)*Number(input.offer.quantity||1)*Number(input.offer.channelFeePercent||0)/100,
    status:'USER_SUPPLIED_ASSUMPTIONS'
  }:undefined;
  return {modelVersion:'scrapform-layout-v1',validationStatus:errors.length===0&&unplaced.length===0?'PASSED':'FAILED',units:{length:'mm',area:'mm2'},placements,unplaced,errors:[...new Set(errors)],utilization:availableArea?usedArea/availableArea:0,usedArea,availableArea,kerfMm:input.kerfMm,offer,runtimeMs:+(performance.now()-started).toFixed(3),sourceReferences:['2DPackLib BENG benchmark format']};
}
