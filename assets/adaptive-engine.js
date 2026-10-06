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

  function evidenceWeight(e,now){
    now=now==null?Date.now():now;
    var ts=e&&e.ts?new Date(e.ts).getTime():now;
    var ageDays=Math.max(0,(now-ts)/DAY);
    var recency=Math.pow(0.5,ageDays/21);
    var difficulty=1+0.08*Math.max(0,(Number(e&&e.difficulty)||1)-1);
    var transfer=(e&&e.dimension==="application")||e&&e.dimension==="transfer"?1.08:1;
    var delayed=e&&e.delayed?1.15:1;
    return recency*difficulty*transfer*delayed;
  }
  function betaEstimate(events,now){
    events=(events||[]).filter(function(e){return e&&e.score!=null;});
    var a=2,b=2,w=0;
    events.forEach(function(e){
      var ew=evidenceWeight(e,now),s=clamp(Number(e.score),0,1);
      a+=s*ew;b+=(1-s)*ew;w+=ew;
    });
    var mean=a/(a+b);
    var variance=(a*b)/(((a+b)*(a+b))*(a+b+1));
    var sd=Math.sqrt(variance);
    return {
      value:Math.round(mean*100),
      uncertainty:Math.round(clamp(sd*196,0,0.5)*100),
      evidenceWeight:Math.round(w*100)/100,
      evidence:events.length
    };
  }
  function trendScore(events){
    var xs=(events||[]).filter(function(e){return e&&e.score!=null;}).slice(-10);
    if(xs.length<4)return 0;
    var cut=Math.floor(xs.length/2),a=xs.slice(0,cut),b=xs.slice(cut);
    function avg(arr){return arr.reduce(function(s,e){return s+Number(e.score||0);},0)/Math.max(1,arr.length);}
    return Math.round((avg(b)-avg(a))*100);
  }
  function evidenceModel(events,now){
    events=events||[];now=now==null?Date.now():now;
    var dimensions=["recall","understanding","legal_precision","application","exam","retention"];
    var axes={};
    dimensions.forEach(function(d){
      var rows=events.filter(function(e){return e.dimension===d||(d==="application"&&e.dimension==="transfer")||(d==="exam"&&e.dimension==="exam_execution");});
      var est=betaEstimate(rows,now);
      est.trend=trendScore(rows);
      est.status=est.evidence===0?"unmeasured":est.value>=82&&est.uncertainty<=18?"strong":est.value>=65?"developing":"priority";
      axes[d]=est;
    });
    return axes;
  }
  function bridgeStrategy(strong,weak){
    var key=(strong||"")+"->"+(weak||"");
    var map={
      "recall->understanding":{mode:"explain_from_memory",label:"استخدم ما يتذكره الطالب لتفسير لماذا تعمل القاعدة، بدل إضافة حفظ جديد."},
      "recall->application":{mode:"change_one_fact",label:"ابدأ بالنص المحفوظ ثم غيّر واقعة واحدة لاختبار التطبيق."},
      "recall->legal_precision":{mode:"precision_from_recall",label:"حوّل الحفظ الجيد إلى تمييز دقيق بين الألفاظ والعناصر التي تغيّر الحكم."},
      "recall->exam":{mode:"answer_from_memory",label:"استخدم الاسترجاع القوي لبناء إجابة قانونية منظمة لا مجرد ترديد النص."},
      "understanding->recall":{mode:"memory_keys",label:"حوّل الفهم إلى مفاتيح استرجاع قصيرة مرتبطة بالمعنى."},
      "understanding->application":{mode:"reason_to_fact",label:"ابدأ من السبب الذي يفهمه الطالب ثم اربطه بواقعة جديدة ليصل للنتيجة."},
      "understanding->legal_precision":{mode:"precision_contrast",label:"استخدم الفهم للتمييز بين الألفاظ القانونية المتقاربة."},
      "understanding->exam":{mode:"structured_answer",label:"حوّل الفهم الجيد إلى إجابة مرتبة: مسألة، قاعدة، تطبيق، نتيجة."},
      "legal_precision->understanding":{mode:"precision_to_meaning",label:"استخدم دقة الطالب في الألفاظ لشرح وظيفة كل عنصر ولماذا يغيّر النتيجة."},
      "legal_precision->application":{mode:"boundary_case",label:"استثمر الدقة في حالات حدودية ووقائع متقاربة."},
      "legal_precision->exam":{mode:"precise_answer",label:"استخدم الدقة القانونية لتحسين صياغة الإجابة وربط المصطلح بأثره."},
      "application->understanding":{mode:"reverse_explain",label:"ارجع من التطبيق الصحيح إلى تفسير القاعدة: لماذا أعطت هذه الواقعة هذه النتيجة؟"},
      "application->recall":{mode:"case_to_memory",label:"حوّل الواقعة التي يطبقها الطالب جيدًا إلى مفاتيح استرجاع مرتبطة بالمثال."},
      "application->exam":{mode:"structured_answer",label:"حوّل التطبيق الجيد إلى إجابة: مسألة، قاعدة، تطبيق، نتيجة."},
      "retention->understanding":{mode:"retrieval_to_meaning",label:"استخدم ثبات المعلومة لشرح معناها ووظيفتها بدل تكرار استرجاعها فقط."},
      "retention->application":{mode:"retained_to_case",label:"استخدم المعلومة الثابتة في واقعة جديدة حتى تتحول من ذاكرة إلى أداء."},
      "retention->exam":{mode:"retained_to_answer",label:"استخدم ما ثبت في الذاكرة لبناء إجابة امتحانية قصيرة ومنظمة."},
      "exam->understanding":{mode:"unpack_answer",label:"فكّك الإجابة الجيدة إلى أسباب وعلاقات للتأكد أن التنظيم لا يخفي فهمًا سطحيًا."},
      "exam->recall":{mode:"answer_to_keys",label:"استخرج من الإجابة الجيدة مفاتيح ذاكرة قصيرة تسرّع الاسترجاع."},
      "exam->retention":{mode:"retrieval_rebuild",label:"أعد بناء الإجابة من مفاتيح قصيرة بعد فاصل زمني."}
    };
    return map[key]||{mode:"evidence_bridge",label:"ابدأ من أقوى مهارة مثبتة لبناء أضعف مهارة بدل تكرار التدريب نفسه."};
  }
  function learnerModel(input,now){
    input=input||{};now=now==null?Date.now():now;
    var axes=evidenceModel(input.events||[],now);
    var metrics=input.metrics||{};
    Object.keys(metrics).forEach(function(k){
      var target=k==="application"?"application":k==="exam_execution"?"exam":k;
      if(!axes[target]||metrics[k]==null)return;
      if(axes[target].evidence===0){
        axes[target]={value:Math.round(Number(metrics[k])),uncertainty:24,evidenceWeight:0.75,evidence:1,trend:0,status:Number(metrics[k])>=82?"strong":Number(metrics[k])>=65?"developing":"priority",seeded:true};
      }
    });
    var ranked=Object.keys(axes).filter(function(k){return axes[k].evidence>0;}).sort(function(a,b){
      var aa=axes[a],bb=axes[b];
      var ar=(100-aa.value)+(aa.uncertainty*0.45)+(aa.trend<0?Math.abs(aa.trend)*0.35:0);
      var br=(100-bb.value)+(bb.uncertainty*0.45)+(bb.trend<0?Math.abs(bb.trend)*0.35:0);
      return br-ar;
    });
    var weak=ranked[0]||"application";
    var strong=ranked.slice().sort(function(a,b){return axes[b].value-axes[a].value;})[0]||"understanding";
    // Core LexLearn bridge: if recall and understanding are imbalanced,
    // use the stronger one to build the weaker one before generic bridging.
    var bridgeStrong=strong,bridgeWeak=weak;
    var rAxis=axes.recall,uAxis=axes.understanding;
    if(rAxis&&uAxis&&rAxis.evidence>0&&uAxis.evidence>0){
      var ruGap=Number(rAxis.value)-Number(uAxis.value);
      if(ruGap>=12){bridgeStrong="recall";bridgeWeak="understanding";}
      else if(ruGap<=-12){bridgeStrong="understanding";bridgeWeak="recall";}
    }
    var bridge=bridgeStrategy(bridgeStrong,bridgeWeak);
    bridge.from=bridgeStrong;bridge.to=bridgeWeak;
    return {
      version:"adaptive-v9",
      axes:axes,
      weakest:weak,
      strongest:strong,
      bridge:bridge,
      confidence:ranked.length?Math.round(ranked.reduce(function(s,k){return s+(100-axes[k].uncertainty);},0)/ranked.length):0,
      reasons:[
        "weakest:"+weak,
        "strongest:"+strong,
        axes[weak]&&axes[weak].trend<0?"declining_trend":"stable_or_improving",
        axes[weak]&&axes[weak].uncertainty>22?"needs_more_evidence":"evidence_sufficient"
      ]
    };
  }
  function targetDifficulty(model,currentDifficulty){
    currentDifficulty=Number(currentDifficulty)||2;
    var a=model&&model.axes&&model.axes[model.weakest];
    if(!a)return currentDifficulty;
    if(a.value>=88&&a.uncertainty<18)return clamp(currentDifficulty+1,1,5);
    if(a.value<55)return clamp(currentDifficulty-1,1,5);
    if(a.trend>10)return clamp(currentDifficulty+1,1,5);
    return clamp(currentDifficulty,1,5);
  }
  function recommendNextTask(model,candidates,history){
    candidates=candidates||[];history=history||[];
    var seen={};history.slice(-20).forEach(function(h){if(h&&h.itemId)seen[h.itemId]=(seen[h.itemId]||0)+1;});
    var target=model&&model.weakest||"application";
    return candidates.map(function(x){
      var s=0;
      if(x.dimension===target||(target==="application"&&x.dimension==="transfer")||(target==="exam"&&x.dimension==="exam_execution"))s+=45;
      if(x.approved===true||x.status==="approved")s+=20;
      if(x.sourceIds&&x.sourceIds.length)s+=10;
      s-=Math.min(18,(seen[x.id]||0)*9);
      var diff=targetDifficulty(model,x.currentDifficulty||2);
      s-=Math.abs((Number(x.difficulty)||2)-diff)*4;
      if(x.variantGroupId)s+=4;
      return {item:x,score:s};
    }).sort(function(a,b){return b.score-a.score;})[0]||null;
  }
  function adaptiveReviewInterval(input){
    input=input||{};
    var score=clamp(Number(input.score)||0,0,1);
    var repeats=Math.max(0,Number(input.repeatErrors)||0);
    var confidence=Number(input.confidence)||2;
    var retentionFailures=Math.max(0,Number(input.retentionFailures)||0);
    var hours=score>=0.9?168:score>=0.75?72:score>=0.55?24:8;
    if(confidence===3&&score<0.6)hours=Math.min(hours,6);
    hours=hours/Math.pow(1.45,repeats+retentionFailures);
    return Math.max(4,Math.round(hours));
  }
  function challengeZone(model){
    var weak=model&&model.axes&&model.axes[model.weakest];
    if(!weak)return 2;
    if(weak.uncertainty>26)return weak.value>=70?3:2;
    if(weak.value>=90)return 5;
    if(weak.value>=80)return 4;
    if(weak.value>=60)return 3;
    if(weak.value>=40)return 2;
    return 1;
  }
  function adaptiveCandidateScore(model,item,history,context,now){
    item=item||{};history=history||[];context=context||{};now=now==null?Date.now():now;
    var target=model&&model.weakest||"application",score=0,reasons=[];
    var dim=item.dimension||"understanding";
    if(dim===target||(target==="application"&&dim==="transfer")||(target==="exam"&&dim==="exam_execution")){score+=50;reasons.push("targets_priority_dimension");}
    if(item.status==="approved"||item.approved===true){score+=18;reasons.push("approved_content");}
    if(item.sourceIds&&item.sourceIds.length){score+=10;reasons.push("grounded_source");}
    var desired=challengeZone(model),difficulty=Number(item.difficulty)||2;
    var distance=Math.abs(difficulty-desired);score+=Math.max(0,15-distance*5);
    if(distance===0)reasons.push("challenge_zone_match");
    var recent=history.slice(-24),seen=recent.filter(function(h){return h&&h.itemId===item.id;}).length;
    score-=Math.min(24,seen*10);
    if(!seen){score+=8;reasons.push("novel_item");}
    var sameDim=recent.slice(-4).filter(function(h){return h&&h.dimension===dim;}).length;
    score-=sameDim*3;
    if(item.dueAt&&new Date(item.dueAt).getTime()<=now){score+=24;reasons.push("review_due");}
    if(item.examImportanceWeight){score+=12*Number(item.examImportanceWeight);reasons.push("exam_relevance");}
    if(context.errorType==="high_confidence_misconception"&&item.conceptId&&item.conceptId===context.conceptId){score+=22;reasons.push("repairs_confident_error");}
    var weak=model&&model.axes&&model.axes[target];
    if(weak&&weak.uncertainty>22&&dim===target){score+=10;reasons.push("reduces_uncertainty");}
    return {score:Math.round(score*100)/100,reasons:reasons,desiredDifficulty:desired};
  }
  function buildAdaptivePlan(model,candidates,history,context,limit){
    candidates=candidates||[];history=history||[];context=context||{};limit=limit||3;
    var ranked=candidates.map(function(item){
      var r=adaptiveCandidateScore(model,item,history,context);
      return {item:item,score:r.score,reasons:r.reasons,desiredDifficulty:r.desiredDifficulty};
    }).sort(function(a,b){return b.score-a.score;});
    var selected=[],concepts={};
    for(var i=0;i<ranked.length&&selected.length<limit;i++){
      var x=ranked[i],concept=x.item.conceptId||null;
      if(concept&&concepts[concept]&&selected.length<Math.min(2,limit))continue;
      if(concept)concepts[concept]=true;
      selected.push(x);
    }
    return {version:"adaptive-policy-v2",target:model&&model.weakest||"application",selected:selected,considered:ranked.length};
  }
  function masteryGate(model,required){
    required=required||["recall","understanding","legal_precision","application","exam","retention"];
    var reasons=[],axes=model&&model.axes||{};
    required.forEach(function(k){
      var a=axes[k];
      if(!a||a.evidence<2)reasons.push(k+":insufficient_evidence");
      else{
        if(a.value<75)reasons.push(k+":below_mastery");
        if(a.uncertainty>24)reasons.push(k+":high_uncertainty");
      }
    });
    var ret=axes.retention;
    if(!ret||ret.evidence<2||ret.value<75)reasons.push("retention:not_confirmed");
    return {ready:reasons.length===0,reasons:reasons};
  }
  function adaptiveDecision(input,now){
    input=input||{};var model=learnerModel({metrics:input.metrics||{},events:input.events||[]},now);
    var plan=buildAdaptivePlan(model,input.candidates||[],input.history||input.events||[],input.context||{},input.limit||3);
    var gate=masteryGate(model,input.requiredDimensions);
    return {model:model,plan:plan,masteryGate:gate};
  }

  function mergeSemanticGrade(localGrade,semanticGrade){
    localGrade=localGrade||{};semanticGrade=semanticGrade||{};
    var ls=localGrade.score==null?null:Number(localGrade.score);
    var ss=semanticGrade.score==null?null:Number(semanticGrade.score);
    var disagreement=(ls==null||ss==null)?null:Math.abs(ls-ss);
    var confidence=Number(semanticGrade.model_confidence||semanticGrade.confidence||0);
    var needs=!!semanticGrade.needs_human_review||confidence<0.68||(disagreement!=null&&disagreement>0.35);
    return {
      score:needs?null:(ss==null?ls:ss),
      localScore:ls,
      semanticScore:ss,
      disagreement:disagreement,
      achievedCriteria:semanticGrade.achieved_criteria||localGrade.matchedConcepts||[],
      missingCriteria:semanticGrade.missing_criteria||localGrade.missingConcepts||[],
      contradictions:semanticGrade.contradictions||[],
      feedback:semanticGrade.feedback_ar||localGrade.feedback||"",
      confidence:confidence,
      needsHumanReview:needs,
      gradingMethod:ss==null?"rubric_fallback":"grounded_semantic"
    };
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
    examTagWeight:examTagWeight,
    evidenceWeight:evidenceWeight,
    betaEstimate:betaEstimate,
    evidenceModel:evidenceModel,
    bridgeStrategy:bridgeStrategy,
    learnerModel:learnerModel,
    targetDifficulty:targetDifficulty,
    recommendNextTask:recommendNextTask,
    adaptiveReviewInterval:adaptiveReviewInterval,
    challengeZone:challengeZone,
    adaptiveCandidateScore:adaptiveCandidateScore,
    buildAdaptivePlan:buildAdaptivePlan,
    masteryGate:masteryGate,
    adaptiveDecision:adaptiveDecision,
    mergeSemanticGrade:mergeSemanticGrade
  };
});
