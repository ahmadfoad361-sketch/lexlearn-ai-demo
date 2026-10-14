/* LexLearn lightweight visitor navigation. No tracking, cookies or dependencies. */
(function () {
  "use strict";
  var doc = document, loc = window.location;
  var isConference = /(?:^|\/)conference\.html$/.test(loc.pathname);
  var isArabic = function () { return doc.documentElement.lang === "ar"; };
  var back = doc.createElement("button");
  back.type = "button";
  back.className = "ll-back";
  back.id = "lexlearnBack";
  back.setAttribute("aria-label", "Back");
  back.innerHTML = '<span class="ll-back-icon" aria-hidden="true">←</span><span class="ll-back-label">Back</span>';
  var toolbar = isConference ? doc.querySelector(".site-header .top-actions") : null;
  if (toolbar) {
    back.classList.add("ll-back-inline");
    toolbar.insertBefore(back, toolbar.firstChild);
  } else {
    doc.body.appendChild(back);
  }

  function words() {
    return isArabic()
      ? {back:"رجوع", toStudent:"جاري فتح تجربة الطالب…", toUniversity:"جاري عرض خطة التعاون الجامعي…", toInvestor:"جاري عرض الرؤية وخارطة الطريق…", cancel:"إلغاء"}
      : {back:"Back", toStudent:"Opening the student demo…", toUniversity:"Opening the university pilot…", toInvestor:"Opening the vision and roadmap…", cancel:"Cancel"};
  }
  function sync() {
    var w = words();
    back.querySelector(".ll-back-label").textContent = w.back;
    back.querySelector(".ll-back-icon").textContent = isArabic() ? "→" : "←";
    back.setAttribute("aria-label", w.back);
    back.title = w.back;
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
    if (isConference && loc.hash) {
      window.history.replaceState(null, "", loc.pathname + loc.search);
      var cards = doc.querySelector(".paths");
      if (cards) cards.scrollIntoView({block:"start", behavior:"auto"});
      else window.scrollTo(0, 0);
      return;
    }
    if (internalHistory()) { window.history.back(); return; }
    loc.assign(isConference ? (isArabic() ? "index.html" : "index-en.html") : "conference.html");
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
      if (window.LEXLEARN_LEARNING_LINES) {
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
      }, reduced ? 180 : 720);
    });
  });
})();
