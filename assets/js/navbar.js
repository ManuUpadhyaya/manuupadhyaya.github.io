(() => {
  const transitionDuration = 350;

  const getSelector = (trigger) => trigger.getAttribute("data-target") || trigger.getAttribute("href");

  const getTarget = (trigger) => {
    const selector = getSelector(trigger);

    if (!selector || selector === "#") {
      return null;
    }

    try {
      return document.querySelector(selector);
    } catch {
      return null;
    }
  };

  const setExpanded = (trigger, isExpanded) => {
    trigger.classList.toggle("collapsed", !isExpanded);
    trigger.setAttribute("aria-expanded", isExpanded ? "true" : "false");
  };

  const showCollapse = (target, trigger) => {
    if (target.classList.contains("show") || target.classList.contains("collapsing")) {
      return;
    }

    setExpanded(trigger, true);
    target.classList.remove("collapse");
    target.classList.add("collapsing");
    target.style.height = "0px";

    window.requestAnimationFrame(() => {
      target.style.height = `${target.scrollHeight}px`;
    });

    window.setTimeout(() => {
      target.classList.remove("collapsing");
      target.classList.add("collapse", "show");
      target.style.height = "";
    }, transitionDuration);
  };

  const hideCollapse = (target, trigger) => {
    if (!target.classList.contains("show") || target.classList.contains("collapsing")) {
      return;
    }

    setExpanded(trigger, false);
    target.style.height = `${target.getBoundingClientRect().height}px`;
    target.offsetHeight;
    target.classList.remove("collapse", "show");
    target.classList.add("collapsing");
    target.style.height = "";

    window.setTimeout(() => {
      target.classList.remove("collapsing");
      target.classList.add("collapse");
    }, transitionDuration);
  };

  const toggleCollapse = (trigger) => {
    const target = getTarget(trigger);

    if (!target) {
      return;
    }

    if (target.classList.contains("show")) {
      hideCollapse(target, trigger);
    } else {
      showCollapse(target, trigger);
    }
  };

  const closeDropdown = (dropdown) => {
    const toggle = dropdown.querySelector('[data-toggle="dropdown"]');
    const menu = dropdown.querySelector(".dropdown-menu");

    dropdown.classList.remove("show");
    toggle?.classList.remove("show");
    toggle?.setAttribute("aria-expanded", "false");
    menu?.classList.remove("show");
  };

  const closeOtherDropdowns = (activeDropdown) => {
    document.querySelectorAll(".dropdown.show").forEach((dropdown) => {
      if (dropdown !== activeDropdown) {
        closeDropdown(dropdown);
      }
    });
  };

  document.addEventListener("click", (event) => {
    const collapseTrigger = event.target.closest('[data-toggle="collapse"]');

    if (collapseTrigger) {
      event.preventDefault();
      toggleCollapse(collapseTrigger);
      return;
    }

    const dropdownToggle = event.target.closest('[data-toggle="dropdown"]');

    if (dropdownToggle) {
      event.preventDefault();
      const dropdown = dropdownToggle.closest(".dropdown");
      const menu = dropdown?.querySelector(".dropdown-menu");
      const isOpen = dropdown?.classList.contains("show") ?? false;

      if (!dropdown || !menu) {
        return;
      }

      closeOtherDropdowns(dropdown);
      dropdown.classList.toggle("show", !isOpen);
      dropdownToggle.classList.toggle("show", !isOpen);
      dropdownToggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
      menu.classList.toggle("show", !isOpen);
      return;
    }

    if (!event.target.closest(".dropdown-menu")) {
      closeOtherDropdowns(null);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    closeOtherDropdowns(null);
  });
})();
