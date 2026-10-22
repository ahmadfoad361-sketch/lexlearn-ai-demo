
-- DRAFT: source-bounded relationship grader for the first legal-personality lesson.
-- Not a general semantic AI model; unsupported contexts must abstain from numeric scoring.
-- Never run against LexLearn Production before academic and security sign-off.
begin;

create or replace function public.lex_personality_relations_v2(p_answer text)
returns jsonb language plpgsql immutable set search_path='' as $body$
declare
 s text:=lower(coalesce(p_answer,'')); is_en boolean;
 quoted_refutation boolean; bad boolean:=false; birth_ok boolean:=false;
 death_ok boolean:=false; prenatal_ok boolean:=false;
begin
 s:=translate(s,'أإآىةؤئ','ااايهوي');
 s:=regexp_replace(s,'[ًٌٍَُِّْـ]','','g');
 is_en:=s ~ '[a-z]' and s !~ '[ء-ي]';
 quoted_refutation:=s ~ '(من الخطا|خاطئه|العباره.{0,95}خاطئ|الصواب|incorrect that|it is false that|wrong to say)';
 if is_en then
   birth_ok:=s ~ '(personality.{0,55}(begins|starts).{0,55}(live birth|born alive)|personality.{0,55}(at|upon) live birth|acquires legal personality.{0,55}born alive|it begins.{0,35}live birth)';
   death_ok:=s ~ '(personality.{0,45}ends.{0,35}death|ends at death|loses it at death|death ends.{0,30}personality)';
   prenatal_ok:=s ~ '(unborn|prenatal).{0,65}(rights?).{0,90}(conditional|born alive|live birth)';
   bad:=s ~ '(personality.{0,40}(begins|starts) at death|personality.{0,40}ends at (live )?birth|does not (begin|start).{0,25}(live )?birth|does not end.{0,25}death|unborn.{0,35}(no rights|no conditional rights))';
 else
   birth_ok:=s ~ '(تبدا.{0,35}(الشخصيه|شخصيه).{0,55}(ولاد|مولود)|الشخصيه.{0,40}تبدا.{0,50}(ولاد|مولود)|تثبت.{0,45}الشخصيه.{0,85}مولود|تكتسب.{0,42}الشخصيه.{0,60}(ولاد|مولود)|اصل.{0,18}الشخصيه.{0,22}الولاده|الشخصيه.{0,25}(بالولاده|عند الولاده))'
      and s ~ '(حي|الحياه|قيد الحياه)';
   death_ok:=s ~ '((تنتهي|نهايتها|نهايه|تزول).{0,45}(وفا|موت|بموته)|الموت.{0,25}ينهي.{0,22}الشخصيه)';
   prenatal_ok:=s ~ '((الحمل|الجنين).{0,55}(حق|حقوق).{0,55}(شرط|مشروط|بشرط).{0,55}(ولاد|ولد).{0,22}حي|(للحمل|للجنين).{0,35}(حق|حقوق).{0,45}(شرط|مشروط|بشرط).{0,55}(ولاد|ولد).{0,22}حي)';
   bad:=s ~ '(لا تبدا.{0,40}الشخصيه.{0,45}(ولاد|مولود)|الشخصيه.{0,28}لا تبدا.{0,40}(ولاد|مولود)|لا تنتهي.{0,42}(الوفا|الموت)|تبدا.{0,38}الشخصيه.{0,25}(بالوفاه|بالموت)|تنتهي.{0,38}الشخصيه.{0,25}بالولاده|لا توجد.{0,35}حقوق.{0,15}(للحمل|للجنين)|لا.{0,12}(حقوق|حق).{0,15}(للحمل|للجنين))';
 end if;
 if quoted_refutation and birth_ok then
   -- A rejected example alone is not a learner conclusion; keep evidence preliminary.
   bad:=false;
 end if;
 return jsonb_build_object('birth',birth_ok,'death',death_ok,
   'prenatal',prenatal_ok,'contradiction',bad,
   'refutation',quoted_refutation,'language',case when is_en then 'en' else 'ar' end);
end $body$;
revoke all on function public.lex_personality_relations_v2(text) from public,anon,authenticated;

