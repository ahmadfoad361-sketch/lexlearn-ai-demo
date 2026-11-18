'use strict';
/* Dark visual-theme regression: no student, backend or scoring data involved. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const learner=fs.readFileSync(path.join(__dirname,'../assets/learner-experience.css'),'utf8');
const questions=fs.readFileSync(path.join(__dirname,'../assets/question-clarity.css'),'utf8');

function lastBlock(css,selector){
  const escaped=selector.replace(/[.*+?^\x24{}()|[\]\\]/g,'\\$&');
  const matches=[...css.matchAll(new RegExp(escaped+'\\s*\\{([^}]*)\\}','g'))];
  assert.ok(matches.length, 'Missing selector '+selector);
  return matches[matches.length-1][1];
}
function tokens(block){
  return Object.fromEntries([...block.matchAll(/--([a-z-]+)\s*:\s*([^;]+);/g)]
    .map(([,name,value])=>[name,value.trim().split('/*')[0].trim()]));
}
function luminance(hex){
  const rgb=hex.replace('#','').match(/.{2}/g).map(n=>parseInt(n,16)/255);
  const [r,g,b]=rgb.map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));
  return 0.2126*r+0.7152*g+0.0722*b;
}
function contrast(a,b){
  const x=luminance(a),y=luminance(b);
  return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
}

test('dark visual tokens retain brand navy and provide distinct card layers',()=>{
  const dark=tokens(lastBlock(learner,'html[data-learner-theme=dark]'));
  assert.equal(dark['lx-bg'].toLowerCase(),'#111d31');
  assert.equal(dark['lx-surface'],'#1e3049');
  assert.equal(dark['lx-raised'],'#2b405c');
  assert.equal(dark['lx-accent'],'#e794ab');
  assert.equal(dark['lx-accent-line'],'#d8718a');
  assert.ok(contrast(dark['lx-ink'],dark['lx-bg'])>=7,'body text must remain high-contrast');
  assert.ok(contrast(dark['lx-surface'],dark['lx-bg'])>=1.25,'surface should be distinguishable from background');
  assert.ok(contrast(dark['lx-raised'],dark['lx-surface'])>=1.25,'raised section should be distinguishable from cards');
  assert.ok(contrast(dark['lx-accent'],dark['lx-raised'])>=4.5,'brick text should meet WCAG AA even on raised panels');
  assert.ok(contrast(dark['lx-accent-line'],dark['lx-raised'])>=3,'decorative/control boundaries should be distinguishable');
});

test('light LexLearn palette and primary burgundy buttons are unchanged',()=>{
  const light=tokens(lastBlock(learner,'html[data-learner-theme]'));
  assert.equal(light['lx-bg'].toLowerCase(),'#f9f4ef');
  assert.equal(light['lx-surface'],'#fffdfb');
  assert.equal(light['lx-accent'].toLowerCase(),'#8a1f39');
  assert.match(learner,/\.btn\.primary[^}]*background:#8a1f39;color:#fff;border-color:#8a1f39/);
  assert.ok(contrast('#f9f4ef','#8a1f39')>=7);
});

test('dark question display follows shared theme and preserves comparison interactions',()=>{
  const dark=tokens(lastBlock(questions,'html[data-learner-theme="dark"]'));
  assert.equal(dark['question-paper'],'var(--lx-surface,#1e3049)');
  assert.equal(dark['question-soft'],'var(--lx-raised,#2b405c)');
  assert.equal(dark['question-accent'],'var(--lx-accent-line,#d8718a)');
  assert.match(questions,/background:var\(--lx-accent,#e794ab\);color:#111d31/);
  assert.match(learner,/\.stage--understanding\{--session-accent:var\(--lx-accent\)\}/);
  assert.match(learner,/\.comparisonNumber\{\s*color:#111d31/);
});
