# Read the legal provisions before answering

The official diagnostic begins with the full Arabic provisions for Articles 39, 40, 49, 50, 62 and 63. Each training session begins with the provisions referenced by that session's server-authorized tasks, including the review checkpoints. Duplicate source references appear once, in article order.

Each provision is a separate paragraph block, followed by its own article number and source link. The same original Arabic law text is retained in the English interface with an English heading and controls. The user selects “Start question one” to hide the reading material and show the existing first question. This reading step does not submit an answer or add a scored question. Saved partial sessions resume at their existing question; completed sessions retain their reports.

`assets/legal-study.js` contains the full statutory text separately from the shorter scoped grading excerpts. It does not change the assessment rubrics or add requirements to a student's answer. This changes the learning protocol to reading followed by questions and retrieval; the resulting practice estimates must not be interpreted as a measure of knowledge before exposure to the text.

Sources checked against the Al Meezan publications of Qatar Civil Code, Law 22/2004:

- [Natural persons, Articles 39–52](https://www.almeezan.qa/PrintArticle_section.aspx?LawTreeSectionID=8882&language=ar&lawId=2559)
- [Legal persons, Articles 53–55](https://www.almeezan.qa/PrintArticle_section.aspx?LawTreeSectionID=8883&language=ar&lawId=2559)
- [Things and property, Articles 56–61](https://www.almeezan.qa/PrintArticle_section.aspx?LawTreeSectionID=8884&language=ar&lawId=2559)
- [Exercise of rights, Articles 62–63](https://www.almeezan.qa/PrintArticle_section.aspx?LawTreeSectionID=8885&language=ar&lawId=2559)

Validation: `node tests/legal-study.test.js` checks both languages, 25 provisions, source deduplication, article labels following each text, the diagnostic reading step, all 30 training sessions, hiding the text before questions, no assessment writes during reading, and partial-session resume. Existing server diagnostic, training, consent and publication checks remain in use.

