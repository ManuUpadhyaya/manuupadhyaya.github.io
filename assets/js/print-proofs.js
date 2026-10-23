// Expand article disclosures only for printing, then restore the reader's choices.
(() => {
  let savedStates = null;

  function expandForPrint() {
    // Both lifecycle APIs can announce the same print session.
    if (savedStates !== null) return;
    savedStates = Array.from(document.querySelectorAll(".post .post-content details"), (detail) => [detail, detail.open]);
    for (const [detail] of savedStates) detail.open = true;
  }

  function restoreAfterPrint() {
    if (savedStates === null) return;
    for (const [detail, wasOpen] of savedStates) detail.open = wasOpen;
    savedStates = null;
  }

  window.addEventListener("beforeprint", expandForPrint);
  window.addEventListener("afterprint", restoreAfterPrint);

  if (typeof window.matchMedia === "function") {
    const printMedia = window.matchMedia("print");
    const handlePrintMedia = (event) => {
      if (event.matches) expandForPrint();
      else restoreAfterPrint();
    };
    if (typeof printMedia.addEventListener === "function") {
      printMedia.addEventListener("change", handlePrintMedia);
    } else if (typeof printMedia.addListener === "function") {
      printMedia.addListener(handlePrintMedia);
    }
    if (printMedia.matches) expandForPrint();
  }
})();
