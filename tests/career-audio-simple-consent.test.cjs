const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('one optional transcription choice; unchecked still records and sends audio without requiring text',async()=>{
 for(const transcribe of [false,true]){
 let card,mics=0,speeches=0,uploads=0,rows=[];const elements={};
 const el=()=>({disabled:false,checked:false,textContent:'',hidden:true});
 const document={createElement:()=>{card={isConnected:true,lang:'ar',innerHTML:'',querySelector:s=>elements[s]||(elements[s]=el()),remove(){this.isConnected=false;}};return card;}};
 class Recorder{static isTypeSupported(){return true;}constructor(){Recorder.current=this;}start(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable({data:new Blob(['synthetic-audio'])});this.onstop();}}
 class Speech{start(){speeches++;}stop(){}}
 const db={functions:{invoke:async(name,{body})=>body.action==='status'?{data:{saved:false}}:(uploads++,{data:{ok:true}})},from:()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:null}),insert:async r=>{rows.push(r);return {};}};return q;}};
 const node={insertAdjacentElement(){},querySelector:()=>({value:'',dataset:{}}),querySelectorAll:()=>[]};
 const window={addEventListener(){},MediaRecorder:Recorder,SpeechRecognition:Speech,LEX_CLOUD:{db:()=>db}};
 const context={window,document,navigator:{mediaDevices:{getUserMedia:async()=>{mics++;return {getTracks:()=>[{stop(){}}]};}}},MediaRecorder:Recorder,Blob,FormData,URL,setTimeout,clearTimeout,Date};
 vm.runInNewContext(fs.readFileSync('assets/career-audio.js','utf8'),context);
 await window.LEX_CAREER_AUDIO.mount(node,{uid:'test-only',n:2,choice:'judge',role:'judge',side:'claimant',version:'career-roles-v2',sourceItemId:'approved-fixture',lang:'ar'});
 assert.equal((card.innerHTML.match(/type=checkbox/g)||[]).length,1);assert.ok(!card.innerHTML.includes('data-consent'));
 elements['[data-transcribe]']={checked:transcribe};await elements['[data-start]'].onclick();assert.equal(mics,1);assert.equal(speeches,Number(transcribe));elements['[data-stop]'].onclick();await elements['[data-upload]'].onclick();assert.equal(uploads,1);assert.equal(rows.length,1);assert.match(rows[0].answer_text,/إجابة صوتية/);assert.equal(rows[0].student_id,'test-only');
 }
});
