(() => {
  document.querySelectorAll(".software-stat[data-software-stat-source]").forEach(async (stat) => {
    const value = stat.querySelector(".software-stat-value");
    if (!value) return;

    value.textContent = "—";
    value.setAttribute("aria-label", "Count unavailable");
    if (typeof fetch !== "function") return;

    try {
      const response = await fetch(stat.dataset.softwareStatSource);
      if (!response.ok) return;
      const data = await response.json();
      // Shields already supplies compact counts; reject its error messages.
      if (typeof data?.message !== "string" || !/^\d+(?:\.\d+)?[kMGTPEZY]?$/i.test(data.message)) return;
      value.textContent = data.message;
      value.removeAttribute("aria-label");
    } catch {
      // The project links remain useful when a statistics source is unavailable.
    }
  });
})();
