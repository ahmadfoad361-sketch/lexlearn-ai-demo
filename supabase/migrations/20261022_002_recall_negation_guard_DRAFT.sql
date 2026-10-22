-- Internal-pilot amendment: reject false high percentages from legal negation.
-- DRAFT - never applied to production; run only in isolated CI until approved.
-- Conservative ambiguous text becomes pending review rather than a fabricated 0 or 100.
begin;
create or replace function public.lex_recall_contradiction(p_text text)
returns boolean language sql immutable set search_path='' as $guard$
 select (
   regexp_replace(translate(lower(coalesce(p_text,'')),'أإآىةؤئ','ااايهوي'),'[ًٌٍَُِّْـ]','','g')
      ~ '(لا[[:space:]]+(تبدا|يبدا).{0,70}(الشخصيه|ولاد|الولاد)|لا[[:space:]]+تنتهي.{0,60}(الوفاه|الوفا|الموت)|لا[[:space:]]+(توجد|تثبت).{0,55}(حق|حقوق).{0,45}(الحمل|الجنين))'
   or regexp_replace(translate(lower(coalesce(p_text,'')),'أإآىةؤئ','ااايهوي'),'[ًٌٍَُِّْـ]','','g')
     ~ '(تبدا.{0,24}الشخصيه.{0,14}(بالوفاه|بالموت)|تنتهي.{0,22}الشخصيه.{0,14}بالولاده|لا.{0,7}(اي[[:space:]]+)?حقوق.{0,12}(للحمل|للجنين)|لا[[:space:]]+توجد[[:space:]]+حقوق[[:space:]]+للحمل)'
   or lower(coalesce(p_text,'')) ~ '(personality[[:space:]]+(begins|starts)[[:space:]]+(at|upon)[[:space:]]+death|personality[[:space:]]+ends[[:space:]]+at[[:space:]]+(live[[:space:]]+)?birth|unborn[[:space:]]+child[[:space:]]+has[[:space:]]+(absolutely[[:space:]]+)?no[[:space:]]+(conditional[[:space:]]+)?rights)'
   or lower(coalesce(p_text,'')) ~ '(does not|doesn.t|never)[[:space:]]+(begin|start).{0,55}(birth|born alive)|does not[[:space:]]+end.{0,55}(death|died)'
 );
$guard$;
revoke all on function public.lex_recall_contradiction(text) from public,anon,authenticated;

create or replace function public.lex_internal_personality_grade(p_item text,p_answer text)
returns jsonb language plpgsql immutable set search_path='' as $$
declare
 t text:=regexp_replace(translate(lower(coalesce(p_answer,'')),'أإآىةؤئ','ااايهوي'),'[ًٌٍَُِّْـ]','','g');
 b boolean; d boolean; u boolean; correct boolean; links boolean;
 a boolean; r boolean; issue boolean; application boolean; outcome boolean; cues boolean; cue_links boolean;
 has_wrong boolean; denied_wrong boolean;
 met text[]:=array[]::text[]; missed text[]:=array[]::text[];
 pts integer:=0; maximum integer:=0; pct integer; reason text; label text;
