-- Grader v2 semantic-scope safety checks on isolated test content.
\set ON_ERROR_STOP on
do $checks$
declare full jsonb; alt jsonb; en jsonb; falsehood jsonb; vague jsonb;
  understanding jsonb; exam_task jsonb; unknown_topic jsonb;
begin
 full:=public.lex_training_rubric_coverage('rights-v1-s1-recall',
   'تبدأ الشخصية القانونية بالولادة حيا وتنتهي بالوفاة. للحمل حقوق بشرط ولادته حيا.');
 if full->>'status'<>'preliminary_internal' or (full->>'provisional_percent')::int<>100
   or (full->>'needs_human_review')::boolean is not true
   then raise exception 'complete observed relations are not 100 provisional with human review: %',full;end if;
 alt:=public.lex_training_rubric_coverage('rights-v1-s1-recall',
   'تثبت للإنسان الشخصية بمجيئه إلى الدنيا مولودا على قيد الحياة، وتزول بموته.');
 if alt->>'status'<>'preliminary_internal' or (alt->>'provisional_percent')::int<65
   then raise exception 'correct paraphrase unfairly penalized: %',alt;end if;
 en:=public.lex_training_rubric_coverage('rights-v1-s1-recall',
   'Legal personality begins upon live birth and ends at death.');
 if en->>'status'<>'preliminary_internal' or (en->>'provisional_percent')::int<65
   then raise exception 'English equivalent unfairly penalized: %',en;end if;
 falsehood:=public.lex_training_rubric_coverage('rights-v1-s1-recall',
   'تبدأ الشخصية القانونية بالوفاة وتنتهي بالولادة الحية.');
 if falsehood->>'status'<>'needs_human_review' or falsehood->>'provisional_percent' is not null
   then raise exception 'inverted relationships must never earn recall points: %',falsehood;end if;
 vague:=public.lex_training_rubric_coverage('rights-v1-s1-recall',
   'الشخصية القانونية والولادة الحية والوفاة وحقوق الحمل.');
 if vague->>'status'<>'needs_human_review' or vague->>'provisional_percent' is not null
   then raise exception 'bare terms must never earn a numerical grade: %',vague;end if;
 understanding:=public.lex_training_rubric_coverage('rights-v1-s1-understanding',
   'تبدأ الشخصية القانونية بالولادة حيا وتنتهي بالوفاة.');
 if understanding->>'status'<>'needs_human_review' or understanding->>'provisional_percent' is not null
   then raise exception 'recall alone must not be scored as understanding: %',understanding;end if;
 exam_task:=public.lex_training_rubric_coverage('rights-v1-s1-exam',
   'تبدأ الشخصية القانونية بالولادة حيا وتنتهي بالوفاة.');
 if exam_task->>'status'<>'needs_human_review' or exam_task->>'provisional_percent' is not null
   then raise exception 'recall alone must not be scored as exam application: %',exam_task;end if;
 unknown_topic:=public.lex_training_rubric_coverage('rights-v1-s2-recall',
   'تبدأ الشخصية القانونية بالولادة حيا وتنتهي بالوفاة.');
 if unknown_topic->>'status'<>'needs_human_review' or unknown_topic->>'provisional_percent' is not null
   then raise exception 'topic mismatch may not earn a generic keyword score: %',unknown_topic;end if;
 raise notice 'GRADING_V2_PASS: correct, paraphrase, bilingual, inverted, keywords, skill boundaries, and other-topic abstention';
end $checks$;
