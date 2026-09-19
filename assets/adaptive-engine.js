(function(root,factory){
  var api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.LEX_ENGINE=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  var HOUR=60*60*1000;
  var DAY=24*HOUR;
  var CONFIG={
    retentionPassScore:0.80,
    retentionGapMs:DAY,
    calibrationWindow:8,
    priority:{
      weakness:0.55,
      examWeight:15,
      repeatError:3,
      highConfidenceMisconception:18,
      conceptConfusion:12,
      applicationDifficulty:10,
      examExecution:8,
      retentionFailure:20
    }
  };

  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function iso(ms){return new Date(ms).toISOString();}
  function normalizeText(v){
    return String(v||"").toLowerCase()
      .replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي")
      .replace(/[ًٌٍَُِّْـ]/g,"")
      .replace(/[^\u0600-\u06FFa-z0-9 ]/gi," ")
      .replace(/\s+/g," ").trim();
  }
  function phraseSimilarity(text,phrase){
    var t=normalizeText(text),p=normalizeText(phrase);
    if(!p)return false;
    if(t.indexOf(p)>=0)return true;
    var pt=p.split(" ").filter(Boolean),tt=t.split(" ").filter(Boolean);
    if(pt.length<2)return tt.indexOf(p)>=0;
    var found=0;
    pt.forEach(function(w){if(tt.indexOf(w)>=0)found++;});
    return found/pt.length>=0.72;
  }
  function criterionResult(text,r){
    if(r&&r.concepts){
      var matched=0,total=r.concepts.length;
      r.concepts.forEach(function(group){
        var alts=Array.isArray(group)?group:[group];
        if(alts.some(function(a){return phraseSimilarity(text,a);})){matched++;}
      });
      var need=r.min||1;
      return {ok:matched>=need,matched:matched,total:total,need:need};
    }
    var words=(r&&r.keywords)||[],hits=0,n=normalizeText(text);
    words.forEach(function(w){if(n.indexOf(normalizeText(w))>=0)hits++;});
    return {ok:hits>0,matched:hits>0?1:0,total:1,need:1};
  }
  function gradeAnswer(answer,rubric,context){
    if(answer==="__DONT_KNOW__"){
      return {score:0,criteria:[],matchedConcepts:[],missingConcepts:(rubric||[]).map(function(r){return r.label;}),misconceptions:[],feedback:"لا توجد إجابة قابلة للتقييم.",gradingMethod:"keyword_fallback"};
    }
    var criteria=(rubric||[]).map(function(r){
      var cr=criterionResult(answer,r);
      return {label:r.label,ok:cr.ok,matched:cr.matched,total:cr.total,need:cr.need};
    });
    var hit=criteria.filter(function(x){return x.ok;}).length;
    var matched=criteria.filter(function(x){return x.ok;}).map(function(x){return x.label;});
    var missing=criteria.filter(function(x){return !x.ok;}).map(function(x){return x.label;});
    return {
      score:criteria.length?hit/criteria.length:0,
      criteria:criteria,
      matchedConcepts:matched,
      missingConcepts:missing,
      misconceptions:[],
      feedback:missing.length?"تحتاج الإجابة إلى تغطية: "+missing.join("، "):"غطّت الإجابة العناصر المطلوبة في نموذج التصحيح.",
      gradingMethod:"keyword_fallback",
      context:context||null
    };
  }

  function classifyError(item,score,confidence){
    if(score>=0.999)return "none";
    if(Number(confidence)===3&&score<0.5)return "high_confidence_misconception";
    if(item&&item.dimension==="transfer")return "application_difficulty";
    if(item&&item.dimension==="legal_precision")return "concept_confusion";
    if(item&&item.dimension==="exam_execution")return "exam_execution_gap";
    if(item&&item.dimension==="understanding")return "incomplete_understanding";
    return "knowledge_gap";
  }
  function errorLabel(type){
    var m={
      high_confidence_misconception:"تصور خاطئ بثقة عالية",
      concept_confusion:"خلط بين مفاهيم متقاربة",
      application_difficulty:"صعوبة في التطبيق على الوقائع",
      exam_execution_gap:"نقص في بناء الإجابة",
      incomplete_understanding:"فهم غير مكتمل",
      knowledge_gap:"فجوة معرفية",
      retention_failure:"فشل احتفاظ مؤجل",
      none:"لا يوجد خطأ"
    };
    return m[type]||type;
  }
  function reviewDelayHours(score,errorType){
    if(errorType==="high_confidence_misconception")return 6;
    if(errorType==="concept_confusion")return 12;
    if(errorType==="application_difficulty")return 24;
    if(errorType==="retention_failure")return 6;
    if(errorType==="exam_execution_gap"||errorType==="incomplete_understanding")return 24;
    return score<0.5?24:72;
  }
  function buildReview(item,score,errorType,confidence,now,attempts){
    now=now==null?Date.now():now;
    var hours=reviewDelayHours(score,errorType);
    return {
      itemId:item&&item.id||null,
      conceptId:item&&item.conceptId||null,
      variantGroupId:item&&item.variantGroupId||null,
      unitId:item&&item.unitId||null,
      topic:item&&item.prompt?item.prompt.slice(0,70):"",
      due:iso(now+hours*HOUR),
      score:Number(score)||0,
      errorType:errorType||"knowledge_gap",
      confidence:confidence==null?null:Number(confidence),
      attempts:Number(attempts)||1,
      reviewReason:errorType||"knowledge_gap"
    };
  }

  function migrateCourseState(s){
    s=s||{};
    if(!Array.isArray(s.groupResults))s.groupResults=[];
    if(!Array.isArray(s.reviews))s.reviews=[];
    if(!Array.isArray(s.activityHistory))s.activityHistory=[];
    if(!Array.isArray(s.observationResults))s.observationResults=[];
    if(!s.skillPaths||typeof s.skillPaths!=="object")s.skillPaths={};
    if(!s.mastery||typeof s.mastery!=="object")s.mastery={};
    if(!s.unitMastery||typeof s.unitMastery!=="object")s.unitMastery={};
    if(!s.conceptMastery||typeof s.conceptMastery!=="object")s.conceptMastery={};
    if(!s.calibration||typeof s.calibration!=="object")s.calibration={status:"insufficient_data",value:null,evidence:0};
    return s;
  }
  function ensurePath(p){
    p=p||{};
    if(!p.stage)p.stage="learn";
    if(p.practiceAttempts==null)p.practiceAttempts=0;
    if(p.testAttempts==null)p.testAttempts=0;
    if(p.retentionAttempts==null)p.retentionAttempts=0;
    if(p.retentionFailures==null)p.retentionFailures=0;
    if(!p.retentionStatus)p.retentionStatus="not_started";
    return p;
  }
  function applyRetentionResult(path,score,now){
    path=ensurePath(path);
    now=now==null?Date.now():now;
    path.testAttempts=(path.testAttempts||0)+1;
    path.lastScore=score;
    if(score<CONFIG.retentionPassScore){
      var wasRetention=path.stage==="retention_check_pending"||!!path.firstPassAt;
      if(wasRetention){
        path.retentionFailures=(path.retentionFailures||0)+1;
        path.retentionStatus="failed";
      }
      path.stage="practice";
      path.firstPassAt=null;
      path.retentionDueAt=null;
      path.confirmedAt=null;
      path.completedAt=null;
      return {status:wasRetention?"retention_failed":"assessment_failed",path:path};
    }
    if(!path.firstPassAt){
      path.firstPassAt=iso(now);
      path.retentionDueAt=iso(now+CONFIG.retentionGapMs);
      path.retentionStatus="pending";
      path.stage="retention_check_pending";
      path.confirmedAt=null;
      path.completedAt=null;
      return {status:"first_pass",path:path};
    }
    var due=new Date(path.retentionDueAt||path.firstPassAt).getTime();
    if(!path.retentionDueAt)due=new Date(path.firstPassAt).getTime()+CONFIG.retentionGapMs;
    if(now<due){
      path.stage="retention_check_pending";
      path.retentionStatus="pending";
      return {status:"too_early",path:path,remainingMs:due-now};
    }
    path.retentionAttempts=(path.retentionAttempts||0)+1;
    path.retentionStatus="confirmed";
    path.stage="completed";
    path.confirmedAt=iso(now);
    path.completedAt=path.confirmedAt;
    return {status:"confirmed",path:path};
  }
  function retentionReady(path,now){
    path=ensurePath(path);now=now==null?Date.now():now;
    return path.stage==="retention_check_pending"&&path.retentionDueAt&&new Date(path.retentionDueAt).getTime()<=now;
  }

  function addAgg(bucket,key,score,weight){
    if(!key)return;
    if(!bucket[key])bucket[key]={sum:0,weight:0,evidence:0};
    bucket[key].sum+=score*100*weight;
    bucket[key].weight+=weight;
    bucket[key].evidence+=1;
  }
  function finalizeAgg(bucket){
    var out={};
    Object.keys(bucket).forEach(function(k){
      var b=bucket[k];
      out[k]={value:b.weight?clamp(b.sum/b.weight,0,100):0,evidence:b.evidence};
    });
    return out;
  }
  function computeMastery(groupResults,itemLookup,observationResults){
    var dims={},units={},concepts={};
    (groupResults||[]).forEach(function(g){
      (g.items||[]).forEach(function(x){
        var item=itemLookup&&itemLookup(x.itemId);
        if(!item)return;
        var w=1+(Math.max(1,item.difficulty||1)-1)*0.08;
        addAgg(dims,item.dimension,x.score,w);
        addAgg(units,item.unitId||"unassigned",x.score,w);
        addAgg(concepts,item.conceptId||item.id,x.score,w);
      });
    });
    (observationResults||[]).forEach(function(x){
      var w=1;
      addAgg(dims,"observation",x.score,w);
      if(x.unitId)addAgg(units,x.unitId,x.score,w);
      if(x.conceptId)addAgg(concepts,x.conceptId,x.score,w);
    });
    return {mastery:finalizeAgg(dims),unitMastery:finalizeAgg(units),conceptMastery:finalizeAgg(concepts)};
  }

  function calibration(groupResults,windowSize){
    var rows=(groupResults||[]).filter(function(g){return g&&g.confidence!=null&&g.avg!=null;});
    rows=rows.slice(-1*(windowSize||CONFIG.calibrationWindow));
    if(rows.length<2)return {status:"insufficient_data",value:null,evidence:rows.length,averageConfidence:null,averagePerformance:null};
    var cm={1:0.25,2:0.60,3:0.90},c=0,p=0;
    rows.forEach(function(g){c+=(cm[g.confidence]||0.6);p+=Number(g.avg)||0;});
    c/=rows.length;p/=rows.length;
    var diff=c-p,status=Math.abs(diff)<=0.18?"accurate":diff>0?"overconfidence":"underconfidence";
    return {status:status,value:diff,evidence:rows.length,averageConfidence:c,averagePerformance:p};
  }
  function calibrationLabel(status){
    return status==="accurate"?"تقدير ذاتي متوازن":status==="overconfidence"?"ثقة أعلى من الأداء":status==="underconfidence"?"ثقة أقل من الأداء":"بيانات غير كافية";
  }

  function errorBoost(type){
    var p=CONFIG.priority;
    if(type==="high_confidence_misconception")return p.highConfidenceMisconception;
    if(type==="concept_confusion")return p.conceptConfusion;
    if(type==="application_difficulty")return p.applicationDifficulty;
    if(type==="exam_execution_gap")return p.examExecution;
    return 0;
  }
  function priorityScore(entry){
    entry=entry||{};
    var mastery=entry.mastery==null?100:Number(entry.mastery);
    var exam=entry.examImportanceWeight==null?0:Number(entry.examImportanceWeight);
    var repeats=Number(entry.repeatErrors)||0;
    var score=(100-mastery)*CONFIG.priority.weakness+exam*CONFIG.priority.examWeight+repeats*CONFIG.priority.repeatError+errorBoost(entry.errorType);
    var reasons=[];
    if(mastery<75)reasons.push("low_mastery");
    if(exam>=0.66)reasons.push("frequent_exam_topic");
    if(entry.errorType==="high_confidence_misconception")reasons.push("high_confidence_misconception");
    if(entry.errorType==="concept_confusion")reasons.push("concept_confusion");
    if(entry.errorType==="application_difficulty")reasons.push("application_difficulty");
    if(entry.retentionStatus==="failed"){
      score+=CONFIG.priority.retentionFailure;
      reasons.push("retention_failure");
    }
    if(repeats>1)reasons.push("repeated_error");
    return {score:score,reasons:reasons};
  }

  function selectVariant(original,items){
    if(!original)return null;
    items=(items||[]).filter(function(x){return x&&x.id!==original.id&&x.type===original.type;});
    var pools=[
      items.filter(function(x){return original.variantGroupId&&x.variantGroupId===original.variantGroupId;}),
      items.filter(function(x){return original.conceptId&&x.conceptId===original.conceptId&&x.dimension===original.dimension;}),
      items.filter(function(x){return original.unitId&&x.unitId===original.unitId&&x.dimension===original.dimension;}),
      items.filter(function(x){return x.dimension===original.dimension;})
    ];
    for(var i=0;i<pools.length;i++)if(pools[i].length)return pools[0].length?pools[0][0]:pools[i][0];
    return null;
  }

  function examTagWeight(tag){
    return tag==="frequent"?1:tag==="medium"?0.66:tag==="rare"?0.33:0;
  }

  return {
    CONFIG:CONFIG,
    migrateCourseState:migrateCourseState,
    ensurePath:ensurePath,
    gradeAnswer:gradeAnswer,
    classifyError:classifyError,
    errorLabel:errorLabel,
    reviewDelayHours:reviewDelayHours,
    buildReview:buildReview,
    applyRetentionResult:applyRetentionResult,
    retentionReady:retentionReady,
    computeMastery:computeMastery,
    calibration:calibration,
    calibrationLabel:calibrationLabel,
    priorityScore:priorityScore,
    selectVariant:selectVariant,
    examTagWeight:examTagWeight
  };
});
