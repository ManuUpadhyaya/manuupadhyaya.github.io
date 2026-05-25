const setupTables = () => {
  document.querySelectorAll("table").forEach((table) => {
    table.classList.toggle("table-dark", determineComputedTheme() == "dark");

    // only select tables that are not inside an element with "news" (about page) or "card" (cv page) class
    if (
      !table.closest('[class*="news"]') &&
      !table.closest('[class*="card"]') &&
      !table.closest('[class*="archive"]') &&
      !table.closest("code")
    ) {
      table.setAttribute("data-toggle", "table");
      table.classList.add("table-hover");
    }
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupTables);
} else {
  setupTables();
}
