const assert=require('node:assert/strict'),G=require('../dist/engine.js');let s=G.initial(),d=G.draft(),r=G.simulate(s,d);assert.equal(G.resources(s,d).cost,11740);assert.deepEqual(s,G.initial());assert.deepEqual(r,G.simulate(s,d));let initialValue=s.batches.reduce((a,b)=>a+b.qty*b.cost,0);assert.ok(Math.abs(initialValue+r.purchase-r.cogs-r.waste-r.inventoryValue)<.001);let late=G.draft();Object.keys(late.orders).forEach(k=>late.orders[k]=0);Object.keys(late.production).forEach(k=>late.production[k]=0);late.orders.chickenPack=100;let x=G.simulate(s,late);assert.equal(x.logs[0].entries[0].sold,20);assert.ok(x.logs[0].entries[0].lost>0);late.production.chicken=999;assert.ok(G.validate(s,late).length);for(let day=1;day<=14;day++){let p=G.draft();G.products.filter(x=>x.raw).forEach(x=>p.production[x.id]=Math.min(p.production[x.id],G.sum(s.batches,x.id,'raw')+p.orders[x.id]));let out=G.simulate(s,p);assert.ok(out.batches.every(b=>b.qty>=0&&b.exp>day));assert.ok(Number.isFinite(out.profit));s={day:day+1,batches:out.batches,history:[...s.history,out]};}console.log('PASS: costing conservation, late delivery, deterministic replay, constraints and 14-day progression');
// Every shift must pause for its one-hour break, not just cap its total minutes.
for(const [shift,windows] of Object.entries(G.shifts).filter(([id])=>id!=="short")){
 let st=G.initial(),d=G.draft();d.staff={early:0,middle:0,late:0};d.staff[shift]=1;Object.keys(d.production).forEach(k=>d.production[k]=0);d.production.chicken=15;d.orders.chicken=15;let jobs=G.schedule(st,d);assert.ok(Math.abs(jobs[12].start-windows.windows[1][0])<.0001,shift+' should resume after break');assert.ok(Math.abs(jobs[14].finish-(windows.windows[1][0]+1))<.0001);assert.equal(G.resources(st,d).capacity,480);assert.equal(G.resources(st,d).labor,2000);
}
let empty=G.draft();empty.staff={early:0,middle:0,late:0};assert.ok(G.validate(G.initial(),empty).some(x=>x.includes('工時')));
console.log('PASS: early/middle/late breaks, 8-hour capacity and per-shift labor costs');
{
 const d=G.draft(),s=G.initial(),r=G.simulate(s,d);
 assert.equal(G.laborHours(d),24);assert.equal(r.labor,6000);
 const old={...r,labor:10800,profit:r.profit-4800};
 G.repriceResult(old);assert.equal(old.profit,r.profit);assert.equal(old.labor,6000);
 G.repriceResult(old);assert.equal(old.profit,r.profit);
 assert.deepEqual(old.batches,r.batches);
 console.log('PASS: 250 hourly rate, three-shift total and idempotent saved-result migration');
}

{
 const d=G.draft(),s=G.initial();d.staff={early:0,middle:0,late:0,short:1};d.production={chicken:16,beef:0,wagyu:0,omi:0};d.orders.chicken=16;
 const jobs=G.schedule(s,d);assert.equal(jobs[9].start,12.5);assert.equal(jobs[15].finish,14+50/60);
 assert.equal(G.resources(s,d).capacity,330);assert.equal(G.resources(s,d).labor,1375);
 d.production.chicken=17;assert(G.validate(s,d).length>0);
 assert.equal(G.staffing({staff:{early:1,middle:1,late:1}}).short,0);
 console.log('PASS: short shift break, 330 minutes, $1375, overtime rejection and old saves');
}
