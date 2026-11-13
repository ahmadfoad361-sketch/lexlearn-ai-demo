/* Compatibility for old bookmarks. No student data is read or written. */
(function(){
"use strict";
if(document.getElementById("studentTrainingApp"))return;
var language=new URLSearchParams(window.location.search).get("lang")==="en"?"en":"ar";
window.location.replace("student-path.html?lang="+language);
})();
