/* Microsoft Advertising UET tag (ti 343279116) with Consent Mode, loaded after page load.
   Consent: denied by default, granted only if the visitor accepted cookies (ff_cookie_consent). */
(function (w, d) {
  "use strict";
  var TI = "343279116";
  w.uetq = w.uetq || [];

  function stored() { try { return w.localStorage.getItem("ff_cookie_consent"); } catch (e) { return null; } }

  /* 1. consent default (must be queued before the tag initialises) */
  w.uetq.push("consent", "default", { ad_storage: stored() === "accepted" ? "granted" : "denied" });

  /* 2. load the UET tag (official loader, unchanged logic) */
  function loadTag() {
    if (w.__uetLoaded) return; w.__uetLoaded = true;
    (function (w, d, t, u, o) {
      w[u] = w[u] || [], o.ts = (new Date).getTime();
      var n = d.createElement(t);
      n.src = "https://bat.bing.net/bat.js?ti=" + o.ti + ("uetq" != u ? "&q=" + u : ""),
      n.async = 1, n.onload = n.onreadystatechange = function () {
        var s = this.readyState;
        s && "loaded" !== s && "complete" !== s ||
        (o.q = w[u], w[u] = new UET(o), w[u].push("pageLoad"),
        n.onload = n.onreadystatechange = null);
      };
      var i = d.getElementsByTagName(t)[0];
      i.parentNode.insertBefore(n, i);
    })(w, d, "script", "uetq", { ti: TI, enableAutoSpaTracking: true });
  }
  if (d.readyState === "complete") loadTag(); else w.addEventListener("load", loadTag);

  /* 3. consent update when the banner is used */
  d.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest("#cookieAccept")) w.uetq.push("consent", "update", { ad_storage: "granted" });
  }, true);

  /* 4. conversion events (create matching Event goals in Microsoft Advertising) */
  function ev(action, label) {
    w.uetq.push("event", action, { event_category: "contact", event_label: label || w.location.pathname });
  }
  d.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null; if (!a) return;
    var h = (a.getAttribute("href") || "").toLowerCase();
    if (h.indexOf("tel:") === 0) ev("phone_call_click", h.slice(4));
    else if (h.indexOf("wa.me") > -1 || h.indexOf("whatsapp.com") > -1) ev("whatsapp_click");
    else if (h.indexOf("mailto:") === 0) ev("email_click");
  }, true);
  d.addEventListener("submit", function (e) {
    var f = e.target; if (!f || f.__uetSent) return;
    if (f.tagName === "FORM" && (f.id === "quoteForm" || /formsubmit\.co/.test(f.action || ""))) { f.__uetSent = true; ev("lead_form_submit"); }
  }, true);
})(window, document);
