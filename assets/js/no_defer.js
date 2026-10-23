const setupTables = () => {
  document.querySelectorAll("table").forEach((table) => {
    table.classList.toggle("table-dark", determineComputedTheme() == "dark");

    // Keep tables inside news, cards, archives, and code outside the interactive table styling.
    if (!table.closest('[class*="news"]') && !table.closest('[class*="card"]') && !table.closest('[class*="archive"]') && !table.closest("code")) {
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
