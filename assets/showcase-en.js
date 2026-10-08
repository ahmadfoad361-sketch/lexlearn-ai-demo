(function(){
"use strict";
var APP=document.getElementById("showcaseApp");
var qs=new URLSearchParams(location.search),studentSession=null;try{studentSession=JSON.parse(localStorage.getItem("lexlearn_student_session")||"null");}catch(e){}
var COUNTRY=qs.get("country")||(studentSession&&studentSession.country)||"qa";
var SUBJECT=qs.get("subject")||(COUNTRY==="qa"?"rights":"sources");
var COURSE_KEY=COUNTRY+"-"+SUBJECT;
var COUNTRY_LABELS={qa:"Qatar",eg:"Egypt",sa:"Saudi Arabia",ae:"UAE",other:"Other country"};
function countryLabel(){return COUNTRY_LABELS[COUNTRY]||"Selected jurisdiction";}
var state={view:"hero",step:0,timer:null,answers:[],free:"",runQuestions:[]};

var text64=COUNTRY==="qa"?"A human being acquires legal personality upon being born alive, and it ends at death. An unborn child may acquire rights that do not require acceptance, provided that the child is born alive.":"A contract is formed when two parties exchange matching expressions of intent, subject to any special formalities required by law.";

var questions=COUNTRY==="qa"?[
  {type:"recall",q:"According to the text, when does a human being acquire legal personality?",opts:["Upon being born alive","At the age of seven","From conception for all rights"],a:0},
  {type:"recall",q:"What condition is attached to the unborn child's acquisition of the rights described in the text?",opts:["Being born alive","Reaching the age of 18","Having an independent domicile"],a:0},
  {type:"understanding",q:"Does the unborn child's ability to acquire certain rights mean that it has full capacity to perform legal acts?",opts:["No. Certain rights may vest conditionally, but this does not confer full capacity to perform legal acts","Yes. Any ability to acquire a right necessarily gives full capacity to perform legal acts","Yes. Full capacity exists whenever the right concerned has an economic value"],a:0},
  {type:"application",q:"A child is born alive after a right that did not require acceptance had arisen in the child's favour. Which legal idea is most relevant?",opts:["The right may vest because the live-birth condition stated in the provision has been satisfied","The right cannot vest because rights arising before birth are always legally ineffective","The child acquires the right only because birth automatically gives retroactive full capacity"],a:0},
  {type:"application",q:"If the child is not born alive, what is the effect of the condition stated in the text on those rights?",opts:["The condition on which those particular rights depended has not been satisfied","The rights vest permanently because the legal cause arose before the expected birth","The rights are transferred automatically to a separate legal person created by the law"],a:0}
]:[
  {type:"recall",q:"What is the first element to examine in contract formation?",opts:["Occurrence of damage","Matching intentions","Unjust enrichment"],a:1},
  {type:"understanding",q:"Are matching intentions sufficient for every contract?",opts:["No. The law may require special formalities","Yes, always","Only if one party is a trader"],a:0},
  {type:"application",q:"If the law requires a special form that was not satisfied, what should you examine?",opts:["The legal effect of the required form","Damage only","The parties' ages only"],a:0}
];

var arabicNums=["1","2","3","4","5"];

function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
function clearTimer(){if(state.timer){clearInterval(state.timer);state.timer=null;}}
function shuffle(arr){
  var a=arr.slice();
  for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}
  return a;
}
function prepareQuestions(){
  state.runQuestions=questions.map(function(q){
    var packed=q.opts.map(function(t,i){return {t:t,correct:i===q.a};});
    packed=shuffle(packed);
    return {type:q.type,q:q.q,opts:packed.map(function(x){return x.t;}),a:packed.findIndex(function(x){return x.correct;})};
  });
}
function chrome(inner){
  APP.innerHTML='<div class="demoShell"><header class="demoTop"><div class="demoTopIn">'+
    '<div class="demoBrand"><div class="demoLogo" dir="ltr"><img src="assets/lexlearn-logo.svg" alt="LexLearn"></div><div><b dir="ltr">LexLearn</b><small>We understand your mind and build your path.</small></div></div>'+
    '<div class="demoMeta"><span class="demoPill">'+countryLabel()+' • '+(COUNTRY==="qa"?"Theory of Rights":"Sources of Obligations")+'</span><a class="demoGhost" href="index-en.html">Home</a></div>'+
    '</div></header><main class="demoWrap">'+inner+'</main><footer class="demoFooter">LexLearn</footer></div>';
}
function render(){
  clearTimer();
  if(state.view==="hero")return hero();
  if(state.view==="read")return read();
  if(state.view==="quiz")return quiz();
  if(state.view==="neutral")return neutral();
  if(state.view==="free")return free();
  if(state.view==="result")return result();
  if(state.view==="exam")return exam();
}
function hero(){
  chrome('<section class="demoStage demoIntro"><div class="stageCard centered">'+
    '<span class="demoEyebrow">Short diagnostic</span>'+
    '<h2>Try it yourself</h2>'+
    '<p>Read the legal text, then answer the questions after it disappears.</p>'+
    '<div class="demoActions centeredActions"><button class="btn primary" id="startDemo">Start</button></div>'+
  '</div></section>');
  document.getElementById("startDemo").onclick=function(){
    state.view="read";state.step=0;state.answers=[];state.free="";prepareQuestions();render();
  };
}
function stage(progress,content){chrome('<section class="demoStage"><div class="progress"><i style="width:'+progress+'%"></i></div>'+content+'</section>');}
function read(){
  var total=22,left=total,start=Date.now();
  stage(12,'<div class="stageCard">'+
    '<span class="demoEyebrow">Read the text carefully</span>'+
    '<h2>'+(COUNTRY==="qa"?"Articles 39 and 40 — Legal Personality":"Contract formation rule")+'</h2>'+
    '<div class="legalPaper" dir="ltr"><small>'+(COUNTRY==="qa"?"Qatar Civil Code No. 22 of 2004 — Articles 39 and 40 • educational English rendering":"Training text")+'</small><div class="txt">'+esc(text64)+'</div></div>'+
    '<div class="timerRow"><button class="btn primary" id="finishRead">Done</button><div class="timerCircle" id="ring"><b id="num">'+total+'</b></div></div>'+
  '</div>');
  state.timer=setInterval(function(){
    left=Math.max(0,total-Math.floor((Date.now()-start)/1000));
    var n=document.getElementById("num"),r=document.getElementById("ring");
    if(n)n.textContent=left;if(r)r.style.setProperty("--angle",((total-left)/total*360)+"deg");
    if(left<=0){clearTimer();state.view="quiz";state.step=0;render();}
  },250);
  document.getElementById("finishRead").onclick=function(){clearTimer();state.view="quiz";state.step=0;render();};
}
function quiz(){
  var q=state.runQuestions[state.step]||questions[state.step],progress=26+state.step*10;
  stage(progress,'<div class="stageCard">'+
    '<span class="demoEyebrow">Question '+arabicNums[state.step]+' of 5</span>'+
    '<h2>'+esc(q.q)+'</h2>'+
    '<div class="choices">'+q.opts.map(function(x,i){return '<button class="choice" data-o="'+i+'">'+esc(x)+'</button>';}).join("")+'</div>'+
  '</div>');
  document.querySelectorAll("[data-o]").forEach(function(b){b.onclick=function(){
    state.answers.push({type:q.type,correct:Number(b.dataset.o)===q.a});
    if(state.step<state.runQuestions.length-1){state.step++;render();}else{state.view="neutral";render();}
  };});
}
function neutral(){
  var opts=shuffle([{t:"■",correct:false},{t:"◆",correct:true},{t:"●",correct:false}]);
  stage(80,'<div class="stageCard"><span class="demoEyebrow">Question 6</span>'+
    '<h2>Complete the pattern: ◆ ● ◆ ● ?</h2>'+
    '<div class="choices symbolChoices">'+opts.map(function(x,i){return '<button class="choice" data-n="'+i+'">'+x.t+'</button>';}).join("")+'</div>'+
  '</div>');
  document.querySelectorAll("[data-n]").forEach(function(b){b.onclick=function(){state.view="free";render();};});
}
function free(){
  stage(90,'<div class="stageCard"><span class="demoEyebrow">Final question</span>'+
    '<h2>Write the two or three most important words you remember from the text.</h2>'+
    '<textarea class="freeInput" id="freeText" dir="rtl" placeholder="Write what you remember..."></textarea>'+
    '<div class="demoActions"><button class="btn primary" id="seeResult">Show result</button></div>'+
  '</div>');
  document.getElementById("seeResult").onclick=function(){state.free=document.getElementById("freeText").value.trim();state.view="result";render();};
}
function pct(type){
  var a=state.answers.filter(function(x){return x.type===type;});
  if(!a.length)return 0;
  return Math.round(a.filter(function(x){return x.correct;}).length/a.length*100);
}
function qualitative(v){if(v>=80)return "Strong";if(v>=45)return "Developing";return "Needs training";}
function freeScore(){
  var n=(state.free||"").replace(/[أإآ]/g,"ا").replace(/[ًٌٍَُِّْـ]/g,"");
  var keys=COUNTRY==="qa"?["personality","birth","alive","unborn","child","rights"]:["offer","acceptance","subject","cause","contract"];
  var hits=keys.filter(function(k){return n.indexOf(k)>=0;}).length;
  return Math.min(100,hits*25);
}
function result(){
  var recall=Math.round((pct("recall")+freeScore())/2);
  var understanding=pct("understanding");
  var application=pct("application");
  var arr=[["Recall",recall,"recall"],["Understanding",understanding,"understanding"],["Application",application,"application"]];
  var weakest=arr.slice().sort(function(a,b){return a[1]-b[1];})[0];
  var rec=weakest[2]==="application"?"Start with short fact patterns in which one decisive fact changes.":weakest[2]==="understanding"?"Break the rule into its elements and explain what each element means.":"Start with short retrieval before rereading the text.";
  var pk=studentSession&&studentSession.studentId?("lexlearn_v9_profile_"+studentSession.studentId):"lexlearn_v9_profile",p={results:{}};
  try{p=JSON.parse(localStorage.getItem(pk)||"{\"results\":{}}")||{results:{}};}catch(e){}
  p.results=p.results||{};
  var gap=recall-understanding,profileType=gap>=12?"recall-led":gap<=-12?"understanding-led":"balanced";
  p.results[COURSE_KEY]={metrics:{recall:recall,understanding:understanding,application:application,legal_precision:null,retention:null,exam:null},profileType:profileType,updatedAt:Date.now()};
  localStorage.setItem(pk,JSON.stringify(p));
  if(studentSession&&studentSession.cloud&&window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()){
    LEX_CLOUD.saveSnapshot({courseId:COURSE_KEY,snapshotType:"profile",state:p}).catch(function(){});
    LEX_CLOUD.logEvent("DIAGNOSTIC_COMPLETED",{course_id:COURSE_KEY,recall:recall,understanding:understanding,application:application,profile_type:profileType}).catch(function(){});
  }
  var trainingQuery=(studentSession&&studentSession.cloud?"":"demo=1&")+"country="+COUNTRY+"&subject="+SUBJECT+"&start=1";
  stage(97,'<div class="stageCard">'+
    '<span class="demoEyebrow">Result</span>'+
    '<h2>Your result in this attempt</h2>'+
    '<div class="metrics three">'+
      metric("Recall",recall)+metric("Understanding",understanding)+metric("Application",application)+
    '</div>'+
    '<div class="planCard nextStep"><h3>Next step</h3><p>'+esc(rec)+'</p></div>'+
    '<div class="demoActions"><a class="btn primary" style="text-decoration:none" href="program-en.html?'+trainingQuery+'">Start the recommended training</a><button class="btn secondary" id="toExam">Exam-style question</button><button class="btn secondary" id="again">Retake diagnostic</button></div>'+
  '</div>');
  document.getElementById("toExam").onclick=function(){state.view="exam";render();};
  document.getElementById("again").onclick=function(){state.view="hero";render();};
}
function metric(name,v){return '<div class="metric"><span>'+name+'</span><b>'+qualitative(v)+'</b></div>';}
function analyzeExamAnswer(answer){
  var n=String(answer||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim(),words=n?n.split(" "):[];
  var keyGroups=COUNTRY==="qa"?[
    ["legal personality","personality"],["born alive","live birth"],["unborn child","unborn"],["rights"],["condition","provided"]
  ]:[["contract"],["intention"],["acceptance"],["rule"],["conclusion"]];
  var hit=keyGroups.filter(function(g){return g.some(function(k){return n.indexOf(k)>=0;});}).length;
  var causal=["because","therefore","thus","so that","which means","if","since"].filter(function(k){return n.indexOf(k)>=0;}).length;
  var precision=COUNTRY==="qa"?["legal personality","unborn child","born alive","acquire rights","legal capacity"].filter(function(k){return n.indexOf(k)>=0;}).length:["contract formation","matching intentions","acceptance","offer"].filter(function(k){return n.indexOf(k)>=0;}).length;
  var structure=["issue","rule","application","conclusion","first","second","therefore"].filter(function(k){return n.indexOf(k)>=0;}).length;
  var recall=Math.min(100,25+hit*15+Math.min(20,words.length));
  var understanding=Math.min(100,20+causal*16+Math.min(35,hit*7));
  var legal=Math.min(100,25+precision*18+Math.min(20,hit*4));
  var exam=Math.min(100,20+structure*15+Math.min(35,Math.floor(words.length/4)));
  var all={recall:recall,understanding:understanding,legal:legal,exam:exam};
  var weakest=Object.keys(all).sort(function(a,b){return all[a]-all[b];})[0];
  var advice={
    recall:"Retrieve the key elements of the rule before reopening the text.",
    understanding:"Explain more clearly why the legal position differs between the two situations.",
    legal:"Use more precise legal terminology and identify the decisive statutory condition.",
    exam:"Structure the answer as issue → rule → explanation/application → conclusion."
  }[weakest];
  return {scores:all,advice:advice};
}
function exam(){
  stage(100,'<div class="stageCard">'+
    '<span class="demoEyebrow">Exam-style question</span>'+
    '<h2>'+(COUNTRY==="qa"?"Explain the difference between acquiring legal personality and the unborn child's ability to acquire certain rights.":"Explain the rule of contract formation.")+'</h2>'+
    '<textarea class="freeInput" id="examText" dir="ltr" placeholder="Write your answer here..."></textarea>'+
    '<div class="demoActions"><button class="btn primary" id="showStructure">Analyse my answer</button></div>'+
    '<div id="examStructure"></div>'+
  '</div>');
  document.getElementById("showStructure").onclick=function(){
    var answer=document.getElementById("examText").value.trim();
    if(answer.split(/\s+/).filter(Boolean).length<12){
      document.getElementById("examStructure").innerHTML='<div class="feedback"><b>Please write a little more.</b><br>We need several sentences to analyse your reasoning rather than only the conclusion.</div>';
      return;
    }
    var a=analyzeExamAnswer(answer),s=a.scores;
    document.getElementById("examStructure").innerHTML=
      '<div class="feedback"><b>Experimental analysis of your answer</b><br>This reads the content and structure of your response to provide an initial learning profile.</div>'+
      '<div class="metrics" style="margin-top:12px">'+
        '<div class="metric"><span>Recall</span><b>'+s.recall+'%</b></div>'+
        '<div class="metric"><span>Understanding</span><b>'+s.understanding+'%</b></div>'+
        '<div class="metric"><span>Legal precision</span><b>'+s.legal+'%</b></div>'+
        '<div class="metric"><span>Answer structure</span><b>'+s.exam+'%</b></div>'+
      '</div>'+
      '<div class="planCard" style="margin-top:12px"><h3>Your main improvement point</h3><p>'+esc(a.advice)+'</p></div>'+
      '<div class="feedback"><b>Reference elements:</b><br>'+(COUNTRY==="qa"?"Legal personality begins on live birth → status of the unborn child → type of rights → live-birth condition → conclusion.":"Rule → intention → legal restrictions → conclusion.")+'</div>';
  };
}
render();
})();