const fs=require("node:fs"),assert=require("node:assert/strict");
const html=fs.readFileSync("diagnostic.html","utf8");
const css=fs.readFileSync("assets/diagnostic.css","utf8");
const app=fs.readFileSync("assets/server-diagnostic.js","utf8");
const builder=fs.readFileSync("scripts/build-public.js","utf8");
// The official flow should look like the student product, never the old 740px
// standalone text form with a large square logo and mixed-language title.
assert.match(html,/class="diagnosticShell"/);
assert.match(html,/class="diagHeader"/);
assert.match(html,/class="diagCard"/);
assert.match(html,/class="diagLogo"/);
assert.match(html,/id="studentHome"/);
assert.match(html,/id="langLink"/);
assert.match(html,/id="diagNotice"/);
assert.match(html,/assets\/diagnostic\.css/);
assert.doesNotMatch(html,/<h1[^>]*>[^<]*Official diagnostic/);
assert.match(css,/width:70px;height:70px/);
assert.match(css,/@media\(max-width:640px\)/);
assert.match(css, /:focus-visible/);
assert.match(app,/diagProgressTrack/);
assert.match(app,/role='progressbar'/);
assert.match(app,/aria-valuenow/);
assert.match(builder,/"assets\/diagnostic\.css"/);
assert.match(builder,/"diagnostic\.html"\]\.includes\(page\)/);
console.log("Diagnostic branded RTL/LTR layout and progress controls PASS");
