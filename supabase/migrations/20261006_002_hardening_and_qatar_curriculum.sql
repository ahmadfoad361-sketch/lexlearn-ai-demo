-- LexLearn production hardening + Qatar first-year curriculum mapping

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.active);
$$;

-- A student with an old session must immediately lose data access after deactivation.
drop policy if exists "attempts own insert" on public.attempts;
create policy "attempts own insert" on public.attempts for insert to authenticated
with check (user_id=auth.uid() and public.is_active_user());

drop policy if exists "mastery own insert" on public.mastery_evidence;
create policy "mastery own insert" on public.mastery_evidence for insert to authenticated
with check (user_id=auth.uid() and public.is_active_user());

drop policy if exists "snapshots own write" on public.learner_snapshots;
create policy "snapshots own write" on public.learner_snapshots for insert to authenticated
with check (user_id=auth.uid() and public.is_active_user());
drop policy if exists "snapshots own update" on public.learner_snapshots;
create policy "snapshots own update" on public.learner_snapshots for update to authenticated
using (user_id=auth.uid() and public.is_active_user())
with check (user_id=auth.uid() and public.is_active_user());

drop policy if exists "plans own write" on public.learning_plans;
create policy "plans own write" on public.learning_plans for all to authenticated
using (user_id=auth.uid() and public.is_active_user())
with check (user_id=auth.uid() and public.is_active_user());

drop policy if exists "reviews own write" on public.reviews;
create policy "reviews own write" on public.reviews for all to authenticated
using (user_id=auth.uid() and public.is_active_user())
with check (user_id=auth.uid() and public.is_active_user());

drop policy if exists "events own insert" on public.activity_events;
create policy "events own insert" on public.activity_events for insert to authenticated
with check (user_id=auth.uid() and public.is_active_user());

drop policy if exists "consent own" on public.consent_records;
create policy "consent own" on public.consent_records for all to authenticated
using (user_id=auth.uid() and public.is_active_user())
with check (user_id=auth.uid() and public.is_active_user());

drop policy if exists "ai runs own insert" on public.ai_grading_runs;
create policy "ai runs own insert" on public.ai_grading_runs for insert to authenticated
with check (user_id=auth.uid() and public.is_active_user());

-- Institution/course evidence is stored separately from legal authorities.
create table if not exists public.curriculum_mappings (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  institution text not null,
  official_course_code text not null,
  first_year boolean not null default false,
  semester_label text,
  credit_hours numeric(3,1),
  prerequisite text,
  official_source_url text not null,
  coverage jsonb not null default '[]'::jsonb,
  verified_at timestamptz not null default now()
);
alter table public.curriculum_mappings enable row level security;
drop policy if exists "curriculum authenticated read" on public.curriculum_mappings;
create policy "curriculum authenticated read" on public.curriculum_mappings for select to authenticated using (true);
drop policy if exists "curriculum staff write" on public.curriculum_mappings;
create policy "curriculum staff write" on public.curriculum_mappings for all to authenticated
using (public.is_staff() or public.is_content_reviewer())
with check (public.is_staff() or public.is_content_reviewer());

insert into public.courses(id,country_code,institution_key,course_code,title_ar,title_en,academic_year,status,metadata)
values
('qa-abmmc-2502102','qa','ahmed-bin-mohammed-military-college','2502102','مصادر الالتزام','Sources of Obligations','2026','approved','{"year":"first","credits":3}'::jsonb),
('eg-civil-sources','eg','lexlearn-egypt','CIV-SOURCES','مصادر الالتزام','Sources of Obligations','2026','approved','{"pilot":true,"institution_specific":false}'::jsonb)
on conflict(id) do update set metadata=excluded.metadata,status=excluded.status,updated_at=now();

insert into public.curriculum_mappings
(id,course_id,institution,official_course_code,first_year,semester_label,credit_hours,prerequisite,official_source_url,coverage)
values
('qa-qu-lawc213-map','qa-qu-lawc213','Qatar University College of Law','LAWC 213',true,'Spring',3,'LAWC 101',
 'https://law.qu.edu.qa/en-us/Colleges/law/departments/private-law/Pages/course-description.aspx',
 '["Contract: elements, conditions, defects, effects and contractual responsibility","Unilateral will and promise of reward","Tort: personal liability, liability for others and things","Unjustified enrichment including undue payment and officious management","Law/legislation as a direct source"]'::jsonb),
('qa-lu-lawc104-map','qa-lu-lawc104','Lusail University College of Law','LAWC 104',true,'Spring',3,'LAWC 101',
 'https://www.lu.edu.qa/downloads/Law-Study-Plan.pdf',
 '["Sources of obligations; first-year spring course","Prerequisite: Introduction to Law"]'::jsonb),
('qa-abmmc-2502102-map','qa-abmmc-2502102','Ahmed Bin Mohammed Military College','2502102',true,'Fall',3,null,
 'https://www.abmmc.edu.qa/wp/bachelors-degree-in-law-study-plan/?lang=en',
 '["Sources of obligations; first-year law study plan"]'::jsonb)
on conflict(id) do update set coverage=excluded.coverage,verified_at=now();

-- Official Qatari legal anchors for grounded tutoring.
insert into public.content_sources
(id,country_code,title,authority,source_url,source_type,status,excerpt,metadata)
values
('qa-civil-2004-art64','qa','القانون المدني القطري رقم 22 لسنة 2004 — المادة 64','الميزان — البوابة القانونية القطرية',
 'https://www.almeezan.qa/LawView.aspx?LawID=2559&language=ar&opt=','official','approved',
 'ينعقد العقد بمجرد ارتباط الإيجاب بالقبول، إذا كان محله وسببه معتبرين قانوناً، وذلك دون إخلال بما يتطلبه القانون من أوضاع خاصة لانعقاد بعض العقود.',
 '{"topic":"contract formation"}'::jsonb),
