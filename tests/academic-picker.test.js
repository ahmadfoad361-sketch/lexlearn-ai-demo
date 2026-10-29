const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const picker=require('../assets/academic-picker.js');
assert.ok(picker.options('ae','عجم').some(x=>x.value==='جامعة عجمان'));
assert.ok(picker.options('ae','AJMAN').some(x=>x.value==='جامعة عجمان'));
assert.equal(picker.options('qa','عجمان').length,0);
assert.ok(picker.options('eg','طنطا').some(x=>x.value==='جامعة طنطا'));
assert.ok(picker.options('sa','Taibah').some(x=>x.value==='جامعة طيبة'));
picker.remember([{country_code:'ae',university:'Ajman University'},{country:'eg',university:'جامعة مسجلة للتجربة'}]);
assert.equal(picker.options('ae','عجمان')[0].value,'Ajman University','existing institution identity must be preserved');
assert.ok(picker.options('eg','مسجلة').length);
assert.equal(picker.options('qa','مسجلة').length,0,'stored names cannot leak between countries');
for(const file of ['student-register.html','student-register-en.html']){
 const text=fs.readFileSync(file,'utf8'),form=text.slice(text.indexOf('<form id="registerForm">'),text.indexOf('</form>'));
 const fields=[...form.matchAll(/<(?:input|select)[^>]*id="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(fields.slice(0,3),['country','university','faculty']);
 assert.ok(text.includes('assets/academic-picker.js'));
}
const source=fs.readFileSync('assets/admin-instructors.js','utf8');
const context={state:{courses:[],teachers:[]},esc:x=>String(x??'')};
vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function scopeFields'),source.indexOf('function editTeacher')),context);
const markup=context.form(),creation=markup.slice(markup.indexOf('<form id="createInstructor">'),markup.indexOf('</form>'));
assert.deepEqual([...creation.matchAll(/<(?:input|select)[^>]*name="([^"]+)"/g)].slice(0,3).map(x=>x[1]),['country_code','university','faculty']);
assert.equal((creation.match(/name="university"/g)||[]).length,1,'one academic scope per create form');
assert.equal((creation.match(/name="country_code"/g)||[]).length,1);
console.log('PASS academic selection: country filtering, Arabic/English prefixes, preserved institution names, public and instructor field order');