begin
 if public.lex_recall_contradiction(p_answer) then
  return jsonb_build_object('status','needs_human_review','provisional_percent',null,
   'reason','core_rule_negation_detected','method','conservative_negation_gate_v1',
   'needs_human_review',true,'confidence','low',
   'warning_ar','تبدو الإجابة مناقضة لقاعدة قانونية أساسية. يتطلب تحديد الدرجة مراجعة المعنى.',
   'warning_en','Potential denial of a core legal rule; human review is required before assigning a score.');
 end if;
 if p_item not in ('diagnostic-legal-personality','rights-v1-s1-recall','rights-v1-s1-understanding','rights-v1-s1-exam')
 then return jsonb_build_object('status','needs_human_review','provisional_percent',null,'reason','unsupported_task');end if;
 if length(trim(t))<4 then
   return jsonb_build_object('status','needs_human_review','provisional_percent',null,'reason','empty_or_short');end if;
 -- Evaluate legal *relationships*, not merely answer length or the presence of a single keyword.
 b:=(t~'(تبدا|يبدا|بدايه).{0,80}(شخص|personality).{0,60}(ولاد|ولد|birth|born).{0,18}(حي|live|alive)'
   or t~'(شخص|personality).{0,50}(تبدا|بدايه|starts|begins).{0,55}(ولاد|ولد|birth|born).{0,18}(حي|live|alive)'
   or t~'(ولاد|ولد|birth|born).{0,18}(حي|live|alive).{0,50}(تبدا|بدايه|starts|begins).{0,38}(شخص|personality)'
   or t~'personality.{0,35}(begins|starts).{0,40}(live birth|born alive)'
   or t~'(live birth|born alive).{0,40}(begins|starts).{0,30}personality');
 d:=t~'(وفا|موت|death|died)' and t~'(تنتهي|نهايه|end|ends)'
   and t~'(شخص|personality)';
 u:=t~'(حمل|جنين|unborn|prenatal)' and t~'(حق|حقوق|rights?)'
   and t~'(شرط|مشروط|بشرط|conditional|depends|subject to)'
   and t~'(ولاد|ولد|born|birth)' and t~'(حي|live|alive)';
 a:=t~'(قبول|accept)' and t~'(لا يحتاج|لا تحتاج|لا تتطلب|بدون|دون|no acceptance|does not require|without|not require)';
 links:=t~'(لان|لذلك|حيث|اذا|بسبب|لأن|نتيجه|فان|because|therefore|since|thus|so that|if)';
 -- The examination's wrong comparison example is not treated as the learner's conclusion
 -- when explicitly identified as incorrect.
 has_wrong:=t~'((تبدا|يبدا).{0,30}الشخصيه.{0,30}(بالحمل|من الحمل|عند الحمل)|الشخصيه.{0,45}(تبدا|بدا).{0,30}(بالحمل|من الحمل|عند الحمل)|personality.{0,30}(starts|begins).{0,30}(conception|pregnancy)|الولاده.{0,30}تنهي.{0,20}الشخصيه|birth ends personality|الحمل.{0,35}كامل.{0,20}اهليه)';
 denied_wrong:=t~'(خطا|خاطي|غير دقيق|غير صحيح|لا تبدا.{0,30}الحمل|incorrect|false|wrong|not true|does not begin at conception)';
 if has_wrong and not denied_wrong then
   return jsonb_build_object('status','needs_human_review','provisional_percent',null,
    'reason','possible_legal_contradiction','confidence','low',
    'warning_ar','قد تتضمن الإجابة استنتاجًا يخالف حكم الشخصية القانونية؛ يحتاج تدقيق المعنى.',
    'warning_en','The answer may assert a legally inconsistent conclusion; meaning requires review.',
    'method','internal_qatar_rights_rules_v1');
 end if;
 if p_item='diagnostic-legal-personality' then
   maximum:=1;
   if b then pts:=1;met:=array_append(met,'live_birth');
   else missed:=array_append(missed,'live_birth');end if;
 elsif p_item='rights-v1-s1-recall' then
   maximum:=8;
   cues:=t~'(مفتاح|مفاتيح|←|->|=>|cue|remember|key word|keyword)';
   cue_links:=cues and b and d and u;
   if b then pts:=pts+2;met:=array_append(met,'live_birth');else missed:=array_append(missed,'live_birth');end if;
   if d then pts:=pts+2;met:=array_append(met,'death_end');else missed:=array_append(missed,'death_end');end if;
   if u and a then pts:=pts+2;met:=array_append(met,'prenatal_conditional_rights');else missed:=array_append(missed,'prenatal_conditional_rights');end if;
   if cues then pts:=pts+1;met:=array_append(met,'memory_cues');else missed:=array_append(missed,'memory_cues');end if;
   if cue_links then pts:=pts+1;met:=array_append(met,'cues_with_meaning');else missed:=array_append(missed,'cues_with_meaning');end if;
 elsif p_item='rights-v1-s1-understanding' then
   maximum:=7;
   correct:=t~'(خطا|خاطي|غير دقيق|غير صحيح|لا تبدا|ليس|الفرق|تمييز|incorrect|wrong|distinguish|not)'
     and t~'(حمل|unborn|prenatal|conception)' and b;
   if b and links then pts:=pts+2;met:=array_append(met,'explain_live_birth');else missed:=array_append(missed,'explain_live_birth');end if;
   if d and links then pts:=pts+2;met:=array_append(met,'explain_death');else missed:=array_append(missed,'explain_death');end if;
   if u and a and links then pts:=pts+2;met:=array_append(met,'explain_prenatal_condition');else missed:=array_append(missed,'explain_prenatal_condition');end if;
   if correct then pts:=pts+1;met:=array_append(met,'correct_wrong_comparison');else missed:=array_append(missed,'correct_wrong_comparison');end if;
 else
   maximum:=3;
   issue:=t~'(مسال|سؤال|issue|question)' and t~'(حق|حقوق|right|شرط|condition)';
   r:=u and a;
   application:=r and t~'(تمت|حصلت|تحققت|واقعه|الواقعه|ورد|وقع|occurred|facts|born alive)' and links;
   outcome:=t~'(تحقق|ثبت|استحق|met|satisfied|vest)' and t~'(شرط|حق|condition|right)'
      and not t~'(لم يتحقق|لا يثبت|was not met|not satisfied)';
   if r then pts:=pts+1;met:=array_append(met,'relevant_legal_rule');else missed:=array_append(missed,'relevant_legal_rule');end if;
   if application and issue then pts:=pts+1;met:=array_append(met,'connect_facts_to_rule');else missed:=array_append(missed,'connect_facts_to_rule');end if;
   if outcome then pts:=pts+1;met:=array_append(met,'direct_legal_conclusion');else missed:=array_append(missed,'direct_legal_conclusion');end if;
 end if;
 if p_item='diagnostic-legal-personality' and not b and length(regexp_replace(t,'[^ ]','','g'))<7 then
  return jsonb_build_object('status','needs_human_review','provisional_percent',null,
   'reason','insufficient_diagnostic_evidence','method','internal_qatar_rights_rules_v1');
 end if;
 pct:=round(100.0*pts/maximum)::integer;
 return jsonb_build_object('status','preliminary_internal','provisional_percent',pct,
  'grade_type','provisional_rule_coverage_not_final_legal_grade',
  'confidence',case when pts>=maximum-1 and b then 'medium' else 'low' end,
  'criteria_met',to_jsonb(met),'criteria_missing',to_jsonb(missed),
  'needs_human_review',true,'method','internal_qatar_rights_rules_v1',
  'source_scope',jsonb_build_array('qa-civil-2004-art39','qa-civil-2004-art40'),
  'warning_ar','النسبة تقييم آلي مبدئي لعناصر القاعدة والعلاقات القانونية، وليست درجة جامعية نهائية.',
  'warning_en','The percentage is a provisional internal legal-element assessment, not a final university grade.');
