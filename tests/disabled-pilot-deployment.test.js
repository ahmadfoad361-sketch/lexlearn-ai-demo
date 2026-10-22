const assert=require("node:assert/strict");
const fs=require("node:fs");
const source=fs.readFileSync("supabase/functions/lexlearn-grading-pilot/index.ts","utf8");
assert.match(source,/const PILOT_PROVIDER_CALLS_LOCKED=true;/);
const entry=source.indexOf("Deno.serve("),lock=source.indexOf('if(PILOT_PROVIDER_CALLS_LOCKED)return pending("pilot_deployed_disabled",503,{cost_usd:0});');
const env=source.indexOf('Deno.env.get("OPENAI_GRADING_API_KEY")');
const auth=source.indexOf("await requireUser(req)");
const provider=source.indexOf('await fetch("https://api.openai.com/v1/responses"');
assert.ok(entry>=0&&lock>entry&&env>lock&&auth>lock&&provider>lock,
 "Pilot must return disabled before reading billing key, accessing student records, or contacting provider");
assert.ok(!source.includes('PILOT_PROVIDER_CALLS_LOCKED=false'),"Pilot must fail closed");
console.log("Disabled staging deployment code gate: PASS (separate path, 503, zero reachable billed calls)");
