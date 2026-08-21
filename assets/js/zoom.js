// Initialize medium zoom without requiring jQuery.
const initializeMediumZoom = () => {
  const zoomableImages = Array.from(document.querySelectorAll("[data-zoomable]"));

  if (zoomableImages.length === 0 || typeof mediumZoom !== "function") {
    return;
  }

  const zoom = mediumZoom(zoomableImages, {
    background: getComputedStyle(document.documentElement).getPropertyValue("--global-bg-color") + "ee",
  });

  window.medium_zoom = zoom;

  zoomableImages.forEach((image) => {
    if (!image.hasAttribute("tabindex")) {
      image.tabIndex = 0;
    }

    if (!image.hasAttribute("role")) {
      image.setAttribute("role", "button");
    }

    if (!image.hasAttribute("aria-label")) {
      const alt = image.getAttribute("alt");
      image.setAttribute("aria-label", alt ? `${alt}. Open enlarged view.` : "Open enlarged image view");
    }

    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        zoom.open({ target: image });
      }
    });
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeMediumZoom, { once: true });
} else {
  initializeMediumZoom();
}
