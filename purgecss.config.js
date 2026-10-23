module.exports = {
  content: ["_site/**/*.html", "_site/**/*.js", "_site/**/*.mjs"],
  css: ["_site/assets/css/*.css"],
  output: "_site/assets/css/",
  skippedContentGlobs: ["_site/assets/**/*.html"],
  // MathJax creates these prose text containers only after the page loads.
  // Keep each complete selector, including its dynamic style/variant attributes.
  safelist: { greedy: [/^mjx-(?:mtext|measure-text)$/] },
};
