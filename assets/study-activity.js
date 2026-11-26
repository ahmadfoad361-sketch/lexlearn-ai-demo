/* LexLearn: descriptive, best-effort training activity only. Never used for grading. */
(function(root){
"use strict";
var TYPES=["STUDY_VISIT_START","STUDY_HEARTBEAT","STUDY_VISIT_END","STUDY_BREAK_SHOWN","STUDY_STOP_SHOWN","STUDY_BREAK_STARTED","STUDY_BREAK_COMPLETED","STUDY_BREAK_DISMISSED"];
var COURSE="qa-qu-lawc101-rights",MAX_ROWS=1500,IDLE=300000;
function id(){return root.crypto.randomUUID();}
function safeId(s){return typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);}
function createTracker(o){
 var uid=o.uid,db=o.db,clock=o.clock||Date.now,storage=o.storage,makeId=o.makeId||id;
 var key="lexlearn:study-visit:v1:"+uid+":"+COURSE,visit=null,pending=0,firstTick=true,lastWrite=0,stopped=false;
 function read(){try{return JSON.parse(storage.getItem(key)||"null");}catch(_){return null;}}
 function save(){try{storage.setItem(key,JSON.stringify(visit));}catch(_){}}
 function emit(type,details){
  if(stopped||!visit)return Promise.resolve(false);
  var data=Object.assign({v:1,visit_id:visit.id,event_id:makeId()},details||{});
  // The owner is fixed at initialization. RLS must independently verify auth.uid().
  return Promise.resolve().then(function(){return db.from("activity_events").insert({user_id:uid,course_id:COURSE,event_type:type,event_data:data});})
   .then(function(r){return !r.error;},function(){return false;});
 }
 function touch(){
  var now=clock();
  if(!visit||now-visit.last>IDLE){
   if(visit)flush();
   var previous=read();
   visit=previous&&safeId(previous.id)&&Number.isFinite(previous.last)&&now>=previous.last&&now-previous.last<=IDLE?previous:{id:makeId(),last:now};
   if(visit!==previous)emit("STUDY_VISIT_START");
   firstTick=true;lastWrite=now;
  }
  visit.last=now;save();
 }
 function flush(){
  if(!pending||!visit)return;
  var seconds=Math.min(60,Math.round(pending));pending=0;lastWrite=clock();
  if(seconds>0)emit("STUDY_HEARTBEAT",{active_seconds:seconds});
 }
 function active(delta){
  if(stopped)return;
  touch();
  // Only a visible, focused tab with the coach's active lease calls this.
  if(firstTick){firstTick=false;return;}
  pending+=Math.min(15,Math.max(0,Number(delta)||0));
  if(pending>=60||clock()-lastWrite>=60000)flush();
 }
 function event(type,details){
  if(stopped||!TYPES.includes(type)||type==="STUDY_HEARTBEAT")return;
  // An open break can last longer than the active-visit idle timeout.
  // Keep the break outcome in the original work period, not a fabricated new one.
  if(visit&&(type==="STUDY_BREAK_STARTED"||type==="STUDY_BREAK_COMPLETED"||type==="STUDY_BREAK_DISMISSED")){visit.last=clock();save();}
  else touch();
  flush();emit(type,details);
 }
 function pagehide(){flush();if(visit)emit("STUDY_VISIT_END",{reason:"pagehide"});}
 function stop(){stopped=true;pending=0;}
 return {active:active,event:event,pagehide:pagehide,stop:stop};
}
function summarize(rows){
 var map=new Map(),seen=new Set();
 (Array.isArray(rows)?rows:[]).slice().sort(function(a,b){return String(a.created_at||"").localeCompare(String(b.created_at||""));}).forEach(function(r){
  var d=r.event_data||{},t=Date.parse(r.created_at);
  if(r.course_id!==COURSE||!TYPES.includes(r.event_type)||d.v!==1||!safeId(d.visit_id)||!safeId(d.event_id)||!Number.isFinite(t)||seen.has(d.event_id))return;
  seen.add(d.event_id);
  var a=map.get(d.visit_id);
  if(!a){a={id:d.visit_id,start:t,last:t,started:false,active:0,prompts:new Set(),stops:new Set(),breakStarts:new Set(),breakEnds:new Set(),dismissed:new Set(),end:null};map.set(d.visit_id,a);}
  a.last=Math.max(a.last,t);
  if(r.event_type==="STUDY_VISIT_START"){a.started=true;a.start=Math.min(a.start,t);}
  if(r.event_type==="STUDY_VISIT_END")a.end=t;
  if(r.event_type==="STUDY_HEARTBEAT"&&Number.isFinite(d.active_seconds))a.active+=Math.max(0,Math.min(60,Math.round(d.active_seconds)));
  if(r.event_type==="STUDY_BREAK_SHOWN"&&safeId(d.prompt_id))a.prompts.add(d.prompt_id);
  if(r.event_type==="STUDY_STOP_SHOWN"&&safeId(d.prompt_id))a.stops.add(d.prompt_id);
  if(r.event_type==="STUDY_BREAK_STARTED"&&safeId(d.break_id))a.breakStarts.add(d.break_id);
  if(r.event_type==="STUDY_BREAK_COMPLETED"&&safeId(d.break_id))a.breakEnds.add(d.break_id);
  if(r.event_type==="STUDY_BREAK_DISMISSED"&&safeId(d.prompt_id))a.dismissed.add(d.prompt_id);
 });
 return Array.from(map.values()).map(function(a){
  return {id:a.id,start:new Date(a.start).toISOString(),last:new Date(a.last).toISOString(),exactStart:a.started,
   pageClosed:a.end===a.last,activeSeconds:Math.min(a.active,Math.max(0,Math.floor((a.last-a.start)/1000))),
   shown:a.prompts.size,stopShown:a.stops.size,started:a.breakStarts.size,completed:[...a.breakEnds].filter(x=>a.breakStarts.has(x)).length,
   dismissed:[...a.dismissed].filter(x=>a.prompts.has(x)||a.stops.has(x)).length};
 }).sort((a,b)=>b.last.localeCompare(a.last));
}
function date(s){return new Date(s).toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Cairo"});}
function render(rows,truncated){
 var visits=summarize(rows);
 if(!visits.length)return '<p>لا يوجد سجل تدريب واستراحات متاح في هذه الفترة. لا يعني ذلك أن الطالب لم يدخل أو أن الاستراحات لم تظهر.</p>';
 var totals=visits.reduce((a,v)=>({seconds:a.seconds+v.activeSeconds,shown:a.shown+v.shown,started:a.started+v.started,completed:a.completed+v.completed,stop:a.stop+v.stopShown}),{seconds:0,shown:0,started:0,completed:0,stop:0});
 return '<p><b>'+visits.length+' فترة عمل مرصودة · '+Math.round(totals.seconds/60)+' دقيقة نشاط تقديرية · '+totals.shown+' تنبيه استراحة · '+totals.stop+' تنبيه اكتفاء يومي · '+totals.started+' استراحة بدأت · '+totals.completed+' اكتملت</b></p>'+
 (truncated?'<p role="status">السجل المعروض جزئي (أحدث '+MAX_ROWS+' حدثًا فقط).</p>':'')+
 '<div style="overflow-x:auto"><table class="dataTable" style="width:100%;text-align:start"><thead><tr><th>من</th><th>آخر نشاط / نهاية مرصودة</th><th>دقائق نشطة</th><th>ظهرت</th><th>بدأت</th><th>اكتملت</th><th>أُغلق التنبيه</th><th>اكتفاء يومي</th></tr></thead><tbody>'+
 visits.map(v=>'<tr><td>'+date(v.start)+(v.exactStart?'':' (أول حدث متاح)')+'</td><td>'+date(v.last)+(v.pageClosed?' (مغادرة صفحة)':' (آخر حدث)')+'</td><td>'+Math.round(v.activeSeconds/60)+'</td><td>'+v.shown+'</td><td>'+v.started+'</td><td>'+v.completed+'</td><td>'+v.dismissed+'</td><td>'+v.stopShown+'</td></tr>').join("")+
 '</tbody></table></div><p>التوقيت: القاهرة. القياس تقديري من المتصفح، لا يثبت تسجيل الخروج أو مدة التركيز الذهني، وقد يفوّت نشاطًا عند انقطاع الاتصال. لا تدخل هذه المؤشرات في الدرجات. الاستراحات السابقة لتفعيل التسجيل غير قابلة للاسترجاع.</p>';
}
async function loadInto(node,uid,days,cloud){
 if(!node||!safeId(uid))return;
 node.textContent="جارٍ تحميل نشاط التدريب والاستراحات…";
 try{
  var me=await cloud.profile();
  if(!me||me.active!==true||!["owner","admin"].includes(me.role))throw Error("forbidden");
  var db=cloud.db(),rows=[],since=new Date(Date.now()-Math.min(90,Math.max(1,Number(days)||30))*86400000).toISOString();
  for(var offset=0;offset<=MAX_ROWS;offset+=500){
   var r=await db.from("activity_events").select("id,course_id,event_type,event_data,created_at").eq("user_id",uid).eq("course_id",COURSE).in("event_type",TYPES).gte("created_at",since).order("created_at",{ascending:false}).order("id",{ascending:false}).range(offset,offset+499);
   if(r.error)throw r.error;
   rows.push(...(r.data||[]));if((r.data||[]).length<500)break;
  }
  if(node.isConnected)node.innerHTML=render(rows.slice(0,MAX_ROWS),rows.length>MAX_ROWS);
 }catch(_){if(node.isConnected)node.textContent="تعذر التحقق من سجل التدريب والاستراحات؛ لا توجد أرقام مؤكدة لعرضها.";}
}
var api={createTracker:createTracker,summarize:summarize,render:render,loadInto:loadInto};
root.LEX_STUDY_ACTIVITY=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
