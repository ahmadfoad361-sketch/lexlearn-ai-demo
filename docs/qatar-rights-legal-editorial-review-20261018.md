# LexLearn — Qatar Year 1 Theory of Rights: substantive legal editorial review (18 October 2026)

**Scope:** A first-pass legal and instructional review of **six authored diagnostic MCQs** plus **three stored first-topic essay prompts**. The 72-item bank was checked structurally for linkage/review status, NOT read and certified item-by-item. This is an editorial legal-research review, not certification by an actual university reviewer or holder of professional academic credentials.

## Legal authority

Qatar Civil Code, Law No. 22 of 2004 (in force), Qatar's Al Meezan legal portal:
- Art 39, legal personality begins with complete live birth and ends at death: https://www.almeezan.qa/LawArticles.aspx?LawArticleID=36483&LawId=2559&language=ar
- Art 40, rights of unborn child whose cause does not require acceptance, conditional upon complete live birth: https://www.almeezan.qa/PrintArticle_section.aspx?LawTreeSectionID=8882&language=ar&lawId=2559
- Art 49, age of majority 18 full years, with legal restrictions on ability to act: https://www.almeezan.qa/LawArticles.aspx?LawArticleID=36493&LawId=2559&language=ar
- Art 50, no capacity to perform legal acts for lack of discernment; persons below age seven presumed to lack discernment: https://www.almeezan.qa/LawArticles.aspx?LawArticleID=36494&LawId=2559&language=ar
- Arts 62–63, lawful exercise of a right and the four separate grounds of unlawful exercise: https://www.almeezan.qa/printarticle_section.aspx?language=ar&lawid=2559&lawtreesectionid=8885

**Important:** Cases of missing persons, absence and foundlings under Art 39(2), and Art 49(1)'s capacity restrictions require qualification in teaching content. First-year students must not confuse *legal personality*, *capacity to hold rights* and *capacity to perform legal acts*. Art 63 contains FOUR distinct grounds: unlawful aim, harm as sole intent, extreme disproportion and unusually grave/unfamiliar harm.

## Review of the six diagnostic items (v2)

| ID | Legal source | Editorial decision | Reason and action |
| --- | --- | --- | --- |
| q39r | Art 39(1) | Initial legal wording suitable | Live birth is necessary for commencement of legal personality as the general rule. Preserve qualification for unborn-child rights under Art 40 in teaching. |
| q49r | Art 49(2) | Initial legal wording suitable | 18 full years is the statutory age; do not infer automatically that every adult is fully able to act, see Art 49(1). |
| q62r | Art 62 | Initial wording acceptable as an *MCQ summary*, not verbatim quotation | No liability merely from damage where exercise is lawful; check Art 63 where lawfulness is disputed. |
| q39u | Art 39(1) | Suitable as introductory concept check | Live birth followed by death generates and ends personality. This one MCQ does not validate deep understanding. |
| q50u | Arts 39,50 | **Revised in code** | Original generic 'why does capacity differ' item tested recall of a vague general statement. V2 supplies a concrete 6-year-old property owner and distinguishes capacity to hold rights from capacity to act; answer index 1. |
| q63a | Art 63(2) | **Revised in code** | With *sole* purpose of causing harm established, conduct **is** unlawful, not merely 'may' be unlawful. Retains precise intent element; answer index 2. |

### Measurement fairness

The three 'recognition' questions do **not** constitute unaided memorization. Two 'understanding' MCQs and one 'application' MCQ are only rough signals. For an actual university placement diagnostic, expand the bank with equivalent parallel forms, validate discrimination and response reliability, and review the thresholds with academic partners. A free essay must remain pending review; word overlap is no basis for automatic legal-semantic correctness. Individual student plans are provisional, not university-certified grades.

### Bilingual fidelity

Arabic is primary for the cited Qatar legislation; English prompts are **educational translations only**, not authoritative English statutes. Preserve the distinction between legal personality and legal capacity. V2 uses 'legal acts' / 'capacity to act' specifically. Native legal-English editorial review by the partner university is recommended.

