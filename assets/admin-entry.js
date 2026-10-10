(function(){
"use strict";
var cloud=window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured();
var s=document.createElement("script");
s.src=cloud?"assets/admin-cloud.js?v=20261010.1":"assets/admin.js?v=2.4";
s.defer=false;
document.body.appendChild(s);
})();