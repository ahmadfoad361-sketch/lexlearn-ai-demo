-- Preserve original evidence. Empty/Not sure stays unmeasured; a submitted, intelligible answer
-- with no legal elements has preliminary legal-criterion coverage 0/5.
-- LexLearn preliminary diagnostic recall rubric revision.
-- Existing saved student results are left untouched for audit and prompt-version fairness.
-- New responses must cover three legal rule elements, not one keyword relationship.
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
   -- This question now explicitly requests three different parts of Qatar Civil Code
   -- Articles 39-40. Partial recall must NEVER receive 100%.
   maximum:=5;
   if b then pts:=pts+2;met:=array_append(met,'live_birth');
   else missed:=array_append(missed,'live_birth');end if;
   if d then pts:=pts+1;met:=array_append(met,'death_end');
   else missed:=array_append(missed,'death_end');end if;
   if u and a then pts:=pts+2;met:=array_append(met,'prenatal_conditional_rights');
   else missed:=array_append(missed,'prenatal_conditional_rights');end if;
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
 if p_item='diagnostic-legal-personality'
   and t ~ '^[[:space:]]*(لا[[:space:]]*(ادري|اعرف|اعلم)|مش[[:space:]]+عارف|ما[[:space:]]+اعرف|غير[[:space:]]+متاكد|idk|not[[:space:]]+sure|i[[:space:]]+don.t[[:space:]]+know)[[:space:].!؟]*$'
 then
  return jsonb_build_object('status','needs_human_review','provisional_percent',null,
   'reason','explicit_not_sure','method','internal_qatar_rights_rules_v4');
 end if;
 -- Do not grade punctuation-only, numeric-only or function-word fragments.
 if p_item='diagnostic-legal-personality'
  and length(regexp_replace(t,'[[:space:][:punct:][:digit:]]','','g'))<4
 then
  return jsonb_build_object('status','needs_human_review','provisional_percent',null,
   'reason','non_substantive_answer','method','internal_qatar_rights_rules_v4');
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
revoke all on function public.lex_internal_personality_grade(text,text) from public,anon,authenticated;

-- Only recompute an old explicitly insufficient one-word response; preserve its
-- original internal_grade verbatim. Never mutate historical paid OpenAI audits.
update public.student_diagnostic_runs d
set result=jsonb_set(
 d.result,'{measurements,recall,corrected_internal_grade}',
 public.lex_internal_personality_grade('diagnostic-legal-personality',d.free_text)
 || jsonb_build_object('rubric_version','20261024_v4_nonresponse_distinction',
                       'grade_origin','server_rubric_not_openai',
                       'historical_grade_preserved',true),
 true), updated_at=now()
where d.status='completed'
 and d.result #>> '{measurements,recall,internal_grade,reason}'='insufficient_diagnostic_evidence'
 and d.result #> '{measurements,recall,corrected_internal_grade}' is null
 and length(trim(coalesce(d.free_text,'')))>=4
 and (public.lex_internal_personality_grade('diagnostic-legal-personality',d.free_text)
   ->>'status')='preliminary_internal'
 and (public.lex_internal_personality_grade('diagnostic-legal-personality',d.free_text)
   ->>'provisional_percent')::int=0;
