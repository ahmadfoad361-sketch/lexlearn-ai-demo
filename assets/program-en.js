(function(){
"use strict";
var APP=document.getElementById("programApp");
var qs=new URLSearchParams(location.search);
var AUTO_START=qs.get("start")==="1";
var STUDENT_SESSION=(function(){try{return JSON.parse(localStorage.getItem("lexlearn_student_session"))||null;}catch(e){return null;}})();
var DEMO=qs.get("demo")==="1"&&!(STUDENT_SESSION&&STUDENT_SESSION.cloud&&STUDENT_SESSION.studentId);
var COUNTRY="qa",SUBJECT="rights",SNAPSHOT_COURSE="qa-rights",COURSE_DB_ID="qa-qu-lawc101-rights";
var STUDENT_SCOPE=STUDENT_SESSION&&STUDENT_SESSION.studentId?("_"+STUDENT_SESSION.studentId):"";
var PROFILE_KEY="lexlearn_v9_profile"+STUDENT_SCOPE;
var COURSE_KEY="lexlearn_course_v2_qa_rights"+STUDENT_SCOPE;

var RIGHTS_ARTICLES={
"39":"A human being acquires legal personality upon being born alive, and legal personality ends at death. Special rules govern missing persons, absentees and foundlings.",
"40":"An unborn child may acquire rights whose cause does not require acceptance, provided that the child is born alive.",
"41":"A person's domicile is the place in which that person habitually resides. A person may have more than one domicile at the same time.",
"42":"The place where a person carries on a trade or profession is considered that person's domicile in matters connected with that trade or profession.",
"43":"The domicile of a minor, an interdicted person, a missing person or an absentee is the domicile of the person who legally represents them. A minor or interdicted person may nevertheless have a special domicile for acts they are legally capable of performing.",
"44":"A chosen domicile may be designated for a particular legal act. It applies to matters connected with that act and must be proved in writing.",
"45":"A person's family consists of the spouse and relatives. Relatives are persons who share a common ancestor.",
"46":"Direct kinship is the relationship between ascendants and descendants. Collateral kinship exists between persons who share a common ancestor without one being a descendant of the other.",
"47":"The degree of direct kinship is calculated by counting each generation without counting the common ancestor. Collateral kinship is calculated by ascending to the common ancestor and descending to the other relative, without counting the common ancestor.",
"48":"The degree of affinity is determined by the degree of kinship of the spouse.",
"49":"A person who has reached the age of majority has full capacity to perform legal acts unless a legal ground exists for continued guardianship, tutorship or interdiction. The age of majority is eighteen full years.",
"50":"A person who lacks discernment because of young age or a legally recognised mental condition lacks capacity to perform legal acts. A person under seven years of age is deemed to lack discernment.",
"51":"A person who has reached the age of discernment but not the age of majority, and an adult who is prodigal or of weak judgment, has limited capacity as provided by law.",
"52":"Persons who lack or have limited capacity are subject to the rules governing guardianship over property under special laws.",
"53":"Legal persons include the State and its legally recognised units, municipalities, public bodies and institutions, endowments, companies, associations, private institutions and other groups of persons or assets to which the law grants legal personality.",
"54":"A legal person enjoys rights compatible with its nature. It has a separate patrimony, legal capacity, the right to litigate, an independent domicile and nationality, and acts through a legal representative.",
"55":"Where a legal person has its principal seat abroad but carries on activity in Qatar, the place of its local management is considered its domicile for that activity.",
"56":"Anything not excluded from legal dealings by its nature or by law may be the object of financial rights.",
"57":"Property owned by the State or public legal persons and allocated to a public benefit is public property. It may not be disposed of, seized, or acquired by prescription.",
"58":"Public property loses that status when its allocation to public benefit ends in the manner recognised by law.",
"59":"Anything fixed in place that cannot be moved without damage or alteration is immovable property; everything else is movable. A movable may be treated as immovable by destination when allocated by the owner to serve or exploit an immovable.",
"60":"Fungible things are items whose units are identical or sufficiently similar that one may replace another in customary dealings. Non-fungible things are those whose units differ in a legally significant way.",
"61":"Consumable things are those whose use consists in consuming or spending them. Goods prepared for sale in shops are treated as consumable property.",
"62":"A person who lawfully exercises a right is not liable merely for damage resulting from that lawful exercise.",
"63":"The exercise of a right is unlawful where the intended interest is unlawful, where the sole purpose is to harm another, where the interest is grossly disproportionate to the harm, or where the exercise causes excessive and unusual harm."
};
function articleText(){var nums=[].slice.call(arguments);return nums.map(function(n){return "Article "+n+": "+RIGHTS_ARTICLES[n];}).join("\n\n");}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(ch){return({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[ch];});}
function norm(v){return String(v||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();}
function pct(v){return Math.max(0,Math.min(100,Math.round(Number(v)||0)));}

var curriculum=[
{week:1,title:"Legal Personality and Domicile",sessions:[
["Beginning of Legal Personality","Articles 39–40: natural persons and the unborn child","core"],
["General Domicile","Article 41: habitual residence and multiple domiciles","core"],
["Business and Representative Domicile","Articles 42–43","core"],
["Chosen Domicile","Article 44 + application to a fact pattern","adaptive"],
["Progress Assessment 1","Recall + understanding + application on Articles 39–44","assessment"]]},
{week:2,title:"Kinship and Legal Capacity",sessions:[
["Family and Kinship","Articles 45–46","core"],
["Degrees of Kinship and Affinity","Articles 47–48","core"],
["Majority and Discernment","Articles 49–50","core"],
["Limited Capacity and Guardianship","Articles 51–52","adaptive"],
["Progress Assessment 2","Classifying capacity and legal status","assessment"]]},
{week:3,title:"Legal Persons",sessions:[
["Who Is a Legal Person?","Article 53: categories and forms","core"],
["Effects of Legal Personality","Article 54: patrimony, capacity and litigation","core"],
["Domicile and Representation","Articles 54–55","core"],
["Natural or Legal Person?","Comparison and application to new facts","adaptive"],
["Progress Assessment 3","Comparative analysis + constructed response","assessment"]]},
{week:4,title:"Property as the Object of Rights",sessions:[
["Objects of Financial Rights","Article 56","core"],
["Public Property","Articles 57–58","core"],
["Movable and Immovable Property","Article 59 + immovable by destination","core"],
["Fungible, Non-fungible and Consumable","Articles 60–61","adaptive"],
["Progress Assessment 4","Property classification and legal application","assessment"]]},
{week:5,title:"Exercise and Abuse of Rights",sessions:[
["Lawful Exercise","Article 62","core"],
["Unlawful Interest and Intent to Harm","Article 63: first and second grounds","core"],
["Disproportion and Excessive Harm","Article 63: third and fourth grounds","core"],
["Change One Fact","When does lawful exercise become unlawful?","adaptive"],
["Progress Assessment 5","Borderline cases + structured legal answer","assessment"]]},
{week:6,title:"Integrated Theory of Rights",sessions:[
["Who Holds the Right?","Personality + capacity + domicile","core"],
["What Is the Object?","Legal person + property + classification","core"],
["How Is the Right Exercised?","Integrating Articles 39–63","adaptive"],
["Legal Simulation","Multi-issue constructed response","adaptive"],
["Final Assessment","Cumulative assessment + personal learning plan","assessment"]]}
];
function sessionMeta(n){var idx=Math.max(1,Math.min(30,n))-1,w=Math.floor(idx/5),d=idx%5,x=curriculum[w].sessions[d];return {week:w+1,day:d+1,title:x[0],detail:x[1],kind:x[2],weekTitle:curriculum[w].title};}

var generic={
review:{mode:"mcq",title:"Legal Retrieval",q:"Without reopening the text, what is the best way to retrieve a legal rule you studied earlier?",opts:["Recall the rule, its elements and their legal effect","Recall only the article number and stop there","Reread the text before trying to remember anything"],a:0,dimension:"recall",why:"Retrieval is stronger when you reconstruct the rule and its legally decisive elements."},
understanding:{mode:"mcq",title:"Understand the Function of the Rule",q:"Why is memorising an article number and wording not enough?",opts:["You must know what each element does and when it changes the legal outcome","The article number alone is sufficient whenever the chapter title is remembered","The elements can be ignored as long as the wording is memorised"],a:0,dimension:"understanding",why:"Understanding means knowing how the rule interacts with legally relevant facts."},
application:{mode:"mcq",title:"Change One Fact",q:"If one legally decisive fact changes while the remaining facts stay the same, what should you do?",opts:["Reapply the rule and test whether the classification or outcome changes","Keep the same outcome because only one fact changed","Reread the rule without testing the changed fact"],a:0,dimension:"application",why:"Legal application depends on identifying which facts alter the operation of the rule."},
spot:{mode:"mcq",title:"Find the Decisive Fact",q:"In a legal problem, which fact should you identify first?",opts:["The fact connected to an element of the governing rule","The most noticeable factual detail even if it has no legal effect","All facts equally, without identifying which element they affect"],a:0,dimension:"application",why:"The decisive fact connects the factual problem to the legal rule."},
exam:{mode:"mcq",title:"Build the Legal Answer",q:"Which sequence gives the clearest short legal answer?",opts:["Issue → rule → decisive element → application → conclusion","Facts → conclusion without identifying the governing rule","Article number → final conclusion without application"],a:0,dimension:"exam",why:"A strong legal answer makes the reasoning path visible."},
memory:{mode:"mcq",title:"From Understanding to Retrieval",q:"If you understand a rule but cannot retrieve it quickly, what should you do?",opts:["Turn the meaning into short retrieval cues, then reconstruct the rule from them","Memorise a long paragraph without linking it to meaning","Rely on rereading instead of retrieval practice"],a:0,dimension:"recall",why:"Meaning-based cues convert understanding into faster recall."}
};

var weekTasks={
1:[
{mode:"mcq",title:"Beginning of Personality",q:"Under Article 39, when does a human being acquire legal personality?",opts:["Upon being born alive","From conception for all legal effects","At the age of seven"],a:0,dimension:"recall",text:articleText("39"),why:"Article 39 links the beginning of legal personality to live birth."},
{mode:"mcq",title:"The Unborn Child",q:"What is distinctive about the unborn child's position under Article 40?",opts:["Certain rights may vest if they do not require acceptance, provided the child is born alive","The unborn child has full capacity to perform legal acts","No rights may ever arise before birth"],a:0,dimension:"understanding",text:articleText("40"),why:"The provision recognises a limited capacity to acquire certain rights, subject to live birth."},
{mode:"mcq",title:"Habitual Domicile",q:"A person habitually lives in Doha but works several days each month elsewhere. What is the starting point for identifying the general domicile?",opts:["The place of habitual residence","Any place where the person happens to be on a given day","The place of birth in every case"],a:0,dimension:"application",text:articleText("41"),why:"Article 41 makes habitual residence the basis of the general domicile."},
{mode:"essay",title:"Explain Articles 39–40",q:"In 4–6 sentences, distinguish the beginning of legal personality from the unborn child's ability to acquire certain rights. Explain why live birth matters in each rule.",dimension:"understanding",keys:["legal personality","born alive","unborn","rights"],why:"The response should distinguish personality itself from the conditional acquisition of particular rights."}
],
2:[
{mode:"mcq",title:"Age of Majority",q:"A student has reached 18 full years and no legal ground for continued guardianship or interdiction applies. What is the starting position?",opts:["The person has full capacity to perform legal acts","The person is deemed to lack discernment","The person necessarily has limited capacity"],a:0,dimension:"application",text:articleText("49"),why:"Article 49 sets eighteen full years as the age of majority, subject to the stated legal qualifications."},
{mode:"mcq",title:"Lack of Discernment",q:"How does Article 50 treat a child who has not completed seven years?",opts:["The child is deemed to lack discernment","The child has limited capacity but complete discernment","The child has full legal capacity"],a:0,dimension:"recall",text:articleText("50"),why:"The statute treats a person under seven as lacking discernment."},
{mode:"mcq",title:"Limited Capacity",q:"A person has reached the age of discernment but has not reached 18. What is the initial classification under Article 51?",opts:["Limited capacity, subject to the rules provided by law","Full capacity for all acts","No legal personality"],a:0,dimension:"application",text:articleText("51","52"),why:"Article 51 distinguishes limited capacity from both full capacity and absence of personality."},
{mode:"essay",title:"Compare Capacity at Different Ages",q:"In 5–7 sentences, compare a person aged 6, a person aged 17, and a person who has reached 18 full years. Distinguish discernment from legal capacity.",dimension:"application",keys:["seven","18","discernment","limited capacity","full capacity"],why:"The answer should use the statutory age thresholds without confusing personality, discernment and capacity."}
],
3:[
{mode:"mcq",title:"Separate Patrimony",q:"Why should the financial estate of a company with legal personality not automatically be treated as the estate of one of its members?",opts:["Article 54 recognises a separate patrimony for the legal person","A legal person cannot own property","Every member becomes a legal person"],a:0,dimension:"understanding",text:articleText("54"),why:"Separate patrimony is a central effect of legal personality."},
{mode:"mcq",title:"Rights of the Legal Person",q:"Which group of legal effects is stated in Article 54?",opts:["Capacity, right to litigate, independent domicile and nationality","Age of majority and direct kinship","Only the right to own movable property"],a:0,dimension:"recall",text:articleText("54"),why:"Article 54 gathers the main legal effects of recognition as a legal person."},
{mode:"mcq",title:"Local Domicile",q:"A foreign company has local management and activity in Qatar. What is its domicile in relation to that Qatari activity?",opts:["The place of local management in Qatar","The personal domicile of one employee","It can have no domicile in Qatar"],a:0,dimension:"application",text:articleText("55"),why:"Article 55 connects local activity with the place of local management."},
{mode:"essay",title:"Natural Person vs Legal Person",q:"In 5–7 sentences, compare a natural person and a legal person in terms of patrimony, capacity, domicile and representation.",dimension:"understanding",keys:["natural person","legal person","patrimony","capacity","domicile","representative"],why:"The comparison should explain legal consequences, not merely list labels."}
],
4:[
{mode:"mcq",title:"Object of Financial Rights",q:"Which things may, in principle, be the object of financial rights under Article 56?",opts:["Things not excluded from legal dealings by their nature or by law","Every thing without exception","Public property only"],a:0,dimension:"understanding",text:articleText("56"),why:"Article 56 states the general rule and its exclusion."},
{mode:"mcq",title:"Public Property",q:"Land owned by the State is actually allocated to a public park. Which fact is decisive for the special public-property regime?",opts:["Allocation to public benefit","The physical size of the land","The fact that the owner is a public body, without considering allocation"],a:0,dimension:"application",text:articleText("57"),why:"Public ownership plus allocation to public benefit activates the special protection in Article 57."},
{mode:"mcq",title:"Immovable by Destination",q:"A movable machine is placed by the owner of land to serve that land on a stable basis. What classification should be tested?",opts:["Whether it is immovable by destination","Whether it automatically becomes public property","Whether every machine is necessarily fungible"],a:0,dimension:"application",text:articleText("59"),why:"Article 59 recognises immovable property by destination when its conditions are met."},
{mode:"essay",title:"Classify and Explain",q:"Classify three examples — a building, a quantity of standardised rice, and a car prepared for sale in a dealership — using the distinctions in Articles 59–61. Give a reason for each classification.",dimension:"application",keys:["immovable","movable","fungible","consumable"],why:"Classification requires a legal criterion, not just a label."}
],
5:[
{mode:"mcq",title:"Lawful Exercise",q:"What is the basic rule in Article 62 where a person lawfully exercises a right and another person suffers damage?",opts:["The holder is not liable merely because that damage occurred","Any damage automatically creates liability","The right itself is automatically lost"],a:0,dimension:"recall",text:articleText("62"),why:"Article 62 separates lawful exercise from liability based merely on the existence of damage."},
{mode:"mcq",title:"Intent to Harm",q:"A right-holder has no genuine purpose other than harming a neighbour. Which factor in Article 63 is most relevant?",opts:["The sole purpose of harming another","The holder's domicile","The classification of the property alone"],a:0,dimension:"application",text:articleText("63"),why:"A sole purpose to cause harm is an express ground of unlawful exercise."},
{mode:"mcq",title:"Gross Disproportion",q:"A very slight interest is pursued at the cost of severe harm to another. What should be tested?",opts:["Whether the interest is grossly disproportionate to the harm","The age of majority of the right-holder","The domicile of a legal person"],a:0,dimension:"application",text:articleText("63"),why:"Article 63 expressly treats gross disproportionality as a ground of unlawful exercise."},
{mode:"essay",title:"Compare Two Uses of the Same Right",q:"In 6–8 sentences, compare two uses of the same right: one pursues a substantial lawful interest with ordinary harm; the other pursues a trivial interest while causing severe harm. Explain why the outcomes may differ under Articles 62 and 63.",dimension:"application",keys:["lawful","interest","harm","disproportion","Article 62","Article 63"],why:"This reveals whether the student can apply abuse-of-right criteria rather than simply recite them."}
],
6:[
{mode:"mcq",title:"Identify the Right-Holder",q:"A problem includes a minor and a company. What should you separate first in the analysis?",opts:["Each person's legal status and capacity or legal personality","The abuse-of-right issue before identifying the persons","The property classification only"],a:0,dimension:"application",why:"An integrated problem starts by identifying the legal positions of the persons involved."},
{mode:"mcq",title:"Identify the Object of the Right",q:"After identifying the right-holder, what should you examine if the dispute concerns a thing or property?",opts:["The nature and classification of the property and the rules attached to that classification","Only the name of the party","Only the monetary value of the property"],a:0,dimension:"application",why:"Property classification may alter the governing legal rule."},
{mode:"mcq",title:"Test the Exercise of the Right",q:"A fully capable person holds a right but exercises it in a way that causes excessive and unusual harm. What is the next step?",opts:["Test the manner of exercise under Article 63","Treat the exercise as lawful simply because the right exists","Return only to the age-of-majority rule"],a:0,dimension:"application",why:"The existence of a right does not end the inquiry into whether it is exercised lawfully."},
{mode:"essay",title:"Final Integrated Simulation",q:"Write 8–10 sentences analysing a fact pattern involving a person with limited capacity, a legal person, public property, and an exercise of a right that causes excessive harm. Separate the issues and connect each conclusion to a rule.",dimension:"exam",keys:["limited capacity","legal person","public property","exercise of a right","conclusion"],why:"The final simulation tests issue separation, rule selection, application and structured legal writing."}
]
};

var assessmentBanks={
1:[
{q:"When does legal personality begin under Article 39?",opts:["Upon being born alive","At the age of seven","From conception for every legal effect"],a:0,dimension:"recall"},
{q:"What condition is attached to the unborn child's acquisition of the rights described in Article 40?",opts:["The child must be born alive","The child must reach 18","The child must have an independent domicile"],a:0,dimension:"understanding"},
{q:"What is the primary basis of general domicile under Article 41?",opts:["Habitual residence","Place of birth in every case","Any temporary place of presence"],a:0,dimension:"application"},
{q:"A dispute arises directly from a person's trade. Which place may operate as a special domicile for that dispute?",opts:["The place where the trade is carried on","The place of birth only","Any hotel in which the person stayed"],a:0,dimension:"application"},
{q:"What is the strongest structure for a short answer on domicile?",opts:["Type of domicile → decisive fact → rule → application → conclusion","Conclusion only","Address only, without a legal rule"],a:0,dimension:"exam"}],
2:[
{q:"What is the age of majority under Article 49?",opts:["18 full years","Seven years","21 years"],a:0,dimension:"recall"},
{q:"How does lack of discernment differ from limited capacity?",opts:["Lack of discernment concerns the absence of discernment; limited capacity concerns a person who has discernment but lacks full capacity","There is no legal difference","Limited capacity always applies only after age 18"],a:0,dimension:"understanding"},
{q:"What is the initial classification of a six-year-old under Article 50?",opts:["Lacking discernment","Fully capable","A legal person"],a:0,dimension:"application"},
{q:"What is the initial classification of a seventeen-year-old under Article 51?",opts:["Limited capacity, subject to law","Full capacity in every case","No legal personality"],a:0,dimension:"application"},
{q:"Which fact should be identified first in a capacity problem?",opts:["Age and any legal circumstance affecting discernment or interdiction","The colour of the document","The place where a witness is seated"],a:0,dimension:"application"}],
3:[
{q:"Which feature most clearly expresses the independence of a legal person?",opts:["A separate patrimony","An age of majority of 18","Collateral kinship"],a:0,dimension:"recall"},
{q:"Why does a legal person not enjoy rights that inherently depend on natural human characteristics?",opts:["Because Article 54 recognises only rights compatible with the nature of a legal person","Because a legal person has no rights","Because every legal person is a public body"],a:0,dimension:"understanding"},
{q:"A company wishes to bring a claim. Which effect in Article 54 directly supports this?",opts:["The right to litigate","Age of majority","Affinity"],a:0,dimension:"application"},
{q:"A foreign company has local management in Qatar. What is its domicile for the Qatari activity?",opts:["The place of local management in Qatar","The manager's personal domicile","It has no domicile in Qatar"],a:0,dimension:"application"},
{q:"How does a legal person express its will?",opts:["Through a person who legally represents it","In exactly the same physical way as a natural person","It cannot express legal will"],a:0,dimension:"legal_precision"}],
4:[
{q:"What is the general rule in Article 56?",opts:["Anything not excluded from legal dealings by nature or law may be the object of financial rights","Everything is public property","Only immovable property may be an object of rights"],a:0,dimension:"recall"},
{q:"Why does public property receive special protection under Article 57?",opts:["Because it is public property allocated to public benefit","Because all public property is immovable","Because no one may ever use public property"],a:0,dimension:"understanding"},
{q:"When may public property lose its public status?",opts:["When its allocation to public benefit ends in a legally recognised manner","After one year","Whenever a private person asks to buy it"],a:0,dimension:"application"},
{q:"A movable is allocated by the owner to serve an immovable. Which classification should be tested?",opts:["Immovable by destination","Public property automatically","Non-fungible property automatically"],a:0,dimension:"application"},
{q:"What distinguishes fungible from non-fungible things?",opts:["Whether units may replace one another in customary dealings without a material difference","Whether one is always immovable and the other always movable","Whether one is public and the other private"],a:0,dimension:"legal_precision"}],
5:[
{q:"What is the basic rule in Article 62?",opts:["Lawful exercise of a right does not create liability merely because damage occurs","Any damage automatically creates liability","Every exercise of a right is abusive"],a:0,dimension:"recall"},
{q:"What is wrong with saying that any damage proves abuse of rights?",opts:["Article 63 requires one of the statutory grounds of unlawful exercise","Nothing is wrong with that statement","Damage is legally irrelevant"],a:0,dimension:"understanding"},
{q:"A person uses a right solely to harm a neighbour. What is the closest classification?",opts:["Unlawful exercise under Article 63","Lawful exercise in every case","A question of legal capacity only"],a:0,dimension:"application"},
{q:"A trivial interest causes severe harm. Which test applies?",opts:["Gross disproportionality between the interest and the harm","Age of majority","Domicile"],a:0,dimension:"application"},
{q:"Why is excessive and unusual harm important under Article 63?",opts:["It is an independent statutory ground of unlawful exercise","It has no legal effect","It automatically makes the holder legally incapable"],a:0,dimension:"legal_precision"}],
6:[
{q:"What is the strongest analysis map for this Theory of Rights program?",opts:["Right-holder → capacity/personality → object of the right → exercise of the right","Contract only","Damage only"],a:0,dimension:"recall"},
{q:"Why may one article be insufficient in an integrated problem?",opts:["Because one fact pattern may involve several legal positions and elements","Because article numbers never matter","Because every article produces the same result"],a:0,dimension:"understanding"},
{q:"A minor, a company and public property appear in one problem. What should you do first?",opts:["Separate the legal issues and identify the rule for each","Choose one result for all issues","Start only with abuse of rights"],a:0,dimension:"application"},
{q:"A right-holder causes excessive and unusual harm. Does the existence of the right itself settle lawfulness?",opts:["No. The manner of exercise must still be tested under Article 63","Yes, always","Only if the holder is a legal person"],a:0,dimension:"legal_precision"},
{q:"What distinguishes an advanced legal answer?",opts:["Each conclusion is linked to a rule and a decisive fact","It is simply the longest answer","It lists article numbers without application"],a:0,dimension:"exam"}]
};

function loadProfile(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY))||{results:{}};}catch(e){return {results:{}};}}
function diagnostic(){var p=loadProfile();return p.results&&p.results[SNAPSHOT_COURSE]?p.results[SNAPSHOT_COURSE]:null;}
function defaultCourse(){return {session:1,started:true,completed:[],evidence:[],errors:[],history:[],lastAssessment:null,weekResults:{},repairRequired:false,repairWeek:null,adminOverrideWeeks:{},achievements:[],completedProgram:false,completedAt:null};}
function passed(r){return !!(r&&(r.status==="mastered"||r.status==="completed"||r.status==="completed_with_support"));}
function loadCourse(){
 try{
  var c=JSON.parse(localStorage.getItem(COURSE_KEY))||defaultCourse();
  c.weekResults=c.weekResults||{};c.adminOverrideWeeks=c.adminOverrideWeeks||{};c.achievements=c.achievements||[];
  c.completed=Array.isArray(c.completed)?c.completed:[];c.evidence=Array.isArray(c.evidence)?c.evidence:[];c.errors=Array.isArray(c.errors)?c.errors:[];c.history=Array.isArray(c.history)?c.history:[];
  c.session=Math.max(1,Math.min(30,Number(c.session)||1));
  for(var w=1;w<=5;w++){if(c.session>w*5&&!passed(c.weekResults[w])&&!c.adminOverrideWeeks[w+1]){c.session=w*5;break;}}
  c.completedProgram=!!c.completedProgram||passed(c.weekResults[6]);
  return c;
 }catch(e){return defaultCourse();}
}
var state={view:"home",task:0,queue:[],answers:[],assessmentAnswers:[],course:loadCourse(),diag:diagnostic(),repairMode:false,repairWeek:null,taskStartedAt:null};

