const fs=require("fs"),path=require("path");
const out=path.join(process.cwd(),"dist-site");
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(path.join(out,"assets"),{recursive:true});

const pages=[
  "index.html","showcase.html","program.html",
  "index-en.html","showcase-en.html","program-en.html",
  "student-login.html","student.html","student-login-en.html","student-en.html",
  "admin-login.html","admin.html",
  "privacy.html","terms.html","reset-password.html",".nojekyll"
];
const assets=[
  "lexlearn-logo.svg","brand-intro.js",
  "v9-law.css","v9-law-content.js","v9-law.js",
  "adaptive-engine.js","learning-quality.js","quality.css",
  "showcase.css","showcase.js","showcase-en.js",
  "program.css","program.js","program-en.js",
  "portal.css","student-login.js","student-login-en.js","admin-login-v2.js",
  "student.css","student.js","student-en.js",
  "english.css",
  "admin.css","admin-entry.js","admin-cloud.js","admin.js",
  "lexlearn-config.js","cloud-data.js","reset-password.js",
  "legal-pages.css"
];
function cp(src,dst){
  if(!fs.existsSync(src))throw new Error("Missing public artifact: "+src);
  fs.copyFileSync(src,dst);
}
for(const p of pages)cp(p,path.join(out,p));
for(const p of assets)cp(path.join("assets",p),path.join(out,"assets",p));

// Production artifact must not publish repository internals or abandoned prototypes.
for(const forbidden of [
  "supabase","tests",".github","AUTH_BACKEND_ARCHITECTURE.md",
  "AI_GRADING_BACKEND.md","CONTENT_REVIEW.md","legacy.html",
  "lexlearn-prototype.html","pilot.html","pilot0.html"
]){
  if(fs.existsSync(path.join(out,forbidden)))throw new Error("Forbidden production artifact: "+forbidden);
}
console.log("LexLearn public build ready:",pages.length,"pages,",assets.length,"assets");
