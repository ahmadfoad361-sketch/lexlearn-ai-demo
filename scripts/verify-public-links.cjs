'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve('dist-site'),errors=[];
function check(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 const full=path.join(dir,entry.name);if(entry.isDirectory()){check(full);continue}
 if(!full.endsWith('.html'))continue;
 const html=fs.readFileSync(full,'utf8');
 for(const m of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)){
  const value=m[1];if(!value||/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value))continue;
  const clean=decodeURIComponent(value.split(/[?#]/)[0]);if(!clean)continue;
  const target=path.resolve(path.dirname(full),clean);if(!target.startsWith(root+path.sep)&&target!==root){errors.push('Outside public artifact: '+value);continue}
  if(!fs.existsSync(target))errors.push(path.relative(root,full)+' -> '+clean);
 }
}}
check(root);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}
else console.log('PASS: local HTML dependencies and navigation targets exist.');
