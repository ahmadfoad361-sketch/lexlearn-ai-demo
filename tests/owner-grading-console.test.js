const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const raw=fs.readFileSync("supabase/functions/lexlearn-grading-console/index.ts","utf8");
const script=raw.replace("(req:Request)","(req)");
let endpoint;
vm.runInNewContext(script,{Deno:{serve:(f)=>endpoint=f},Response,URL});
(async()=>{
 const u="https://project.supabase.co/functions/v1/lexlearn-grading-console";
 const expected="https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/lexlearn-grading-console.html";
 const res=await endpoint({method:"GET",url:u});
 assert.equal(res.status,302);
 assert.equal(res.headers.get("location"),expected);
 assert.equal(res.headers.get("cache-control"),"no-store");
 assert.equal(res.headers.get("referrer-policy"),"no-referrer");
 assert.equal(await res.text(),"");
 assert.equal((await endpoint({method:"HEAD",url:u})).status,302);
 assert.equal((await endpoint({method:"POST",url:u})).status,405);
 assert.doesNotMatch(raw,/SUPABASE_SERVICE_ROLE_KEY|OPENAI_GRADING_API_KEY|sk-proj-/);
 console.log("LexLearn grading console redirect: PASS (static GitHub Pages HTML, no privileged secrets)");
})().catch(e=>{console.error(e);process.exitCode=1;});