## First-level/topic 1 content review — beginning of personality (Arts 39–40)

Read actual records from the current production database, **without modifying them**:
- `rights-v1-s1-exam`: hypothesizes a cause of an unborn child's right that does not require acceptance, with later live birth. Proposed conclusion that the condition for vesting is met without full capacity to act is consistent with Art 40. Rubric rightly prioritizes issue, application and conclusion. **Minor clarification:** say that the *specified legal condition* is met; avoid declaring whether another independent condition for the particular right has been satisfied unless facts specify it.
- `rights-v1-s1-recall`: legal-element recall of birth, death and conditional prenatal rights is consistent with Arts 39–40. Three memory cues are a *learning-technique component*, not three further legal elements. Keep their score explicitly separate from correctness of the legal rule.
- `rights-v1-s1-understanding`: contrast between personality beginning with live birth and a misleading proposition that personality begins at conception is correct. The model should accept accurate equivalent paraphrases and not award full meaning marks for copying text alone.
All three records are currently `legal_review` and `reviewed_at IS NULL`; no reviewer-approved grade is asserted.

## Structural audit of all 72 Qatar-rights academic items

Read-only production SQL:
- Total: 72 = 24 topics × 3 dimensions (`recall`, `understanding`, `exam_execution`), distributed as 12 records in each of six weeks.
- 72/72 have one or more source links; **0 missing foreign source links** after unnest/reference comparison.
- **0/72 recorded legal_approval=true**, **0/72 learning_approval=true**, and **0/72 non-null reviewed_at**.
- Thus the source inventory is linked, but the legal correctness of the other **69 essays, model answers and weights** remains an open review task, not presumed verified.
- The diagnostic MCQs are a separate, newly authored set; they are not among the existing 72 essay records. The v2 approval mapping `metadata.official_diagnostic_v2_id` requires six distinct reviewed and approved item records. Do not assert approval by simply changing metadata or toggling frontend release flags.

## Deployment and architectural safety

- Official authenticated student diagnostic remains **fail-closed** pending actual item approval, course enrollment and informed learning-data consent.
- The stored result must be bound to a verified Auth user and course, with write-read verification and no public demo substitution.
- The client-side course snapshot can currently be modified by its owner under existing RLS. **A client-origin signature alone cannot stop forgery.** Before live academic progress and credits, review server-authoritative assessment finalization and stage progression with immutable provenance, staff override audit and explicit RLS/Edge Function approval. Do not alter production permissions in this editorial review.
- The production website remains on the old `main` until review and authenticated browser E2E pass; passing a Node mock fixture does not mean live student E2E passed.
- There is **no paid OpenAI API** in the diagnostic or this review workflow.

## Verification checklist before release

1. Academic/legal reviewers independently verify six v2 MCQ answer keys and the first topic against linked statutory sections; record their actual identity and disposition within the existing review process.
2. Validate remaining 69 essay tasks with two independent competent reviewers, Arabic and English, within the academic review workflow.
3. Establish non-certified technical test environment that does not silently mark academic items approved or modify production students.
4. Complete authorized real-account E2E on mobile and desktop: diagnostic → confirmed cloud save → three adaptive routes → session 1, logout/login, refresh, locale switch, network failure and stage locks; collect traces.
5. Resolve server-side authoritative grade and course progression without exposing service-role credentials.
6. Only then review/merge draft PR and deploy, with rollback and Supabase inspection.

## Review outcome

**Editorially examined:** six diagnostic items and three topic-1 essay tasks, with two diagnostic code edits to Art 50 and Art 63; non-certified first-pass review.
**Structurally validated:** all 72 bank records have linked sources, none of the 72 has academic approval recorded.
**Not done:** academic institutional approval, 69-item detailed substantive review, genuine automated semantic grading, real-account production E2E, live release.
