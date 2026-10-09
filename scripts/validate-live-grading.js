// Run preflight without credentials; --live requires human-approved benchmark cases.
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
async function main(){
  const args=process.argv.slice(2),live=args.includes('--live');
  const option=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
  const benchmark=JSON.parse(fs.readFileSync(option('--benchmark')||path.join(root,'validation/semantic-benchmark.json'),'utf8'));
  const cases=benchmark.cases;
  if(!Array.isArray(cases)||!cases.length||cases.some(c=>!c.id||!c.task_key||!c.course_id||!c.answer||!['ar','en'].includes(c.language)||!Number.isFinite(c.proposed_min_score)||!Number.isFinite(c.proposed_max_score)||c.proposed_min_score<0||c.proposed_max_score>1||c.proposed_min_score>c.proposed_max_score))throw new Error('Invalid benchmark cases');
  if(new Set(cases.map(c=>c.id)).size!==cases.length)throw new Error('Duplicate case IDs');
  const pending=cases.filter(c=>c.review_status!=='human_approved'||!c.reviewer||!c.reviewed_at);
  console.log(JSON.stringify({mode:live?'live':'preflight',cases:cases.length,unreviewed_cases:pending.length,live_model_tested:false},null,2));
  if(!live)return;
  if(pending.length)throw new Error('Live evaluation blocked: a human reviewer must approve expected scores first.');
  const token=process.env.LEX_VALIDATION_TOKEN;
  if(!token)throw new Error('Set LEX_VALIDATION_TOKEN to an authorized test session access token.');
  const output=option('--output');
  if(!output)throw new Error('Use --output with a report file path to preserve the evaluation.');
  const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/lexlearn-config.js'),'utf8'),ctx);
  const config=ctx.window.LEX_CONFIG,results=[];
  for(const c of cases){
    const res=await fetch(config.supabaseUrl+'/functions/v1/grade-answer',{method:'POST',headers:{'Content-Type':'application/json',apikey:config.supabaseAnonKey,Authorization:'Bearer '+token},body:JSON.stringify({task_key:c.task_key,course_id:c.course_id,language:c.language,answer:c.answer}),signal:AbortSignal.timeout(45000)});
    const result=await res.json();
    const scored=res.ok&&result.grading_method==='grounded_semantic'&&result.needs_human_review===false&&typeof result.score==='number'&&Number.isFinite(result.score);
    const row={id:c.id,http_status:res.status,scored,score:scored?result.score:null,reason:result.reason||result.error||null,within_expected_range:scored&&result.score>=c.proposed_min_score&&result.score<=c.proposed_max_score,result};
    results.push(row);console.log(c.id+': '+(scored?(row.within_expected_range?'PASS':'MISMATCH'):'BLOCKED'));
    if([401,403,429,503].includes(res.status)||result.reason==='item_not_approved'||result.reason==='approved_sources_missing')break;
  }
  const report={created_at:new Date().toISOString(),live_model_tested:results.some(r=>r.result.grading_method==='grounded_semantic'),planned_cases:cases.length,completed_cases:results.length,scored_cases:results.filter(r=>r.scored).length,mismatches:results.filter(r=>r.scored&&!r.within_expected_range).length,blocked_cases:results.filter(r=>!r.scored).length,results};
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  if(results.length!==cases.length||results.some(r=>!r.within_expected_range))process.exitCode=1;
}
main().catch(()=>{console.error('Validation stopped. Check benchmark approval, authorized session, approved content and provider configuration. No credentials are printed.');process.exitCode=1;});
