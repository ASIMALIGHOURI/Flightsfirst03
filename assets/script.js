/* ==========================================================================
   FLIGHTSFIRST.CO.UK — site.js
   DTR (Dynamic Text Replacement) / DKI keyword engine for Google Ads RSA
   campaigns, plus UI interactions: nav, FAQ accordion, board ticker, the
   lead/callback form (with email delivery), and cookie consent.

   ------------------------------------------------------------------------
   HOW TO WIRE THIS TO GOOGLE ADS (RSA + DKI + DTR strategy)
   ------------------------------------------------------------------------
   1. In your RSA headlines use DKI as normal, e.g.
        {KeyWord:Cheap Flights}  |  {KeyWord:Flights to Dubai}
   2. In the ad's Final URL / Final URL suffix, pass the exact keyword
      through as a query parameter, e.g.:
        https://www.flightsfirst.co.uk/?keywords={keyword}&utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&device={device}
   3. This script reads keywords / kw / utm_term / keyword (in that order),
      title-cases it, and swaps it into the H1, page <title>, meta
      description and CTA copy — so a search for "flights to dubai" lands
      on a page that says "Flights to Dubai" straight back at the visitor.
   4. If no parameter is present (direct/organic traffic) it falls back to
      DEFAULT_KEYWORD below.
   ========================================================================== */

