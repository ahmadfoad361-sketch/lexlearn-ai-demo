"use strict";
const {spawn}=require("node:child_process");
const {performance}=require("node:perf_hooks");
const students=500,parallel=25,queue=Array.from({length:students},(_,i)=>i+1);
const results=[],failure=[];
function runOne(i){
 return new Promise((resolve,reject)=>{
  const id="00000000-0000-4000-8000-"+String(i).padStart(12,"0");
  const sql=`set role service_role; select id from public.lex_ai_queue_admit('${id}'::uuid,'diagnostic','qa-qu-lawc101-rights',null,null);`;
  const t=performance.now(),child=spawn("psql",["-X","-q","-t","-A","-v","ON_ERROR_STOP=1","-c",sql],{env:process.env});
  let stderr="",stdout="";
  child.stderr.on("data",x=>stderr+=x);child.stdout.on("data",x=>stdout+=x);
  child.on("error",reject);
  child.on("exit",code=>{
   if(code!==0||!/[a-f0-9]{8}-[a-f0-9-]{27}/i.test(stdout))return reject(new Error("Student "+i+" SQL operation failed: "+stderr.slice(0,300)));
   resolve(performance.now()-t);
  });
 });
}
async function worker(){
 while(queue.length){
  const i=queue.shift();
  try{results.push(await runOne(i));}catch(e){failure.push(e.message);}
 }
}
async function main(){
 const started=performance.now();
 await Promise.all(Array.from({length:parallel},()=>worker()));
 const elapsed=(performance.now()-started)/1000;
 const sorted=results.slice().sort((a,b)=>a-b);
 const p95=sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]||0;
 console.log(JSON.stringify({operations:results.length,errors:failure.length,concurrent_db_clients:parallel,elapsed_seconds:Math.round(elapsed*100)/100,p95_sql_ms:Math.round(p95)},null,2));
 if(failure.length){console.error(failure.slice(0,3));process.exitCode=1;}
 if(results.length!==students)process.exitCode=1;
 if(p95>5000)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
