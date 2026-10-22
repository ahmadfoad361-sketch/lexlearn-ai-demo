-- Isolated PostgreSQL CI diagnostic coverage: natural paraphrases, contradiction, ambiguity.
\set ON_ERROR_STOP on
create temp table recall_matrix(case_id text, expectation text, answer_text text);
insert into recall_matrix values
('full_correct','correct','تبدأ الشخصية القانونية بتمام ولادته حيا وتنتهي بالوفاة حسب القانون. للحمل حقوق بشرط الولادة حيا ومفاتيح الحفظ تربط الولادة ببداية الشخصية والوفاة بالنهاية.'),
('correct_refutation','correct','من الخطأ القول إن الشخصية لا تبدأ بالولادة الحية، الصحيح أنها تبدأ بالولادة حيا وتنتهي بالوفاة.'),
('correct_not_conception','correct','الشخصية لا تبدأ بالحمل وإنما تبدأ بتمام ولادة الإنسان حيا وتنتهي بالوفاة.'),
('synonym','correct','تثبت للإنسان الشخصية بمجيئه إلى الدنيا مولودا على قيد الحياة، وتزول بموته.'),
('partial','partial','تبدأ الشخصية القانونية بالولادة حيا.'),
('keywords','ambiguous','الشخصية القانونية الولادة حيا الوفاة الحمل حقوق مشروطة.'),
('wrong_birth','incorrect','الشخصية القانونية لا تبدأ بالولادة الحية بل تبدأ بعد سن الرشد.'),
('wrong_death','incorrect','تبدأ الشخصية القانونية بالولادة حيا لكنها لا تنتهي بالوفاة.'),
('reverse','incorrect','تبدأ الشخصية القانونية بالوفاة وتنتهي بالولادة الحية.'),
('wrong_pregnancy','incorrect','تبدأ الشخصية بالولادة الحية وتنتهي بالوفاة ولكن لا توجد حقوق للحمل المستكن.'),
('mixed','ambiguous','تبدأ الشخصية بالولادة حيا ولا تبدأ الشخصية بالولادة حيا.'),
('en_correct','correct','Legal personality begins upon live birth and ends at death.'),
('en_wrong','incorrect','Legal personality does not begin at live birth. It begins at adulthood.'),
('en_reverse','incorrect','Legal personality begins at death and ends at live birth.'),
('en_refute','correct','It is false that legal personality begins at death. It begins upon live birth.'),
('en_keywords','ambiguous','birth death personality prenatal rights memorized keywords.');
do $run$ declare c record; d jsonb; p jsonb; begin
 for c in select * from recall_matrix loop
  d:=public.lex_internal_personality_grade('diagnostic-legal-personality',c.answer_text);
  p:=public.lex_training_rubric_coverage('rights-v1-s1-recall',c.answer_text);
  raise notice 'RECALL_MATRIX %',jsonb_build_object('case',c.case_id,'expected',c.expectation,
   'diagnostic_status',d->>'status','diagnostic',d->'provisional_percent',
   'practice_status',p->>'status','practice',p->'provisional_percent');
 end loop;
end $run$;
