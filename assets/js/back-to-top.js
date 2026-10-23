(() => {
  addBackToTop();
  const control = document.getElementById("back-to-top");
  if (!control) return;

  control.setAttribute("role", "button");
  control.setAttribute("aria-label", "Back to top");
  control.querySelector("svg")?.setAttribute("aria-hidden", "true");

  const updateAccessibility = () => {
    const hidden = control.classList.contains("hidden");
    control.setAttribute("tabindex", hidden ? "-1" : "0");
    control.setAttribute("aria-hidden", String(hidden));
  };
  updateAccessibility();
  window.addEventListener("scroll", updateAccessibility, { passive: true });

  control.addEventListener("keydown", (event) => {
    if (control.classList.contains("hidden") || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    control.click();
  });
})();