function engineModel(){
 var base=(state.diag&&state.diag.metrics)||{};
 if(window.LEX_ENGINE){
  try{return LEX_ENGINE.learnerModel({metrics:base,events:state.course.evidence||[]});}catch(e){}
 }
 var axes={};["recall","understanding","application","legal_precision","retention","exam"].forEach(function(k){axes[k]={value:base[k]==null?50:Number(base[k]),evidence:base[k]==null?0:1};});
 var ranked=["recall","understanding","application"].sort(function(a,b){return axes[a].value-axes[b].value;});
 return {axes:axes,weakest:ranked[0],strongest:ranked[ranked.length-1],bridge:{mode:"evidence_bridge",label:"Use the strongest measured skill to build the weakest."},confidence:0.5};
}
function currentMetrics(){
 var base=(state.diag&&state.diag.metrics)||{},m=engineModel(),out={};
 ["recall","understanding","application","legal_precision","retention","exam"].forEach(function(k){var a=m.axes&&m.axes[k];out[k]=(a&&a.evidence>0)?Math.round(a.value):(base[k]==null?null:Math.round(base[k]));});
 return out;
}
function teachingPlan(){
 var m=engineModel(),weak=m.weakest||"application",strong=m.strongest||"recall",bridge=m.bridge||{},method,tasks;
 if((bridge.mode==="explain_from_memory")||(strong==="recall"&&weak==="understanding")){method="Use what the student can recall to explain the function of each element, then test the explanation on a new fact pattern.";tasks=["Explain from memory","Why does this element matter?","Change one fact"];}
 else if((bridge.mode==="memory_keys")||(strong==="understanding"&&weak==="recall")){method="Convert understanding into short retrieval cues, then reconstruct the rule after a delay.";tasks=["Retrieval cues","Reconstruct the rule","Delayed retrieval"];}
 else if(weak==="application"){method="Reduce abstract explanation and require the student to identify the decisive fact, apply the rule, and then change one fact.";tasks=["Find the decisive fact","Apply the rule","Change one fact"];}
 else if(weak==="exam"){method="Convert legal knowledge into a structured answer: issue, rule, elements, application, conclusion.";tasks=["Constructed response","Critique an answer","Short simulation"];}
 else{method="Use the strongest measured skill to build the weakest skill, then reassess before increasing difficulty.";tasks=["Skill bridge","Adaptive practice","Reassessment"];}
 return {weakest:weak,strongest:strong,bridge_mode:bridge.mode||"evidence_bridge",method:method,tasks:tasks,updatedAt:Date.now()};
}
function save(){
 var model=engineModel();state.course.adaptiveModel=model;state.course.teachingPlan=teachingPlan();
 localStorage.setItem(COURSE_KEY,JSON.stringify(state.course));
 if(window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()&&STUDENT_SESSION&&STUDENT_SESSION.cloud){
  LEX_CLOUD.saveSnapshot({courseId:SNAPSHOT_COURSE,snapshotType:"course",state:state.course}).catch(function(){});
  LEX_CLOUD.saveLearningPlan({course_id:COURSE_DB_ID,weakest_dimension:model.weakest,strongest_dimension:model.strongest,bridge_mode:model.bridge&&model.bridge.mode||"evidence_bridge",goals_json:[{dimension:model.weakest,teaching_plan:state.course.teachingPlan}],model_json:model}).catch(function(){});
 }
}
function weakestDimension(){return (engineModel().weakest||"application")==="legal_precision"?"understanding":(engineModel().weakest||"application");}
function bridgeTask(meta){
 var m=currentMetrics(),r=m.recall==null?50:m.recall,u=m.understanding==null?50:m.understanding;
 if(r-u>=12)return {mode:"essay",title:"From Recall to Understanding — "+meta.title,q:"Without opening the text, state the rule you remember for "+meta.detail+". Then explain why its decisive element changes the legal outcome.",dimension:"understanding",keys:["rule","because","therefore"],why:"We are using strong recall to build deeper understanding."};
 if(u-r>=12)return {mode:"essay",title:"From Understanding to Retrieval — "+meta.title,q:"For "+meta.detail+", write three short retrieval cues that would help you reconstruct the rule later. Explain the function of each cue.",dimension:"recall",keys:["rule","element","effect"],why:"We are converting understanding into reliable retrieval."};
 return generic.application;
}
function buildQueue(){
 var meta=sessionMeta(state.course.session),pool=weekTasks[meta.week]||weekTasks[1],lead=pool[Math.min(pool.length-1,meta.day-1)]||pool[0],weak=weakestDimension();
 var adaptive=weak==="recall"?generic.memory:weak==="understanding"?generic.understanding:weak==="application"?generic.application:weak==="exam"?generic.exam:generic.spot;
 var q=[lead,bridgeTask(meta),adaptive,generic.review];
 if(meta.week>=3&&!q.some(function(t){return t.mode==="essay";}))q.push(pool.find(function(t){return t.mode==="essay";})||lead);
 return q.filter(function(t,i,a){return t&&a.indexOf(t)===i;}).slice(0,5);
}
function balanceOptions(opts,correct){
 opts=(opts||[]).slice();if(opts.length<2)return opts;
 var lengths=opts.map(function(x){return norm(x).length;}),cl=lengths[correct]||0,other=Math.max.apply(null,lengths.filter(function(_,i){return i!==correct;}));
 if(cl-other<8||cl/Math.max(1,other)<1.25)return opts;
 var tails=[" in this case"," under the stated facts"," for this legal issue"," on these facts"," under the proposed classification"],target=Math.round(cl*.82);
 return opts.map(function(x,i){if(i===correct)return x;var out=x,g=0;while(norm(out).length<target&&g<tails.length){out+=tails[g++];}return out;});
}
function ordered(t){
 var opts=balanceOptions(t.opts||[],t.a),ids=opts.map(function(_,i){return i;}),target=(state.course.session+state.task)%ids.length,correct=t.a,rest=ids.filter(function(i){return i!==correct;});rest.splice(target,0,correct);
 return rest.map(function(i){return {orig:i,text:opts[i]};});
}
function essayAnalysis(answer,t){
 var n=norm(answer),words=n?n.split(" ").filter(Boolean):[],raw=String(answer||""),sent=raw.split(/[.!?\n]+/).filter(function(x){return x.trim();});
 var keys=t.keys||[],hits=keys.filter(function(k){return n.indexOf(norm(k))>=0;}).length;
 var recall=pct(30+(keys.length?hits/keys.length*60:Math.min(60,words.length*2)));
 var why=["because","therefore","so that","which means","as a result","since"].filter(function(k){return n.indexOf(k)>=0;}).length;
 var understanding=pct(25+why*15+Math.min(35,recall*.35));
 var app=["on these facts","in this case","applies","therefore","accordingly","the decisive fact"].filter(function(k){return n.indexOf(k)>=0;}).length;
 var application=pct(20+app*16+Math.min(25,words.length));
 var legal=["legal personality","capacity","domicile","legal person","patrimony","public property","immovable","fungible","exercise of a right","unlawful"].filter(function(k){return n.indexOf(k)>=0;}).length;
 var precision=pct(25+legal*8);
 var structure=["issue","rule","application","conclusion"].filter(function(k){return n.indexOf(k)>=0;}).length;
 var exam=pct(25+structure*15+Math.min(20,Math.max(0,sent.length-2)*5));
 var axes={recall:recall,understanding:understanding,application:application,legal_precision:precision,exam:exam};
 var overall=Math.round(recall*.18+understanding*.24+application*.28+precision*.12+exam*.18);
 var weakest=Object.keys(axes).sort(function(a,b){return axes[a]-axes[b];})[0];
 var notes={recall:"Retrieval is incomplete. Rebuild the topic rule from short cues before applying it.",understanding:"The response identifies elements but needs a clearer explanation of why they affect the outcome.",application:"The rule is present, but the link to the decisive facts should be more explicit.",legal_precision:"Use more precise legal terminology and identify the element that changes the classification.",exam:"Organise the answer more clearly around issue, rule, application and conclusion."};
 return {overall:overall,axes:axes,weakest:weakest,note:notes[weakest],style:exam>=65?"The answer is reasonably structured.":"The answer needs a clearer legal structure."};
}
function addEvidence(dim,score,method){
 state.course.evidence=state.course.evidence||[];
 state.course.evidence.push({itemId:null,dimension:dim,score:score,difficulty:3,confidence:null,latency_ms:Math.max(0,Date.now()-(state.taskStartedAt||Date.now())),grading_method:method||"english_adaptive",ts:Date.now(),session:state.course.session,week:sessionMeta(state.course.session).week});
 if(state.course.evidence.length>240)state.course.evidence=state.course.evidence.slice(-240);
 if(window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()&&STUDENT_SESSION&&STUDENT_SESSION.cloud){
  LEX_CLOUD.recordAttempt({course_id:COURSE_DB_ID,item_id:null,dimension:dim,answer_text:null,score:score,confidence:null,latency_ms:Math.max(0,Date.now()-(state.taskStartedAt||Date.now())),difficulty:3,grading_method:method||"english_adaptive",error_type:score>=.6?null:"skill_gap"}).catch(function(){});
 }
}
function chrome(inner){
 APP.innerHTML='<div class="courseShell"><header class="courseTop"><div class="courseTopIn"><div class="brand"><div class="mark"><img src="assets/lexlearn-logo.svg" alt="LexLearn"></div><div><b>LexLearn</b><small>Qatar • Theory of Rights</small></div></div><div class="topActions"><a class="topBtn" href="student-en.html">Student Portal</a><a class="topBtn" href="program.html?country=qa&subject=rights">العربية</a></div></div></header><main class="courseWrap">'+inner+'</main></div>';
}
function metricCard(label,v){var n=v==null?"—":Math.round(v)+"%",word=v==null?"Not measured":v>=80?"Strong":v>=60?"Developing well":v>=40?"Needs focus":"Priority";return '<div class="snapshotCard"><div class="snapshotRing" style="--p:'+(v==null?0:v)+'"><b>'+n+'</b></div><strong>'+label+'</strong><small>'+word+'</small></div>';}
function roadmap(current){
 return '<section class="weekRoadmap"><div class="roadmapTitle"><div><span class="kicker">6-week program</span><h2>Each week unlocks after the previous assessment is passed</h2></div><span class="roadmapCount">'+state.course.completed.length+' / 30 sessions</span></div><div class="weekBar">'+curriculum.map(function(w){
  var r=state.course.weekResults[w.week],open=state.diag&&(w.week===1||w.week<=current||passed(state.course.weekResults[w.week-1])||state.course.adminOverrideWeeks[w.week]),cls=r?"done":w.week===current&&open?"current":open?"available":"locked",status=r?(r.status==="repair"?"Needs reinforcement":r.status==="mastered"?"Mastered":"Completed"):open?"Available":"Locked";
  return '<button class="week '+cls+'" '+(open?'data-week="'+w.week+'"':'disabled')+'><b>Week '+w.week+'</b><small>'+esc(w.title)+'</small><em>'+status+'</em></button>';
 }).join("")+'</div></section>';
}
function home(){
 if(state.course.completedProgram)return completion();
 if(!state.diag){
  chrome('<section class="simpleStudentHero"><div><span class="kicker">Start here</span><h1>Complete the diagnostic first</h1><p>Week 1 remains locked until LexLearn has analysed your recall, understanding and application.</p></div><a class="primary bigStudentCta" href="showcase-en.html?country=qa&subject=rights">Start diagnostic</a></section>'+roadmap(1));return;
 }
 var meta=sessionMeta(state.course.session),m=currentMetrics();
 chrome('<section class="simpleStudentHero"><div><span class="kicker">Today’s session</span><h1>'+esc(meta.title)+'</h1><p>'+esc(meta.detail)+'</p><div class="simpleMeta"><span>Week '+meta.week+' of 6</span><span>Session '+state.course.session+' of 30</span><span>≈ 20 minutes</span></div></div><button class="primary bigStudentCta" id="startSession">'+(meta.kind==="assessment"?"Start weekly assessment":"Start session")+'</button></section>'+
 '<div class="simpleSectionTitle"><div><h2>Your level at a glance</h2><p>Three signals are enough for now.</p></div></div><section class="studentSnapshot">'+metricCard("Recall",m.recall)+metricCard("Understanding",m.understanding)+metricCard("Application",m.application)+'</section>'+
 '<section class="studentTip"><div><b>Adaptive teaching plan</b><p>'+esc(teachingPlan().method)+'</p></div></section>'+roadmap(meta.week));
 document.getElementById("startSession").onclick=function(){state.task=0;state.answers=[];state.assessmentAnswers=[];state.queue=meta.kind==="assessment"?assessmentBanks[meta.week].slice():buildQueue();state.view=meta.kind==="assessment"?"assessment":"train";render();};
 document.querySelectorAll("[data-week]").forEach(function(b){b.onclick=function(){var w=Number(b.dataset.week);if(w>meta.week){state.course.session=(w-1)*5+1;save();}state.task=0;state.queue=buildQueue();state.view="train";render();};});
}
function renderTask(t,assessment){
 state.taskStartedAt=Date.now();
 if(t.mode==="essay"){
  chrome('<section class="stage"><div class="taskCard"><span class="kicker">'+(assessment?"Assessment":"Adaptive task")+'</span><h2>'+esc(t.title)+'</h2><p>'+esc(t.q)+'</p><textarea class="textarea essayAssessmentInput" id="essayAnswer" placeholder="Write your answer in your own words..."></textarea><div class="choiceRow"><button class="primary" id="submitEssay">Analyse my answer</button></div><div id="feed"></div></div></section>');
  document.getElementById("submitEssay").onclick=function(){var a=document.getElementById("essayAnswer").value.trim();if(a.split(/\s+/).filter(Boolean).length<15){document.getElementById("feed").innerHTML='<div class="notice">Write a little more so LexLearn can analyse your reasoning, not just the conclusion.</div>';return;}var p=essayAnalysis(a,t),score=p.overall/100;addEvidence(t.dimension||"exam",score,"english_essay_profile");state.answers.push({dimension:t.dimension,score:score,correct:p.overall>=60});document.getElementById("feed").innerHTML='<div class="essayAnalysis"><div><span>Recall</span><b>'+p.axes.recall+'%</b></div><div><span>Understanding</span><b>'+p.axes.understanding+'%</b></div><div><span>Application</span><b>'+p.axes.application+'%</b></div><div><span>Structure</span><b>'+p.axes.exam+'%</b></div><p>'+esc(p.style)+' '+esc(p.note)+'</p></div><div class="choiceRow"><button class="primary" id="nextEssay">'+(state.task<state.queue.length-1?"Next":"Finish session")+'</button></div>';document.getElementById("essayAnswer").disabled=true;document.getElementById("submitEssay").disabled=true;document.getElementById("nextEssay").onclick=nextTask;};return;
 }
 var ord=ordered(t);
 chrome('<section class="stage"><div class="progress"><i style="width:'+((state.task+1)/state.queue.length*100)+'%"></i></div><div class="taskCard"><span class="kicker">'+(assessment?"Assessment":"Session "+state.course.session)+'</span><h2>'+esc(t.title||"Legal question")+'</h2>'+(t.text?'<div class="legalBox"><small>Legal text — educational English rendering</small><div>'+esc(t.text)+'</div></div>':'')+'<p>'+esc(t.q)+'</p><div class="options">'+ord.map(function(o){return '<button class="option" data-o="'+o.orig+'">'+esc(o.text)+'</button>';}).join("")+'</div><div id="feed"></div></div></section>');
 document.querySelectorAll("[data-o]").forEach(function(b){b.onclick=function(){var i=Number(b.dataset.o),ok=i===t.a;document.querySelectorAll("[data-o]").forEach(function(x){x.disabled=true;});b.classList.add(ok?"good":"bad");if(!ok){var right=document.querySelector('[data-o="'+t.a+'"]');if(right)right.classList.add("good");}addEvidence(t.dimension||"understanding",ok?1:0,assessment?"english_stage_assessment":"english_adaptive");state.answers.push({dimension:t.dimension,score:ok?1:0,correct:ok});document.getElementById("feed").innerHTML='<div class="answerStatus '+(ok?"correct":"wrong")+'"><div><b>'+(ok?"Correct":"Review this point")+'</b><small>'+esc(ok?t.why:("Correct answer: "+t.opts[t.a]+". "+t.why))+'</small></div></div><div class="choiceRow"><button class="primary" id="nextChoice">'+(state.task<state.queue.length-1?"Next":"Finish session")+'</button></div>';document.getElementById("nextChoice").onclick=nextTask;};});
}
function nextTask(){if(state.task<state.queue.length-1){state.task++;render();}else{if(state.view==="assessment")finishAssessment();else finishTraining();}}
function train(){var t=state.queue[state.task]||buildQueue()[0];renderTask(t,false);}
function finishTraining(){
 state.course.history.push({session:state.course.session,type:state.repairMode?"repair":"training",answers:state.answers,ts:Date.now()});
 if(state.repairMode){state.repairMode=false;state.view="assessment";state.task=0;state.answers=[];state.queue=assessmentBanks[state.repairWeek||sessionMeta(state.course.session).week].slice();render();return;}
 if(state.course.completed.indexOf(state.course.session)===-1)state.course.completed.push(state.course.session);
 state.course.session=Math.min(30,state.course.session+1);save();state.view="sessionResult";render();
}
function sessionResult(){var total=state.answers.length||1,correct=state.answers.filter(function(x){return x.correct;}).length,p=Math.round(correct/total*100),next=sessionMeta(state.course.session);chrome('<section class="stage"><div class="taskCard"><span class="kicker">Session complete</span><h2>Good work — your data has updated the next session.</h2><div class="resultGrid"><div class="metric"><span>Session performance</span><b>'+p+'%</b></div><div class="metric"><span>Next session</span><b>'+state.course.session+'</b></div></div><div class="notice">The next week will not unlock until you pass the current weekly assessment.</div><div class="choiceRow"><button class="primary" id="continueNext">'+(next.kind==="assessment"?"Start weekly assessment":"Start next session")+'</button><button class="secondary" id="goHome">Back to program</button></div></div></section>');document.getElementById("continueNext").onclick=function(){state.task=0;state.answers=[];state.queue=next.kind==="assessment"?assessmentBanks[next.week].slice():buildQueue();state.view=next.kind==="assessment"?"assessment":"train";render();};document.getElementById("goHome").onclick=function(){state.view="home";render();};}
function assessment(){
 var week=sessionMeta(state.course.session).week;
 if(state.queue.length===0)state.queue=(assessmentBanks[week]||[]).slice();
 var t=state.queue[state.task];
 renderTask(t,true);
}
function finishAssessment(){
 var week=sessionMeta(state.course.session).week,total=state.answers.length||1,score=Math.round(state.answers.reduce(function(s,x){return s+Number(x.score||0);},0)/total*100),status=score>=80?"mastered":score>=65?"completed":"repair";
 state.course.weekResults[week]={score:score,status:status,ts:Date.now()};
 state.course.lastAssessment={week:week,score:score,status:status,ts:Date.now()};
 if(status==="repair"){state.course.repairRequired=true;state.course.repairWeek=week;}else{state.course.repairRequired=false;state.course.repairWeek=null;if(state.course.completed.indexOf(state.course.session)===-1)state.course.completed.push(state.course.session);if(week===6){state.course.completedProgram=true;state.course.completedAt=Date.now();}else state.course.session=Math.min(30,state.course.session+1);}
 save();state.view=status==="repair"?"assessmentResult":(week===6?"completion":"assessmentResult");render();
}
function assessmentResult(){
 var r=state.course.lastAssessment,need=r.status==="repair";
 chrome('<section class="stage"><div class="achievementCard '+(need?"needsRepair":"success")+'"><span class="kicker">Week '+r.week+' assessment</span><h2>'+(need?"A short reinforcement session is needed":"Week completed")+'</h2><div class="stageMetricValue">'+r.score+'%</div><p>'+(need?"LexLearn will target the weakest measured skill before you retake the assessment.":"The next week is now available.")+'</p><div class="choiceRow">'+(need?'<button class="primary" id="repair">Start reinforcement</button>':'<button class="primary" id="homeAfter">Continue</button>')+'</div></div></section>');
 var rb=document.getElementById("repair");if(rb)rb.onclick=function(){state.repairMode=true;state.repairWeek=r.week;state.task=0;state.answers=[];var meta=sessionMeta(state.course.session),weak=weakestDimension(),target=weak==="recall"?generic.memory:weak==="understanding"?generic.understanding:weak==="application"?generic.application:generic.exam;state.queue=[target,bridgeTask(meta),generic.spot,generic.review].concat((weekTasks[r.week]||[]).slice(0,1));state.view="train";render();};
 var hb=document.getElementById("homeAfter");if(hb)hb.onclick=function(){state.view="home";render();};
}
function completion(){
 var r=state.course.weekResults[6]||{},score=r.score==null?"—":r.score+"%",date=state.course.completedAt?new Date(state.course.completedAt).toLocaleDateString("en-GB"):"Today";
 chrome('<section class="stage finalStage"><div class="finalCard professionalFinal"><div class="finalSeal">§</div><span class="kicker">Program completed</span><h1>You completed the LexLearn Theory of Rights program</h1><p>You completed all six weeks and the final assessment.</p><div class="finalStats"><div><span>Weeks</span><b>6 / 6</b></div><div><span>Sessions</span><b>30 / 30</b></div><div><span>Final assessment</span><b>'+score+'</b></div></div><div class="finalRibbon">Academic learning milestone • '+date+'</div><div class="choiceRow"><a class="primary finalLink" href="student-en.html">Return to Student Portal</a></div></div></section>');
}
function render(){if(state.view==="home")return home();if(state.view==="train")return train();if(state.view==="sessionResult")return sessionResult();if(state.view==="assessment")return assessment();if(state.view==="assessmentResult")return assessmentResult();if(state.view==="completion")return completion();}

async function boot(){
 if(!DEMO&&STUDENT_SESSION&&STUDENT_SESSION.cloud&&window.LEX_CLOUD&&LEX_CLOUD.isConfigured&&LEX_CLOUD.isConfigured()){
  try{
   var ps=await LEX_CLOUD.loadSnapshot({courseId:SNAPSHOT_COURSE,snapshotType:"profile"});if(ps&&ps.state)localStorage.setItem(PROFILE_KEY,JSON.stringify(ps.state));
   var cs=await LEX_CLOUD.loadSnapshot({courseId:SNAPSHOT_COURSE,snapshotType:"course"});if(cs&&cs.state){localStorage.setItem(COURSE_KEY,JSON.stringify(cs.state));state.course=loadCourse();}
   state.diag=diagnostic();
  }catch(e){}
 }
 if(AUTO_START&&state.diag&&!state.course.completedProgram){var meta=sessionMeta(state.course.session);state.task=0;state.answers=[];state.queue=meta.kind==="assessment"?(assessmentBanks[meta.week]||[]).slice():buildQueue();state.view=meta.kind==="assessment"?"assessment":"train";}
 render();
}
boot();
})();