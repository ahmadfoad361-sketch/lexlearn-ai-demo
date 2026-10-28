const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');
const pages=['index.html','index-en.html','student-login.html','student-login-en.html','student-register.html','student-register-en.html','student.html','student-en.html','student-path.html','diagnostic.html','program.html','program-en.html','showcase.html','showcase-en.html','student-practice.html'];
for(const page of pages){const html=fs.readFileSync(page,'utf8');assert.ok(html.includes('assets/learner-theme.js')&&html.includes('assets/learner-experience.css'),page);}
for(const path of ['conference.html','assets/conference.css','assets/conference-theme.css','assets/conference-theme.js','assets/conference-experience.css'])assert.equal(fs.readFileSync(path,'utf8').replace(/\r\n/g,'\n'),cp.execFileSync('git',['show','HEAD:'+path],{encoding:'utf8'}).replace(/\r\n/g,'\n'),'conference remains identical: '+path);
const css=fs.readFileSync('assets/learner-experience.css','utf8');assert.equal(fs.readFileSync('assets/conference-promo.css','utf8').replace(/\r\n/g,'\n'),cp.execFileSync('git',['show','HEAD:assets/conference-promo.css'],{encoding:'utf8'}).replace(/\r\n/g,'\n'),'conference promotion dimensions stay untouched');
function run(saved,broken=false){let event,button;const values=new Map([['lexlearn_learner_theme',saved]]),attrs={};const doc={readyState:'complete',documentElement:{lang:'ar',style:{},setAttribute:(k,v)=>attrs[k]=v,getAttribute:k=>attrs[k]},createElement:()=>({setAttribute(){}}),body:{appendChild:b=>button=b}};const win={addEventListener:(_,f)=>event=f};vm.runInNewContext(fs.readFileSync('assets/learner-theme.js','utf8'),{document:doc,window:win,localStorage:{getItem:k=>{if(broken)throw Error();return values.get(k);},setItem:(k,v)=>{if(broken)throw Error();values.set(k,v);}}});return {attrs,button,values,event};}
const light=run('light');assert.equal(light.attrs['data-learner-theme'],'light');light.button.onclick();assert.equal(light.attrs['data-learner-theme'],'dark');assert.equal(light.values.get('lexlearn_learner_theme'),'dark');assert.ok(light.button.textContent.includes('الفاتح'));assert.equal(run('dark').attrs['data-learner-theme'],'dark');assert.equal(run(undefined,true).attrs['data-learner-theme'],'light');
function luminance(h){const a=h.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2];}function ratio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
for(const [fg,bg] of [['18253b','fffdfa'],['536176','f2ece5'],['f7f4ef','1b2a40'],['c1ccdd','263750'],['ffb1c4','263750'],['ffffff','8a1f39'],['a0e4c1','1b2a40'],['ff9da9','263750'],['20604c','fffdfa'],['a71d36','fffdfa']])assert.ok(ratio(fg,bg)>=4.5,fg+' on '+bg);
assert.ok(fs.readFileSync('scripts/build-public.js','utf8').includes('"learner-theme.js","learner-experience.css"'));
console.log('Learner experience: 15 learner routes, theme persistence/storage fallback, text contrast and untouched conference PASS');


for(const page of pages)assert.ok(fs.readFileSync(page,'utf8').includes('assets/learner-brand.js'),page+' home branding');
const brand=fs.readFileSync('assets/learner-brand.js','utf8');assert.ok(brand.includes('MutationObserver')&&brand.includes("a.href=home"));
for(const page of ['showcase.html','showcase-en.html'])assert.ok(fs.readFileSync(page,'utf8').includes('assets/legal-study.js'));
for(const js of ['assets/showcase.js','assets/showcase-en.js'])assert.ok(fs.readFileSync(js,'utf8').includes('LEX_LEGAL_STUDY.render([39,40],lang)'));

const emphasis=require('../assets/legal-emphasis.js');
for(const [text,marked] of [
 ['راجع المادة 39 من القانون المدني القطري رقم (22) لسنة 2004.',['المادة 39']],
 ['المادتان 39 و40 من القانون المدني القطري',['المادتان 39 و40']],
 ['المادتين (٣٩) و(٤٠)',['المادتين (٣٩) و(٤٠)']],
 ['المواد 39–63',['المواد 39–63']],
 ['Articles 39 and 40 of Qatar Civil Code, Law No. 22 of 2004',['Articles 39 and 40']],
 ['Article 39: text. Article 40: another text.',['Article 39','Article 40']],
 ['جلسة 4، القانون 22 لسنة 2004، نتيجتك 39%.',[]],
 ['رقم المادة غير محدد',[]]
 ]){const parts=emphasis.segments(text);assert.equal(parts.map(x=>x.text).join(''),text,'all learner wording stays verbatim');assert.deepEqual(parts.filter(x=>x.article).map(x=>x.text),marked);}
for(const page of pages)assert.ok(fs.readFileSync(page,'utf8').includes('assets/legal-emphasis.js'),page+' highlights article references');
for(const [fg,bg] of [['634008','f7e6b7'],['ffe4aa','49381d']])assert.ok(ratio(fg,bg)>=4.5,'article reference contrast');
