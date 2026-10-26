/* LexLearn lightweight visitor navigation. No tracking, cookies or dependencies. */
(function () {
  "use strict";
  var doc = document, loc = window.location;
  // Make visible LexLearn brandmarks navigate home without changing other controls.
  function linkBrands(){
    doc.querySelectorAll(".brand, .site-brand, .logo-wrap, .brand-lockup, .brand-mark").forEach(function(el){
      if(el.closest("a,button")||el.querySelector("input,button,a"))return;
      if(!/lexlearn/i.test(el.textContent+" "+(el.querySelector("img")?.getAttribute("alt")||"")+" "+(el.querySelector("img")?.getAttribute("src")||"")))return;
      var a=doc.createElement("a");a.href=(loc.pathname.includes("/go/")?"../":"")+"index.html";a.className="lexlearn-home-brand";a.style.cssText="display:inline-flex;align-items:center;color:inherit;text-decoration:none";a.setAttribute("aria-label","LexLearn — الصفحة الرئيسية");el.parentNode.insertBefore(a,el);a.appendChild(el);
    });
  }
  if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",linkBrands,{once:true});else linkBrands();
  var isConference = /(?:^|\/)conference\.html$/.test(loc.pathname);
  var isStudentPath = /(?:^|\/)student-path\.html$/.test(loc.pathname);
  // Public demo renders its own responsive Back control inside its header.
  if (/(?:^|\/)showcase(?:-en)?\.html$/.test(loc.pathname)) return;
  var isArabic = function () { return doc.documentElement.lang === "ar"; };
  var back = doc.createElement("button");
  back.type = "button";
  back.className = "ll-back";
  back.id = "lexlearnBack";
  back.setAttribute("aria-label", "Back");
  back.innerHTML = '<span class="ll-back-icon" aria-hidden="true">←</span><span class="ll-back-label">Back</span>';
  var toolbar = isConference ? doc.querySelector(".site-header .top-actions") : (isStudentPath ? doc.querySelector("main > header") : null);
  if (toolbar) {
    back.classList.add("ll-back-inline");
    toolbar.insertBefore(back, toolbar.firstChild);
  } else {
    doc.body.appendChild(back);
  }

  // On the conference landing itself the three routes are the primary UI;
  // avoid a redundant Home button. Subpages still retain their Back control.
  if (isConference) {
    back.hidden = true;
    back.setAttribute("aria-hidden", "true");
    back.tabIndex = -1;
  }

  function words() {
    return isArabic()
      ? {back:isConference?"الرئيسية":"رجوع", toStudent:"جاري فتح تجربة الطالب…", toUniversity:"جاري عرض خطة التعاون الجامعي…", toInvestor:"جاري عرض الرؤية وخارطة الطريق…", cancel:"إلغاء"}
      : {back:isConference?"Home":"Back", toStudent:"Opening the student demo…", toUniversity:"Opening the university pilot…", toInvestor:"Opening the vision and roadmap…", cancel:"Cancel"};
  }
  function sync() {
    var w = words();
    back.querySelector(".ll-back-label").textContent = w.back;
    back.querySelector(".ll-back-icon").textContent = isArabic() ? "→" : "←";
    back.setAttribute("aria-label", w.back);
    back.title = w.back;
    if (isConference && investorQuotePanel && activeInvestorQuote && window.LEXLEARN_INVESTOR_QUOTES) {
      window.LEXLEARN_INVESTOR_QUOTES.render(investorQuotePanel, isArabic()?"ar":"en", activeInvestorQuote);
    }
  }
  sync();
  if (isConference) {
    ["langAR","langEN"].forEach(function (id) {
      var control = doc.getElementById(id);
      if (control) control.addEventListener("click", sync);
    });
  }

  var activeTimer = null, closeTimer = null, overlay = null;
  function closeOverlay() {
    clearTimeout(activeTimer); clearTimeout(closeTimer);
    activeTimer = closeTimer = null;
    if (overlay) overlay.hidden = true;
    doc.body.classList.remove("ll-navigating");
  }
  function internalHistory() {
    try {
      var prev = new URL(doc.referrer);
      return prev.origin === loc.origin && prev.pathname !== loc.pathname && !/\/go\/?(?:index\.html)?$/.test(prev.pathname) && window.history.length > 1;
    } catch (_) { return false; }
  }
  back.addEventListener("click", function () {
    if (overlay && !overlay.hidden) { closeOverlay(); return; }
    // Explicit Home control on the public conference page, even when
    // opened via the permanent QR redirect or from a section hash.
    if (isConference) {
      loc.assign(isArabic() ? "index.html" : "index-en.html");
      return;
    }
    if (internalHistory()) { window.history.back(); return; }
    loc.assign(isStudentPath ? (isArabic() ? "student.html" : "student-en.html") : "conference.html");
  });
  window.addEventListener("pageshow", closeOverlay);

  if (!isConference) return;
  overlay = doc.createElement("div");
  overlay.className = "ll-transition";
  overlay.id = "lexlearnTransition";
  overlay.hidden = true;
  overlay.setAttribute("role","status");
  overlay.setAttribute("aria-live","polite");
  overlay.setAttribute("aria-atomic","true");
  overlay.innerHTML =
    '<div class="ll-paper-field" aria-hidden="true">' +
      '<div class="ll-research-slip ll-paper-one"><small>PSYCHOLOGICAL SCIENCE · 2006</small><strong>Test-Enhanced Learning</strong><p>Roediger &amp; Karpicke</p><em>Long-term retention</em></div>' +
      '<div class="ll-research-slip ll-paper-two"><small>SCIENCE · 2011</small><strong>Retrieval Practice Produces More Learning than Elaborative Studying</strong><p>Karpicke &amp; Blunt</p><em>Meaningful learning</em></div>' +
      '<div class="ll-research-slip ll-paper-three"><small>REVIEW · 2013</small><strong>Improving Students’ Learning With Effective Learning Techniques</strong><p>Dunlosky et al.</p><em>Practice testing · Distributed practice</em></div>' +
    '</div>' +
    '<div class="ll-transition-panel">' +
      '<div class="ll-transition-logo"><img src="assets/lexlearn-x-transparent.svg" alt="LexLearn" width="108" height="108"></div>' +
      '<b class="ll-transition-name">Lex<span>Learn</span></b>' +
      '<div class="ll-learning-quote"></div>' +
      '<p class="ll-transition-message"></p>' +
      '<span class="ll-transition-bar" aria-hidden="true"><i></i></span>' +
      '<button class="ll-transition-cancel" type="button"></button>' +
    '</div>';
  doc.body.appendChild(overlay);
  overlay.querySelector(".ll-transition-cancel").addEventListener("click", closeOverlay);
  doc.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !overlay.hidden) { event.preventDefault(); closeOverlay(); }
  });
  var investorQuotePanel = doc.getElementById("investorQuote"), activeInvestorQuote = null;
  if (investorQuotePanel && window.LEXLEARN_INVESTOR_QUOTES) {
    activeInvestorQuote = window.LEXLEARN_INVESTOR_QUOTES.render(investorQuotePanel, isArabic()?"ar":"en");
  }
  var links = [
    {selector:".paths .path.student", message:"toStudent"},
    {selector:".paths .path.university", message:"toUniversity"},
    {selector:".paths .path.investor", message:"toInvestor"},
    {selector:"#demoLink", message:"toStudent"}
  ];
  links.forEach(function (config) {
    var link = doc.querySelector(config.selector);
    if (!link) return;
    link.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      var href = link.getAttribute("href");
      if (!href) return;
      event.preventDefault();
      closeOverlay();
      var w = words();
      overlay.querySelector(".ll-transition-message").textContent = w[config.message];
      var quoteTarget = overlay.querySelector(".ll-learning-quote");
      var investorMode = config.message === "toInvestor";
      overlay.classList.toggle("ll-investor-mode", investorMode);
      if (investorMode && window.LEXLEARN_INVESTOR_QUOTES) {
        activeInvestorQuote = window.LEXLEARN_INVESTOR_QUOTES.render(quoteTarget, isArabic() ? "ar" : "en");
        if (investorQuotePanel) window.LEXLEARN_INVESTOR_QUOTES.render(investorQuotePanel, isArabic() ? "ar" : "en", activeInvestorQuote);
      } else if (window.LEXLEARN_LEARNING_LINES) {
        window.LEXLEARN_LEARNING_LINES.render(quoteTarget, isArabic() ? "ar" : "en");
      } else {
        quoteTarget.textContent = isArabic() ? "نفهم لنتذكّر، ونسترجع لنفهم أكثر." : "We understand to remember; we retrieve to understand more.";
      }
      overlay.querySelector(".ll-transition-cancel").textContent = w.cancel;
      overlay.setAttribute("lang", isArabic() ? "ar" : "en");
      overlay.setAttribute("dir", isArabic() ? "rtl" : "ltr");
      overlay.hidden = false;
      doc.body.classList.add("ll-navigating");
      var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      activeTimer = setTimeout(function () {
        activeTimer = null;
        if (href.charAt(0) === "#") {
          // Same-page routes are sections, not new pages; preserve native hash history.
          loc.hash = href.slice(1);
          closeTimer = setTimeout(closeOverlay, reduced ? 120 : 360);
        } else {
          loc.assign(link.href);
        }
      }, reduced ? 180 : investorMode ? 1800 : 720);
    });
  });
})();
