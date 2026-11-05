/* Privacy-first LexLearn telemetry: never send student text, identity, URL parameters or grade content. */
(function (root, document) {
  "use strict";
  if (!root || !document || !root.location) return;
  var cfg = root.LEX_OBSERVABILITY_CONFIG || {};
  var page = (root.location.pathname.split("/").pop() || "index.html").toLowerCase();
  var pages = {
    "index.html": "home", "index-en.html": "home",
    "conference.html": "conference",
    "showcase.html": "demo", "showcase-en.html": "demo",
    "showcase-level1.html": "demo", "showcase-level1-en.html": "demo",
    "diagnostic.html": "diagnostic",
    "student.html": "student_home", "student-en.html": "student_home",
    "student-path.html": "student_path", "student-practice.html": "student_practice",
    "student-login.html": "login", "student-login-en.html": "login",
    "student-register.html": "registration", "student-register-en.html": "registration"
  };
  var surface = pages[page];
  var nav = root.navigator || {};
  var privateBrowsingOptOut = nav.globalPrivacyControl === true ||
    nav.doNotTrack === "1" || root.doNotTrack === "1";
  var allowed = {
    page_opened: true, diagnostic_started: true, diagnostic_completed: true,
    grading_queued: true, grading_confirmed: true, training_stage_completed: true
  };
  var posthogKey = typeof cfg.posthogKey === "string" ? cfg.posthogKey.trim() : "";
  var posthogHost = cfg.posthogHost === "https://eu.i.posthog.com" ||
    cfg.posthogHost === "https://us.i.posthog.com" ? cfg.posthogHost : "";
  var anonymousSession = "";
  if (!privateBrowsingOptOut && surface && posthogKey && posthogHost && root.crypto && root.crypto.randomUUID) {
    try {
      anonymousSession = root.sessionStorage.getItem("lexlearn_anon_analytics_session");
      if (!/^[a-f0-9-]{36}$/i.test(anonymousSession || "")) {
        anonymousSession = root.crypto.randomUUID();
        root.sessionStorage.setItem("lexlearn_anon_analytics_session", anonymousSession);
      }
    } catch (_) {
      anonymousSession = root.crypto.randomUUID();
    }
  }
  function track(name) {
    if (privateBrowsingOptOut || !surface || !allowed[name] ||
        !anonymousSession || !posthogKey || !posthogHost || !root.fetch) return false;
    var data = {
      api_key: posthogKey, event: "lex_" + name, distinct_id: "anon-" + anonymousSession,
      properties: { surface: surface, $process_person_profile: false }
    };
    try {
      root.fetch(posthogHost + "/capture/", {
        method: "POST", mode: "cors", credentials: "omit",
        referrerPolicy: "no-referrer", keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).catch(function () {});
      return true;
    } catch (_) { return false; }
  }
  root.LEX_OBSERVABILITY = Object.freeze({ track: track });
  if (surface) track("page_opened");

  /* Sentry is disabled unless an actual project DSN is supplied at build time.
     Explicit generic errors only; never capture form values, stack traces, URLs or breadcrumbs. */
  var dsn = typeof cfg.sentryDsn === "string" ? cfg.sentryDsn : "";
  var sentryUrl;
  try { sentryUrl = new URL(dsn); } catch (_) { return; }
  if (sentryUrl.protocol !== "https:" ||
      !/(^|\.)sentry\.io$/i.test(sentryUrl.hostname) ||
      !/^\d+$/.test(sentryUrl.pathname.slice(1))) return;
  var script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = "https://browser.sentry-cdn.com/latest/bundle.min.js";
  script.onload = function () {
    if (!root.Sentry || !root.Sentry.init) return;
    root.Sentry.init({
      dsn: dsn,
      defaultIntegrations: false,
      integrations: [],
      sendDefaultPii: false,
      tracesSampleRate: 0,
      beforeSend: function (event) {
        return { event_id: event.event_id, timestamp: event.timestamp,
          platform: "javascript", level: "error", message: "LexLearn frontend error",
          tags: { surface: surface || "other" } };
      }
    });
    function genericError(code) {
      try { root.Sentry.captureMessage(code, { level: "error" }); } catch (_) {}
    }
    root.addEventListener("error", function () { genericError("lex_frontend_error"); });
    root.addEventListener("unhandledrejection", function () { genericError("lex_unhandled_rejection"); });
  };
  script.onerror = function () {};
  (document.head || document.documentElement).appendChild(script);
})(typeof window !== "undefined" ? window : null,
   typeof document !== "undefined" ? document : null);
