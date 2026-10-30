const fs=require("fs"),path=require("path");
const out=path.join(process.cwd(),"dist-site");
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(path.join(out,"assets"),{recursive:true});

const pages=[
  "index.html","conference.html","go/index.html","showcase.html","showcase-level1.html","program.html","diagnostic.html","student-practice.html","student-path.html","student-profile.html",
  "index-en.html","showcase-en.html","showcase-level1-en.html","program-en.html",
  "student-login.html","student-register.html","student.html","student-login-en.html","student-register-en.html","student-en.html",
  "admin-login.html","admin.html","admin-instructors.html","admin-analytics.html","admin-progress.html","instructor-login.html","instructor.html","references.html","lexlearn-grading-console.html","demo-supervisor.html","pilot-review.html","pilot-qa.html",
  "privacy.html","privacy-en.html","terms.html","terms-en.html","reset-password.html",".nojekyll"
];
const assets=[
  "academic-picker.js","academic-picker.css",
  "student-identity.js","student-identity.css","student-profile.js","student-card-pdf.js","qrcode-generator.js","qrcode-generator-LICENSE.txt",
  "session-moments.js","session-moments.css","grading-wait.js","grading-wait.css","learning-keys.js","learning-keys.css",
  "brand-wordmark.js","brand-wordmark.css","learner-theme.js","learner-experience.css","staff-entry.css","learner-brand.js","legal-emphasis.js",
  "lexlearn-logo.svg","lexlearn-x-transparent.svg","lexlearn-og.jpg","lexlearn-public-pitch-en.pdf","lexlearn-go-qr.svg","conference.css","conference.js","conference-experience.css","conference-experience.js","conference-theme.css","conference-theme.js","conference-citations.js","conference-media/lexlearn-logo-hq.webp","conference-media/investor-men-v3.webp","conference-media/law-lecture-v3.webp","conference-media/student-law.webp","conference-media/logo-intro-navy.mp4","conference-pdf.js","lexlearn-navigation.css","lexlearn-navigation.js","lexlearn-learning-lines.js","lexlearn-investor-quotes.js","conference-promo.css","brand-intro.js","training-carousel.js",
  "v9-law.css","v9-law-content.js","v9-law.js",
  "adaptive-engine.js","learning-quality.js","pilot-learning.js","pilot-review.js","pilot-qa.js","quality.css",
  "analysis-faces.svg","student-demo-guard.js","showcase-recall.js","showcase.css","showcase-learning-cycle.css","showcase-learning-cycle.js","showcase.js","showcase-en.js",
  "program.css","program.js","program-en.js","diagnostic.css","legal-study.js","legal-study.css","learning-moments.js","learning-moments.css","beginner-prompts.js","official-diagnostic.js","server-diagnostic.js","official-level-one.js","student-practice.js","student-path.js","legal-case-guide.js","legal-case-guide.css",
  "portal.css","register.css","auth-controls.js","student-register.js","student-login.js","student-login-en.js","admin-login-v2.js",
  "student.css","student.js","student-en.js",
  "english.css",
  "site-analytics.js","admin-analytics.js","admin-analytics.css","academic-display.js","flags/qa.svg","flags/eg.svg","flags/sa.svg","flags/ae.svg","flags/LICENSE","admin.css","admin-experience.css","admin-appearance.js","admin-entry.js","admin-cloud.js","instructor.css","instructor-card.js","instructor-card.css","instructor-login.js","instructor-dashboard.js","admin-instructors.js","admin-progress.js","lex-references.js","student-records.js","student-report.js","admin.js",
  "lexlearn-config.js","cloud-data.js","lexlearn-grading-console.js","reset-password.js",
  "legal-pages.css"
];
function cp(src,dst){
  if(!fs.existsSync(src))throw new Error("Missing public artifact: "+src);
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  fs.copyFileSync(src,dst);
}
for(const p of pages)cp(p,path.join(out,p));
for(const p of assets)cp(path.join("assets",p),path.join(out,"assets",p));

