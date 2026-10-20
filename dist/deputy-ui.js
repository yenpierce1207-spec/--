navs.push(['deputy','副主任巡場','06']);
pages.deputy=()=>{
 const h=result?22:pendingOutcome?parseInt(playbackEvents()[playStep].time):9;
 const cards=Deputy.inspect(G,state,plan,result||pendingOutcome,h);
 return heading('DEPUTY MANAGER','副主任｜現場巡查簿',`${h}:00 · ${result?'收班檢討':pendingOutcome?'營業中回報':'開店前檢查'} · 建議由主任確認後調整`)+`<div class="notice">${result?'依今天的實際銷售與報廢整理改善方向。':pendingOutcome?'只顯示目前時段已發生的回報。叫貨與排班已鎖定，收班後可重演調整。':'依目前草稿與預估需求檢查，每次修改後重新更新。需求參考不是保證銷量。'}</div><div class="two">${cards.map(c=>`<section class="panel"><span class="tag">副主任提醒</span><h3>${c.title}</h3><p>${c.text}</p><button class="secondary" data-view="${c.target}">查看${navs.find(n=>n[0]===c.target)[1]} →</button></section>`).join('')}</div>${pendingOutcome?'<button class="primary" data-action="guide">繼續現場回報 →</button>':result?'<button class="primary" data-action="replay">依建議修改・重演今天 →</button>':''}`;
};
function openDeputy(){view='deputy';started=true;sceneOnly=false;render()}
