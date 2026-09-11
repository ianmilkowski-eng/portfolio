(() => {
  "use strict";

  function initializeMotion() {
    const root = document.documentElement;
    const stage = document.querySelector(".hero-stage");
    const toggle = document.querySelector("[data-motion-toggle]");
    const preference = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    const canObserve = typeof window.IntersectionObserver === "function";
    const activeReveals = new Set();
    let reducedMotion = Boolean(preference?.matches);
    let pausedByUser = false;
    let stageInView = false;

    function cancelReveals() {
      for (const animation of activeReveals) animation.cancel();
      activeReveals.clear();
    }

    function synchronizeMotion() {
      const playing = !pausedByUser && !reducedMotion && !document.hidden && (!stage || stageInView);
      root.dataset.motion = playing ? "running" : "paused";
      if (toggle) {
        // The control keeps the user's preference when the page pauses offscreen.
        toggle.setAttribute("aria-pressed", String(pausedByUser || reducedMotion));
        toggle.disabled = reducedMotion;
        toggle.textContent = reducedMotion ? "Motion off" : pausedByUser ? "Play motion" : "Pause motion";
      }
      if (pausedByUser || document.hidden || reducedMotion) cancelReveals();
    }

    if (stage) {
      stage.dataset.inView = "false";
      if (canObserve) {
        const stageObserver = new window.IntersectionObserver((entries) => {
          for (const entry of entries) {
            stageInView = entry.isIntersecting;
            stage.dataset.inView = String(stageInView);
          }
          synchronizeMotion();
        }, { threshold: 0 });
        stageObserver.observe(stage);
      }
    }

    if (toggle && stage && canObserve) {
      toggle.addEventListener("click", () => {
        if (reducedMotion) return;
        pausedByUser = !pausedByUser;
        synchronizeMotion();
      });
      toggle.hidden = false;
    }

    const onPreferenceChange = (event) => {
      reducedMotion = event.matches;
      // System settings apply immediately without losing an intentional pause.
      synchronizeMotion();
    };
    if (preference?.addEventListener) {
      preference.addEventListener("change", onPreferenceChange);
    } else if (preference?.addListener) {
      preference.addListener(onPreferenceChange);
    }
    document.addEventListener("visibilitychange", synchronizeMotion);

    if (canObserve) {
      const revealObserver = new window.IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target;
          revealObserver.unobserve(element);
          if (pausedByUser || reducedMotion || document.hidden || typeof element.animate !== "function") continue;

          // Artwork stays visible throughout; cancellation restores its normal layout.
          const animation = element.animate([
            { opacity: 1, transform: "translateY(18px)" },
            { opacity: 1, transform: "translateY(0)" }
          ], { duration: 600, easing: "cubic-bezier(0.2, 0.65, 0.3, 1)", fill: "none" });
          activeReveals.add(animation);
          animation.addEventListener("finish", () => activeReveals.delete(animation), { once: true });
          animation.addEventListener("cancel", () => activeReveals.delete(animation), { once: true });
        }
      }, { threshold: 0.08 });
      for (const element of document.querySelectorAll("[data-reveal]")) {
        revealObserver.observe(element);
      }
    }

    synchronizeMotion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeMotion, { once: true });
  } else {
    initializeMotion();
  }
})();
