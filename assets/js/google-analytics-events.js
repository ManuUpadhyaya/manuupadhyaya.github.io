const trackAnalyticsEvent = (eventName, params) => {
  if (typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, params);
};

const normalizeLinkText = (text) => {
  if (!text) {
    return "";
  }

  return text.replace(/\s+/g, " ").trim().slice(0, 100);
};

const getLinkArea = (anchor) => {
  if (anchor.closest(".social")) {
    return "social";
  }

  if (window.location.pathname.startsWith("/software/")) {
    return "software";
  }

  if (window.location.pathname.startsWith("/publications/") || anchor.closest(".bibliography")) {
    return "publications";
  }

  return "general";
};

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const anchor = event.target.closest("a[href]");

  if (!anchor) {
    return;
  }

  const href = anchor.getAttribute("href");

  if (!href) {
    return;
  }

  const normalizedHref = href.trim();

  if (normalizedHref === "" || normalizedHref.startsWith("#") || normalizedHref.toLowerCase().startsWith("javascript:")) {
    return;
  }

  const linkText = normalizeLinkText(anchor.textContent || anchor.getAttribute("title") || anchor.getAttribute("aria-label"));
  const sharedParams = {
    link_text: linkText,
    link_area: getLinkArea(anchor),
    page_path: window.location.pathname,
  };

  if (normalizedHref.toLowerCase().startsWith("mailto:")) {
    trackAnalyticsEvent("email_click", {
      ...sharedParams,
    });
    return;
  }

  let url;

  try {
    url = new URL(anchor.href, window.location.origin);
  } catch {
    return;
  }

  const normalizedPath = url.pathname.toLowerCase();

  if (normalizedPath.endsWith("/share/cv.pdf")) {
    trackAnalyticsEvent("cv_download", {
      ...sharedParams,
      file_name: normalizedPath.split("/").pop(),
      link_url: `${url.origin}${url.pathname}`,
    });
    return;
  }

  if (!/^https?:$/.test(url.protocol) || url.origin === window.location.origin) {
    return;
  }

  const outboundParams = {
    ...sharedParams,
    link_domain: url.hostname,
    link_url: `${url.origin}${url.pathname}`,
  };

  if (sharedParams.link_area === "publications") {
    trackAnalyticsEvent("publication_outbound_click", outboundParams);
    return;
  }

  if (sharedParams.link_area === "software") {
    trackAnalyticsEvent("software_outbound_click", outboundParams);
    return;
  }

  trackAnalyticsEvent("outbound_link_click", outboundParams);
});
