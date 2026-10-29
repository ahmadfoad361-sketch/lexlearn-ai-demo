const assert = require("node:assert/strict");
const fs = require("node:fs");
const read = path => fs.readFileSync(path,"utf8");

const arHome = read("assets/v9-law.js");
const enHome = read("index-en.html");
const conference = read("conference.html");
const locales = read("assets/conference.js");
const login = read("instructor-login.html");
const pageList = read("scripts/build-public.js");

assert.equal((arHome.match(/href="instructor-login\\.html"/g)||[]).length,2,
  "Arabic home header and course actions must both link professor login");
assert.equal((enHome.match(/href="instructor-login\\.html"/g)||[]).length,2,
  "English home header and hero must link professor login");
assert.match(conference, /href="instructor-login\\.html" data-t="instructorLogin"/);
assert.match(locales,/instructorLogin:"دخول أستاذ الجامعة"/);
assert.match(locales,/instructorLogin:"Professor login"/);
assert.match(login, /id="instructorLogin"/);
assert.match(login, /id="instructorEmail"/);
assert.match(login, /id="instructorPassword"/);
assert.match(login, /كلمة المرور المؤقتة/);
assert.match(pageList, /"instructor-login\\.html","instructor\\.html"/);
assert.match(read("index.html"),/v9-law\\.js\\?v=20261029\\.instructor1/);
assert.match(read("index-en.html"),/staff-entry\\.css\\?v=20261029\\.instructor1/);
assert.match(read("conference.html"),/conference\\.js\\?v=20261029\\.instructor1/);
assert.match(read("assets/staff-entry.css"),/flex-wrap:wrap/);
console.log("PASS: Arabic, English, conference professor entry and first-login instructions");
