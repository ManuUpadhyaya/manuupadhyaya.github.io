// Initialize medium zoom without requiring jQuery.
const initializeMediumZoom = () => {
  const zoomableImages = Array.from(document.querySelectorAll("[data-zoomable]"));

  if (zoomableImages.length === 0 || typeof mediumZoom !== "function") {
    return;
  }

  const zoomMargin = 16;
  const navbar = document.getElementById("navbar");
  const getZoomContainer = () => {
    const viewportHeight = document.documentElement.clientHeight;
    const navbarBottom = navbar ? Math.ceil(navbar.getBoundingClientRect().bottom) : 0;
    const maximumTopOffset = Math.max(0, viewportHeight - zoomMargin * 2);

    return {
      top: Math.min(Math.max(0, navbarBottom), maximumTopOffset),
    };
  };

  const zoom = mediumZoom(zoomableImages, {
    background: getComputedStyle(document.documentElement).getPropertyValue("--global-bg-color") + "ee",
    container: getZoomContainer(),
    margin: zoomMargin,
  });

  window.medium_zoom = zoom;

  const updateZoomContainer = () => {
    zoom.update({ container: getZoomContainer() });
  };

  window.addEventListener("resize", updateZoomContainer, { passive: true });

  if (navbar && typeof ResizeObserver === "function") {
    const navbarResizeObserver = new ResizeObserver(updateZoomContainer);
    navbarResizeObserver.observe(navbar);
  }

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
