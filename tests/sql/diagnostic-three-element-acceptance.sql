-- A correct statement of only Article 39's live-birth starting condition
-- is NOT 100% recall of Articles 39 and 40.
do $$
declare partial jsonb; complete_answer jsonb; mistaken jsonb;
begin
  partial:=public.lex_internal_personality_grade('diagnostic-legal-personality',
    'تبدأ الشخصية القانونية للإنسان بتمام ولادته حياً.');
  if partial->>'status'<>'preliminary_internal' or (partial->>'provisional_percent')::int<>40 then
    raise exception 'Partial recall should earn 2 of 5 legal criteria points, not 100: %',partial;
  end if;
  complete_answer:=public.lex_internal_personality_grade('diagnostic-legal-personality',
    'تبدأ شخصية الإنسان بتمام ولادته حياً وتنتهي شخصيته القانونية بوفاته. الحمل المستكن له حقوق لا يحتاج سببها إلى قبول بشرط تمام ولادته حياً.');
  if complete_answer->>'status'<>'preliminary_internal' or (complete_answer->>'provisional_percent')::int<>100 then
    raise exception 'Complete correct answer should cover all 3 legal rule elements: %',complete_answer;
  end if;
  mistaken:=public.lex_internal_personality_grade('diagnostic-legal-personality',
    'تبدأ الشخصية القانونية بالوفاة وتنتهي بالولادة الحية.');
  if mistaken->>'provisional_percent' is not null and (mistaken->>'provisional_percent')::int=100 then
    raise exception 'Reversed legal propositions must not be graded 100: %',mistaken;
  end if;
end $$;
\echo 'PASS: only all legal elements can earn a complete_answer provisional diagnostic score'

-- Regression: null, "Not sure", punctuation and a submitted wrong one-word fragment
-- MUST be distinguished rather than all mapped to 0%.
do $$
declare short_answer jsonb; unknown_answer jsonb; blank_answer jsonb; punctuation jsonb;
begin
 short_answer:=public.lex_internal_personality_grade('diagnostic-legal-personality','الشخصبة');
 if short_answer->>'status'<>'preliminary_internal'
   or (short_answer->>'provisional_percent')::integer<>0
   or jsonb_array_length(short_answer->'criteria_missing')<>3 then
  raise exception 'One-word attempt must cover 0 of 3 legal rules, not a fabricated score or null: %', short_answer;
 end if;
 unknown_answer:=public.lex_internal_personality_grade('diagnostic-legal-personality','لا أدري');
 if unknown_answer->>'status'<>'needs_human_review'
    or unknown_answer->>'provisional_percent' is not null then
  raise exception 'Explicit not-sure must remain unmeasured: %',unknown_answer;
 end if;
 blank_answer:=public.lex_internal_personality_grade('diagnostic-legal-personality','');
 if blank_answer->>'status'<>'needs_human_review'
   or blank_answer->>'provisional_percent' is not null then
  raise exception 'Empty text must not score zero: %', blank_answer;
 end if;
 punctuation:=public.lex_internal_personality_grade('diagnostic-legal-personality','!!!!!!!!!');
 if punctuation->>'status'<>'needs_human_review'
    or punctuation->>'provisional_percent' is not null then
  raise exception 'Punctuation is not a legal answer: %',punctuation;
 end if;
end $$;
\echo 'PASS: 0% for a supplied answer with no correct criterion; unknown and blank stay unmeasured'
