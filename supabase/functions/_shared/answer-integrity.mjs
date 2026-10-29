/*
 * Conservative, language-aware free-answer screening for LexLearn.
 * Classification is an intake hint, NOT a legal score or a diagnosis of ability.
 * Only definite refusal or unmistakable noise is stopped automatically.
 * Ambiguous/short meaningful legal answers still reach ordinary review.
 */
export function classifyFreeAnswer(value) {
 const raw = String(value ?? "").trim();
 const normalized = raw.normalize("NFKC")
  .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
  .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي")
  .replace(/\s+/g, " ").toLowerCase().trim();
 const cleaned = normalized.replace(/[^\p{L}\p{N}\s']/gu, " ").replace(/\s+/g, " ").trim();
 if (!raw || !cleaned) return {kind:"empty",reason:"no_text",grade:null,counts_as_evidence:false};
 const words=cleaned.split(/\s+/).filter(Boolean);
 const letters=cleaned.replace(/[^\p{L}]/gu,"");
 const explicitAr=/^(?:(?:انا|اني)\s+)?(?:لا\s*(?:اعلم|اعرف|ادري|اذكر|اتذكر|استطيع\s+التذكر)|مش\s*(?:عارف|عارفه|فاكر|فاكره|متذكر|متذكره)|ما\s*(?:اعرف|ادري|اذكر|اتذكر|افتكر)|معرفش|ماعرفش|مشعارف|نسيت|ناسي|ما\s*عندي(?:ش)?\s*فكره|معنديش\s*فكره)(?:\s+(?:الاجابه|الجواب|السؤال|المعلومه|القاعده|هذه\s+القاعده|هذا\s+السؤال|خالص|تماما|دلوقتي|الان|صراحه|اصلا|اي\s+حاجه|شيء|حاجه))*$/u;
 const explicitEn=/^(?:i\s+)?(?:don't\s+know|do\s+not\s+know|dont\s+know|can't\s+remember|cannot\s+remember|don't\s+remember|do\s+not\s+remember|have\s+no\s+idea|am\s+not\s+sure|forgot|forget|idk|no\s+idea|not\s+sure)(?:\s+(?:the\s+answer|the\s+rule|anything|at\s+all|sorry))*$/i;
 if(explicitAr.test(cleaned)||explicitEn.test(cleaned))
  return {kind:"explicit_unknown",reason:"student_declared_no_answer",grade:null,counts_as_evidence:false};
 if(!letters || /^(?:[\p{N}\s]+)$/u.test(cleaned))
  return {kind:"obvious_noise",reason:"no_alphabetic_content",grade:null,counts_as_evidence:false};
 if(letters.length>=5 && new Set([...letters]).size<=1)
  return {kind:"obvious_noise",reason:"repeated_character",grade:null,counts_as_evidence:false};
 if(/^(?:qwerty(?:uiop)?|asdf(?:ghjkl)?|zxcv(?:bnm)?)(?:\s*(?:qwerty(?:uiop)?|asdf(?:ghjkl)?|zxcv(?:bnm)?))*$/i.test(cleaned))
  return {kind:"obvious_noise",reason:"keyboard_sequence",grade:null,counts_as_evidence:false};
 if(words.length>=3 && new Set(words).size===1 && words[0].length<=5)
  return {kind:"obvious_noise",reason:"repeated_token",grade:null,counts_as_evidence:false};
 return {kind:"assessable",reason:"not_confidently_nonanswer",grade:null,counts_as_evidence:null};
}
