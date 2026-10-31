(() => {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  document.querySelectorAll("[data-video-preview]").forEach((preview) => {
    const video = preview.querySelector("video");
    const toggle = preview.querySelector("[data-video-toggle]");
    const fullscreen = preview.querySelector("[data-video-fullscreen]");
    if (!video || !toggle) return;

    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    const description = (toggle.getAttribute("aria-label") || "animation preview").replace(/^(Pause|Play)\s+/, "");
    let wantsPlayback = !reducedMotion;
    let visible = typeof IntersectionObserver === "undefined";
    let pendingPlay = false;
    let playAttempt = 0;
    let policyPauseEvents = 0;
    const nativeFullscreenActive = () => Boolean(video.webkitDisplayingFullscreen);
    const shouldPlay = () => wantsPlayback && (visible || nativeFullscreenActive()) && !document.hidden;
    const pausePlayback = () => {
      // The pause event is queued by browsers, so remember its origin until it arrives.
      if (!video.paused) policyPauseEvents++;
      video.pause();
    };
    const updateAccessibility = () => {
      const playing = !video.paused && !video.ended;
      toggle.setAttribute("aria-pressed", String(playing));
      toggle.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${description}`);
    };

    const updatePlayback = () => {
      if (!shouldPlay()) {
        pendingPlay = false;
        playAttempt++;
        pausePlayback();
        updateAccessibility();
        return;
      }
      if (!video.paused || pendingPlay) return;

      pendingPlay = true;
      const attempt = ++playAttempt;
      const finishAttempt = () => {
        if (attempt === playAttempt) pendingPlay = false;
        // A visibility change or user pause may have happened while play was pending.
        if (!shouldPlay()) pausePlayback();
        updateAccessibility();
      };
      try {
        Promise.resolve(video.play()).then(finishAttempt, finishAttempt);
      } catch {
        finishAttempt();
      }
    };

    toggle.addEventListener("click", () => {
      wantsPlayback = !(!video.paused || (pendingPlay && wantsPlayback));
      updatePlayback();
    });
    video.addEventListener("play", () => {
      // iOS replaces our inline controls with its own native player in fullscreen.
      if (nativeFullscreenActive() && !pendingPlay && !document.hidden) wantsPlayback = true;
      if (!shouldPlay()) pausePlayback();
      updateAccessibility();
    });
    video.addEventListener("pause", () => {
      if (policyPauseEvents) policyPauseEvents--;
      else if (nativeFullscreenActive() && !document.hidden) wantsPlayback = false;
      updateAccessibility();
    });
    video.addEventListener("ended", updateAccessibility);
    document.addEventListener("visibilitychange", updatePlayback);
    updateAccessibility();

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target !== preview) return;
          visible = entry.isIntersecting;
          updatePlayback();
        });
      });
      observer.observe(preview);
    } else {
      updatePlayback();
    }

    if (!fullscreen) return;
    const standardFullscreen =
      typeof preview.requestFullscreen === "function" && typeof document.exitFullscreen === "function" && document.fullscreenEnabled !== false;
    const nativeFullscreen = typeof video.webkitEnterFullscreen === "function";
    fullscreen.hidden = !standardFullscreen && !nativeFullscreen;

    const updateFullscreen = () => {
      const active = document.fullscreenElement === preview || video.webkitDisplayingFullscreen;
      const label = active ? "Exit fullscreen" : "Enter fullscreen";
      fullscreen.setAttribute("aria-label", label);
      fullscreen.setAttribute("title", label);
    };
    fullscreen.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement === preview) {
          await document.exitFullscreen();
        } else if (video.webkitDisplayingFullscreen && typeof video.webkitExitFullscreen === "function") {
          video.webkitExitFullscreen();
        } else if (standardFullscreen) {
          await preview.requestFullscreen();
        } else if (nativeFullscreen) {
          video.webkitEnterFullscreen();
        }
      } catch {
        // A browser may decline fullscreen; keep the control synchronized with its state.
      }
      updateFullscreen();
    });
    document.addEventListener("fullscreenchange", updateFullscreen);
    video.addEventListener("webkitbeginfullscreen", updateFullscreen);
    video.addEventListener("webkitendfullscreen", () => {
      updateFullscreen();
      updatePlayback();
    });
    updateFullscreen();
  });
})();
