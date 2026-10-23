const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const moments=require('../assets/learning-moments.js');
assert.equal(moments.score('90'),null);assert.equal(moments.score(101),null);assert.equal(moments.score(0),0);
for(const lang of ['ar','en']){
 const image=moments.resultSvg({kind:'level',level:2,recall:80,understanding:null},lang);
 assert.ok(image.startsWith('<svg'));assert.ok(image.includes('80%'));assert.ok(image.includes(lang==='ar'?'قيد المراجعة':'Under review'));
 assert.ok(!image.includes('null%')&&!image.includes('undefined')&&!image.includes('>0%</text>'));
 assert.ok(moments.hero({kind:'level',level:'<script>'},lang).includes(lang==='ar'?'المستوى 1':'Level 1'));
 assert.equal((moments.completion({kind:'level',level:2},lang).match(/class='earned'/g)||[]).length,2);
 assert.ok(!moments.completion({kind:'session',session:1,level:1},lang).includes("class='earned'"),'one session must not award a completed level');
}
function animationEnvironment(reduce){
 const layers=[],storage=new Map(),timers=[];
 function element(){return {style:{},children:[],appendChild(x){this.children.push(x);},setAttribute(){},remove(){this.removed=true;}};}
 const window={matchMedia:()=>({matches:reduce}),sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{createElement:element},setTimeout:f=>timers.push(f)};window.window=window;
 vm.runInNewContext(fs.readFileSync('assets/learning-moments.js','utf8'),window);
 return {api:window.LEX_MOMENTS,host:{appendChild:x=>layers.push(x)},layers,timers};
}
const reduced=animationEnvironment(true);assert.equal(reduced.api.celebrate(reduced.host,'one'),false);assert.equal(reduced.layers.length,0);
const animated=animationEnvironment(false);assert.equal(animated.api.celebrate(animated.host,'one'),true);assert.equal(animated.layers[0].children.length,44);assert.equal(animated.api.celebrate(animated.host,'one'),false);animated.timers[0]();assert.equal(animated.layers[0].removed,true);
// Drive the real student submit flow: celebrate only after a confirmed checkpoint save.
async function lifecycle({saveFails=false,session=5,precompleted=false}={}){
 const nodes={},calls=[];let done=precompleted;
 const task={id:'recall',dimension:'recall',prompt_ar:'اكتب القاعدة بأسلوبك.',prompt_en:'Explain the rule.'};
 const saved=()=>done?[{item_id:'recall',dimension:'recall',answer_text:'Saved answer',evaluation:{}}]:[];
 const host={querySelector:s=>nodes[s.slice(1)]||null};
 Object.defineProperty(host,'innerHTML',{set(v){this.html=v;for(const k of Object.keys(nodes))delete nodes[k];for(const m of v.matchAll(/id='([^']+)'/g))nodes[m[1]]={value:'',innerHTML:'',textContent:'',disabled:false};},get(){return this.html;}});
 const cloud={studentLifecycleRpc:async action=>{
  calls.push(action);if(action==='trainingOverview')return {allowed:true,unlocked:session,completed_count:done?session:session-1};
  if(action==='trainingSubmit'){if(saveFails)throw Error('offline');done=true;}
  return {allowed:true,tasks:[task],saved:saved(),completed:done};
 }};
 const visual={...moments,bindDownload(){},celebrate(){calls.push('celebration');}};
 const window={LEX_MOMENTS:visual,LEX_CLOUD:cloud,LEX_OFFICIAL_DIAGNOSTIC:{identity:async()=> 'student'},document:{getElementById:()=>host},URLSearchParams,location:{search:'?session='+session},console};window.window=window;
 vm.runInNewContext(fs.readFileSync('assets/student-path.js','utf8'),window);await window.LEX_STUDENT_PATH.mount();
 if(precompleted){assert.ok(!calls.includes('celebration'),'opening an old report must not replay celebrations');return;}
 nodes.adaptiveEssay.value='Meaningful student answer';await nodes.adaptiveSubmit.onclick();
 assert.equal(calls.includes('celebration'),!saveFails&&session%5===0);
 if(!saveFails&&session%5===0)assert.ok(calls.lastIndexOf('trainingOpen')<calls.indexOf('celebration'),'read back persisted work before celebration');
 if(saveFails){assert.ok(nodes.adaptiveEssay);assert.equal(nodes.adaptiveEssay.value,'Meaningful student answer');}
}
(async()=>{await lifecycle();await lifecycle({saveFails:true});await lifecycle({session:4});await lifecycle({precompleted:true});console.log('Learning moments: real/missing scores, image export, reduced motion, once-only confetti and confirmed checkpoint completion PASS');})().catch(e=>{console.error(e);process.exitCode=1;});

