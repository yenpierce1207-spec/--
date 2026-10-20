(function(root){
function inspect(G,s,d,outcome=null,hour=9){
 const cards=[],add=(title,text,target='orders')=>cards.push({title,text,target});
 const cash=n=>'$'+Math.round(n).toLocaleString('zh-TW');
 if(outcome){
  const logs=outcome.logs.filter(l=>l.time<=hour);
  if(!logs.length)add('開門巡場','尚未到第一個銷售回報時段。先確認加工與到貨安排。','production');
  logs.forEach(l=>add(l.time+':00 現場回報',l.entries.filter(e=>e.lost).map(e=>`${e.name}缺 ${e.lost} 包`).join('；')||'這個時段各品項需求都有滿足。','inventory'));
  if(hour<22){
   add('當班與休息',Object.entries(G.shifts).map(([id,sh])=>`${sh.name} ${G.staffing(d)[id]} 人：${sh.windows.some(([a,b])=>hour>=a&&hour<b)?'工作中':hour>=sh.windows[0][1]&&hour<sh.windows[1][0]?'休息中':'未在班'}`).join('；'),'production');
   add('接下來怎麼做',hour<14?'外購雞肉與火鍋肉片 14:00 到貨，無法回補午間缺貨。':'檢查後續加工能否接上晚間需求。這一輪安排已鎖定，可於收班後重演調整。','production');
  }else{
   const lost=outcome.rows.filter(r=>r.lost),waste=outcome.rows.filter(r=>r.waste);
   add('明天的供應重點',lost.length?lost.map(r=>`${r.name}全天缺 ${r.lost} 包`).join('；')+'。先對照缺貨時段，調整到貨與加工完成時間，再決定是否加量。':'今天沒有缺貨，明天仍需重新核對需求與剩餘庫存。','finance');
   add('報廢檢討',waste.length?waste.map(r=>`${r.name}報廢成本 ${cash(r.waste)}`).join('；')+'。優先處理近效期批次，再評估減少叫貨或加工。':'今天沒有到期報廢。隔天仍要留意保留批次的效期。','inventory');
   add('人工與利益',`人事成本 ${cash(outcome.labor)}（每人每小時 ${cash(G.hourlyRate)}，休息不計薪），可控利益 ${cash(outcome.profit)}。比較班別供應時點後再調整人數，避免只省人工卻擴大缺貨。`,'finance');
  }
  return cards;
 }
 const errors=G.validate(s,d);errors.forEach(e=>add('草稿需要修正',e,'production'));
 const exp=s.batches.filter(b=>b.exp<=s.day&&b.qty>0);
 add('今日效期',exp.length?exp.map(b=>`${G.products.find(p=>p.id===b.id).name}${b.type==='raw'?'原料':'成品'} ${b.qty}${b.type==='raw'?'公斤':'包'}`).join('；')+'今日到期，優先使用與銷售。':'目前沒有今日到期批次。','inventory');
 if(errors.length)return cards;
 const jobs=G.schedule(s,d),forecast=G.scenario(s.day).forecast;
 G.products.forEach((p,i)=>{
  const base=G.sum(s.batches,p.id,'finished')+(p.id==='japan'?d.orders.japan:0),own=jobs.filter(j=>j.p.id===p.id),noon=base+own.filter(j=>j.finish<=12).length*(p.yield||0),total=base+own.length*(p.yield||0)+(p.id==='chicken'?d.orders.chickenPack:p.id==='hotpot'?d.orders.hotpot:0),need=Math.round(forecast[i]*.4);
  if(noon<need)add(p.name+'｜午間供應提醒',`12:00 前可供 ${noon} 包，午間需求參考約 ${need} 包，可能短缺 ${need-noon} 包。${p.raw?'可檢查早班加工順序與原料數量。':'請留意成品到貨時間。'}下午到貨無法補回午間客人。`,p.raw?'production':'orders');
  if(total>Math.ceil(forecast[i]*1.15))add(p.name+'｜供應偏多',`全天供應 ${total} 包，高於需求參考上緣 ${Math.ceil(forecast[i]*1.15)} 包。先看效期與隔日需求，再決定減少叫貨或加工。`);
 });
 const gaps=[];for(let h=11;h<22;h+=.5)if(!Object.entries(G.shifts).some(([id,sh])=>d.staff[id]>0&&sh.windows.some(([a,b])=>h>=a&&h<b)))gaps.push(`${String(Math.floor(h)).padStart(2,"0")}:${h%1?"30":"00"}–${String(Math.floor(h+.5)).padStart(2,"0")}:${(h+.5)%1?"30":"00"}`);
 add('班別銜接',gaps.length?`${gaps.join('、')} 沒有排班人員。此模型人力影響加工，請檢查補貨銜接。`:'營業時段皆有排班人員；仍需確認各商品加工完成時間。','production');
 add('休息安排','早班 13:00–14:00；中班 15:00–16:00；晚班 17:00–18:00；短班 12:00–12:30。加工排程已自動避開休息時間。','production');
 return cards;
}
root.Deputy={inspect};if(typeof module!=='undefined')module.exports=root.Deputy;
})(typeof window==='undefined'?globalThis:window);
