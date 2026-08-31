/* Premio Kerasion — interazioni e animazioni */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";

  /* ---------------- smooth scroll (Lenis) ----------------
     Ammorbidisce anche la rotellina del mouse, che su Windows
     scrolla a scatti: senza, le animazioni scrub si vedono solo
     col touchpad. Disattivato con prefers-reduced-motion. */
  function initSmoothScroll() {
    if (prefersReduced || typeof window.Lenis === "undefined") return;
    var lenis = new Lenis({ autoRaf: false });
    window.__lenis = lenis;
    if (hasGsap && typeof window.ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ---------------- menu overlay ---------------- */
  function initMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var overlay = document.querySelector(".menu-overlay");
    var closeBtn = document.querySelector(".menu-overlay__close");
    if (!toggle || !overlay) return;

    var FOCUSABLE_SELECTOR =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function setOpen(open) {
      overlay.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      overlay.setAttribute("aria-hidden", String(!open));
      if (window.__lenis) {
        if (open) { window.__lenis.stop(); } else { window.__lenis.start(); }
      }
      if (open) {
        var first = overlay.querySelector("a, button");
        if (first) first.focus();
      } else {
        toggle.focus();
      }
    }
    toggle.addEventListener("click", function () {
      setOpen(!overlay.classList.contains("is-open"));
    });
    if (closeBtn) closeBtn.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (!overlay.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Tab") {
        var focusable = overlay.querySelectorAll(FOCUSABLE_SELECTOR);
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ---------------- reveal allo scroll ---------------- */
  function initReveals() {
    if (
      prefersReduced ||
      !hasGsap ||
      typeof window.ScrollTrigger === "undefined" ||
      typeof window.SplitText === "undefined"
    ) return; // contenuto già visibile di default
    gsap.registerPlugin(ScrollTrigger, SplitText);

    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      var split = new SplitText(el, { type: "words" });
      gsap.from(split.words, {
        opacity: 0.12,
        stagger: 0.04,
        duration: 0.4,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          end: "top 35%",
          scrub: true
        }
      });
    });

    document.querySelectorAll("[data-fade]").forEach(function (el) {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%" }
      });
    });

    document.querySelectorAll("[data-parallax]").forEach(function (el) {
      gsap.to(el, {
        yPercent: -12,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }

  /* ---------------- lightbox gallerie ---------------- */
  function initLightbox() {
    var grids = document.querySelectorAll(".gallery-grid");
    var box = document.querySelector(".lightbox");
    if (!grids.length || !box) return;
    var img = box.querySelector("img");
    grids.forEach(function (grid) {
      grid.addEventListener("click", function (e) {
        var a = e.target.closest("a");
        if (!a) return;
        e.preventDefault();
        img.src = a.getAttribute("href");
        img.alt = a.querySelector("img") ? a.querySelector("img").alt : "";
        box.classList.add("is-open");
        box.setAttribute("aria-hidden", "false");
      });
    });
    function close() {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      img.removeAttribute("src");
    }
    box.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  /* ---------------- selettore anno (Edizioni / Gallerie) ---------------- */
  function initYearTabs() {
    var tabs = document.querySelector("[data-year-tabs]");
    var panels = document.querySelectorAll("[data-year-panel]");
    if (!tabs || !panels.length) return;
    var links = tabs.querySelectorAll("a[data-year]");

    function show(year) {
      var found = false;
      panels.forEach(function (p) {
        var match = p.getAttribute("data-year-panel") === year;
        p.hidden = !match;
        if (match) found = true;
      });
      if (!found) {
        year = panels[0].getAttribute("data-year-panel");
        panels[0].hidden = false;
      }
      links.forEach(function (a) {
        if (a.getAttribute("data-year") === year) {
          a.setAttribute("aria-current", "page");
        } else {
          a.removeAttribute("aria-current");
        }
      });
    }

    links.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var year = a.getAttribute("data-year");
        show(year);
        history.replaceState(null, "", "#" + year);
      });
    });

    show(window.location.hash.replace("#", "") || links[0].getAttribute("data-year"));
  }

  /* ---------------- bottone torna su ---------------- */
  function initBackToTop() {
    var btn = document.querySelector(".back-to-top");
    if (!btn) return;
    function update() {
      btn.classList.toggle("back-to-top--hidden", window.scrollY < window.innerHeight * 0.6);
    }
    window.addEventListener("scroll", update, { passive: true });
    btn.addEventListener("click", function (e) {
      if (window.__lenis) {
        e.preventDefault();
        window.__lenis.scrollTo(0);
      }
    });
    update();
  }

  function initSlideshows() {
    document.querySelectorAll(".slideshow").forEach(function (el) {
      var slides = el.querySelectorAll("img");
      if (slides.length < 2) return;
      var i = 0;
      setInterval(function () {
        slides[i].classList.remove("is-active");
        i = (i + 1) % slides.length;
        slides[i].classList.add("is-active");
      }, 4000);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSmoothScroll();
    initMenu();
    initReveals();
    initLightbox();
    initYearTabs();
    initBackToTop();
    initSlideshows();
  });
})();
