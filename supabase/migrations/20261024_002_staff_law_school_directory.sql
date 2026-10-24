-- Staff-maintained directory; public browser clients cannot query/write these tables directly.
CREATE TABLE IF NOT EXISTS public.lex_reference_countries(
 code text PRIMARY KEY CHECK(code ~ '^[a-z]{2}$'), name_ar text NOT NULL CHECK(char_length(name_ar) BETWEEN 2 AND 120),
 created_by uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.lex_law_universities(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),country_code text NOT NULL REFERENCES public.lex_reference_countries(code),
 institution_key text NOT NULL UNIQUE CHECK(institution_key ~ '^[a-z0-9][a-z0-9-]{2,119}$'),
 name_ar text NOT NULL CHECK(char_length(name_ar) BETWEEN 3 AND 180),
 official_url text CHECK(official_url IS NULL OR official_url LIKE 'https://%'),
 provenance text NOT NULL DEFAULT 'staff_added' CHECK(provenance IN ('official','staff_added')),
 created_by uuid REFERENCES auth.users(id),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS lex_law_universities_country_name_unique ON public.lex_law_universities(country_code,lower(trim(name_ar)));
CREATE INDEX IF NOT EXISTS lex_law_universities_country_idx ON public.lex_law_universities(country_code,name_ar);
CREATE TABLE IF NOT EXISTS public.lex_law_faculties(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),university_id uuid NOT NULL REFERENCES public.lex_law_universities(id),
 name_ar text NOT NULL CHECK(char_length(name_ar) BETWEEN 3 AND 180),
 official_url text CHECK(official_url IS NULL OR official_url LIKE 'https://%'),
 provenance text NOT NULL DEFAULT 'staff_added' CHECK(provenance IN ('official','staff_added')),
 created_by uuid REFERENCES auth.users(id),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS lex_law_faculty_uni_name_unique ON public.lex_law_faculties(university_id,lower(trim(name_ar)));
CREATE INDEX IF NOT EXISTS lex_law_faculty_uni_idx ON public.lex_law_faculties(university_id);
ALTER TABLE public.lex_reference_books ADD COLUMN IF NOT EXISTS faculty_id uuid REFERENCES public.lex_law_faculties(id);
CREATE INDEX IF NOT EXISTS lex_ref_book_faculty_idx ON public.lex_reference_books(faculty_id);
ALTER TABLE public.lex_reference_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lex_law_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lex_law_faculties ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lex_reference_countries,public.lex_law_universities,public.lex_law_faculties FROM anon,authenticated;
GRANT ALL ON public.lex_reference_countries,public.lex_law_universities,public.lex_law_faculties TO service_role;
INSERT INTO public.lex_reference_countries(code,name_ar) VALUES('qa','قطر'),('eg','مصر'),('sa','السعودية'),('ae','الإمارات العربية المتحدة')
ON CONFLICT(code) DO NOTHING;
WITH data(country_code,institution_key,name_ar,faculty_name,official_url) AS (VALUES
  ('qa','qatar-university','جامعة قطر','كلية القانون','https://www.qu.edu.qa/en-us/Colleges/Pages/default.aspx'),
  ('qa','lusail-university','جامعة لوسيل','كلية القانون','https://www.lu.edu.qa/'),
  ('eg','cairo-university','جامعة القاهرة','كلية الحقوق','https://law.sohag-univ.edu.eg/main/الجامعات-المصرية/'),
  ('eg','ain-shams-university','جامعة عين شمس','كلية الحقوق','https://law.sohag-univ.edu.eg/main/الجامعات-المصرية/'),
  ('eg','alexandria-university','جامعة الإسكندرية','كلية الحقوق','https://law.sohag-univ.edu.eg/main/الجامعات-المصرية/'),
  ('eg','mansoura-university','جامعة المنصورة','كلية الحقوق','https://law.sohag-univ.edu.eg/main/الجامعات-المصرية/'),
  ('eg','tanta-university','جامعة طنطا','كلية الحقوق','https://law.sohag-univ.edu.eg/main/الجامعات-المصرية/'),
  ('eg','zagazig-university','جامعة الزقازيق','كلية الحقوق','https://law.sohag-univ.edu.eg/main/الجامعات-المصرية/'),
  ('eg','assiut-university','جامعة أسيوط','كلية الحقوق','https://law.sohag-univ.edu.eg/main/الجامعات-المصرية/'),
  ('eg','helwan-university','جامعة حلوان','كلية الحقوق','https://law.sohag-univ.edu.eg/main/الجامعات-المصرية/'),
  ('eg','benha-university','جامعة بنها','كلية الحقوق','https://law.sohag-univ.edu.eg/main/الجامعات-المصرية/'),
  ('eg','menoufia-university','جامعة المنوفية','كلية الحقوق','https://law.sohag-univ.edu.eg/main/الجامعات-المصرية/'),
  ('sa','king-saud-university','جامعة الملك سعود','كلية الحقوق والعلوم السياسية','https://clps.ksu.edu.sa/ar/node/1218'),
  ('sa','king-abdulaziz-university','جامعة الملك عبدالعزيز','كلية الحقوق','https://www.kau.edu.sa/faculty/ar/law'),
  ('ae','united-arab-emirates-university','جامعة الإمارات العربية المتحدة','كلية القانون','https://www.uaeu.ac.ae/en/cl/'),
  ('ae','university-of-sharjah','جامعة الشارقة','كلية القانون','https://www.sharjah.ac.ae/en/Academics/Law')
), uni AS (
 INSERT INTO public.lex_law_universities(country_code,institution_key,name_ar,official_url,provenance)
 SELECT country_code,institution_key,name_ar,official_url,'official' FROM data
 ON CONFLICT(institution_key) DO NOTHING RETURNING id
)
INSERT INTO public.lex_law_faculties(university_id,name_ar,official_url,provenance)
SELECT u.id,d.faculty_name,d.official_url,'official'
FROM data d JOIN public.lex_law_universities u ON u.institution_key=d.institution_key
ON CONFLICT DO NOTHING;
UPDATE public.lex_reference_books b SET faculty_id=f.id,updated_at=now()
FROM public.lex_law_faculties f JOIN public.lex_law_universities u ON u.id=f.university_id
WHERE b.faculty_id IS NULL AND b.institution_key=u.institution_key AND b.jurisdiction=u.country_code
AND (b.course_id IS NULL OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id=b.course_id AND c.institution_key=u.institution_key AND c.country_code=b.jurisdiction));
