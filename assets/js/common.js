const setupCommon = () => {
  const syncDisclosureState = (entry) => {
    entry?.querySelectorAll(".links button[aria-controls]").forEach(function (control) {
      const panel = document.getElementById(control.getAttribute("aria-controls"));
      control.setAttribute("aria-expanded", panel?.classList.contains("open") ? "true" : "false");
    });
  };

  // add toggle functionality to abstract, award and bibtex buttons
  document.querySelectorAll("button.abstract-toggle").forEach(function (control) {
    control.addEventListener("click", function () {
      const entry = control.parentElement?.parentElement;

      entry?.querySelectorAll(".abstract.hidden").forEach((element) => element.classList.toggle("open"));
      entry?.querySelectorAll(".award.hidden.open, .bibtex.hidden.open").forEach((element) => element.classList.remove("open"));
      syncDisclosureState(entry);
    });
  });
  document.querySelectorAll("button.award-toggle").forEach(function (control) {
    control.addEventListener("click", function () {
      const entry = control.parentElement?.parentElement;

      entry?.querySelectorAll(".abstract.hidden.open, .bibtex.hidden.open").forEach((element) => element.classList.remove("open"));
      entry?.querySelectorAll(".award.hidden").forEach((element) => element.classList.toggle("open"));
      syncDisclosureState(entry);
    });
  });
  document.querySelectorAll("button.bibtex-toggle").forEach(function (control) {
    control.addEventListener("click", function () {
      const entry = control.parentElement?.parentElement;

      entry?.querySelectorAll(".abstract.hidden.open, .award.hidden.open").forEach((element) => element.classList.remove("open"));
      entry?.querySelectorAll(".bibtex.hidden").forEach((element) => element.classList.toggle("open"));
      syncDisclosureState(entry);
    });
  });
  document.querySelectorAll("button.video-toggle").forEach(function (control) {
    control.addEventListener("click", function () {
      const entry = control.parentElement?.parentElement;

      entry
        ?.querySelectorAll(".abstract.hidden.open, .award.hidden.open, .bibtex.hidden.open")
        .forEach((element) => element.classList.remove("open"));
      entry?.querySelectorAll(".video.hidden").forEach((element) => element.classList.toggle("open"));
      syncDisclosureState(entry);
    });
  });
  document.querySelectorAll("a").forEach(function (link) {
    link.classList.remove("waves-effect", "waves-light");
  });

  // bootstrap-toc
  if (document.getElementById("toc-sidebar") && window.jQuery && window.Toc) {
    // remove related publications years from the TOC
    document.querySelectorAll(".publications h2").forEach(function (heading) {
      heading.setAttribute("data-toc-skip", "");
    });
    var navSelector = "#toc-sidebar";
    var $myNav = window.jQuery(navSelector);
    Toc.init($myNav);
    if (typeof window.jQuery(document.body).scrollspy === "function") {
      window.jQuery("body").scrollspy({
        target: navSelector,
      });
    }
  }

  const jupyterTheme = determineComputedTheme();
  const cssLink = document.createElement("link");
  cssLink.href = "../css/jupyter.css";
  cssLink.rel = "stylesheet";
  cssLink.type = "text/css";

  document.querySelectorAll(".jupyter-notebook-iframe-container iframe").forEach(function (iframe) {
    try {
      iframe.contentDocument?.head?.appendChild(cssLink.cloneNode());
    } catch {}

    if (jupyterTheme == "dark") {
      iframe.addEventListener("load", function () {
        try {
          iframe.contentDocument?.body?.setAttribute("data-jp-theme-light", "false");
          iframe.contentDocument?.body?.setAttribute("data-jp-theme-name", "JupyterLab Dark");
        } catch {}
      });
    }
  });

  // trigger popovers
  if (window.jQuery && typeof window.jQuery.fn.popover === "function") {
    window.jQuery('[data-toggle="popover"]').popover({
      trigger: "hover",
    });
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupCommon);
} else {
  setupCommon();
}