('qa-civil-2004-art192','qa','القانون المدني القطري — المادة 192','الميزان — البوابة القانونية القطرية',
 'https://www.almeezan.qa/LawArticles.aspx?LawTreeSectionID=8922&language=ar&lawId=2559','official','approved',
 'التصرف القانوني الصادر بالإرادة المنفردة لا ينشئ التزاماً ولا يعدّل في التزام قائم ولا ينهيه، إلا في الأحوال الخاصة التي ينص عليها القانون.',
 '{"topic":"unilateral will"}'::jsonb),
('qa-civil-2004-art193','qa','القانون المدني القطري — المادة 193','الميزان — البوابة القانونية القطرية',
 'https://almeezan.qa/LawArticles.aspx?LawArticleID=36637&LawID=2559&language=ar','official','approved',
 'من وجّه للجمهور وعداً بجائزة يعطيها عن عمل معين، التزم بإعطاء الجائزة لمن قام بهذا العمل وفقاً للشروط المعلنة.',
 '{"topic":"promise of reward"}'::jsonb),
('qa-civil-2004-art199','qa','القانون المدني القطري — المادة 199','الميزان — البوابة القانونية القطرية',
 'https://www.almeezan.qa/LawArticles.aspx?LawArticleID=36643&LawID=2559&language=ar','official','approved',
 'كل خطأ سبب ضرراً للغير يلزم من ارتكبه بالتعويض.',
 '{"topic":"tort"}'::jsonb),
('qa-civil-2004-art220','qa','القانون المدني القطري — المادة 220','الميزان — البوابة القانونية القطرية',
 'https://www.almeezan.qa/LawArticles.aspx?LawArticleID=36664&LawId=2559&language=ar','official','approved',
 'كل شخص يثري دون سبب مشروع على حساب شخص آخر يلتزم في حدود ما أثرى به بتعويض هذا الشخص عما لحقه من خسارة.',
 '{"topic":"unjust enrichment"}'::jsonb)
on conflict(id) do update set excerpt=excluded.excerpt,source_url=excluded.source_url,status='approved',updated_at=now();

-- Drafted items deliberately stop at legal_review until the academic owner approves them.
insert into public.content_items
(id,course_id,unit_id,concept_id,variant_group_id,dimension,difficulty,item_type,prompt_ar,rubric_json,source_ids,status,metadata)
values
('qa213-contract-explain-01','qa-qu-lawc213','contract','formation','contract-formation-explain','understanding',3,'free',
 'اشرح في سطرين: لماذا لا يكفي وجود الإيجاب والقبول وحدهما دائماً لانعقاد العقد؟',
 '{"criteria":[{"id":"c1","label":"ارتباط الإيجاب بالقبول","weight":0.30},{"id":"c2","label":"اعتبار المحل والسبب قانوناً","weight":0.45},{"id":"c3","label":"الأوضاع الخاصة عند اللزوم","weight":0.25}]}'::jsonb,
 array['qa-civil-2004-art64'],'legal_review','{"generated_for":"LexLearn adaptive track","needs_owner_approval":true}'::jsonb),
('qa213-unilateral-reward-01','qa-qu-lawc213','unilateral-will','reward','unilateral-reward-apply','application',3,'free',
 'وُجّه للجمهور وعد بجائزة عن عمل معين. حدّد مصدر الالتزام واشرح بإيجاز سبب اختيارك.',
 '{"criteria":[{"id":"c1","label":"الإرادة المنفردة","weight":0.45},{"id":"c2","label":"وعد موجّه للجمهور بجائزة","weight":0.35},{"id":"c3","label":"الالتزام وفق الشروط المعلنة","weight":0.20}]}'::jsonb,
 array['qa-civil-2004-art192','qa-civil-2004-art193'],'legal_review','{"needs_owner_approval":true}'::jsonb),
('qa213-tort-source-01','qa-qu-lawc213','tort','personal-act','tort-source-apply','application',3,'free',
 'لا توجد علاقة عقدية، وسبب شخص بخطئه ضرراً للغير. حدّد مصدر الالتزام وما العنصر الذي يربط الواقعة به.',
 '{"criteria":[{"id":"c1","label":"الفعل الضار/المسؤولية عن العمل غير المشروع","weight":0.50},{"id":"c2","label":"الخطأ","weight":0.20},{"id":"c3","label":"الضرر","weight":0.20},{"id":"c4","label":"التعويض كأثر","weight":0.10}]}'::jsonb,
 array['qa-civil-2004-art199'],'legal_review','{"needs_owner_approval":true}'::jsonb),
('qa213-enrichment-01','qa-qu-lawc213','unjust-enrichment','general-rule','enrichment-apply','application',3,'free',
 'شخص أثرى دون سبب مشروع على حساب شخص آخر. ما مصدر الالتزام وما حدود الأثر الذي تقرره القاعدة؟',
 '{"criteria":[{"id":"c1","label":"الإثراء دون سبب","weight":0.35},{"id":"c2","label":"على حساب شخص آخر/خسارته","weight":0.30},{"id":"c3","label":"التعويض في حدود الإثراء","weight":0.35}]}'::jsonb,
 array['qa-civil-2004-art220'],'legal_review','{"needs_owner_approval":true}'::jsonb)
on conflict(id) do update set rubric_json=excluded.rubric_json,source_ids=excluded.source_ids,metadata=excluded.metadata,updated_at=now();
