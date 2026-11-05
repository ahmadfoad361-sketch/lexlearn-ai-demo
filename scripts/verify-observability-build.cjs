'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = process.cwd();
const htmlFile = path.join(root,'dist-site','index.html');
const configFile = path.join(root,'dist-site','assets','lexlearn-observability-config.js');

function build(variables) {
  const env = {...process.env};
  delete env.LEX_POSTHOG_PROJECT_KEY;
  delete env.LEX_SENTRY_DSN;
  delete env.LEX_OBSERVABILITY_ENABLED;
  Object.assign(env,variables);
  const p=spawnSync(process.execPath,['scripts/build-public.js'],{
    cwd:root,env,encoding:'utf8',timeout:60000
  });
  assert.equal(p.status,0,p.stderr||p.stdout||'build failed');
  const html=fs.readFileSync(htmlFile,'utf8');
  const injected=html.includes('assets/lexlearn-observability-config.js');
  return {injected,config:fs.existsSync(configFile)?fs.readFileSync(configFile,'utf8'):null};
}
try {
  let r=build({});
  assert.equal(r.injected,false,'production default must not load any external monitoring');
  assert.equal(r.config,null,'disabled build should not emit a runtime config');
  r=build({
    LEX_OBSERVABILITY_ENABLED:'1',
    LEX_POSTHOG_PROJECT_KEY:'phc_synthetic_only_0001',
    LEX_SENTRY_DSN:'https://public@o123.ingest.sentry.io/12345'
  });
  assert.equal(r.injected,true,'synthetic opt-in must include monitoring');
  assert.ok(r.config.includes('phc_synthetic_only_0001'));
  assert.ok(r.config.includes('o123.ingest.sentry.io'));
  r=build({
    LEX_OBSERVABILITY_ENABLED:'1',
    LEX_POSTHOG_PROJECT_KEY:'wrong-key',
    LEX_SENTRY_DSN:'https://unapproved.invalid/private'
  });
  assert.equal(r.injected,false,'invalid settings must fail closed');
  assert.equal(r.config,null,'invalid settings should not generate config');
  r=build({});
  assert.equal(r.injected,false,'restore inert production equivalent');
  console.log('PASS: observability is inert by default, opt-in is tested, invalid settings do not block deployment');
} catch(e) {
  console.error(e);
  process.exitCode=1;
}
