# Repository guidance

## Mathematical blog typography

These are the user's preferences for mathematical blog posts, including `_posts/2026-10-12-computer-aided-lyapunov-analyses-in-optimization.md`.

- Prefer explicit mathematical symbols and expressions to descriptions using only words when they improve clarity. Combine names with their expressions where helpful, especially when introducing quantities, for example squared distance `\|x^k-x^\star\|^2` and function-value suboptimality `f(x^k)-f(x^\star)`.
- Align matrix entries by their unsigned expressions, as if literal leading minus signs did not affect their positions. In columns containing leading minuses, reserve an invisible minus slot with `\phantom{-}` for entries without a leading minus, including zeros, ones, and symmetry stars. Preserve safe spacing between signs, neighboring columns, and brackets; check large matrices against the text width.
- Give connective text in displays, such as “and,” “or,” “as,” “such that,” and “for each,” equal visible space on both sides when it sits between mathematical expressions. Row-leading or row-ending text naturally needs separation only on the side containing mathematics.
- Verify the rendered spacing, not just the TeX commands. MathJax can add automatic spacing beside matrix atoms, operators, or punctuation even when the explicit spacing commands match. Inspect the visible result and measure gaps when necessary.
- Use `\tfrac` for fractions. Keep textual mathematical operators and words in the same font as the surrounding prose.
- Keep each complete equality or inequality on one rendered line where practical. Break between complete equalities when needed, and do not insert line breaks inside norms. Preserve readability and text-width fit without reducing the mathematical font size merely to force a display to fit.
- Use parentheses for mathematical grouping. Keep square brackets for structural notation such as matrices, intervals, and systems of conditions.
- Align related multirow definitions at their equality signs within one shared display. Use fixed columns for paired matrix/vector definitions, preserve complete equalities on each row, and check the combined width in the rendered page.