(function () {
  "use strict";

  var DEFAULT_KEYWORD = "Cheap Flights";

  /* ---------------- DTR / DKI engine ---------------- */
  function getParam(names) {
    var params = new URLSearchParams(window.location.search);
    for (var i = 0; i < names.length; i++) {
      var v = params.get(names[i]);
      if (v && v.trim().length) return v;
    }
    return null;
  }

  function cleanKeyword(raw) {
    var text = decodeURIComponent(raw.replace(/\+/g, " "));
    text = text.replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
    var small = ["to", "from", "and", "the", "in", "of", "a", "for"];
    var words = text.split(" ").map(function (w, i) {
      var lw = w.toLowerCase();
      if (i !== 0 && small.indexOf(lw) > -1) return lw;
      return lw.charAt(0).toUpperCase() + lw.slice(1);
    });
    return words.join(" ");
  }

  function initDynamicKeyword() {
    // "keywords" checked first since that's the parameter this site standardises on;
    // kw / utm_term / keyword remain supported for flexibility across ad groups.
    var raw = getParam(["keywords", "kw", "utm_term", "keyword", "k"]);
    var keyword = raw ? cleanKeyword(raw) : DEFAULT_KEYWORD;

    document.querySelectorAll("[data-kw]").forEach(function (el) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.value = keyword;
      } else {
        el.textContent = keyword;
      }
    });
    document.querySelectorAll("[data-kw-lower]").forEach(function (el) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.value = keyword.toLowerCase();
      } else {
        el.textContent = keyword.toLowerCase();
      }
    });

    if (document.title.indexOf("{kw}") > -1) {
      document.title = document.title.replace("{kw}", keyword);
    }
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.getAttribute("content").indexOf("{kw}") > -1) {
      metaDesc.setAttribute("content", metaDesc.getAttribute("content").replace("{kw}", keyword));
    }
  }

  /* ---------------- Mobile nav toggle ---------------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- FAQ accordion ---------------- */
  function initFaq() {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var q = item.querySelector(".faq-q");
      if (!q) return;
      q.setAttribute("aria-expanded", item.classList.contains("open") ? "true" : "false");
      q.addEventListener("click", function () {
        var isOpen = item.classList.contains("open");
        document.querySelectorAll(".faq-item.open").forEach(function (openItem) {
          if (openItem !== item) {
            openItem.classList.remove("open");
            openItem.querySelector(".faq-q").setAttribute("aria-expanded", "false");
          }
        });
        item.classList.toggle("open", !isOpen);
        q.setAttribute("aria-expanded", (!isOpen).toString());
      });
    });
  }

  /* ---------------- Departure board infinite ticker ---------------- */
  function initBoard() {
    var track = document.querySelector(".board-track");
    if (!track) return;
    track.innerHTML += track.innerHTML; // duplicate for seamless loop
  }

  /* ---------------- Lead / callback form ---------------- */
  /* Delivery: forms POST to FormSubmit (https://formsubmit.co) which relays
     submissions to info@flightsfirst.co.uk with no backend server required.
     IMPORTANT (one-time step): the very first submission after this site
     goes live triggers an activation email to info@flightsfirst.co.uk —
     someone must click "Activate Form" in that email once, after which every
     future submission is delivered straight to the inbox automatically. */
  function initLeadForms() {
    document.querySelectorAll("form.lead-form").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();

        var fieldsWrap = form.querySelector(".lead-form-fields");
        var success = form.querySelector(".form-success");
        var errorBox = form.querySelector(".form-error");
        var submitBtn = form.querySelector('button[type="submit"]');
        var originalLabel = submitBtn ? submitBtn.innerHTML : "";

        if (errorBox) errorBox.classList.remove("visible");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Sending…";
        }

        fetch(form.action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        })
          .then(function (res) {
            if (!res.ok) throw new Error("Network response was not OK");
            if (success) {
              var nameInput = form.querySelector('input[name="name"]');
              var nameSlot = success.querySelector(".success-name");
              if (nameInput && nameInput.value.trim() && nameSlot) {
                var firstName = nameInput.value.trim().split(" ")[0];
                nameSlot.textContent = ", " + firstName;
              }
            }
            if (fieldsWrap) fieldsWrap.style.display = "none";
            if (success) success.classList.add("active");
          })
          .catch(function () {
            if (errorBox) errorBox.classList.add("visible");
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalLabel;
            }
          });
      });
    });
  }

  /* ---------------- From/To swap button ---------------- */
  function initSwapButtons() {
    document.querySelectorAll(".swap-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var row = btn.closest(".swap-row");
        if (!row) return;
        var fromInput = row.querySelector('input[name="from"]');
        var toInput = row.querySelector('input[name="to"]');
        if (fromInput && toInput) {
          var tmp = fromInput.value;
          fromInput.value = toInput.value;
          toInput.value = tmp;
        }
        btn.classList.toggle("swapped");
      });
    });
  }

  /* ---------------- Trip type: hide return date for one-way ---------------- */
  function initTripType() {
    document.querySelectorAll('select[name="trip_type"]').forEach(function (select) {
      var form = select.closest("form");
      if (!form) return;
      var returnField = form.querySelector('input[name="return_date"]');
      if (!returnField) return;
      var returnWrap = returnField.closest(".field");

      function sync() {
        var isOneWay = select.value === "One Way";
        if (returnWrap) returnWrap.style.visibility = isOneWay ? "hidden" : "visible";
        returnField.disabled = isOneWay;
      }
      select.addEventListener("change", sync);
      sync();
    });
  }

  /* ---------------- Discounted fare modal ---------------- */
  function initFareModal() {
    var overlay = document.getElementById("fareModal");
    if (!overlay) return;
    var closeBtn = overlay.querySelector(".modal-close");
    var airlineField = overlay.querySelector('input[name="airline_interest"]');
    var priceField = overlay.querySelector('input[name="fare_price"]');
    var nameSlot = overlay.querySelector(".modal-airline-name");
    var fareChip = document.getElementById("modalFareChip");
    var farePriceSlot = overlay.querySelector(".modal-fare-price");
    var lastFocused = null;

    function openModal(airlineName, price) {
      lastFocused = document.activeElement;
      if (airlineField) airlineField.value = airlineName || "";
      if (priceField) priceField.value = price || "";
      if (nameSlot) nameSlot.textContent = airlineName ? " — " + airlineName : "";
      if (fareChip && farePriceSlot) {
        if (price) {
          farePriceSlot.textContent = (airlineName ? airlineName + " " : "") + "from " + price;
          fareChip.style.display = "flex";
        } else {
          fareChip.style.display = "none";
        }
      }
      overlay.classList.add("open");
      document.body.classList.add("modal-open");
      var firstInput = overlay.querySelector("input:not([type=hidden]), select");
      if (firstInput) firstInput.focus();
    }
    function closeModal() {
      overlay.classList.remove("open");
      document.body.classList.remove("modal-open");
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    }

    document.querySelectorAll(".get-discount-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModal(btn.getAttribute("data-airline"), btn.getAttribute("data-price"));
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
    });
  }

  function initDatePickers() {
    document.querySelectorAll('input[type="date"]').forEach(function (input) {
      input.addEventListener("click", function () {
        if (typeof input.showPicker === "function") {
          try {
            input.showPicker();
          } catch (err) {
            /* not user-activated or unsupported in this context — ignore */
          }
        }
      });
    });
  }

  /* ---------------- GCLID capture (Google Ads click ID) ----------------
     Captures ?gclid= from the URL so it can be attached to lead form
     submissions for offline conversion import in Google Ads. GDPR-conscious:
     - Always available for the CURRENT pageview's form submission (this is
       necessary to process that specific enquiry, not decorative tracking).
     - Only persisted to localStorage (so it survives to a later pageview,
       e.g. someone browses another page before enquiring) if the visitor has
       already accepted cookies via the consent banner.
     See Cookie Policy / Privacy Policy for how this is described to users. */
  var CAPTURED_GCLID = null;
  function initGclidCapture() {
    var params = new URLSearchParams(window.location.search);
    var gclid = params.get("gclid");
    var CONSENT_KEY = "ff_cookie_consent";
    var GCLID_KEY = "ff_gclid";

    if (gclid) {
      CAPTURED_GCLID = gclid;
      try {
        if (localStorage.getItem(CONSENT_KEY) === "accepted") {
          localStorage.setItem(GCLID_KEY, gclid);
        }
      } catch (err) {
        /* localStorage unavailable — session-only capture still works */
      }
    } else {
      try {
        if (localStorage.getItem(CONSENT_KEY) === "accepted") {
          CAPTURED_GCLID = localStorage.getItem(GCLID_KEY);
        }
      } catch (err) {}
    }

    if (CAPTURED_GCLID) {
      document.querySelectorAll('input[name="gclid"]').forEach(function (el) {
        el.value = CAPTURED_GCLID;
      });
    }
  }

  /* ---------------- Cookie consent ---------------- */
  function initCookieBanner() {
    var banner = document.getElementById("cookieBanner");
    if (!banner) return;
    var STORAGE_KEY = "ff_cookie_consent";
    var accept = document.getElementById("cookieAccept");
    var decline = document.getElementById("cookieDecline");

    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        window.setTimeout(function () {
          banner.classList.add("visible");
        }, 600);
      }
    } catch (err) {
      /* localStorage unavailable (e.g. private mode) — skip banner persistence */
    }

    function dismiss(value) {
      try {
        localStorage.setItem(STORAGE_KEY, value);
        // if the visitor accepts after we already captured a gclid this
        // pageview, persist it now so it isn't lost on a later visit
        if (value === "accepted" && CAPTURED_GCLID) {
          localStorage.setItem("ff_gclid", CAPTURED_GCLID);
        }
      } catch (err) {}
      banner.classList.remove("visible");
    }

    if (accept) accept.addEventListener("click", function () { dismiss("accepted"); });
    if (decline) decline.addEventListener("click", function () { dismiss("declined"); });
  }

  /* ---------------- Header glass effect on scroll ---------------- */
  function initHeaderScroll() {
    var header = document.querySelector(".site-header");
    var mobileBar = document.querySelector(".mobile-bar");
    var revealed = false;

    function onScroll() {
      if (header) {
        header.classList.toggle("scrolled", window.scrollY > 12);
      }
      if (mobileBar && !revealed && window.scrollY > 80) {
        mobileBar.classList.add("visible");
        revealed = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- Scroll-reveal entrance animation ---------------- */
  function initReveal() {
    var selector = ".card, .route-card, .testi, .step, .section-head, .cta-band, .lead-card";
    var els = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!els.length) return;

    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return; // leave elements in their natural visible state
    }

    // stagger reveal delay for siblings within the same parent (cascading effect)
    var seen = new Map();
    els.forEach(function (el) {
      el.classList.add("reveal-init");
      var parent = el.parentElement;
      var siblingIndex = seen.get(parent) || 0;
      seen.set(parent, siblingIndex + 1);
      el.style.transitionDelay = Math.min(siblingIndex % 4, 4) * 90 + "ms";
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------------- Animated stat counters ---------------- */
  function initCountUp() {
    var els = document.querySelectorAll("[data-countup]");
    if (!els.length) return;

    function animate(el) {
      var target = parseInt(el.getAttribute("data-countup"), 10) || 0;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.textContent = target.toLocaleString("en-GB");
        return;
      }
      var duration = 1400;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target).toLocaleString("en-GB");
        if (progress < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      els.forEach(animate);
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    els.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------------- Cloudflare Turnstile ----------------
     Loaded with render=explicit so we control exactly when/how each widget
     renders. Every form's submit button ships with `disabled` in the HTML
     as a safe default (fails closed if JS or Turnstile fails to load) and
     is only re-enabled once that form's widget returns a valid token. */
  function renderTurnstileWidgets() {
    if (typeof turnstile === "undefined") return;
    document.querySelectorAll(".cf-turnstile").forEach(function (container) {
      if (container.getAttribute("data-rendered") === "true") return;
      var form = container.closest("form");
      var submitBtn = form ? form.querySelector('button[type="submit"]') : null;
      var tokenField = form ? form.querySelector('input[name="cf-turnstile-response"]') : null;

      turnstile.render(container, {
        sitekey: container.getAttribute("data-sitekey"),
        callback: function (token) {
          if (tokenField) tokenField.value = token;
          if (submitBtn) submitBtn.disabled = false;
        },
        "expired-callback": function () {
          if (tokenField) tokenField.value = "";
          if (submitBtn) submitBtn.disabled = true;
        },
        "error-callback": function () {
          if (tokenField) tokenField.value = "";
          if (submitBtn) submitBtn.disabled = true;
        },
      });
      container.setAttribute("data-rendered", "true");
    });
  }

  // Cloudflare calls this global function once its script has loaded
  // (see the ?onload=onloadTurnstile param on the <script> tag).
  window.onloadTurnstile = function () {
    renderTurnstileWidgets();
  };

  function initTurnstile() {
    // The fare modal's widget lives inside a hidden overlay when the page
    // loads, so also (re)render whenever the modal opens.
    var overlay = document.getElementById("fareModal");
    if (overlay) {
      var observer = new MutationObserver(function () {
        if (overlay.classList.contains("open")) renderTurnstileWidgets();
      });
      observer.observe(overlay, { attributes: true, attributeFilter: ["class"] });
    }
    // In case the Turnstile script already finished loading before this ran
    if (typeof turnstile !== "undefined") renderTurnstileWidgets();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initDynamicKeyword();
    initGclidCapture();
    initNav();
    initFaq();
    initBoard();
    initLeadForms();
    initSwapButtons();
    initTripType();
    initDatePickers();
    initFareModal();
    initTurnstile();
    initCookieBanner();
    initHeaderScroll();
    initReveal();
    initCountUp();
  });
})();
