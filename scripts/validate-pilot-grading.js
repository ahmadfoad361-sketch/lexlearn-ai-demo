#!/usr/bin/env node
"use strict";
// Dedicated live preview benchmark for pilot-grade. NEVER print tokens or API keys.
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");

function arg(name,fallback){const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];}
const live=process.argv.includes("--live");
const benchmarkFile=path.resolve(arg("--benchmark","validation/pilot-semantic-benchmark.json"));
const outputFile=path.resolve(arg("--output","validation/pilot-live-report.local.json"));
const limit=Number(arg("--limit","0")),start=Number(arg("--start","0"));
const safeStages=new Set(["step3","step4","step5","day1","day7"]);
const safeExpected=new Set(["pass","reject","review"]);

function verify(data){
 assert.equal(data.course_id,"qa-qu-lawc101-rights");
 assert.ok(Array.isArray(data.cases)&&data.cases.length>=160,"Expected all topic/stage/language/variant cases");
 const ids=new Set(),matrix=new Set(),variants=new Set();
 for(const c of data.cases){
  assert.ok(c.id&&!ids.has(c.id),"Duplicate or missing case ID");ids.add(c.id);
  assert.ok([1,22].includes(c.topic)&&safeStages.has(c.stage)&&["ar","en"].includes(c.language));
  assert.ok(safeExpected.has(c.expected)&&typeof c.answer==="string"&&c.answer.trim().length>=10&&c.answer.length<=12000);
  assert.equal(c.review_status,"pending_human_review","The benchmark has not received formal review");
  matrix.add([c.topic,c.stage,c.language].join("-"));variants.add(c.variation);
 }
 assert.equal(matrix.size,20,"Missing one or more topic/stage/language combinations");
 for(const v of ["correct","rephrased","incorrect","incomplete","ambiguous","verbose_no_substance","quoted_error_corrected","prompt_injection"])assert.ok(variants.has(v),v);
 return {cases:data.cases.length,combinations:matrix.size,variants:[...variants].sort()};
}
function outcome(g){if(g?.passed===true&&g?.status==="scored"&&Number.isFinite(Number(g.score)))return "pass";if(g?.passed===false&&g?.status==="scored")return "reject";if(g?.passed===null&&g?.score===null)return "review";return "invalid";}
function matches(expected,observed){return expected==="reject"?observed==="reject"||observed==="review":expected===observed;}

async function main(){
 const data=JSON.parse(fs.readFileSync(benchmarkFile,"utf8"));
 const checked=verify(data);
 if(!live){console.log("Pilot benchmark structure valid:",JSON.stringify(checked));console.log("This is NOT a live accuracy test. No releases or approvals were changed.");return;}
 const token=process.env.LEX_VALIDATION_TOKEN,apiKey=process.env.LEX_SUPABASE_ANON_KEY;
 const url=process.env.LEX_SUPABASE_URL;
 if(!token||!apiKey||!url)throw Error("Set secure LEX_VALIDATION_TOKEN (staff session), LEX_SUPABASE_ANON_KEY and LEX_SUPABASE_URL in the local environment.");
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url))throw Error("Invalid Supabase URL.");
 if(!Number.isInteger(limit)||limit<0||!Number.isInteger(start)||start<0)throw Error("Invalid --limit/--start");
 const selected=data.cases.slice(start,limit?start+limit:undefined);
 const results=[];
 for(const [i,c] of selected.entries()){
  let observed="unavailable",status=0,grade=null,errorCode=null;
  try{
   const res=await fetch(url.replace(/\/$/,"")+"/functions/v1/pilot-grade",{method:"POST",headers:{"Content-Type":"application/json",apikey:apiKey,Authorization:"Bearer "+token},body:JSON.stringify({preview:true,topic:c.topic,stage:c.stage,answer:c.answer,language:c.language}),signal:AbortSignal.timeout(30000)});
   status=res.status;
   const body=await res.json();
   if(res.ok&&!body?.error){grade={status:body.status,passed:body.passed,score:body.score,feedback:body.feedback,model_confidence:body.model_confidence,criteria:body.criteria,source_ids:body.source_ids};observed=outcome(grade);}
   else{errorCode=String(body?.error||"http_error").slice(0,80);}
  }catch(e){errorCode=e?.name==="TimeoutError"?"timeout":"transport_error";}
  const match=matches(c.expected,observed);
  results.push({id:c.id,topic:c.topic,stage:c.stage,language:c.language,variation:c.variation,expected:c.expected,observed,match,http_status:status,error_code:errorCode,grade});
  console.log((start+i+1)+"/"+data.cases.length+" "+c.id+": "+(match?"OK":"MISMATCH")+" ("+observed+")");
 }
 const failures=results.filter(x=>!x.match);
 const report={generated_at:new Date().toISOString(),project_ref:new URL(url).hostname.split(".")[0],function_name:"pilot-grade",function_mode:"preview",benchmark_path:path.relative(process.cwd(),benchmarkFile),total_in_benchmark:checked.cases,executed:results.length,matched:results.length-failures.length,mismatches:failures.map(x=>({id:x.id,expected:x.expected,observed:x.observed,error_code:x.error_code})),human_review_completed:false,student_session_verified:false,content_review_approved:false,release_authorized:false,results};
 fs.mkdirSync(path.dirname(outputFile),{recursive:true});
 fs.writeFileSync(outputFile,JSON.stringify(report,null,2)+"\n",{mode:0o600});
 console.log("Report written locally. Human adjudication, real student and supervisor testing are still mandatory.");
 console.log("Mismatches:",failures.length,"of",results.length);
 if(failures.length||!results.length)process.exitCode=1;
}
main().catch(e=>{console.error("Pilot validation failed:",e.message.includes("LEX_")?e.message:"Check benchmark, network and authorized session; details withheld.");process.exitCode=1;});
