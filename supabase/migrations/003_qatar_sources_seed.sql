insert into public.content_sources(id,course_id,title,source_url,source_type,jurisdiction,effective_date,verified_at,citation_label,excerpt_text)
values
('QA-CIVIL-64','qa-qu-lawc213','القانون المدني القطري — المادة 64','https://www.almeezan.qa/LawView.aspx?LawID=2559&language=ar&opt=','official','QA','2004-08-08',now(),'مدني قطري م64','ينعقد العقد بمجرد ارتباط الإيجاب بالقبول، إذا كان محله وسببه معتبرين قانونًا، مع مراعاة الأوضاع الخاصة التي يتطلبها القانون.'),
('QA-CIVIL-193','qa-qu-lawc213','القانون المدني القطري — المادة 193','https://almeezan.qa/LawArticles.aspx?LawArticleID=36637&LawID=2559&language=ar','official','QA','2004-08-08',now(),'مدني قطري م193','الوعد الموجه للجمهور بجائزة عن عمل معين يلزم الواعد بإعطائها لمن قام بالعمل وفق الشروط المعلنة.'),
('QA-CIVIL-199','qa-qu-lawc213','القانون المدني القطري — المادة 199','https://www.almeezan.qa/LawArticles.aspx?LawTreeSectionID=8924&language=ar&lawId=2559','official','QA','2004-08-08',now(),'مدني قطري م199','كل خطأ سبب ضرراً للغير يلزم من ارتكبه بالتعويض.'),
('QA-CIVIL-220','qa-qu-lawc213','القانون المدني القطري — المادة 220','https://www.almeezan.qa/LawArticles.aspx?LawArticleID=36664&LawId=2559&language=ar','official','QA','2004-08-08',now(),'مدني قطري م220','من يثري دون سبب مشروع على حساب غيره يلتزم في حدود إثرائه بتعويض ما لحق الغير من خسارة.')
on conflict(id) do update set source_url=excluded.source_url,verified_at=excluded.verified_at,citation_label=excluded.citation_label,excerpt_text=excluded.excerpt_text;

insert into public.content_items(id,course_id,unit_id,concept_id,dimension,difficulty,item_type,prompt_ar,rubric_json,source_ids,status,metadata)
values
('qa213-contract-explain-01','qa-qu-lawc213','contract-formation','contract-formation','understanding',3,'free','اشرح في سطرين: لماذا لا يكفي وجود الإيجاب والقبول وحدهما دائمًا لانعقاد العقد؟',
'[{"id":"c1","label":"وجود التراضي","concepts":[["الإيجاب والقبول","التراضي"]]},{"id":"c2","label":"سلامة المحل والسبب","concepts":[["المحل","السبب"]]},{"id":"c3","label":"الأوضاع الخاصة عند اللزوم","concepts":[["أوضاع خاصة","شكل خاص","الشكل"]]}]'::jsonb,
array['QA-CIVIL-64'],'legal_review','{"origin":"LexLearn Qatar year-1 map"}'::jsonb),
('qa213-unilateral-reward-01','qa-qu-lawc213','unilateral-will','promise-reward','legal_precision',3,'free','بيّن لماذا يعد الوعد الموجه للجمهور بجائزة مثالًا على الإرادة المنفردة كمصدر للالتزام.',
'[{"id":"c1","label":"إرادة شخص واحد","concepts":[["إرادة واحدة","الإرادة المنفردة"]]},{"id":"c2","label":"وعد للجمهور","concepts":[["للجمهور","وعد بجائزة"]]},{"id":"c3","label":"استحقاق من ينفذ الشروط","concepts":[["الشروط المعلنة","قام بالعمل","نفذ العمل"]]}]'::jsonb,
array['QA-CIVIL-193'],'legal_review','{"origin":"LexLearn Qatar year-1 map"}'::jsonb),
('qa213-tort-source-01','qa-qu-lawc213','tort','personal-fault','application',3,'free','في واقعة لا يوجد فيها عقد ووقع ضرر بسبب خطأ شخص، اشرح لماذا يكون الفعل الضار نقطة البداية في التكييف.',
'[{"id":"c1","label":"خطأ","concepts":[["خطأ","فعل غير مشروع"]]},{"id":"c2","label":"ضرر","concepts":[["ضرر","أضرار"]]},{"id":"c3","label":"التعويض","concepts":[["تعويض","يلزم بالتعويض"]]}]'::jsonb,
array['QA-CIVIL-199'],'legal_review','{"origin":"LexLearn Qatar year-1 map"}'::jsonb),
('qa213-enrichment-01','qa-qu-lawc213','unjust-enrichment','enrichment-without-cause','application',3,'free','اشرح عناصر البداية في تحليل الإثراء بلا سبب على حساب الغير.',
'[{"id":"c1","label":"إثراء","concepts":[["إثراء","أثرى"]]},{"id":"c2","label":"على حساب الغير/خسارة","concepts":[["على حساب","خسارة","افتقار"]]},{"id":"c3","label":"غياب السبب المشروع","concepts":[["دون سبب","بلا سبب","غياب السبب"]]}]'::jsonb,
array['QA-CIVIL-220'],'legal_review','{"origin":"LexLearn Qatar year-1 map"}'::jsonb)
on conflict(id) do update set prompt_ar=excluded.prompt_ar,rubric_json=excluded.rubric_json,source_ids=excluded.source_ids,metadata=excluded.metadata,updated_at=now();
