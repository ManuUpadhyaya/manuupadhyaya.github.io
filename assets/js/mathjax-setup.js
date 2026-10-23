window.MathJax = {
  loader: {
    load: ["[tex]/mathtools", "[tex]/boldsymbol"],
  },
  tex: {
    tags: "ams",
    packages: { "[+]": ["mathtools", "boldsymbol"] },
    macros: {
      eqref: ["(\\ref{#1})", 1],
      norm: ["\\lVert#1\\rVert", 1],
      inner: ["\\langle #1, #2 \\rangle", 2],
      Bignorm: ["\\left\\lVert#1\\right\\rVert", 1],
      Biginner: ["\\left\\langle #1, #2 \\right\\rangle", 2],
    },
    preFilters: [
      ({ math }) => {
        const parent = math.start.node?.parentElement;
        if (!parent || parent.closest(".publications") || math.inputData.bolded) return;
        const bodyWeight = Number(window.getComputedStyle(document.body).fontWeight);
        if (Number(window.getComputedStyle(parent).fontWeight) > bodyWeight) {
          math.math = `\\boldsymbol{${math.math}}`;
          math.inputData.bolded = true;
        }
      },
    ],
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
  },
  output: {
    font: "mathjax-newcm",
    scale: 0.92,
    fontPath: "https://cdn.jsdelivr.net/npm/@mathjax/%%FONT%%-font@4.1.3",
    mtextInheritFont: true,
    displayOverflow: "scroll",
    linebreaks: {
      inline: false,
    },
  },
  chtml: {
    matchFontHeight: false,
  },
  startup: {
    ready() {
      const startup = window.MathJax.startup;
      startup.defaultReady();

      const output = startup.document.outputJax;
      const scale = output.options.scale;
      // Keep inherited prose at body size when mathematical symbols are scaled.
      const proseVariants = new Set(["normal", "bold", "italic", "bold-italic"]);
      output.preFilters.add(({ math }) => {
        const parent = math.start.node?.parentElement;
        const bodyWeight = Number(window.getComputedStyle(document.body).fontWeight);
        const boldContext = parent && !parent.closest(".publications") && Number(window.getComputedStyle(parent).fontWeight) > bodyWeight;
        math.root.walkTree((node) => {
          const variant = node.attributes?.get("mathvariant");
          if (!node.isKind("mtext") || !proseVariants.has(variant)) {
            return;
          }
          if (boldContext && (variant === "normal" || variant === "italic")) {
            node.attributes.set("mathvariant", variant === "italic" ? "bold-italic" : "bold");
          }
          if (scale !== 1 && node.attributes.get("scriptlevel") === 0 && node.attributes.getExplicit("mathsize") === undefined) {
            node.attributes.set("mathsize", `${100 / scale}%`);
          }
        });
      });
    },
  },
  options: {
    renderActions: {
      addCss: [
        200,
        function (doc) {
          const style = document.createElement("style");
          style.innerHTML = `
          .mjx-container {
            color: inherit;
          }
        `;
          document.head.appendChild(style);
        },
        "",
      ],
    },
  },
};