// Visible build identification is generated from the exact reviewed commit.
const {execFileSync}=require("child_process");
let sha=(process.env.GITHUB_SHA||"").match(/^[a-f0-9]{40}$/)?.[0];
if(!sha){
 try{sha=execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim();}
 catch(_){sha="unknown";}
}
const buildId=(sha||"unknown").slice(0,12);
for(const page of pages){
 if(!page.endsWith(".html"))continue;
 const full=path.join(out,page);let html=fs.readFileSync(full,"utf8");
 const stamp='<footer id="lexBuild" hidden aria-hidden="true">LexLearn build '+buildId+'</footer>';
 html=html.replace("</body>",stamp+"</body>");
 html=html.replace(/(assets\/[a-z0-9-]+\.(?:js|css))(?:\?v=[^"']*)?/g,"$1?v="+buildId);
 fs.writeFileSync(full,html);
}

// Keep a consistent back arrow across every public subpage (including login,
// student, university and supervisor views), without injecting it on home or /go.
for(const page of pages){
  // Diagnostic has its own prominent student-account back link; do not duplicate it with a floating button.
  if(!page.endsWith(".html") || ["index.html","index-en.html","go/index.html","diagnostic.html"].includes(page))continue;
  const full=path.join(out,page);
  let html=fs.readFileSync(full,"utf8");
  if(!html.includes("lexlearn-navigation.css")){
    if(!html.includes("</head>"))throw new Error("Cannot inject back navigation styles into "+page);
    html=html.replace("</head>",'<link rel="stylesheet" href="assets/lexlearn-navigation.css?v=20261015.3"></head>');
  }
  if(!html.includes("lexlearn-navigation.js")){
    if(!html.includes("</body>"))throw new Error("Cannot inject back navigation control into "+page);
    html=html.replace("</body>",'<script src="assets/lexlearn-navigation.js?v=20261015.3" defer></script></body>');
  }
  // Refresh versions for older local page templates as well as conference.html.

  html=html.replace(/(assets\/lexlearn-x-transparent\.svg)(?:\?v=[^"']+)?/g,"$1?v=20261019-hq");
  fs.writeFileSync(full,html);
}


// First-party measurements on public/student pages and authenticated faculty dashboard.
// Never collect supervisor activity as learner attendance.
const measuredPages=pages.filter(p=>p.endsWith('.html')&&(!/^(admin|instructor|reset-password|references|lexlearn-grading|demo-supervisor|pilot-|go\/)/.test(p)||p==='instructor.html'));
for(const page of measuredPages){
 const full=path.join(out,page);let html=fs.readFileSync(full,'utf8');
 if(!html.includes('assets/lexlearn-config.js'))html=html.replace('</body>','<script src="assets/lexlearn-config.js"></script></body>');
 html=html.replace('</body>','<script src="assets/site-analytics.js" defer></script></body>');fs.writeFileSync(full,html);
}

// Attendance should never be visible to students or professors outside the staff report.
for(const required of ["student.html","student-path.html","student-practice.html","instructor.html"]){
 if(!fs.readFileSync(path.join(out,required),"utf8").includes('assets/site-analytics.js'))
  throw new Error("Account presence tracker missing from "+required);
}
if(!fs.readFileSync(path.join(out,"assets/admin-analytics.js"),"utf8").includes('accountSessions'))
 throw new Error("Supervisor attendance detail link missing");
if(fs.readFileSync(path.join(out,"assets/instructor-dashboard.js"),"utf8").includes("الساعات المكتبية"))
 throw new Error("Unused instructor office hours still exposed");

// A shared brand wordmark also covers dashboards whose headers render after login.
for(const page of pages){
 if(!page.endsWith('.html')||page==='go/index.html')continue;
 const full=path.join(out,page);let html=fs.readFileSync(full,'utf8');
 html=html.replace('</head>','<link rel="stylesheet" href="assets/brand-wordmark.css"></head>');
 html=html.replace('</body>','<script src="assets/brand-wordmark.js" defer></script></body>');fs.writeFileSync(full,html);
}

// Version all local JS/CSS references after every HTML transformation.
const crypto=require("crypto");
for(const page of pages){
 if(!page.endsWith(".html"))continue;
 const full=path.join(out,page);
 let html=fs.readFileSync(full,"utf8");
 html=html.replace(/(assets\/[a-z0-9-]+\.(?:js|css))(?:\?v=[^"']*)?/g,"$1?v="+buildId);
 fs.writeFileSync(full,html);
}
// Copy integrity is checked against source, not timestamps. A stale dist-site cannot pass.
const manifest={commit:sha,build:buildId,assets:{}};
for(const asset of assets){
 const source=fs.readFileSync(path.join("assets",asset)),built=fs.readFileSync(path.join(out,"assets",asset));
 if(!source.equals(built))throw new Error("Stale public asset: "+asset);
 manifest.assets["assets/"+asset]=crypto.createHash("sha256").update(built).digest("hex");
}
fs.writeFileSync(path.join(out,"build-manifest.json"),JSON.stringify(manifest,null,2)+"\n");

// Release-gate: the student self-registration route and both languages must be present.
// Silent omissions caused valid GitHub source changes to be absent from the live site.
for(const required of [
  "conference.html","go/index.html","assets/conference.js","assets/conference-pdf.js","assets/conference.css","assets/academic-display.js","assets/admin-entry.js","assets/admin-cloud.js","assets/admin-experience.css","assets/lexlearn-navigation.js","assets/lexlearn-navigation.css","assets/lexlearn-learning-lines.js","assets/lexlearn-investor-quotes.js","assets/lexlearn-go-qr.svg","assets/lexlearn-public-pitch-en.pdf",
  "student-register.html","student-register-en.html","diagnostic.html","assets/diagnostic.css","student-practice.html","student-path.html","assets/student-practice.js","assets/student-path.js","assets/grading-wait.js","assets/grading-wait.css","assets/legal-case-guide.js","assets/legal-case-guide.css","assets/official-diagnostic.js","assets/server-diagnostic.js","assets/official-level-one.js","showcase-level1.html","showcase-level1-en.html",
  "privacy-en.html","terms-en.html",
  "references.html","assets/lex-references.js",
  "assets/student-register.js","assets/register.css","assets/auth-controls.js","assets/student-report.js",
  "assets/showcase-learning-cycle.js","assets/showcase-learning-cycle.css"
]) {
  if(!fs.existsSync(path.join(out,required)))
    throw new Error("Missing live registration or report asset: "+required);
}
for(const login of ["student-login.html","student-login-en.html"]) {
  if(!fs.readFileSync(path.join(out,login),"utf8").includes("student-register"))
    throw new Error("Student login page has no registration link: "+login);
}

// Supervisor reference library must be present in the public artifact; access is still gated by backend staff auth.
const refsPage=fs.readFileSync(path.join(out,"references.html"),"utf8");
if(!refsPage.includes("assets/lex-references.js"))throw new Error("Supervisor reference library has no script");
for(const requiredControl of ['id="jurisdictionSelect"','id="universitySelect"','id="facultySelect"','id="countryForm"','id="universityForm"','id="facultyForm"']){
  if(!refsPage.includes(requiredControl))throw new Error("Academic reference directory UI missing: "+requiredControl);
}
const refJs=fs.readFileSync(path.join(out,"assets/lex-references.js"),"utf8");
for(const handler of ["renderDirectory","updateUniversities","updateFaculties","add_country","add_university","add_faculty"]){
  if(!refJs.includes(handler))throw new Error("Academic reference directory logic missing: "+handler);
}
const adminPage=fs.readFileSync(path.join(out,"admin.html"),"utf8");
const cloudAdmin=fs.readFileSync(path.join(out,"assets/admin-cloud.js"),"utf8");
if(!cloudAdmin.includes('href="references.html"'))throw new Error("Supervisor has no link to reference library");


// Supervisor release checks: guard the country flags, academic-year wording and expanded state styles.
const supervisorTree=fs.readFileSync(path.join(out,"assets/admin-cloud.js"),"utf8");
const supervisorCss=fs.readFileSync(path.join(out,"assets/admin-experience.css"),"utf8");
if(!supervisorTree.includes("countryFlag")||!supervisorTree.includes("displayYear")||!fs.readFileSync(path.join(out,"assets/academic-display.js"),"utf8").includes("الفرقة"))
 throw new Error("Supervisor country/year navigation missing from published artifact");
if(!supervisorCss.includes(".level-year[open]")||!supervisorCss.includes(".level-country.country-qa"))
 throw new Error("Supervisor expanded-year or country card styling missing");

// Prevent regressions where the interface references a waiting-screen asset excluded from the published bundle.
const studentPath=fs.readFileSync(path.join(out,"student-path.html"),"utf8");
for(const required of ["assets/grading-wait.js","assets/grading-wait.css"]){
 if(!studentPath.includes(required))throw new Error("Student grading wait dependency not referenced: "+required);
 if(!fs.existsSync(path.join(out,required)))throw new Error("Student grading wait asset not published: "+required);
}
const studentLogic=fs.readFileSync(path.join(out,"assets/student-path.js"),"utf8");
if(!studentLogic.includes("startGradingWait")||!studentLogic.includes("wait.finish()"))
 throw new Error("Student assessment wait lifecycle missing from production build");

// Production artifact must not publish repository internals or abandoned prototypes.
for(const forbidden of [
  "supabase","tests",".github","AUTH_BACKEND_ARCHITECTURE.md",
  "AI_GRADING_BACKEND.md","CONTENT_REVIEW.md","legacy.html",
  "lexlearn-prototype.html","pilot.html","pilot0.html"
]){
  if(fs.existsSync(path.join(out,forbidden)))throw new Error("Forbidden production artifact: "+forbidden);
}
console.log("LexLearn public build ready:",pages.length,"pages,",assets.length,"assets");