create or replace function public.lex_internal_personality_grade(p_item text,p_answer text)
returns jsonb language plpgsql stable security definer set search_path='' as $body$
declare e jsonb; birth_ok boolean; death_ok boolean; prenatal_ok boolean; pct integer;
begin
 if p_item not in ('diagnostic-legal-personality','rights-v1-s1-recall',
    'rights-v1-s1-understanding','rights-v1-s1-exam') then
   return jsonb_build_object('status','needs_human_review','provisional_percent',null,'reason','unsupported_item');
 end if;
 if length(trim(coalesce(p_answer,'')))<4 then
   return jsonb_build_object('status','needs_human_review','provisional_percent',null,'reason','insufficient_answer');
 end if;
 e:=public.lex_personality_relations_v2(p_answer);
 if (e->>'contradiction')::boolean then
   return jsonb_build_object('status','needs_human_review','provisional_percent',null,
    'reason','potential_legal_contradiction','confidence','low','needs_human_review',true,
    'method','relation_rubric_v2','details',e);
 end if;
 birth_ok:=(e->>'birth')::boolean; death_ok:=(e->>'death')::boolean;
 prenatal_ok:=(e->>'prenatal')::boolean;
 if not birth_ok and not death_ok and not prenatal_ok then
   return jsonb_build_object('status','needs_human_review','provisional_percent',null,
    'reason','meaning_not_confirmed','confidence','low','needs_human_review',true,
    'method','relation_rubric_v2','details',e);
 end if;
 if p_item='diagnostic-legal-personality' then
   if not birth_ok then
     return jsonb_build_object('status','needs_human_review','provisional_percent',null,
       'reason','diagnostic_start_of_personality_not_confirmed','method','relation_rubric_v2');
   end if;
   pct:=100; -- 100% of the SINGLE measured birth-start criterion, not total memory ability.
 elsif p_item='rights-v1-s1-recall' then
   pct:=(case when birth_ok then 35 else 0 end)
       +(case when death_ok then 35 else 0 end)
       +(case when prenatal_ok then 30 else 0 end);
 else
   -- Understanding and exam reasoning need separate argument/case rubrics.
   return jsonb_build_object('status','needs_human_review','provisional_percent',null,
     'reason','dimension_specific_semantic_rubric_pending','method','relation_rubric_v2',
     'details',e,'needs_human_review',true);
 end if;
 return jsonb_build_object('status','preliminary_internal','provisional_percent',pct,
   'grade_type','observed_legal_relations_not_verified_mastery','confidence','low',
   'needs_human_review',true,'method','relation_rubric_v2',
   'criteria_met',to_jsonb(array_remove(array[
       case when birth_ok then 'live_birth' end,
       case when death_ok then 'death_end' end,
       case when prenatal_ok then 'prenatal_conditional_rights' end],null)),
   'details',e,
   'warning_ar','نسبة أولية لعناصر قانونية محددة، وليست درجة إتقان أو تصحيحا دلاليا معتمدا.',
   'warning_en','Preliminary coverage of specific legal propositions, not validated semantic mastery.');
end $body$;
revoke all on function public.lex_internal_personality_grade(text,text) from public,anon,authenticated;

create or replace function public.lex_training_rubric_coverage(p_item_id text,p_answer text)
returns jsonb language plpgsql stable security definer set search_path='' as $body$
declare item public.content_items%rowtype; result jsonb;
begin
 select * into item from public.content_items
 where id=p_item_id and course_id='qa-qu-lawc101-rights' and item_type='essay'
 and metadata->>'owner_pilot_approved'='true';
 if not found then raise exception 'lesson_not_available' using errcode='42501';end if;
 if length(trim(coalesce(p_answer,'')))<8 or length(p_answer)>4000 then
   raise exception 'invalid_free_answer' using errcode='22023';end if;
 if p_item_id not in ('rights-v1-s1-recall','rights-v1-s1-understanding','rights-v1-s1-exam') then
   -- Never pass all 30 topics through an unrelated birth/death rubric or token overlap.
   return jsonb_build_object('status','needs_human_review','provisional_percent',null,
     'reason','lesson_semantic_rubric_not_reviewed','method','human_review_pending',
     'confidence','low','needs_human_review',true,
     'feedback_ar','تم حفظ إجابتك وتحتاج مراجعة معيار الدرس قبل التقدير.',
     'feedback_en','Answer saved; a lesson-specific meaning rubric is required before scoring.');
 end if;
 result:=public.lex_internal_personality_grade(p_item_id,p_answer);
 return result || jsonb_build_object(
   'feedback_ar',case when result->>'status'='preliminary_internal'
    then 'تم التعرف مبدئيا على علاقات قانونية صحيحة. راجع العناصر التي لم تثبت في إجابتك.'
    else 'تم حفظ الإجابة دون تقدير آلي غير موثوق؛ يلزم فحص المعنى القانوني.' end,
   'feedback_en',case when result->>'status'='preliminary_internal'
    then 'Some legal relationships were detected. Review missing or unverified elements.'
    else 'The answer is saved. A reliable automated percentage is withheld pending legal review.' end);
end $body$;
revoke all on function public.lex_training_rubric_coverage(text,text) from public,anon,authenticated;
commit;
