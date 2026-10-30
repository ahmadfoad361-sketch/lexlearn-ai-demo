// Block backend files, unapproved artifacts, and recognizable credentials in the public Pages release.
'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const site=path.join(process.cwd(),'dist-site'), errors=[];
function walk(dir,prefix=''){
 if(!fs.existsSync(dir)){errors.push('Missing public build');return []}
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  const rel=path.posix.join(prefix,e.name),full=path.join(dir,e.name);
  if(e.isSymbolicLink()){errors.push('Public symlink: '+rel);return []}
  return e.isDirectory()?walk(full,rel):e.isFile()?[rel]:[];
 });
}
const files=walk(site);
const privatePath=/(^|\/)(?:\.git|\.github|supabase|validation|tests|scripts|sources|node_modules|_private)(\/|$)/i;
const privateFile=/(^|\/)(?:\.env(?:\..*)?|\.npmrc|\.mcp\.json|AGENTS\.md|AI_GRADING_BACKEND\.md|AUTH_BACKEND_ARCHITECTURE\.md)$/i;
const privateExt=/\.(?:sql|ts|tsx|map|env|pem|key|p12|pfx|db|sqlite|bak|log)$/i;
const credentials=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/,/\bsb_secret_[A-Za-z0-9_-]{12,}\b/,/\bgh(?:p|o|u|s|r)_[A-Za-z0-9]{20,}\b/,/\bgithub_pat_[A-Za-z0-9_]{20,}\b/];
for(const file of files){
 if(privatePath.test(file)||privateFile.test(file)||privateExt.test(file))errors.push('Internal file in Pages build: '+file);
 if(!/\.(?:html|js|json|css|txt|svg|xml|webmanifest)$/i.test(file))continue;
 if(fs.statSync(path.join(site,file)).size>8*1024*1024)continue;
 const content=fs.readFileSync(path.join(site,file),'utf8');
 if(credentials.some(p=>p.test(content)))errors.push('Possible secret in Pages build: '+file);
}
for(const required of ['index.html','showcase.html','build-manifest.json'])
 if(!files.includes(required))errors.push('Missing required artifact: '+required);
try{
 const manifest=JSON.parse(fs.readFileSync(path.join(site,'build-manifest.json'),'utf8'));
 for(const asset of Object.keys(manifest.assets||{}))if(!files.includes(asset))errors.push('Manifest asset missing: '+asset);
}catch(e){errors.push('Invalid manifest: '+e.message)}
try{
 const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
 for(const file of tracked)if(/(^|\/)\.env(?:\.(?!example\b|sample\b)[^/]*)?$/.test(file)||/\.(?:pem|p12|pfx)$/.test(file))errors.push('Potential committed credentials: '+file);
}catch(e){errors.push('Could not inspect tracked files')}
if(errors.length){for(const e of errors)console.error('SECURITY BLOCK:',e);process.exitCode=1}
else console.log('PASS: public release boundary checked ('+files.length+' files).');
