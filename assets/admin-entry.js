(function(){
"use strict";
var cloud=window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured();
var s=document.createElement("script");
var entry=document.currentScript;
var version=entry?new URL(entry.src,location.href).searchParams.get("v"):"20261026.8";
s.src=(cloud?"assets/admin-cloud.js":"assets/admin.js")+"?v="+encodeURIComponent(version||"20261026.8");
s.defer=false;
document.body.appendChild(s);
})();