const fs=require("fs"),path=require("path");
const out=path.join(process.cwd(),"dist-site");
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(path.join(out,"assets"),{recursive:true});

const pages=[
  "index.html","conference.html","go/index.html","showcase.html","program.html",
  "index-en.html","showcase-en.html","program-en.html",
  "student-login.html","student-register.html","student.html","student-login-en.html","student-register-en.html","student-en.html",
  "admin-login.html","admin.html","demo-supervisor.html","pilot-review.html","pilot-qa.html",
  "privacy.html","privacy-en.html","terms.html","terms-en.html","reset-password.html",".nojekyll"
];
const assets=[
  "lexlearn-logo.svg","lexlearn-x-transparent.svg","lexlearn-og.jpg","lexlearn-public-pitch-en.pdf","lexlearn-go-qr.svg","conference.css","conference.js","conference-pdf.js","lexlearn-navigation.css","lexlearn-navigation.js","lexlearn-learning-lines.js","lexlearn-investor-quotes.js","conference-promo.css","brand-intro.js","training-carousel.js",
  "v9-law.css","v9-law-content.js","v9-law.js",
  "adaptive-engine.js","learning-quality.js","pilot-learning.js","pilot-review.js","pilot-qa.js","quality.css",
  "showcase-recall.js","showcase.css","showcase.js","showcase-en.js",
  "program.css","program.js","program-en.js",
  "portal.css","register.css","auth-controls.js","student-register.js","student-login.js","student-login-en.js","admin-login-v2.js",
  "student.css","student.js","student-en.js",
  "english.css",
  "admin.css","admin-entry.js","admin-cloud.js","student-report.js","admin.js",
  "lexlearn-config.js","cloud-data.js","reset-password.js",
  "legal-pages.css"
];
function cp(src,dst){
  if(!fs.existsSync(src))throw new Error("Missing public artifact: "+src);
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  fs.copyFileSync(src,dst);
}
for(const p of pages)cp(p,path.join(out,p));
for(const p of assets)cp(path.join("assets",p),path.join(out,"assets",p));

// Keep a consistent back arrow across every public subpage (including login,
// student, university and supervisor views), without injecting it on home or /go.
for(const page of pages){
  if(!page.endsWith(".html") || ["index.html","index-en.html","go/index.html"].includes(page))continue;
  const full=path.join(out,page);
  let html=fs.readFileSync(full,"utf8");
  if(!html.includes("lexlearn-navigation.css")){
    if(!html.includes("</head>"))throw new Error("Cannot inject back navigation styles into "+page);
    html=html.replace("</head>",'<link rel="stylesheet" href="assets/lexlearn-navigation.css?v=20261014.11"></head>');
  }
  if(!html.includes("lexlearn-navigation.js")){
    if(!html.includes("</body>"))throw new Error("Cannot inject back navigation control into "+page);
    html=html.replace("</body>",'<script src="assets/lexlearn-navigation.js?v=20261014.11" defer></script></body>');
  }
  // Refresh versions for older local page templates as well as conference.html.
  html=html.replace(/(assets\/lexlearn-navigation\.(?:css|js))\?v=[^"']+/g,"$1?v=20261014.11");
  fs.writeFileSync(full,html);
}


// Release-gate: the student self-registration route and both languages must be present.
// Silent omissions caused valid GitHub source changes to be absent from the live site.
for(const required of [
  "conference.html","go/index.html","assets/conference.js","assets/conference-pdf.js","assets/conference.css","assets/lexlearn-navigation.js","assets/lexlearn-navigation.css","assets/lexlearn-learning-lines.js","assets/lexlearn-investor-quotes.js","assets/lexlearn-go-qr.svg","assets/lexlearn-public-pitch-en.pdf",
  "student-register.html","student-register-en.html",
  "privacy-en.html","terms-en.html",
  "assets/student-register.js","assets/register.css","assets/auth-controls.js","assets/student-report.js"
]) {
  if(!fs.existsSync(path.join(out,required)))
    throw new Error("Missing live registration or report asset: "+required);
}
for(const login of ["student-login.html","student-login-en.html"]) {
  if(!fs.readFileSync(path.join(out,login),"utf8").includes("student-register"))
    throw new Error("Student login page has no registration link: "+login);
}

// Production artifact must not publish repository internals or abandoned prototypes.
for(const forbidden of [
  "supabase","tests",".github","AUTH_BACKEND_ARCHITECTURE.md",
  "AI_GRADING_BACKEND.md","CONTENT_REVIEW.md","legacy.html",
  "lexlearn-prototype.html","pilot.html","pilot0.html"
]){
  if(fs.existsSync(path.join(out,forbidden)))throw new Error("Forbidden production artifact: "+forbidden);
}
console.log("LexLearn public build ready:",pages.length,"pages,",assets.length,"assets");
