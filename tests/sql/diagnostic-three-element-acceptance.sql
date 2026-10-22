-- A correct statement of only Article 39's live-birth starting condition
-- is NOT 100% recall of Articles 39 and 40.
do $$
declare partial jsonb; full jsonb; mistaken jsonb;
begin
  partial:=public.lex_internal_personality_grade('diagnostic-legal-personality',
    'تبدأ الشخصية القانونية للإنسان بتمام ولادته حياً.');
  if partial->>'status'<>'preliminary_internal' or (partial->>'provisional_percent')::int<>40 then
    raise exception 'Partial recall should earn 2 of 5 legal criteria points, not 100: %',partial;
  end if;
  full:=public.lex_internal_personality_grade('diagnostic-legal-personality',
    'تبدأ شخصية الإنسان بتمام ولادته حياً وتنتهي شخصيته القانونية بوفاته. الحمل المستكن له حقوق لا يحتاج سببها إلى قبول بشرط تمام ولادته حياً.');
  if full->>'status'<>'preliminary_internal' or (full->>'provisional_percent')::int<>100 then
    raise exception 'Complete correct answer should cover all 3 legal rule elements: %',full;
  end if;
  mistaken:=public.lex_internal_personality_grade('diagnostic-legal-personality',
    'تبدأ الشخصية القانونية بالوفاة وتنتهي بالولادة الحية.');
  if mistaken->>'provisional_percent' is not null and (mistaken->>'provisional_percent')::int=100 then
    raise exception 'Reversed legal propositions must not be graded 100: %',mistaken;
  end if;
end $$;
\echo 'PASS: only all legal elements can earn a full provisional diagnostic score'
