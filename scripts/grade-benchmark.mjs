/* LexLearn — read-only calibration. Requires de-identified, human-marked cases.
 * Usage: node scripts/grade-benchmark.mjs /secure/path/cases.json
 * Never send student answers or names to this public repository.
 */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
export function measure(cases){
 if(!Array.isArray(cases))throw Error("cases array required");
 const rows=cases.map((x,i)=>{
  if(!x||!Array.isArray(x.human_scores)||x.human_scores.length<2||
    !x.human_scores.every(v=>typeof v==="number"&&v>=0&&v<=100)||
    typeof x.ai_score!=="number"||x.ai_score<0||x.ai_score>100)
   throw Error("Invalid paired human/AI score at row "+(i+1));
  const human=x.human_scores.reduce((a,b)=>a+b,0)/x.human_scores.length;
  return {id:String(x.id||"row-"+(i+1)),human,ai:x.ai_score,
   error:Math.abs(x.ai_score-human),
   humanSpread:Math.max(...x.human_scores)-Math.min(...x.human_scores),
   criticalMismatch:x.critical_error===true&&x.ai_score>=60};
 });
 const n=rows.length;
 const avg=f=>n?rows.reduce((a,b)=>a+f(b),0)/n:null;
 const mae=avg(x=>x.error),within10=avg(x=>x.error<=10?1:0);
 const agreement=avg(x=>x.humanSpread<=10?1:0);
 const critical=rows.filter(x=>x.criticalMismatch);
 return {samples:n,mae,within10,within10Percent:within10==null?null:Math.round(within10*1000)/10,
  humanAgreementPercent:agreement==null?null:Math.round(agreement*1000)/10,
  criticalFalseApprovals:critical.map(x=>x.id),
  casesNeedingAdjudication:rows.filter(x=>x.humanSpread>10).map(x=>x.id),
  proposedPilotGate:{enoughCases:n>=200,withinTenPoints:within10!==null&&within10>=.90,
   noCriticalFalseApprovals:critical.length===0},
  qualification:"Targets are proposed internal acceptance thresholds, not official university accreditation."};
}
const own=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(own){
 const filename=process.argv[2];
 if(!filename){console.error("Usage: node scripts/grade-benchmark.mjs <private-anonymized-cases.json>");process.exitCode=2;}
 else try{
  const input=JSON.parse(readFileSync(resolve(filename),"utf8"));
  const report=measure(Array.isArray(input)?input:input.cases);
  console.log(JSON.stringify(report,null,2));
  if(!Object.values(report.proposedPilotGate).every(Boolean))process.exitCode=1;
 }catch(error){console.error(error.message);process.exitCode=2;}
}