end $$;

create or replace function public.lex_training_rubric_coverage(p_item_id text,p_answer text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare x public.content_items%rowtype;
 raw text:=trim(coalesce(p_answer,''));
 reference text; norm_answer text; norm_rule text; tok text;
 words text[]:=array[]::text[]; met text[]:=array[]::text[];
 n integer:=0; hits integer:=0; pct integer; structure_score integer:=0;
begin
 if public.lex_recall_contradiction(p_answer) then
  return jsonb_build_object('status','needs_human_review','provisional_percent',null,
   'method','conservative_negation_gate_v1','reason','core_rule_negation_detected',
   'confidence','low','needs_human_review',true,
   'feedback_ar','تتضمن الإجابة نفيًا محتملًا لقاعدة قانونية. أوقفنا النسبة الآلية حتى مراجعة الإجابة.',
   'feedback_en','Potential negation of a core rule. Automated percentage is withheld pending review.');
 end if;
 select * into x from public.content_items where id=p_item_id
 and course_id='qa-qu-lawc101-rights' and item_type='essay'
 and metadata->>'owner_pilot_approved'='true';
 if not found then raise exception 'lesson_not_available' using errcode='42501';end if;
 if length(raw)<8 or length(raw)>4000 then raise exception 'invalid_free_answer' using errcode='22023';end if;
 reference:=coalesce(x.rubric_json->>'reference_rule_ar','');
 if length(reference)<15 then return jsonb_build_object('status','needs_human_review','provisional_percent',null,'reason','missing_rubric');end if;
 norm_rule:=translate(lower(reference),'أإآىةؤئ','ااايهوي');
 norm_answer:=translate(lower(raw),'أإآىةؤئ','ااايهوي');
 norm_rule:=regexp_replace(norm_rule,'[ًٌٍَُِّْـ]','','g');
 norm_answer:=regexp_replace(norm_answer,'[ًٌٍَُِّْـ]','','g');
 foreach tok in array regexp_split_to_array(regexp_replace(norm_rule,'[^a-z0-9ء-ي]+',' ','g'),'\s+') loop
   if length(tok)<4 or tok=any(array['الذي','التي','القانون','بعضها','therefore','legal','their','where','بينما'])
    or tok=any(words) then continue;end if;
   words:=array_append(words,tok);n:=n+1;
   if position(tok in norm_answer)>0 or (length(tok)>=6 and position(substr(tok,1,length(tok)-2) in norm_answer)>0) then
    hits:=hits+1;met:=array_append(met,tok);
   end if;
 end loop;
 if n=0 then return jsonb_build_object('status','needs_human_review','provisional_percent',null,'reason','reference_not_scannable');end if;
 pct:=round(100.0*hits/n)::integer;
 if x.dimension='exam_execution' then
   if norm_answer ~ '(المسال|المسأله|issue)' then structure_score:=structure_score+5;end if;
   if norm_answer ~ '(القاعد|rule)' then structure_score:=structure_score+5;end if;
   if norm_answer ~ '(التطبيق|application)' then structure_score:=structure_score+5;end if;
   if norm_answer ~ '(النتيج|conclusion)' then structure_score:=structure_score+5;end if;
   pct:=round(pct*0.8+structure_score)::integer;
 end if;
 return jsonb_build_object(
  'status','preliminary_internal','provisional_percent',greatest(0,least(100,pct)),
  'method','lexical_rubric_coverage_v1','grade_type','provisional_textual_coverage_not_semantic_accuracy',
  'confidence','low','needs_human_review',true,
  'criteria_met',to_jsonb(met),
  'feedback_ar',case when pct<55 then 'راجع عناصر القاعدة وقارن إجابتك بالنص المرجعي؛ النسبة أولية ولا تثبت صحة التكييف القانوني.'
                     else 'توجد عناصر مرتبطة بالقاعدة في إجابتك؛ راجع دقة العلاقات والاستثناءات مع المشرف.' end,
  'feedback_en',case when pct<55 then 'Review the legal elements: this provisional score does not establish legal correctness.'
                     else 'Some reference elements are present; verify the legal reasoning and qualifications with an instructor.' end);
end $$;
commit;
