---
layout: post
title: Computer-aided Lyapunov analyses in optimization
date: 2026-10-23
last_modified_at: 2026-10-23
seo_description: Computer-aided Lyapunov analyses of gradient methods with inexact gradients and memory using interpolation inequalities and semidefinite feasibility.
math: true
math_cooperative: true
math_font_preparation: true
local_roboto: true
published: true
latex_citations: true
citation_doi: 10.5281/zenodo.23521024
citation_url: https://manuupadhyaya.github.io/blog/computer-aided-lyapunov-analyses-in-optimization/
citation_author_orcid: https://orcid.org/0000-0002-8235-0789
license: https://creativecommons.org/licenses/by/4.0/
toc:
  inline: true
_styles: |
  #table-of-contents {
    margin: 1.5rem 0 2rem;
  }
  #table-of-contents .section-nav {
    list-style: none;
    padding-left: 0;
  }
  .numerical-solver-note {
    font-size: 0.85em;
    color: var(--global-text-color-light);
  }
  .proof-disclosure {
    margin: -0.25rem 0 1rem;
  }
  .proof-disclosure > summary {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    width: fit-content;
    min-height: 28px;
    padding: 0;
    font-size: 0.9em;
    color: var(--global-text-color-light);
    cursor: pointer;
    list-style: none;
  }
  .proof-disclosure > summary::-webkit-details-marker {
    display: none;
  }
  .proof-disclosure > summary::before {
    content: "";
    width: 0.4em;
    height: 0.4em;
    flex: none;
    border-right: 1px solid currentColor;
    border-bottom: 1px solid currentColor;
    transform: rotate(-45deg);
  }
  .proof-disclosure[open] > summary::before {
    transform: rotate(45deg);
  }
  .proof-disclosure > summary:hover {
    color: var(--global-text-color);
  }
  .proof-disclosure > summary > .proof-hide,
  .proof-disclosure[open] > summary > .proof-show {
    display: none;
  }
  .proof-disclosure[open] > summary > .proof-hide {
    display: inline;
  }
  .proof-disclosure > summary:focus-visible {
    outline: 2px solid var(--global-theme-color);
    outline-offset: 2px;
    border-radius: 2px;
  }
  .proof-disclosure > .proof-content {
    margin-top: 0.5rem;
    padding: 1rem 1.25rem;
    background: var(--global-code-bg-color);
    border-radius: 4px;
  }
  .interpolation-derivation > .proof-content {
    padding-inline: 0.5rem;
  }
  .memory-interpolation-derivation {
    margin: 0 0 1rem;
    padding: 0.5rem 0.375rem;
    border: 1px solid var(--global-divider-color);
    border-radius: 4px;
    background: var(--global-bg-color);
  }
  .memory-interpolation-derivation > .proof-content {
    padding: 0.5rem 0 0;
    background: transparent;
  }
  .proof-disclosure > .proof-content > :last-child,
  .proof-disclosure > .proof-content > :last-child mjx-container[display="true"] {
    margin-bottom: 0;
  }
  .interpolation-theorem {
    margin: 1.25rem 0;
    padding: 1rem 1.25rem;
    background: var(--global-code-bg-color);
    border-radius: 4px;
  }
  .interpolation-theorem > :last-child {
    margin-bottom: 0;
  }
  @media (pointer: coarse) {
    .proof-disclosure > summary {
      min-height: 44px;
    }
  }
  .function-assumptions {
    list-style: none;
    margin: 0.75rem 0 1.25rem;
    padding-left: 1.25rem;
  }
  .function-assumptions > li {
    position: relative;
    padding-left: 0.4rem;
    margin-bottom: 0.75rem;
  }
  .function-assumptions > li::before {
    content: "";
    position: absolute;
    top: 0.68rem;
    left: -0.9rem;
    width: 0.32rem;
    height: 0.32rem;
    background: var(--global-text-color-light);
    transform: rotate(45deg);
  }
  .quadratic-bounds-figure {
    max-width: 620px;
    margin: 1.75rem auto;
  }
  .quadratic-bounds-figure .caption {
    text-align: left;
  }
  .quadratic-bounds-control {
    cursor: grab;
    touch-action: none;
    outline: none;
  }
  .quadratic-bounds-halo {
    opacity: 0;
  }
  .quadratic-bounds-control:focus-visible .quadratic-bounds-halo,
  .quadratic-bounds-control.is-dragging .quadratic-bounds-halo {
    opacity: 0.6;
  }
  .quadratic-bounds-control.is-dragging {
    cursor: grabbing;
  }
  @media (hover: hover) {
    .quadratic-bounds-control:hover .quadratic-bounds-halo {
      opacity: 0.6;
    }
  }
  .two-step-methods {
    max-width: 660px;
    margin: 1.5rem auto;
  }
  .two-step-methods table {
    width: 100%;
    min-width: 600px;
    border-collapse: collapse;
  }
  .two-step-methods th,
  .two-step-methods td {
    padding: 0.65rem 0.75rem;
    vertical-align: middle;
    text-align: center;
  }
  .two-step-methods thead {
    border-bottom: 1px solid var(--global-text-color);
  }
  .two-step-methods th:not(:first-child) {
    font-weight: var(--body-font-weight);
  }
  .two-step-methods th:first-child,
  .two-step-methods td:first-child {
    padding-left: 0;
    text-align: left;
  }
  .two-step-methods td:not(:first-child) {
    white-space: nowrap;
  }
  .function-gap-multipliers {
    margin-block: 1.25rem;
  }
  .function-gap-multipliers table {
    width: auto;
    border-collapse: collapse;
    margin: 0 auto;
    font: inherit;
  }
  .function-gap-multipliers th,
  .function-gap-multipliers td {
    padding: 0.55rem 0.35rem;
    text-align: center;
    vertical-align: middle;
    font: inherit;
    white-space: nowrap;
  }
  .function-gap-multipliers thead {
    border-bottom: 1px solid var(--global-text-color);
  }
scholar:
  bibliography: lyapunov-blog.bib
  bibliography_template: blog-reference
  bibliography_class: post-references
  style: assets/bibliography/alpha-citations.csl
  sort_by: author
  order: ascending
  group_by: none
---

Many convergence proofs for first-order methods in optimization follow a common pattern: construct a Lyapunov function, establish an inequality describing its decrease, and use this inequality to show that a performance measure converges to zero. Within many standard problem classes and prescribed families of Lyapunov functions, these tasks can often be formulated exactly as semidefinite programs (SDPs). Existing solvers can then be used to search numerically for feasible solutions. Convergence analysis itself thus becomes a tractable optimization problem.

Closely related is the performance estimation problem (PEP) methodology, introduced by Drori and Teboulle \cite{DT14}. For many first-order methods and problem classes, the search for a worst-case example can be reformulated as an SDP, giving tight worst-case guarantees \cite{THG17}. The standard PEP methodology is now a mature technology for worst-case analysis, supported by software packages such as [PEPit](https://pepit.readthedocs.io/) \cite{GMG24}.

However, standard PEP formulations analyze a fixed number of iterations, with the number of variables and constraints typically growing quadratically with this horizon. Deriving closed-form guarantees valid for all iterations can also be challenging. Automated Lyapunov analyses provide a complementary approach: restricting the search to prescribed families of Lyapunov analyses can give smaller SDPs whose number of variables and constraints is independent of the iteration horizon, or grows only linearly with it, facilitating concise, closed-form convergence proofs \nocite{TVSL18,TB19,UBTG25,UDGT26}[<a href="#TVSL18">TVSL18</a>, <a href="#TB19">TB19</a>, <a href="#UBTG25">UBTG25</a>, <a href="#UDGT26">UDGT+26</a>]. A closely related framework uses integral quadratic constraints (IQCs), developed in robust control \cite{MR97}, to obtain convergence guarantees through linear matrix inequalities (LMIs) that can be checked by semidefinite programming \nocite{LRP16,MSE21}[<a href="#LRP16">LRP16</a>, <a href="#MSE21">MSE21</a>]. Although searching over prescribed families of Lyapunov functions may give conservative bounds, these bounds can still match the actual worst-case behavior in many settings.

In this post, we derive the corresponding SDPs explicitly for two examples: an inexact gradient method, for which the Lyapunov function is fixed in advance, and a gradient method with memory, for which we search for a Lyapunov function within a prescribed family.
The aim is to explain the main ideas in a simple setting and provide a starting point for analyses of other methods and problem classes. For the first example, we also show how to extract a closed-form proof of a tight convergence guarantee from numerical SDP solutions. In the second example, we show how allowing a more flexible class of Lyapunov functions can give tighter convergence guarantees. This post assumes familiarity with smooth and strongly convex optimization, basic matrix algebra, and Lagrangian duality. On a first reading, the expandable derivations and proofs can be skipped.

<!-- table-of-contents -->

#### 1. Problem setting
{: #problem-setting aria-level="2"}

For simplicity, both examples use the familiar setting of smooth and strongly convex optimization, although the tools developed here apply more broadly. We consider the unconstrained problem

<div class="math">
\begin{equation}
\label{eq:optimization-problem}
\mathop{\text{minimize}}\limits_{x \in \mathbb{R}^d}\; f(x)
\end{equation}
</div>

where $$f:\mathbb{R}^d\to\mathbb{R}$$ is differentiable, has an $$L$$-Lipschitz continuous gradient (that is, $$f$$ is $$L$$-smooth), and is $$\mu$$-strongly convex, with $$0<\mu<L$$. We denote this class of functions by $$\mathcal{F}_{\mu,L}(\mathbb{R}^d)$$. Equivalently, $$f$$ satisfies

<div class="math">
\begin{equation}
\label{eq:quadratic-bounds}
(\forall x,y\in\mathbb{R}^{d})\qquad
\left[
\begin{aligned}
f(x)
&\leqslant
f(y)+\langle\nabla f(y),x-y\rangle +\tfrac{L}{2}\lVert x-y\rVert^{2},\\
f(x)
&\geqslant
f(y)+\langle\nabla f(y),x-y\rangle +\tfrac{\mu}{2}\lVert x-y\rVert^{2},
\end{aligned}
\right.
\end{equation}
</div>

where $$\langle\cdot,\cdot\rangle$$ is the Euclidean inner product and $$\lVert\cdot\rVert$$ is its induced norm. For the quadratic bounds above, see \nocite{Bec17}[<a href="#Bec17">Bec17</a>, Theorems 5.8(ii) and 5.24(ii)]. Strong convexity ensures that problem $$\eqref{eq:optimization-problem}$$ has a unique minimizer $$x^\star\in\mathbb{R}^{d}$$, characterized by $$\nabla f(x^\star)=0$$ \nocite{Bec17}[<a href="#Bec17">Bec17</a>, Theorems 3.63 and 5.25(a)]. Figure 1 illustrates these inequalities geometrically, showing how $$f$$ is globally bounded above and below by quadratic functions tangent to it at any chosen point.

{% capture quadratic_bounds_caption %}
<strong>Figure 1:</strong> Every function \(f\in\mathcal{F}_{\mu,L}(\mathbb{R}^d)\) has a global quadratic minorizer and majorizer tangent to \(f\) at each \(x\in\mathbb{R}^{d}\), with curvatures \(\mu\) and \(L\), respectively.
{% endcapture %}

<div class="quadratic-bounds-figure" data-quadratic-bounds>
{% include figure.liquid
  path="assets/img/posts/quadratic-bounds.svg"
  alt="A function with tangent quadratic lower and upper bounds at the point x."
  class="img-fluid d-block mx-auto"
  width="520"
  height="277"
  cache_bust=true
  caption=quadratic_bounds_caption
%}
</div>

<script type="module" src="{{ '/assets/js/quadratic-bounds.js' | relative_url | bust_file_cache }}"></script>

#### 2. Fixed Lyapunov functions
{: #fixed-lyapunov-functions aria-level="2"}

Here we check a Lyapunov function chosen in advance, then use the tools developed here to search for one in [Section 3](#searching-for-lyapunov-functions).

##### 2.1 The gradient method with inexact gradients
{: #the-gradient-method-with-inexact-gradients aria-level="3"}

The standard gradient method provides a familiar starting point; here, we consider a slightly richer variant with inexact gradients. Given a constant step size $$\gamma>0$$ and an initial point $$x^{0}\in\mathbb{R}^{d}$$, consider

<div class="math">
\begin{equation}
\label{eq:relatively-inexact-gradient-method}
\left[
\begin{aligned}
&\text{Pick }d^{k}\in\mathbb{R}^{d}\;\text{such that}\;  \|\nabla f(x^{k}) - d^{k}\| \leqslant \varepsilon \|\nabla f(x^{k})\|,\\
&x^{k+1} = x^{k} - \gamma d^{k},
\end{aligned}
\right.
\end{equation}
</div>

where $$\varepsilon\in[0,1)$$ bounds the relative error in the gradient approximation. We seek convergence guarantees that hold for every sequence of approximations $$d^k$$ satisfying this bound. When $$\varepsilon=0$$, we recover the standard gradient method.

##### 2.2 Lyapunov functions and contraction
{: #lyapunov-functions-and-contraction aria-level="3"}

To quantify convergence, we track a nonnegative scalar quantity such as squared distance to the solution $$\|x^{k}-x^{\star}\|^2$$ or function-value suboptimality $$f(x^{k})-f(x^{\star})$$. We call such a quantity a performance measure. Under the standing assumptions, it is natural to seek bounds of the form
<div class="math">
\begin{equation}
\label{eq:contraction-examples}
\|x^{k+1}-x^{\star}\|^2 \leqslant \rho_{\mathtt{norm}^2}(\gamma,\varepsilon,\mu,L)\|x^{k}-x^{\star}\|^2
\quad\text{or}\quad
f(x^{k+1})-f(x^{\star}) \leqslant \rho_{\mathtt{func}}(\gamma,\varepsilon,\mu,L)(f(x^{k})-f(x^{\star})),
\end{equation}
</div>
and to determine which choices of $$\gamma$$ ensure that the corresponding factors satisfy
<div class="math">
\begin{equation*}
0\leqslant \rho_{\mathtt{norm}^2}(\gamma,\varepsilon,\mu,L) < 1 \quad\text{and}\quad 0\leqslant \rho_{\mathtt{func}}(\gamma,\varepsilon,\mu,L) < 1.
\end{equation*}
</div>
In these examples, we use the performance measure itself as a Lyapunov function, establishing convergence by proving a contraction inequality for that same quantity.
More generally, we consider nonnegative and nontrivial Lyapunov functions $$\mathcal{V}$$ satisfying
<div class="math">
\begin{equation}
\label{eq:lyapunov-contraction}
\mathcal{V}(k+1) \leqslant \rho(\gamma,\varepsilon,\mu,L)\mathcal{V}(k),
\end{equation}
</div>
and seek conditions ensuring $$0\leqslant\rho(\gamma,\varepsilon,\mu,L)<1$$. Iterating the contraction inequality \eqref{eq:lyapunov-contraction} gives
<div class="math">
\begin{equation*}
\mathcal{V}(k)\leqslant\rho(\gamma,\varepsilon,\mu,L)^{k}\mathcal{V}(0)
\quad\Longrightarrow\quad
\mathcal{V}(k)\in\mathcal{O}(\rho(\gamma,\varepsilon,\mu,L)^{k})
\quad\text{as}\quad k\to\infty,
\end{equation*}
</div>
and we say that $$\mathcal{V}$$ converges linearly to zero with rate at most $$\rho(\gamma,\varepsilon,\mu,L)$$. In particular, we seek the smallest factor for which \eqref{eq:lyapunov-contraction} holds.

We build on squared distance $$\|x^{k}-x^{\star}\|^2$$ and function-value suboptimality $$f(x^{k})-f(x^{\star})$$ in $$\eqref{eq:contraction-examples}$$ by also using gradient information. Including the squared gradient norm $$\|\nabla f(x^{k})\|^2$$ and the inner product $$\langle x^{k}-x^{\star},\nabla f(x^{k})\rangle$$ allows us to account for the gradient's magnitude and its alignment with $$x^{k}-x^{\star}$$. We therefore consider the family
<div class="math">
\begin{align*}
\mathcal{V}(k)
&= Q_{1,1}\norm{x^{k}-x^{\star}}^{2}
+2Q_{1,2}\inner{x^{k}-x^{\star}}{\nabla f(x^{k})}
+Q_{2,2}\norm{\nabla f(x^{k})}^{2}
+q(f(x^{k})-f(x^{\star})),
\end{align*}
</div>
where $$Q=(Q_{i,j})_{1\leqslant i,j\leqslant2}\in\mathbb{R}^{2\times2}$$ is symmetric and $$q\in\mathbb{R}$$.

For fixed $$Q$$ and $$q$$, $$\mathcal{V}$$ is linear in the squared norms, inner products, and function-value differences that become variables of the SDP derived in [Section 2.3](#optimal-contraction-via-semidefinite-programming). More general mixed terms need not admit a linear representation in those variables. For that derivation, we group the two vectors $$x^{k}-x^{\star}$$ and $$\nabla f(x^{k})$$ and write
<div class="math">
\begin{align*}
\mathcal{V}(k)
&= \inner{(x^{k}-x^{\star},\nabla f(x^{k}))}{(Q \otimes I_{d})(x^{k}-x^{\star},\nabla f(x^{k}))} + q(f(x^{k})-f(x^{\star})),
\end{align*}
</div>
where $$\otimes$$ is the Kronecker product and $$I_{d}$$ is the identity matrix in $$\mathbb{R}^{d\times d}$$.

Here, we fix $$Q$$ and $$q$$ so that $$\mathcal{V}$$ is nonnegative and nontrivial. The two cases in $$\eqref{eq:contraction-examples}$$ correspond to
<div class="math">
\begin{align}
\label{eq:lyapunov-examples}
\mathcal{V}(k)
&= \begin{cases}
\norm{x^{k}-x^{\star}}^{2},
&\text{if } Q=\mathord{\begin{bmatrix}1&0\\0&0\end{bmatrix}}\;\text{and}\; q=0,\\[0.5em]
f(x^{k})-f(x^{\star}),
&\text{if } Q=0\;\text{and}\; q=1.
\end{cases}
\end{align}
</div>

##### 2.3 Optimal contraction via semidefinite programming
{: #optimal-contraction-via-semidefinite-programming aria-level="3"}

<span id="verifying-contraction-via-semidefinite-feasibility"></span>

To verify $$\eqref{eq:lyapunov-contraction}$$ along every trajectory, it suffices to consider one step from an arbitrary point $$x^{k}$$. The update rule and the coefficients $$Q$$ and $$q$$ are the same at every iteration, and any such step can be realized as the first step by setting $$x^{0}=x^{k}$$. We therefore define the optimal one-step contraction factor by

<div class="math">
\begin{equation*}
\rho_d^{\star}(Q,q,\gamma,\varepsilon,\mu,L)
=\inf\left\{
\rho\in\mathbb{R}\;\middle|\;
\begin{array}{l}
\mathcal{V}(k+1)\leqslant\rho\mathcal{V}(k)\\
\text{for every }f\in\mathcal{F}_{\mu,L}(\mathbb{R}^{d})
\;\text{and}\; x^{k},d^{k}\in\mathbb{R}^{d}\text{ with}\\
x^{k+1}=x^{k}-\gamma d^{k}\quad\text{and}\quad
\|\nabla f(x^{k})-d^{k}\|\leqslant\varepsilon\|\nabla f(x^{k})\|
\end{array}
\right\}.
\end{equation*}
</div>

We will show, step by step, how semidefinite programming gives an upper bound on this quantity and under which conditions the bound equals the optimal one-step contraction factor. We first fix a candidate $$\rho$$ and derive a semidefinite feasibility test, then minimize $$\rho$$ in this test. This feasibility formulation will also let us search for valid Lyapunov functions in [Section 3](#searching-for-lyapunov-functions), where their coefficients become additional variables.

**Worst-case Lyapunov difference.** For a fixed candidate $$\rho$$, we maximize the difference $$\mathcal{V}(k+1)-\rho\mathcal{V}(k)$$ over all admissible functions and updates:

<div class="math">
\begin{equation*}
\mathcal{P}_{d}(Q,q,\gamma,\varepsilon,\mu,L,\rho)
=
\left(
\begin{array}{cl}
\mathop{\text{maximize}}\limits_{\substack{
f\in\mathcal{F}_{\mu,L}(\mathbb{R}^{d})\\
x^{k},x^{k+1},x^{\star},d^{k}\in\mathbb{R}^{d}
}}
& \mathcal{V}(k+1)-\rho\,\mathcal{V}(k)\\[0.3em]
\text{subject to}
& x^{k+1}=x^{k}-\gamma d^{k},\\
& \norm{\nabla f(x^{k})-d^{k}}\leqslant\varepsilon\norm{\nabla f(x^{k})},\\
& \nabla f(x^{\star})=0
\end{array}
\right).
\end{equation*}
</div>

The contraction inequality $$\eqref{eq:lyapunov-contraction}$$ holds for every admissible function and update exactly when $$\mathcal{P}_{d}(Q,q,\gamma,\varepsilon,\mu,L,\rho)\leqslant0$$. The optimal one-step contraction factor is therefore

<div class="math">
\begin{equation*}
\rho_d^{\star}(Q,q,\gamma,\varepsilon,\mu,L)
=\inf\{\rho\in\mathbb{R}\mid\mathcal{P}_{d}(Q,q,\gamma,\varepsilon,\mu,L,\rho)\leqslant0\}.
\end{equation*}
</div>

We next derive a semidefinite test for the condition $$\mathcal{P}_{d}(Q,q,\gamma,\varepsilon,\mu,L,\rho)\leqslant0$$. We will describe the possible function values and gradients using finitely many inequalities, collect vector inner products in a positive semidefinite matrix, and combine these inequalities to certify contraction.

**Encoding inner products with a Gram matrix.** Before we proceed, we introduce some convenient notation.
Let $$\mathbb{S}^{n}$$ and $$\mathbb{S}_{+}^{n}$$ denote the sets of real-valued symmetric and positive semidefinite $$n\times n$$ matrices, respectively.
We define the _Gramian function_ $$\mathtt{Gram}:(\mathbb{R}^{d})^{n}\to\mathbb{S}^{n}_{+}$$ by
<div class="math">
\begin{align*}
(\forall \mathbf{z}=(z_{1},\ldots,z_{n})\in(\mathbb{R}^{d})^{n}) \qquad \mathtt{Gram}(\mathbf{z}) = (\inner{z_i}{z_j})_{1\leqslant i,j \leqslant n}.
\end{align*}
</div>
In particular, $$(\mathtt{Gram}(\mathbf{z}))_{i,i}=\norm{z_i}^{2}$$, so squared norms appear as diagonal entries. With this, we can write the Lyapunov function as
<div class="math">
\begin{align*}
\mathcal{V}(k) = \text{trace}(Q\,\mathtt{Gram}(x^{k}-x^{\star} , \nabla f(x^{k}))) + q(f(x^{k})-f(x^{\star})).
\end{align*}
</div>

For $$A\in\mathbb{R}^{m\times n}$$, $$M\in\mathbb{S}^{m}$$, and $$\mathbf{z}\in(\mathbb{R}^{d})^{n}$$, we will use the identities
<div class="math">
\begin{equation}
\label{eq:gram-trace-identities}
\begin{aligned}
\mathtt{Gram}((A\otimes I_d)\mathbf{z})
&=A\,\mathtt{Gram}(\mathbf{z})A^{\top},\\
\text{trace}\bigl(M\,\mathtt{Gram}((A\otimes I_d)\mathbf{z})\bigr)
&=\text{trace}\bigl(A^{\top}MA\,\mathtt{Gram}(\mathbf{z})\bigr).
\end{aligned}
\end{equation}
</div>
<details class="proof-disclosure">
  <summary><span class="proof-show">Show proof</span><span class="proof-hide">Hide proof</span></summary>
  <div class="proof-content">
    <p>For each \(1\leqslant i,j\leqslant m\), bilinearity of the inner product gives</p>
    <div class="math">
\begin{align*}
(\mathtt{Gram}((A\otimes I_d)\mathbf{z}))_{i,j}
&=\Biginner{\sum_{\ell=1}^{n}A_{i,\ell}z_{\ell}}{\sum_{r=1}^{n}A_{j,r}z_r}\\
&=\sum_{\ell=1}^{n}\sum_{r=1}^{n}A_{i,\ell}A_{j,r}\inner{z_{\ell}}{z_r}\\
&=(A\,\mathtt{Gram}(\mathbf{z})A^{\top})_{i,j}.
\end{align*}
    </div>
    <p>Substituting this identity and using cyclicity of the trace gives</p>
    <div class="math">
\begin{align*}
\text{trace}\bigl(M\,\mathtt{Gram}((A\otimes I_d)\mathbf{z})\bigr)
&=\text{trace}\bigl(MA\,\mathtt{Gram}(\mathbf{z})A^{\top}\bigr)\\
&=\text{trace}\bigl(A^{\top}MA\,\mathtt{Gram}(\mathbf{z})\bigr).
\end{align*}
    </div>
  </div>
</details>

**Rewriting the objective.** Our goal is to express the objective of $$\mathcal{P}_{d}(Q,q,\gamma,\varepsilon,\mu,L,\rho)$$ in terms of the function-value differences $$f(x^{k})-f(x^{\star})$$ and $$f(x^{k+1})-f(x^{\star})$$, together with the Gram matrix $$\mathtt{Gram}(x^{k}-x^{\star},\nabla f(x^{k}),\nabla f(x^{k+1}),d^{k})$$. For this purpose, we introduce the following matrices, whose columns correspond, from left to right, to the four arguments of this Gramian:
<div class="math">
\begin{equation*}
S=
\begin{bmatrix}
1&0&0&0\\
0&1&0&0
\end{bmatrix},
\qquad
S_+=
\begin{bmatrix}
1&0&0&-\gamma\\
0&0&1&\phantom{-}0
\end{bmatrix}.
\end{equation*}
</div>
Applying the trace identity in $$\eqref{eq:gram-trace-identities}$$ with these matrices gives the objective in the desired form
<div class="math">
\begin{equation*}
\mathcal{V}(k+1)-\rho\mathcal{V}(k)
=\text{trace}\bigl((S_+^{\top}QS_+-\rho S^{\top}QS)\,\mathtt{Gram}(x^{k}-x^{\star},\nabla f(x^{k}),\nabla f(x^{k+1}),d^{k})\bigr)
+q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}^{\top}
\begin{bmatrix}
f(x^{k})-f(x^{\star})\\
f(x^{k+1})-f(x^{\star})
\end{bmatrix}.
\end{equation*}
</div>
<details class="proof-disclosure" id="objective-rewriting-proof">
  <summary><span class="proof-show">Show proof</span><span class="proof-hide">Hide proof</span></summary>
  <div class="proof-content">
    <p>The map \(S\otimes I_d\) selects \(x^{k}-x^{\star}\) and \(\nabla f(x^{k})\), the two vectors in the Gramian term of \(\mathcal{V}(k)\), giving</p>
<div class="math">
\begin{equation*}
(S\otimes I_d)(x^{k}-x^{\star},\nabla f(x^{k}),\nabla f(x^{k+1}),d^{k})
=(x^{k}-x^{\star},\nabla f(x^{k})).
\end{equation*}
</div>
    <p>For \(\mathcal{V}(k+1)\), the map \(S_+\otimes I_d\) recovers \(x^{k+1}-x^{\star}\) and \(\nabla f(x^{k+1})\) using the update \(x^{k+1}=x^{k}-\gamma d^{k}\), giving</p>
<div class="math">
\begin{equation*}
(S_+\otimes I_d)(x^{k}-x^{\star},\nabla f(x^{k}),\nabla f(x^{k+1}),d^{k})
=(x^{k}-x^{\star}-\gamma d^{k},\nabla f(x^{k+1}))
=(x^{k+1}-x^{\star},\nabla f(x^{k+1})).
\end{equation*}
</div>
    <p>Applying the trace identity in \(\eqref{eq:gram-trace-identities}\) gives</p>
<div class="math">
\begin{align*}
\mathcal{V}(k)
&=\text{trace}\bigl(Q\,\mathtt{Gram}(x^{k}-x^{\star},\nabla f(x^{k}))\bigr)+q(f(x^{k})-f(x^{\star}))\\
&=\text{trace}\bigl(Q\,\mathtt{Gram}((S\otimes I_d)(x^{k}-x^{\star},\nabla f(x^{k}),\nabla f(x^{k+1}),d^{k}))\bigr)+q(f(x^{k})-f(x^{\star}))\\
&=\text{trace}\bigl(S^{\top}QS\,\mathtt{Gram}(x^{k}-x^{\star},\nabla f(x^{k}),\nabla f(x^{k+1}),d^{k})\bigr)+q(f(x^{k})-f(x^{\star})).
\end{align*}
</div>
    <p>Similarly, we obtain</p>
<div class="math">
\begin{align*}
\mathcal{V}(k+1)
&=\text{trace}\bigl(Q\,\mathtt{Gram}(x^{k+1}-x^{\star},\nabla f(x^{k+1}))\bigr)+q(f(x^{k+1})-f(x^{\star}))\\
&=\text{trace}\bigl(Q\,\mathtt{Gram}((S_+\otimes I_d)(x^{k}-x^{\star},\nabla f(x^{k}),\nabla f(x^{k+1}),d^{k}))\bigr)+q(f(x^{k+1})-f(x^{\star}))\\
&=\text{trace}\bigl(S_+^{\top}QS_+\,\mathtt{Gram}(x^{k}-x^{\star},\nabla f(x^{k}),\nabla f(x^{k+1}),d^{k})\bigr)+q(f(x^{k+1})-f(x^{\star})).
\end{align*}
</div>
    <p>Subtracting \(\rho\mathcal{V}(k)\) from \(\mathcal{V}(k+1)\) gives the stated expression.</p>
  </div>
</details>

**Optimizing over functions.** Using this trace representation of the objective gives the following equivalent formulation of the problem defining $$\mathcal{P}_{d}(Q,q,\gamma,\varepsilon,\mu,L,\rho)$$
<div class="math">
\begin{equation*}
\begin{array}{cl}
\mathop{\text{maximize}}\limits_{\substack{
f\in\mathcal{F}_{\mu,L}(\mathbb{R}^{d})\\
x^{k},x^{k+1},x^{\star},d^{k}\in\mathbb{R}^{d}
}}
&\text{trace}((S_+^{\top}QS_+-\rho S^{\top}QS)\,\mathtt{Gram}(x^{k}-x^{\star},\nabla f(x^{k}),\nabla f(x^{k+1}),d^{k}))
+q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}^{\top}
\begin{bmatrix}
f(x^{k})-f(x^{\star})\\
f(x^{k+1})-f(x^{\star})
\end{bmatrix}
\\[0.6em]
\text{subject to}
&x^{k+1}=x^{k}-\gamma d^{k},\\
&\lVert\nabla f(x^{k})-d^{k}\rVert
\leqslant\varepsilon\lVert\nabla f(x^{k})\rVert,\\
&\nabla f(x^{\star})=0.
\end{array}
\end{equation*}
</div>

Here, $$f$$ is an infinite-dimensional optimization variable, even though only its values and gradients at $$x^{k}$$, $$x^{k+1}$$, and $$x^{\star}$$ appear in the objective and constraints. Introducing corresponding variables $$f^i$$ and $$g^i$$ therefore gives the equivalent formulation
<div class="math">
\begin{equation*}
\begin{array}{cl}
\mathop{\text{maximize}}\limits_{\substack{
x^{k},x^{k+1},x^{\star},d^{k}\in\mathbb{R}^{d}\\
g^{k},g^{k+1},g^{\star}\in\mathbb{R}^{d}\\
f^{k},f^{k+1},f^{\star}\in\mathbb{R}
}}
&\text{trace}((S_+^{\top}QS_+-\rho S^{\top}QS)\,\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k}))
+q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}^{\top}
\begin{bmatrix}
f^{k}-f^{\star}\\
f^{k+1}-f^{\star}
\end{bmatrix}
\\[0.6em]
\text{subject to}
&x^{k+1}=x^{k}-\gamma d^{k},\\
&\lVert g^{k}-d^{k}\rVert\leqslant\varepsilon\lVert g^{k}\rVert,\\
&g^{\star}=0,\\
&\text{there exists }f\in\mathcal{F}_{\mu,L}(\mathbb{R}^{d})
\;\text{such that}\; f(x^i)=f^i\;\text{and}\; \nabla f(x^i)=g^i
\;\text{for each}\; i\in\{k,k+1,\star\}.
\end{array}
\end{equation*}
</div>

At first glance, this may not seem like progress: we have replaced the infinite-dimensional variable by an existence constraint over the same function class. Have we actually made the problem any easier?

Determining whether the prescribed values and gradients can come from a single function in $$\mathcal{F}_{\mu,L}(\mathbb{R}^{d})$$ is an *interpolation problem*. For this class, *interpolation conditions* from the performance estimation literature let us replace the existence constraint by finitely many explicit inequalities \cite{THG17}. The quadratic bounds $$\eqref{eq:quadratic-bounds}$$, imposed only at the sampled points, are necessary but not sufficient for interpolation. [Theorem 1](#theorem-interpolation) gives necessary and sufficient conditions for a function in $$\mathcal{F}_{\mu,L}(\mathbb{R}^{d})$$ to match all the prescribed values and gradients.

<div class="interpolation-theorem" id="theorem-interpolation" role="note" aria-labelledby="interpolation-theorem-title">
  <p id="interpolation-theorem-title"><strong><a href="#theorem-interpolation">Theorem 1</a> (Smooth and strongly convex interpolation).</strong> \nocite{THG17}[<a href="#THG17">THG17</a>, Theorem 4]</p>
  <p>Let \(J\) be a finite index set, and let \(x^i,g^i\in\mathbb{R}^{d}\) and \(f^i\in\mathbb{R}\) for each \(i\in J\). There exists a function \(f\in\mathcal{F}_{\mu,L}(\mathbb{R}^{d})\) satisfying</p>
  <div class="math">
\begin{equation*}
f(x^i)=f^i\;\text{and}\; \nabla f(x^i)=g^i\;\text{for each}\; i\in J
\end{equation*}
  </div>
  <p>if and only if</p>
  <div class="math">
\begin{equation*}
f^i-f^j-\inner{g^j}{x^i-x^j}
\geqslant\tfrac{\mu}{2}\norm{x^i-x^j}^{2}
+\tfrac{1}{2(L-\mu)}\norm{g^i-g^j-\mu(x^i-x^j)}^{2}
\end{equation*}
  </div>
  <p>for each pair of distinct indices \(i,j\in J\).</p>
</div>

For an intuitive explanation of interpolation in the convex, possibly nonsmooth case, corresponding to $$\mu=0$$ and $$L=+\infty$$, see [Adrien Taylor's excellent post on Francis Bach's blog](https://francisbach.com/computer-aided-analyses/) \cite{Tay20}.

Applying [Theorem 1](#theorem-interpolation) gives the following equivalent finite-dimensional formulation, where we have squared the relative-error bound and written each inequality with zero on the right
<div class="math">
\begin{equation*}
\begin{array}{cl}
\mathop{\text{maximize}}\limits_{\substack{
x^{k},x^{k+1},x^{\star},d^{k}\in\mathbb{R}^{d}\\
g^{k},g^{k+1},g^{\star}\in\mathbb{R}^{d}\\
f^{k},f^{k+1},f^{\star}\in\mathbb{R}
}}
&\text{trace}((S_+^{\top}QS_+-\rho S^{\top}QS)\,\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k}))
+q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}^{\top}
\begin{bmatrix}
f^{k}-f^{\star}\\
f^{k+1}-f^{\star}
\end{bmatrix}
\\[0.6em]
\text{subject to}
&x^{k+1}=x^{k}-\gamma d^{k},\\
&\norm{g^{k}-d^{k}}^{2}-\varepsilon^{2}\norm{g^{k}}^{2}\leqslant0,\\
&g^{\star}=0,\\
&f^j-f^i+\inner{g^j}{x^i-x^j}
+\tfrac{\mu}{2}\norm{x^i-x^j}^{2}
+\tfrac{1}{2(L-\mu)}\norm{g^i-g^j-\mu(x^i-x^j)}^{2}\leqslant0\\
&\text{for each pair of distinct indices }i,j\in\{k,k+1,\star\}.
\end{array}
\end{equation*}
</div>

We have now eliminated the unknown function: only finitely many vector and scalar variables remain. For the three indices in $$\{k,k+1,\star\}$$, there are six interpolation inequalities: one for each ordered pair of distinct indices. Swapping $$i$$ and $$j$$ generally gives a different inequality.

**Rewriting the constraints.** Substituting $$x^{k+1}=x^{k}-\gamma d^{k}$$ and $$g^{\star}=0$$ eliminates $$x^{k+1}$$ and $$g^{\star}$$ as optimization variables. The relative-error constraint becomes
<div class="math">
\begin{equation*}
\norm{g^{k}-d^{k}}^{2}-\varepsilon^{2}\norm{g^{k}}^{2}
=\text{trace}(A_{\mathrm{err}}\,\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k}))
\leqslant0,
\qquad
A_{\mathrm{err}}=
\begin{bmatrix}
0&\phantom{-}0&0&\phantom{-}0\\
0&\phantom{-}1-\varepsilon^{2}&0&-1\\
0&\phantom{-}0&0&\phantom{-}0\\
0&-1&0&\phantom{-}1
\end{bmatrix}.
\end{equation*}
</div>
For each interpolation inequality, we use $$A_{i,j}\in\mathbb{S}^{4}$$ to represent the inner products and squared norms and $$a_{i,j}\in\mathbb{R}^{2}$$ to select the function-value difference $$f^{j}-f^{i}$$. The six inequalities can then be written as
<div class="math">
\begin{equation*}
\text{trace}(A_{i,j}\,\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k}))
+a_{i,j}^{\top}
\begin{bmatrix}
f^{k}-f^{\star}\\
f^{k+1}-f^{\star}
\end{bmatrix}
\leqslant0
\end{equation*}
</div>
for each pair of distinct indices $$i,j\in\{k,k+1,\star\}$$.
<details class="proof-disclosure interpolation-derivation">
  <summary><span class="proof-show">Show derivation</span><span class="proof-hide">Hide derivation</span></summary>
  <div class="proof-content">
    <p>For each of the six ordered pairs, we first write the interpolation inequality, then substitute \(x^{k+1}=x^{k}-\gamma d^{k}\) and \(g^{\star}=0\), expand the squared norms, and identify its trace representation.</p>
<p>For \((i,j)=(k,\star)\), we obtain</p>
<div class="math">
\begin{align*}
&f^{\star}-f^{k}+\inner{g^{\star}}{x^{k}-x^{\star}}
+\tfrac{\mu}{2}\norm{x^{k}-x^{\star}}^{2}
+\tfrac{1}{2(L-\mu)}\norm{g^{k}-g^{\star}-\mu(x^{k}-x^{\star})}^{2}\\
&=f^{\star}-f^{k}
+\tfrac{\mu}{2}\norm{x^{k}-x^{\star}}^{2}
+\tfrac{1}{2(L-\mu)}\norm{g^{k}-\mu(x^{k}-x^{\star})}^{2}\\
&=f^{\star}-f^{k}+\tfrac{1}{2(L-\mu)}(
\mu L\norm{x^{k}-x^{\star}}^{2}
-2\mu\inner{x^{k}-x^{\star}}{g^{k}}
+\norm{g^{k}}^{2})\\
&=\text{trace}(A_{k,\star}\,\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k}))
+a_{k,\star}^{\top}\begin{bmatrix}f^{k}-f^{\star}\\f^{k+1}-f^{\star}\end{bmatrix}\leqslant0,
\end{align*}
</div>
<p>where</p>
<div class="math">
\begin{equation*}
A_{k,\star}=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\phantom{-}\mu L&-\mu&0&0\\
-\mu&\phantom{-}1&0&0\\
\phantom{-}0&\phantom{-}0&0&0\\
\phantom{-}0&\phantom{-}0&0&0
\end{bmatrix},
\qquad
a_{k,\star}=\begin{bmatrix}-1\\\phantom{-}0\end{bmatrix}.
\end{equation*}
</div>

<p>For \((i,j)=(\star,k)\), we obtain</p>
<div class="math">
\begin{align*}
&f^{k}-f^{\star}+\inner{g^{k}}{x^{\star}-x^{k}}
+\tfrac{\mu}{2}\norm{x^{\star}-x^{k}}^{2}
+\tfrac{1}{2(L-\mu)}\norm{g^{\star}-g^{k}-\mu(x^{\star}-x^{k})}^{2}\\
&=f^{k}-f^{\star}-\inner{g^{k}}{x^{k}-x^{\star}}
+\tfrac{\mu}{2}\norm{x^{k}-x^{\star}}^{2}
+\tfrac{1}{2(L-\mu)}\norm{g^{k}-\mu(x^{k}-x^{\star})}^{2}\\
&=f^{k}-f^{\star}+\tfrac{1}{2(L-\mu)}(
\mu L\norm{x^{k}-x^{\star}}^{2}
-2L\inner{x^{k}-x^{\star}}{g^{k}}
+\norm{g^{k}}^{2})\\
&=\text{trace}(A_{\star,k}\,\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k}))
+a_{\star,k}^{\top}\begin{bmatrix}f^{k}-f^{\star}\\f^{k+1}-f^{\star}\end{bmatrix}\leqslant0,
\end{align*}
</div>
<p>where</p>
<div class="math">
\begin{equation*}
A_{\star,k}=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\phantom{-}\mu L&-L&0&0\\
-L&\phantom{-}1&0&0\\
\phantom{-}0&\phantom{-}0&0&0\\
\phantom{-}0&\phantom{-}0&0&0
\end{bmatrix},
\qquad
a_{\star,k}=\begin{bmatrix}1\\0\end{bmatrix}.
\end{equation*}
</div>

<p>For \((i,j)=(k+1,\star)\), we obtain</p>
<div class="math">
\begin{align*}
&f^{\star}-f^{k+1}+\inner{g^{\star}}{x^{k+1}-x^{\star}}
+\tfrac{\mu}{2}\norm{x^{k+1}-x^{\star}}^{2}
+\tfrac{1}{2(L-\mu)}\norm{g^{k+1}-g^{\star}-\mu(x^{k+1}-x^{\star})}^{2}\\
&=f^{\star}-f^{k+1}
+\tfrac{\mu}{2}\norm{x^{k}-x^{\star}-\gamma d^{k}}^{2}
+\tfrac{1}{2(L-\mu)}\norm{g^{k+1}-\mu(x^{k}-x^{\star}-\gamma d^{k})}^{2}\\
&=f^{\star}-f^{k+1}+\tfrac{1}{2(L-\mu)}(
\mu L\norm{x^{k}-x^{\star}}^{2}
-2\mu\inner{x^{k}-x^{\star}}{g^{k+1}}
-2\gamma\mu L\inner{x^{k}-x^{\star}}{d^{k}}
+\norm{g^{k+1}}^{2}
+2\gamma\mu\inner{g^{k+1}}{d^{k}}
+\gamma^{2}\mu L\norm{d^{k}}^{2})\\
&=\text{trace}(A_{k+1,\star}\,\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k}))
+a_{k+1,\star}^{\top}\begin{bmatrix}f^{k}-f^{\star}\\f^{k+1}-f^{\star}\end{bmatrix}\leqslant0,
\end{align*}
</div>
<p>where</p>
<div class="math">
\begin{equation*}
A_{k+1,\star}=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\phantom{-}\mu L&0&-\mu&-\gamma\mu L\\
\phantom{-}0&0&\phantom{-}0&\phantom{-}0\\
-\mu&0&\phantom{-}1&\phantom{-}\gamma\mu\\
-\gamma\mu L&0&\phantom{-}\gamma\mu&\phantom{-}\gamma^{2}\mu L
\end{bmatrix},
\qquad
a_{k+1,\star}=\begin{bmatrix}\phantom{-}0\\-1\end{bmatrix}.
\end{equation*}
</div>

<p>For \((i,j)=(\star,k+1)\), we obtain</p>
<div class="math">
\begin{align*}
&f^{k+1}-f^{\star}+\inner{g^{k+1}}{x^{\star}-x^{k+1}}
+\tfrac{\mu}{2}\norm{x^{\star}-x^{k+1}}^{2}
+\tfrac{1}{2(L-\mu)}\norm{g^{\star}-g^{k+1}-\mu(x^{\star}-x^{k+1})}^{2}\\
&=f^{k+1}-f^{\star}-\inner{g^{k+1}}{x^{k}-x^{\star}-\gamma d^{k}}
+\tfrac{\mu}{2}\norm{x^{k}-x^{\star}-\gamma d^{k}}^{2}
+\tfrac{1}{2(L-\mu)}\norm{g^{k+1}-\mu(x^{k}-x^{\star}-\gamma d^{k})}^{2}\\
&=f^{k+1}-f^{\star}+\tfrac{1}{2(L-\mu)}(
\mu L\norm{x^{k}-x^{\star}}^{2}
-2L\inner{x^{k}-x^{\star}}{g^{k+1}}
-2\gamma\mu L\inner{x^{k}-x^{\star}}{d^{k}}
+\norm{g^{k+1}}^{2}
+2\gamma L\inner{g^{k+1}}{d^{k}}
+\gamma^{2}\mu L\norm{d^{k}}^{2})\\
&=\text{trace}(A_{\star,k+1}\,\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k}))
+a_{\star,k+1}^{\top}\begin{bmatrix}f^{k}-f^{\star}\\f^{k+1}-f^{\star}\end{bmatrix}\leqslant0,
\end{align*}
</div>
<p>where</p>
<div class="math">
\begin{equation*}
A_{\star,k+1}=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\phantom{-}\mu L&0&-L&-\gamma\mu L\\
\phantom{-}0&0&\phantom{-}0&\phantom{-}0\\
-L&0&\phantom{-}1&\phantom{-}\gamma L\\
-\gamma\mu L&0&\phantom{-}\gamma L&\phantom{-}\gamma^{2}\mu L
\end{bmatrix},
\qquad
a_{\star,k+1}=\begin{bmatrix}0\\1\end{bmatrix}.
\end{equation*}
</div>

<p>For \((i,j)=(k,k+1)\), we obtain</p>
<div class="math">
\begin{align*}
&f^{k+1}-f^{k}+\inner{g^{k+1}}{x^{k}-x^{k+1}}
+\tfrac{\mu}{2}\norm{x^{k}-x^{k+1}}^{2}
+\tfrac{1}{2(L-\mu)}\norm{g^{k}-g^{k+1}-\mu(x^{k}-x^{k+1})}^{2}\\
&=f^{k+1}-f^{k}+\gamma\inner{g^{k+1}}{d^{k}}
+\tfrac{\mu\gamma^{2}}{2}\norm{d^{k}}^{2}
+\tfrac{1}{2(L-\mu)}\norm{g^{k}-g^{k+1}-\mu\gamma d^{k}}^{2}\\
&=f^{k+1}-f^{k}+\tfrac{1}{2(L-\mu)}(
\norm{g^{k}}^{2}
-2\inner{g^{k}}{g^{k+1}}
-2\gamma\mu\inner{g^{k}}{d^{k}}
+\norm{g^{k+1}}^{2}
+2\gamma L\inner{g^{k+1}}{d^{k}}
+\gamma^{2}\mu L\norm{d^{k}}^{2})\\
&=\text{trace}(A_{k,k+1}\,\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k}))
+a_{k,k+1}^{\top}\begin{bmatrix}f^{k}-f^{\star}\\f^{k+1}-f^{\star}\end{bmatrix}\leqslant0,
\end{align*}
</div>
<p>where</p>
<div class="math">
\begin{equation*}
A_{k,k+1}=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
0&\phantom{-}0&\phantom{-}0&\phantom{-}0\\
0&\phantom{-}1&-1&-\gamma\mu\\
0&-1&\phantom{-}1&\phantom{-}\gamma L\\
0&-\gamma\mu&\phantom{-}\gamma L&\phantom{-}\gamma^{2}\mu L
\end{bmatrix},
\qquad
a_{k,k+1}=\begin{bmatrix}-1\\\phantom{-}1\end{bmatrix}.
\end{equation*}
</div>

<p>For \((i,j)=(k+1,k)\), we obtain</p>
<div class="math">
\begin{align*}
&f^{k}-f^{k+1}+\inner{g^{k}}{x^{k+1}-x^{k}}
+\tfrac{\mu}{2}\norm{x^{k+1}-x^{k}}^{2}
+\tfrac{1}{2(L-\mu)}\norm{g^{k+1}-g^{k}-\mu(x^{k+1}-x^{k})}^{2}\\
&=f^{k}-f^{k+1}-\gamma\inner{g^{k}}{d^{k}}
+\tfrac{\mu\gamma^{2}}{2}\norm{d^{k}}^{2}
+\tfrac{1}{2(L-\mu)}\norm{g^{k+1}-g^{k}+\mu\gamma d^{k}}^{2}\\
&=f^{k}-f^{k+1}+\tfrac{1}{2(L-\mu)}(
\norm{g^{k}}^{2}
-2\inner{g^{k}}{g^{k+1}}
-2\gamma L\inner{g^{k}}{d^{k}}
+\norm{g^{k+1}}^{2}
+2\gamma\mu\inner{g^{k+1}}{d^{k}}
+\gamma^{2}\mu L\norm{d^{k}}^{2})\\
&=\text{trace}(A_{k+1,k}\,\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k}))
+a_{k+1,k}^{\top}\begin{bmatrix}f^{k}-f^{\star}\\f^{k+1}-f^{\star}\end{bmatrix}\leqslant0,
\end{align*}
</div>
<p>where</p>
<div class="math">
\begin{equation*}
A_{k+1,k}=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
0&\phantom{-}0&\phantom{-}0&\phantom{-}0\\
0&\phantom{-}1&-1&-\gamma L\\
0&-1&\phantom{-}1&\phantom{-}\gamma\mu\\
0&-\gamma L&\phantom{-}\gamma\mu&\phantom{-}\gamma^{2}\mu L
\end{bmatrix},
\qquad
a_{k+1,k}=\begin{bmatrix}\phantom{-}1\\-1\end{bmatrix}.
\end{equation*}
</div>
  </div>
</details>

Combining the rewritten objective and constraints gives the equivalent formulation
<div class="math">
\begin{equation*}
\mathcal{P}_{d}(Q,q,\gamma,\varepsilon,\mu,L,\rho)
=\left(
\begin{array}{cl}
\mathop{\text{maximize}}\limits_{\substack{
x^{k},x^{\star},d^{k}\in\mathbb{R}^{d}\\
g^{k},g^{k+1}\in\mathbb{R}^{d}\\
f^{k},f^{k+1},f^{\star}\in\mathbb{R}
}}
&\text{trace}((S_+^{\top}QS_+-\rho S^{\top}QS)\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k}))
+q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}^{\top}
\begin{bmatrix}
f^{k}-f^{\star}\\
f^{k+1}-f^{\star}
\end{bmatrix}
\\[0.6em]
\text{subject to}
&\text{trace}(A_{\mathrm{err}}\,\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k}))\leqslant0,\\
&\text{trace}(A_{i,j}\,\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k}))
+a_{i,j}^{\top}
\begin{bmatrix}
f^{k}-f^{\star}\\
f^{k+1}-f^{\star}
\end{bmatrix}
\leqslant0\\
&\text{for each pair of distinct indices }i,j\in\{k,k+1,\star\}.
\end{array}
\right).
\end{equation*}
</div>

We have now obtained an equivalent quadratically constrained quadratic program (QCQP) for evaluating $$\mathcal{P}_{d}(Q,q,\gamma,\varepsilon,\mu,L,\rho)$$, but it is generally nonconvex. The following result lets us replace the vectors by their Gram matrix, with a rank constraint accounting for the dimension $$d$$.

**Which matrices are Gram matrices?** For $$G\in\mathbb{S}^{n}$$, we have that
<div class="math">
\begin{equation}
\label{eq:gram-characterization}
\text{there exists }\mathbf{z}\in(\mathbb{R}^{d})^{n}\;\text{such that}\; \mathtt{Gram}(\mathbf{z})=G
\;\text{if and only if}\;
G\in\mathbb{S}_{+}^{n}\;\text{and}\;\mathord{\mathop{\text{rank}}\nolimits(G)}\leqslant d.
\end{equation}
</div>
<details class="proof-disclosure">
  <summary><span class="proof-show">Show proof</span><span class="proof-hide">Hide proof</span></summary>
  <div class="proof-content">
    <p>If \(\mathtt{Gram}(\mathbf{z})=G\), let \(Z=[z_1\ \cdots\ z_n]\in\mathbb{R}^{d\times n}\). Then \(G=Z^{\top}Z\in\mathbb{S}_{+}^{n}\), and</p>
    <div class="math">
\begin{equation*}
\mathop{\text{rank}}\nolimits(G)
\leqslant\mathop{\text{rank}}\nolimits(Z)
\leqslant d.
\end{equation*}
    </div>
    <p>Conversely, if \(G\in\mathbb{S}_{+}^{n}\) and \(\mathop{\text{rank}}\nolimits(G)\leqslant d\), the Cholesky decomposition for positive semidefinite matrices \nocite{Gen98}[<a href="#Gen98">Gen98</a>, p. 94] implies that there exists \(Z=[z_1\ \cdots\ z_n]\in\mathbb{R}^{d\times n}\) such that \(G=Z^{\top}Z\). Its columns therefore satisfy \(\mathtt{Gram}(\mathbf{z})=G\).</p>
  </div>
</details>

**Primal SDP.** Writing $$G=\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k})$$ and $$F=\begin{bmatrix}f^{k}-f^{\star}\\f^{k+1}-f^{\star}\end{bmatrix}\in\mathbb{R}^{2}$$, we obtain from $$\eqref{eq:gram-characterization}$$ the equivalent formulation
<div class="math">
\begin{equation*}
\mathcal{P}_{d}(Q,q,\gamma,\varepsilon,\mu,L,\rho)
=\left(
\begin{array}{cl}
\mathop{\text{maximize}}\limits_{G\in\mathbb{S}_{+}^{4},\,F\in\mathbb{R}^{2}}
&\text{trace}((S_+^{\top}QS_+-\rho S^{\top}QS)G)
+q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}^{\top}F\\[0.6em]
\text{subject to}
&\mathop{\text{rank}}\nolimits(G)\leqslant d,\\
&\text{trace}(A_{\mathrm{err}}G)\leqslant0,\\
&\text{trace}(A_{i,j}G)+a_{i,j}^{\top}F\leqslant0\\
&\text{for each pair of distinct indices }i,j\in\{k,k+1,\star\}.
\end{array}
\right).
\end{equation*}
</div>
The objective and scalar inequality constraints are linear in $$G$$ and $$F$$. Positive semidefiniteness is a convex constraint, so dropping the rank constraint gives the SDP
<div class="math">
\begin{equation*}
\mathcal{P}^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L,\rho)
=\left(
\begin{array}{cl}
\mathop{\text{maximize}}\limits_{G\in\mathbb{S}_{+}^{4},\,F\in\mathbb{R}^{2}}
&\text{trace}((S_+^{\top}QS_+-\rho S^{\top}QS)G)
+q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}^{\top}F\\[0.6em]
\text{subject to}
&\text{trace}(A_{\mathrm{err}}G)\leqslant0,\\
&\text{trace}(A_{i,j}G)+a_{i,j}^{\top}F\leqslant0\\
&\text{for each pair of distinct indices }i,j\in\{k,k+1,\star\}.
\end{array}
\right),
\end{equation*}
</div>
and hence an upper bound valid in every dimension $$d$$
<div class="math">
\begin{equation*}
\mathcal{P}_{d}(Q,q,\gamma,\varepsilon,\mu,L,\rho)
\leqslant\mathcal{P}^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L,\rho).
\end{equation*}
</div>
For $$d\geqslant4$$, the rank constraint is automatic, so
<div class="math">
\begin{equation*}
\mathcal{P}_{d}(Q,q,\gamma,\varepsilon,\mu,L,\rho)
=\mathcal{P}^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L,\rho).
\end{equation*}
</div>

The SDP $$\mathcal{P}^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L,\rho)$$ has one $$4\times4$$ positive semidefinite matrix variable, two scalar variables, and seven scalar inequalities: six interpolation inequalities and one relative-error inequality. Its size is independent of $$d$$.

**Dual SDP.** Next, we derive the Lagrange dual of $$\mathcal{P}^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L,\rho)$$.
We associate dual multipliers with the constraints as follows
<div class="math">
\begin{align*}
\text{trace}(A_{\mathrm{err}}G)\leqslant0
&\qquad:\qquad\tau\geqslant0,\\
\text{trace}(A_{i,j}G)+a_{i,j}^{\top}F\leqslant0
&\qquad:\qquad\lambda_{i,j}\geqslant0
\end{align*}
</div>
for each pair of distinct indices $$i,j\in\{k,k+1,\star\}$$. With the notation $$\lambda=(\lambda_{i,j})_{i,j\in\{k,k+1,\star\},\,i\ne j}$$, the Lagrangian is
<div class="math">
\begin{align*}
\mathcal{L}(G,F,\tau,\lambda)
&=\text{trace}((S_+^{\top}QS_+-\rho S^{\top}QS)G)
+q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}^{\top}F
-\tau\,\text{trace}(A_{\mathrm{err}}G)
-\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}
(\text{trace}(A_{i,j}G)+a_{i,j}^{\top}F)\\
&=\text{trace}\left(\left(S_+^{\top}QS_+-\rho S^{\top}QS
-\tau A_{\mathrm{err}}-\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}A_{i,j}\right)G\right)
+\left(q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}
-\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}a_{i,j}\right)^{\top}F.
\end{align*}
</div>
Taking the supremum of the Lagrangian over $$G\in\mathbb{S}_{+}^{4}$$ and $$F\in\mathbb{R}^{2}$$ gives the dual objective
<div class="math">
\begin{align*}
&\mathop{\text{sup}}\limits_{G\in\mathbb{S}_{+}^{4},\,F\in\mathbb{R}^{2}}
\mathcal{L}(G,F,\tau,\lambda)\\
&=\mathop{\text{sup}}\limits_{G\in\mathbb{S}_{+}^{4}}
\text{trace}\left(\left(S_+^{\top}QS_+-\rho S^{\top}QS
-\tau A_{\mathrm{err}}-\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}A_{i,j}\right)G\right)
+\mathop{\text{sup}}\limits_{F\in\mathbb{R}^{2}}
\left(q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}
-\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}a_{i,j}\right)^{\top}F\\[0.4em]
&=\begin{cases}
0,&\text{if }S_+^{\top}QS_+-\rho S^{\top}QS
-\tau A_{\mathrm{err}}-\displaystyle\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}A_{i,j}\preccurlyeq0
\;\text{and}\; q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}
-\displaystyle\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}a_{i,j}=0,\\[0.4em]
+\infty,&\text{otherwise}.
\end{cases}
\end{align*}
</div>
Minimizing this dual objective over the nonnegative multipliers gives the dual SDP
<div class="math">
\begin{equation*}
\mathcal{D}^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L,\rho)
=\left(
\begin{array}{cl}
\mathop{\text{minimize}}\limits_{\substack{
\tau\in\mathbb{R}\\
\lambda_{i,j}\in\mathbb{R},\ i,j\in\{k,k+1,\star\},\ i\ne j
}}
&0\\[0.6em]
\text{subject to}
&\tau\geqslant0,\quad\lambda_{i,j}\geqslant0,\\
&\tau A_{\mathrm{err}}
+\displaystyle\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}A_{i,j}
-(S_+^{\top}QS_+-\rho S^{\top}QS)\succcurlyeq0,\\
&\displaystyle\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}a_{i,j}
-q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}=0.
\end{array}
\right).
\end{equation*}
</div>
Here, solving the dual SDP amounts to finding multipliers satisfying its constraints. The primal relaxation and weak duality (the primal SDP optimal value is no larger than the dual SDP optimal value) \nocite{BV04}[<a href="#BV04">BV04</a>, Section 5.2.2] give
<div class="math">
\begin{equation*}
\mathcal{P}_{d}(Q,q,\gamma,\varepsilon,\mu,L,\rho)
\leqslant\mathcal{P}^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L,\rho)
\leqslant\mathcal{D}^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L,\rho).
\end{equation*}
</div>
Thus, if we find such multipliers, the right-hand side is zero and $$\mathcal{P}_{d}(Q,q,\gamma,\varepsilon,\mu,L,\rho)\leqslant0$$.

**Optional: Strong duality.** For $$\varepsilon>0$$, the primal and dual optimal values agree (known as strong duality),
<div class="math">
\begin{equation*}
\mathcal{P}^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L,\rho)
=\mathcal{D}^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L,\rho).
\end{equation*}
</div>
This follows from the refined Slater condition \nocite{BV04}[<a href="#BV04">BV04</a>, Section 5.2.3]. The verification is technical, so we include it below as optional reading for those interested in the details.
<details class="proof-disclosure">
  <summary><span class="proof-show">Show proof</span><span class="proof-hide">Hide proof</span></summary>
  <div class="proof-content">
    <p>All scalar constraints in the SDP defining \(\mathcal{P}^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L,\rho)\) are affine in \((G,F)\), so the refined Slater condition only requires a feasible pair with \(G\succ0\); the scalar inequalities may hold with equality \nocite{BV04}[<a href="#BV04">BV04</a>, Section 5.2.3]. We construct such a pair from the quadratic</p>
    <div class="math">
\begin{equation*}
f(x)=\tfrac12x^{\top}\mathop{\text{diag}}\nolimits(\mu,L,\mu,L)x,
\qquad x\in\mathbb{R}^{4}.
\end{equation*}
    </div>
    <p>This function belongs to \(\mathcal{F}_{\mu,L}(\mathbb{R}^{4})\) and has minimizer \(x^{\star}=0\). Choose</p>
    <div class="math">
\begin{equation*}
x^{k}=\begin{bmatrix}1\\1\\0\\0\end{bmatrix},\qquad
d^{k}=\begin{bmatrix}\mu\\L\\\varepsilon\mu\\\varepsilon L\end{bmatrix},\qquad
x^{k+1}=x^{k}-\gamma d^{k}.
\end{equation*}
    </div>
    <p>Take \(g^i=\nabla f(x^i)\), and set</p>
    <div class="math">
\begin{equation*}
G=\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1},d^{k}),\qquad
F=\begin{bmatrix}f(x^{k})-f(x^{\star})\\f(x^{k+1})-f(x^{\star})\end{bmatrix}.
\end{equation*}
    </div>
    <p>The interpolation inequalities hold because these data come from \(f\). For the relative-error bound, we have</p>
    <div class="math">
\begin{equation*}
g^{k}=\nabla f(x^{k})=\begin{bmatrix}\mu\\L\\0\\0\end{bmatrix},\qquad
g^{k}-d^{k}=\begin{bmatrix}\phantom{-}0\\\phantom{-}0\\-\varepsilon\mu\\-\varepsilon L\end{bmatrix}.
\end{equation*}
    </div>
    <p>Hence the relative-error bound holds with equality:</p>
    <div class="math">
\begin{equation*}
\|g^{k}-d^{k}\|=\varepsilon\sqrt{\mu^2+L^2}
=\varepsilon\|g^{k}\|.
\end{equation*}
    </div>
    <p>It remains to check that \(G\succ0\). Since \(x^{\star}=0\), write</p>
    <div class="math">
\begin{equation*}
Z=\begin{bmatrix}x^{k}&g^{k}&g^{k+1}&d^{k}\end{bmatrix}
=
\begin{bmatrix}
1&\mu&\phantom{-}\mu(1-\gamma\mu)&\mu\\
1&L&\phantom{-}L(1-\gamma L)&L\\
0&0&-\gamma\varepsilon\mu^2&\varepsilon\mu\\
0&0&-\gamma\varepsilon L^2&\varepsilon L
\end{bmatrix}.
\end{equation*}
    </div>
    <p>This matrix is block upper triangular. Its diagonal blocks have determinants \(L-\mu\) and \(\gamma\varepsilon^2\mu L(L-\mu)\), respectively, so its determinant is \(\gamma\varepsilon^2\mu L(L-\mu)^2>0\). Thus \(Z\) is nonsingular and \(G=Z^{\top}Z\succ0\), as required.</p>
  </div>
</details>

When $$\varepsilon=0$$, we have $$d^{k}=g^{k}$$, so the four-vector Gram matrix cannot be positive definite. We can use the smaller Gramian $$\mathtt{Gram}(x^{k}-x^{\star},g^{k},g^{k+1})$$ to obtain a different primal–dual SDP pair for which strong duality holds. We do not study this reduced formulation further here.

**Dual certificates.** A feasible dual point gives nonnegative weights that combine the relative-error and interpolation inequalities into a proof of the desired Lyapunov inequality. To make this proof explicit, let $$(\tau,\lambda)$$ be a feasible point of $$\mathcal{D}^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L,\rho)$$. Consider any step of the method $$\eqref{eq:relatively-inexact-gradient-method}$$, and set
<div class="math">
\begin{equation*}
G=\mathtt{Gram}(x^{k}-x^{\star},\nabla f(x^{k}),\nabla f(x^{k+1}),d^{k}),
\qquad
F=\begin{bmatrix}f(x^{k})-f(x^{\star})\\f(x^{k+1})-f(x^{\star})\end{bmatrix}.
\end{equation*}
</div>
Since $$G\succcurlyeq0$$, the constraints of $$\mathcal{D}^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L,\rho)$$ give $$\mathcal{L}(G,F,\tau,\lambda)\leqslant0$$. Thus, for this step,
<div class="math">
\begin{equation}
\label{eq:dual-certificate-bound}
\begin{aligned}
\mathcal{V}(k+1)-\rho\mathcal{V}(k)
&=\text{trace}\left((S_+^{\top}QS_+-\rho S^{\top}QS)G\right)
+q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}^{\top}F\\
&=\mathcal{L}(G,F,\tau,\lambda)+\tau\,\text{trace}(A_{\mathrm{err}}G)
+\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}
\left(\text{trace}(A_{i,j}G)+a_{i,j}^{\top}F\right)\\
&\leqslant\tau\,\text{trace}(A_{\mathrm{err}}G)
+\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}
\left(\text{trace}(A_{i,j}G)+a_{i,j}^{\top}F\right)\\
&\leqslant0.
\end{aligned}
\end{equation}
</div>
The last inequality uses primal feasibility and nonnegative multipliers. Since $$x^k$$ and $$d^k$$ were arbitrary subject to the relative-error condition, the same feasible point $$(\tau,\lambda)$$ certifies $$\mathcal{V}(k+1)\leqslant\rho\mathcal{V}(k)$$ at every iteration along every admissible trajectory, in every dimension. Conversely, for $$d\geqslant4$$ and $$\varepsilon>0$$, if $$\mathcal{V}(k+1)\leqslant\rho\mathcal{V}(k)$$ holds for every admissible function and step, then $$\mathcal{D}^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L,\rho)$$ has a feasible point $$(\tau,\lambda)$$. This follows from exactness of the primal formulation and strong duality.

<span id="formal-statement"></span>

**Formal result.** With $$Q$$ and $$q$$ fixed, minimizing $$\rho$$ subject to the constraints of $$\mathcal{D}^{\mathrm{SDP}}$$ is itself an SDP, since these constraints are affine in $$\rho,\tau,\lambda$$. The derivation above gives [Theorem 2](#theorem-fixed-lyapunov-contraction).

<div class="interpolation-theorem" id="theorem-fixed-lyapunov-contraction" role="note" aria-labelledby="lyapunov-contraction-theorem-title">
  <p id="lyapunov-contraction-theorem-title"><strong><a href="#theorem-fixed-lyapunov-contraction">Theorem 2</a> (Optimal one-step contraction via semidefinite programming).</strong></p>
  <p>Fix \(d\in\mathbb{N}\), \(0<\mu<L\), \(\gamma>0\), \(\varepsilon\geqslant0\), \(Q=(Q_{i,j})_{1\leqslant i,j\leqslant2}\in\mathbb{S}^{2}\), and \(q\in\mathbb{R}\). With \(S,S_+\in\mathbb{R}^{2\times4}\), \(A_{\mathrm{err}},A_{i,j}\in\mathbb{S}^{4}\), and \(a_{i,j}\in\mathbb{R}^{2}\) defined below, consider the SDP</p>
  <div class="math">
\begin{equation}
\label{eq:lyapunov-certificate}
\rho^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L)
=\left(
\begin{array}{cl}
\mathop{\text{minimize}}\limits_{\substack{
\rho,\tau\in\mathbb{R}\\
\lambda_{i,j}\in\mathbb{R},\\
i,j\in\{k,k+1,\star\},\ i\ne j
}}
&\rho\\[0.6em]
\text{subject to}
&\tau\geqslant0,\quad\lambda_{i,j}\geqslant0,\\
&\tau A_{\mathrm{err}}
+\displaystyle\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}A_{i,j}
-(S_+^{\top}QS_+-\rho S^{\top}QS)\succcurlyeq0,\\
&\displaystyle\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}a_{i,j}
-q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}=0,
\end{array}
\right)
\end{equation}
  </div>
  <p>where \(k,k+1,\star\) are just point labels (the SDP does not depend on \(k\)).</p>
  <p>The optimal one-step contraction factor satisfies</p>
  <div class="math">
\begin{equation*}
\begin{aligned}
\rho_d^{\star}(Q,q,\gamma,\varepsilon,\mu,L)
&=\inf\left\{
\rho\in\mathbb{R}\;\middle|\;
\begin{array}{l}
\mathcal{V}(k+1)\leqslant\rho\mathcal{V}(k)\\
\text{for every }f\in\mathcal{F}_{\mu,L}(\mathbb{R}^{d})
\;\text{and}\; x^{k},d^{k}\in\mathbb{R}^{d}\text{ with}\\
x^{k+1}=x^{k}-\gamma d^{k}\quad\text{and}\quad
\|\nabla f(x^{k})-d^{k}\|\leqslant\varepsilon\|\nabla f(x^{k})\|
\end{array}
\right\}\\
&\leqslant\rho^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L),
\end{aligned}
\end{equation*}
  </div>
  <p>where \(x^{\star}\) is the minimizer of \(f\) and</p>
  <div class="math">
\begin{equation*}
\mathcal{V}(k)
=Q_{1,1}\|x^{k}-x^{\star}\|^{2}
+2Q_{1,2}\langle x^{k}-x^{\star},\nabla f(x^{k})\rangle
+Q_{2,2}\|\nabla f(x^{k})\|^{2}
+q(f(x^{k})-f(x^{\star})).
\end{equation*}
  </div>
  <p>If \(d\geqslant4\) and \(\varepsilon>0\), the inequality is an equality.</p>
  <details class="proof-disclosure" id="fixed-lyapunov-coefficients">
    <summary><span class="proof-show">Show coefficient matrices</span><span class="proof-hide">Hide coefficient matrices</span></summary>
    <div class="proof-content">
  <p>The coefficient matrices and vectors are</p>
  <div class="math">
\begin{equation*}
S=\begin{bmatrix}1&0&0&0\\0&1&0&0\end{bmatrix},\qquad
S_+=\begin{bmatrix}1&0&0&-\gamma\\0&0&1&\phantom{-}0\end{bmatrix},\qquad
A_{\mathrm{err}}=\begin{bmatrix}0&\phantom{-}0&0&\phantom{-}0\\0&\phantom{-}1-\varepsilon^{2}&0&-1\\0&\phantom{-}0&0&\phantom{-}0\\0&-1&0&\phantom{-}1\end{bmatrix},
\end{equation*}
  </div>
  <div class="math">
\begin{equation*}
\begin{alignedat}{2}
A_{k,\star}&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\phantom{-}\mu L&-\mu&0&0\\
-\mu&\phantom{-}1&0&0\\
\phantom{-}0&\phantom{-}0&0&0\\
\phantom{-}0&\phantom{-}0&0&0
\end{bmatrix},\qquad &A_{\star,k}&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\phantom{-}\mu L&-L&0&0\\
-L&\phantom{-}1&0&0\\
\phantom{-}0&\phantom{-}0&0&0\\
\phantom{-}0&\phantom{-}0&0&0
\end{bmatrix},\\[0.8em]
A_{k+1,\star}&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\phantom{-}\mu L&0&-\mu&-\gamma\mu L\\
\phantom{-}0&0&\phantom{-}0&\phantom{-}0\\
-\mu&0&\phantom{-}1&\phantom{-}\gamma\mu\\
-\gamma\mu L&0&\phantom{-}\gamma\mu&\phantom{-}\gamma^{2}\mu L
\end{bmatrix},\qquad &A_{\star,k+1}&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\phantom{-}\mu L&0&-L&-\gamma\mu L\\
\phantom{-}0&0&\phantom{-}0&\phantom{-}0\\
-L&0&\phantom{-}1&\phantom{-}\gamma L\\
-\gamma\mu L&0&\phantom{-}\gamma L&\phantom{-}\gamma^{2}\mu L
\end{bmatrix},\\[0.8em]
A_{k,k+1}&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
0&\phantom{-}0&\phantom{-}0&\phantom{-}0\\
0&\phantom{-}1&-1&-\gamma\mu\\
0&-1&\phantom{-}1&\phantom{-}\gamma L\\
0&-\gamma\mu&\phantom{-}\gamma L&\phantom{-}\gamma^{2}\mu L
\end{bmatrix},\qquad &A_{k+1,k}&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
0&\phantom{-}0&\phantom{-}0&\phantom{-}0\\
0&\phantom{-}1&-1&-\gamma L\\
0&-1&\phantom{-}1&\phantom{-}\gamma\mu\\
0&-\gamma L&\phantom{-}\gamma\mu&\phantom{-}\gamma^{2}\mu L
\end{bmatrix},
\end{alignedat}
\end{equation*}
  </div>
  <p>and</p>
  <div class="math">
\begin{equation*}
a_{k,\star}=-a_{\star,k}=\begin{bmatrix}-1\\\phantom{-}0\end{bmatrix},\qquad
a_{k+1,\star}=-a_{\star,k+1}=\begin{bmatrix}\phantom{-}0\\-1\end{bmatrix},\qquad
a_{k,k+1}=-a_{k+1,k}=\begin{bmatrix}-1\\\phantom{-}1\end{bmatrix}.
\end{equation*}
  </div>
    </div>
  </details>
</div>

##### 2.4 Numerical results
{: #numerical-results aria-level="3"}

<p class="numerical-solver-note">The numerical results were obtained with MOSEK \cite{Mos26}.</p>

We now compute $$\rho^{\mathrm{SDP}}(Q,q,\gamma,\varepsilon,\mu,L)$$ in the case of the squared distance to the solution and the function-value suboptimality. Recall from \eqref{eq:lyapunov-examples} that

$$
\mathcal{V}(k)=\begin{cases}
\|x^{k}-x^{\star}\|^{2},
&\text{if }Q=\mathord{\begin{bmatrix}1&0\\0&0\end{bmatrix}}\;\text{and}\; q=0,\\[0.5em]
f(x^{k})-f(x^{\star}),
&\text{if }Q=0\;\text{and}\; q=1.
\end{cases}
$$

These two choices give

$$
\begin{aligned}
\rho_{\mathtt{norm}^{2}}(\gamma,\varepsilon,\mu,L)
&=\rho^{\mathrm{SDP}}\left(\begin{bmatrix}1&0\\0&0\end{bmatrix},0,\gamma,\varepsilon,\mu,L\right),\\[0.5em]
\rho_{\mathtt{func}}(\gamma,\varepsilon,\mu,L)
&=\rho^{\mathrm{SDP}}(0,1,\gamma,\varepsilon,\mu,L).
\end{aligned}
$$

The resulting one-step guarantees are

$$
\begin{aligned}
\|x^{k+1}-x^{\star}\|^{2}
&\leqslant\rho_{\mathtt{norm}^{2}}(\gamma,\varepsilon,\mu,L)\|x^{k}-x^{\star}\|^{2},\\
f(x^{k+1})-f(x^{\star})
&\leqslant\rho_{\mathtt{func}}(\gamma,\varepsilon,\mu,L)(f(x^{k})-f(x^{\star})).
\end{aligned}
$$

Figure 2 compares these factors as the step size $$\gamma$$ varies.

{% include lyapunov-contraction-figure.liquid %}

At the sampled parameter values, the numerical results suggest that function-value suboptimality gives a one-step contraction factor no larger than that for the squared distance to the solution.
We therefore study the function-value case further by solving $$\mathcal{D}^{\mathrm{SDP}}(0,1,\gamma,\varepsilon,\mu,L,\rho)$$ with the candidate factor suggested by fitting the numerical data in Figure 2:

<div class="math">
\begin{equation}
\label{eq:fitted-function-factor}
\rho = \mathop{\text{max}}\{(1-\gamma\mu(1-\varepsilon))^{2},\,(1-\gamma L(1+\varepsilon))^{2}\}.
\end{equation}
</div>

Figure 3 shows the multipliers returned by the solver. These need not be unique; we look for simple patterns that can guide an explicit proof.

{% include lyapunov-multipliers-figure.liquid %}

##### 2.5 From numerical multipliers to an exact proof
{: #closed-form-expressions aria-level="3"}

Fixing all multipliers to the fitted expressions in Figure 3 preserves feasibility at the checked sample points. We now show directly that, for $$\varepsilon\in(0,1)$$ and $$\gamma\in(0,\tfrac{2}{L(1+\varepsilon)})$$, the factor

$$
\rho_{\mathtt{func}} = \rho_{\mathtt{func}}(\gamma,\varepsilon,\mu,L)
=\mathop{\text{max}}\{(1-\gamma\mu(1-\varepsilon))^{2},\,(1-\gamma L(1+\varepsilon))^{2}\}\in[0,1)
$$

can be certified using the following multipliers, obtained by fitting the numerical data in Figure 3:

<div class="table-responsive function-gap-multipliers">
  <table aria-label="Suggested function-value contraction multipliers">
    <thead>
      <tr>
        <th scope="col">\(\tau\)</th>
        <th scope="col">\(\lambda_{k,\star}\)</th>
        <th scope="col">\(\lambda_{\star,k}\)</th>
        <th scope="col">\(\lambda_{k+1,\star}\)</th>
        <th scope="col">\(\lambda_{\star,k+1}\)</th>
        <th scope="col">\(\lambda_{k,k+1}\)</th>
        <th scope="col">\(\lambda_{k+1,k}\)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>\(\tfrac{\gamma\sqrt{\rho_{\mathtt{func}}}}{2\varepsilon}\)</td>
        <td>\(0\)</td>
        <td>\(\sqrt{\rho_{\mathtt{func}}}(1-\sqrt{\rho_{\mathtt{func}}})\)</td>
        <td>\(0\)</td>
        <td>\(1-\sqrt{\rho_{\mathtt{func}}}\)</td>
        <td>\(\sqrt{\rho_{\mathtt{func}}}\)</td>
        <td>\(0\)</td>
      </tr>
    </tbody>
  </table>
</div>

Indeed, following the dual-certificate argument in $$\eqref{eq:dual-certificate-bound}$$, we combine the relative-error condition and the three interpolation inequalities below, using the multipliers indicated on the right:
<div class="math">
\begin{equation*}
\begin{alignedat}{2}
\norm{\nabla f(x^k)-d^k}^2-\varepsilon^2\norm{\nabla f(x^k)}^2
&\leqslant0
&\;:\ &\tau,\\[0.5em]
f(x^k)-f(x^{\star})+\inner{\nabla f(x^k)}{x^{\star}-x^k}
+\tfrac{\mu}{2}\norm{x^{\star}-x^k}^2
+\tfrac{1}{2(L-\mu)}\norm{\nabla f(x^{\star})-\nabla f(x^k)-\mu(x^{\star}-x^k)}^2
&\leqslant0
&\;:\ &\lambda_{\star,k},\\[0.5em]
f(x^{k+1})-f(x^{\star})+\inner{\nabla f(x^{k+1})}{x^{\star}-x^{k+1}}
+\tfrac{\mu}{2}\norm{x^{\star}-x^{k+1}}^2
+\tfrac{1}{2(L-\mu)}\norm{\nabla f(x^{\star})-\nabla f(x^{k+1})-\mu(x^{\star}-x^{k+1})}^2
&\leqslant0
&\;:\ &\lambda_{\star,k+1},\\[0.5em]
f(x^{k+1})-f(x^k)+\inner{\nabla f(x^{k+1})}{x^k-x^{k+1}}
+\tfrac{\mu}{2}\norm{x^k-x^{k+1}}^2
+\tfrac{1}{2(L-\mu)}
\norm{\nabla f(x^k)-\nabla f(x^{k+1})-\mu(x^k-x^{k+1})}^2
&\leqslant0
&\;:\ &\lambda_{k,k+1}.
\end{alignedat}
\end{equation*}
</div>
The function-value terms in the weighted sum give the difference on the left below. After substituting $$x^{k+1}=x^k-\gamma d^k$$ and $$\nabla f(x^\star)=0$$, we move the remaining quadratic terms to the right and complete squares to obtain
<div class="math">
\begin{equation}
\label{eq:function-value-sos-bound}
\begin{aligned}
&f(x^{k+1})-f(x^{\star})-\rho_{\mathtt{func}}(f(x^k)-f(x^{\star}))\\
&\leqslant\begin{aligned}[t]
&-\underbracket{\tfrac{1}{2(L-\mu)}}_{>0}
\left\lVert\nabla f(x^{k+1})-\sqrt{\rho_{\mathtt{func}}}\nabla f(x^k)-L\left(1-\sqrt{\rho_{\mathtt{func}}}\right)(x^k-x^{\star})+\gamma Ld^k\right\rVert^2\\
&-\underbracket{\tfrac{\gamma}{2\varepsilon\left(\sqrt{\rho_{\mathtt{func}}}-\varepsilon\gamma L\right)}}_{>0}
\left\lVert\left(\sqrt{\rho_{\mathtt{func}}}-\varepsilon\gamma L\right)d^k-\sqrt{\rho_{\mathtt{func}}}(1-\varepsilon)\nabla f(x^k)+\varepsilon L\left(1-\sqrt{\rho_{\mathtt{func}}}\right)(x^k-x^{\star})\right\rVert^2\\
&-\underbracket{\tfrac{\gamma L\sqrt{\rho_{\mathtt{func}}}(1-\varepsilon)
\left(1+\sqrt{\rho_{\mathtt{func}}}-\gamma L(1+\varepsilon)\right)}
{2(L-\mu)\left(\sqrt{\rho_{\mathtt{func}}}-\varepsilon\gamma L\right)}}_{\geqslant0}
\norm{\nabla f(x^k)-\mu(x^k-x^{\star})}^2\\
&-\underbracket{\tfrac{\sqrt{\rho_{\mathtt{func}}}
\left(1-\sqrt{\rho_{\mathtt{func}}}\right)
\left(\sqrt{\rho_{\mathtt{func}}}-1+\gamma\mu(1-\varepsilon)\right)}
{2(L-\mu)\left(\sqrt{\rho_{\mathtt{func}}}-\varepsilon\gamma L\right)}}_{\geqslant0}
\norm{\nabla f(x^k)-L(x^k-x^{\star})}^2
\end{aligned}\\
&\leqslant0,
\end{aligned}
\end{equation}
</div>
which establishes $$f(x^{k+1})-f(x^{\star})\leqslant\rho_{\mathtt{func}}(f(x^k)-f(x^{\star}))$$. The key point is how nonnegative weights combine known inequalities into a contraction bound, following the argument in $$\eqref{eq:dual-certificate-bound}$$; the nonpositive sum of weighted squares in \eqref{eq:function-value-sos-bound} explicitly represents $$\mathcal{L}(G,F,\tau,\lambda)$$.

The function-value contraction factor

$$
\rho_{\mathtt{func}}(\gamma,\varepsilon,\mu,L)=\mathop{\text{max}}\{(1-\gamma\mu(1-\varepsilon))^2,\,(1-\gamma L(1+\varepsilon))^2\}
$$

is minimized when its two terms are equal, at

$$
\gamma_\star=\tfrac{2}{\mu(1-\varepsilon)+L(1+\varepsilon)},
$$

with minimum value

$$
\rho_{\mathtt{func}}(\gamma_\star,\varepsilon,\mu,L)
=\left(\tfrac{L(1+\varepsilon)-\mu(1-\varepsilon)}{L(1+\varepsilon)+\mu(1-\varepsilon)}\right)^2.
$$

**Tightness.** For every $$d\in\mathbb{N}$$ and $$\gamma\in(0,\tfrac{2}{L(1+\varepsilon)})$$, there exist $$f\in\mathcal{F}_{\mu,L}(\mathbb{R}^d)$$ and a step of $$\eqref{eq:relatively-inexact-gradient-method}$$ with $$x^k\ne x^\star$$ such that
<div class="math">
\begin{equation*}
f(x^{k+1})-f(x^\star)=\rho_{\mathtt{func}}(\gamma,\varepsilon,\mu,L)(f(x^k)-f(x^\star)).
\end{equation*}
</div>

<details class="proof-disclosure" id="function-value-tightness-proof">
  <summary><span class="proof-show">Show proof</span><span class="proof-hide">Hide proof</span></summary>
  <div class="proof-content">
    <p>In both cases below, take \(x^k\ne0\).</p>
    <ul>
      <li>
        <p>For \(0<\gamma\leqslant\gamma_\star\), choose</p>

  <div class="math">
  \begin{equation*}
  f=\tfrac{\mu}{2}\norm{\cdot}^2\in\mathcal{F}_{\mu,L}(\mathbb{R}^d),\quad x^\star=0,\quad d^k=(1-\varepsilon)\nabla f(x^k).
  \end{equation*}
  </div>

        <p>Substituting into \(\eqref{eq:relatively-inexact-gradient-method}\) gives</p>

  <div class="math">
  \begin{equation*}
  \norm{\nabla f(x^k)-d^k}=\varepsilon\norm{\nabla f(x^k)},\qquad x^{k+1}=x^k-\gamma d^k=(1-\gamma\mu(1-\varepsilon))x^k,
  \end{equation*}
  </div>

        <p>and hence</p>

  <div class="math">
  \begin{equation*}
  f(x^{k+1})-f(x^\star)=(1-\gamma\mu(1-\varepsilon))^2(f(x^k)-f(x^\star))=\rho_{\mathtt{func}}(\gamma,\varepsilon,\mu,L)(f(x^k)-f(x^\star)).
  \end{equation*}
  </div>

      </li>
      <li>
        <p>For \(\gamma_\star<\gamma<\tfrac{2}{L(1+\varepsilon)}\), choose</p>

  <div class="math">
  \begin{equation*}
  f=\tfrac{L}{2}\norm{\cdot}^2\in\mathcal{F}_{\mu,L}(\mathbb{R}^d),\quad x^\star=0,\quad d^k=(1+\varepsilon)\nabla f(x^k).
  \end{equation*}
  </div>

        <p>Substituting into \(\eqref{eq:relatively-inexact-gradient-method}\) gives</p>

  <div class="math">
  \begin{equation*}
  \norm{\nabla f(x^k)-d^k}=\varepsilon\norm{\nabla f(x^k)},\qquad x^{k+1}=x^k-\gamma d^k=(1-\gamma L(1+\varepsilon))x^k,
  \end{equation*}
  </div>

        <p>and hence</p>

  <div class="math">
  \begin{equation*}
  f(x^{k+1})-f(x^\star)=(1-\gamma L(1+\varepsilon))^2(f(x^k)-f(x^\star))=\rho_{\mathtt{func}}(\gamma,\varepsilon,\mu,L)(f(x^k)-f(x^\star)).
  \end{equation*}
  </div>
      </li>
    </ul>
  </div>
</details>

**Optional: Exact gradients.** For $$\varepsilon=0$$ and $$0<\gamma<\tfrac{2}{L}$$, we recover the known sharp function-value bound for the gradient method \nocite{THG18}[<a href="#THG18">THG18</a>, Theorem 3.3]:

$$
f(x^{k+1})-f(x^\star)\leqslant\mathop{\text{max}}\{(1-\gamma\mu)^2,(1-\gamma L)^2\}(f(x^k)-f(x^\star)).
$$

This follows by letting $$\varepsilon\downarrow0$$ in the contraction bound while keeping the exact-gradient step fixed.

<p class="numerical-solver-note"><strong>Related literature.</strong> Gannot \nocite{Gan22}[<a href="#Gan22">Gan22</a>, Remark 1.6] states \(f(x^{k+1})-f(x^\star)\leqslant\rho_{\mathtt{func}}(\gamma,\varepsilon,\mu,L)(f(x^k)-f(x^\star))\), drawing on a proof by Etienne de Klerk, François Glineur, and Adrien B. Taylor \nocite{dKGT20}[<a href="#dKGT20">dKGT20</a>, Appendix B]. A proof for \(\gamma\in(0,\gamma_\star]\) is given by Uschmajew and Vandereycken \nocite{UV22}[<a href="#UV22">UV22</a>, Theorem 4.2].</p>

##### 2.6 Optional: Reducing the certificate to two squared norms
{: #optional-simpler-proof-using-weaker-inequalities aria-level="3"}

<details class="proof-disclosure fitted-curvature-proof">
  <summary><span class="proof-show">Show proof</span><span class="proof-hide">Hide proof</span></summary>
  <div class="proof-content">
    <p>We can simplify the sum of squares in \(\eqref{eq:function-value-sos-bound}\) by using weaker interpolation inequalities, while keeping the same contraction factor. We choose weaker curvature bounds that make the prescribed step size \(\gamma\) optimal for the larger function class. The same idea is used for exact gradients in \nocite{TUG26}[<a href="#TUG26">TUG+26</a>, Section 4.1.2].</p>
    <p>For \(\varepsilon\in(0,1)\) and \(\gamma\in(0,\tfrac{2}{L(1+\varepsilon)})\), keep \(\rho_{\mathtt{func}}=\rho_{\mathtt{func}}(\gamma,\varepsilon,\mu,L)\) from <a href="#closed-form-expressions">Section 2.5</a> and set</p>
    <div class="math">
\begin{equation*}
\mu_\gamma=\tfrac{1-\sqrt{\rho_{\mathtt{func}}}}{\gamma(1-\varepsilon)},
\qquad
L_\gamma=\tfrac{1+\sqrt{\rho_{\mathtt{func}}}}{\gamma(1+\varepsilon)}.
\end{equation*}
    </div>
    <p>These parameters satisfy</p>
    <div class="math">
\begin{equation*}
0<\mu_\gamma\leqslant\mu<L\leqslant L_\gamma,
\qquad
\mathcal{F}_{\mu,L}(\mathbb{R}^d)\subseteq\mathcal{F}_{\mu_\gamma,L_\gamma}(\mathbb{R}^d),
\end{equation*}
    </div>
    <p>so the interpolation inequalities remain valid with \(\mu_\gamma,L_\gamma\). Moreover,</p>
    <div class="math">
\begin{equation*}
\gamma=\tfrac{2}{\mu_\gamma(1-\varepsilon)+L_\gamma(1+\varepsilon)},
\qquad
1-\gamma\mu_\gamma(1-\varepsilon)=\gamma L_\gamma(1+\varepsilon)-1=\sqrt{\rho_{\mathtt{func}}}.
\end{equation*}
    </div>
    <p>Thus \(\gamma\) minimizes the contraction factor for the larger class, and</p>
    <div class="math">
\begin{equation*}
\rho_{\mathtt{func}}(\gamma,\varepsilon,\mu_\gamma,L_\gamma)
=\rho_{\mathtt{func}}(\gamma,\varepsilon,\mu,L).
\end{equation*}
    </div>
    <p>We now combine the same four inequalities as in <a href="#closed-form-expressions">Section 2.5</a>, using the same multipliers and replacing \(\mu,L\) by \(\mu_\gamma,L_\gamma\) in the three interpolation inequalities. After substituting \(x^{k+1}=x^k-\gamma d^k\) and \(\nabla f(x^\star)=0\), their weighted sum gives</p>
    <div class="math">
\begin{equation}
\label{eq:fitted-curvature-sos-bound}
\begin{aligned}
&f(x^{k+1})-f(x^{\star})-\rho_{\mathtt{func}}(f(x^k)-f(x^{\star}))\\
&\leqslant\begin{aligned}[t]
&-\underbracket{\tfrac{1}{2(L_\gamma-\mu_\gamma)}}_{>0}
\left\lVert\nabla f(x^{k+1})-\sqrt{\rho_{\mathtt{func}}}\nabla f(x^k)-L_\gamma\left(1-\sqrt{\rho_{\mathtt{func}}}\right)(x^k-x^{\star})+\gamma L_\gamma d^k\right\rVert^2\\
&-\underbracket{\tfrac{\gamma}{2\varepsilon\left(\sqrt{\rho_{\mathtt{func}}}-\varepsilon\gamma L_\gamma\right)}}_{>0}
\left\lVert\left(\sqrt{\rho_{\mathtt{func}}}-\varepsilon\gamma L_\gamma\right)d^k-\sqrt{\rho_{\mathtt{func}}}(1-\varepsilon)\nabla f(x^k)+\varepsilon L_\gamma\left(1-\sqrt{\rho_{\mathtt{func}}}\right)(x^k-x^{\star})\right\rVert^2
\end{aligned}\\
&\leqslant0.
\end{aligned}
\end{equation}
    </div>
    <p>Replacing \(\mu,L\) by \(\mu_\gamma,L_\gamma\) makes the final two coefficients in \(\eqref{eq:function-value-sos-bound}\) vanish. The resulting proof is simpler in the sense that it establishes the same contraction inequality with two squared norms instead of four.</p>
  </div>
</details>

#### 3. Searching for Lyapunov functions
{: #searching-for-lyapunov-functions aria-level="2"}

In [Section 2](#fixed-lyapunov-functions), we compared the one-step contraction factors obtained from squared distance to the solution and function-value suboptimality. A contracting Lyapunov function that bounds a performance measure from above can certify a faster asymptotic rate than a direct contraction bound for that measure, or establish convergence even when the measure does not contract at every iteration. Here we search for such a Lyapunov function within a chosen family. We illustrate this search using stationary gradient methods with memory to solve $$\eqref{eq:optimization-problem}$$, i.e., to minimize a function $$f\in\mathcal{F}_{\mu,L}(\mathbb{R}^d)$$.

##### 3.1 Stationary gradient methods with memory
{: #gradient-methods-with-memory aria-level="3"}

Given constants $$\gamma>0$$ and $$\alpha,\beta\in\mathbb{R}$$, and initial points $$x^{0},x^{-1}\in\mathbb{R}^{d}$$, consider

<div class="math">
\begin{equation}
\label{eq:gradient-method-with-memory}
\left[
\begin{aligned}
y^{k} &= x^{k}+\alpha(x^{k}-x^{k-1}),\\
x^{k+1} &= x^{k}-\gamma\nabla f(y^{k})+\beta(x^{k}-x^{k-1}).
\end{aligned}
\right.
\end{equation}
</div>

The method is called stationary because $$\gamma$$, $$\alpha$$, and $$\beta$$ are constant across iterations. In the table below, we give some standard choices of $$\gamma$$, $$\alpha$$, and $$\beta$$.

<figure class="two-step-methods">
  <div class="table-responsive">
    <table aria-label="Standard parameter choices for gradient methods with memory">
      <thead>
        <tr>
          <th scope="col">Method</th>
          <th scope="col">\(\gamma\)</th>
          <th scope="col">\(\beta\)</th>
          <th scope="col">\(\alpha\)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Gradient method<sup><a href="#method-parameter-note-1">1</a></sup></td>
          <td>\(\tfrac{2}{L+\mu}\)</td>
          <td>\(0\)</td>
          <td>\(0\)</td>
        </tr>
        <tr>
          <td>Polyak's heavy-ball method<sup><a href="#method-parameter-note-2">2</a></sup></td>
          <td>\(\tfrac{4}{(\sqrt{L}+\sqrt{\mu})^{2}}\)</td>
          <td>\(\bigl(\tfrac{\sqrt{L}-\sqrt{\mu}}{\sqrt{L}+\sqrt{\mu}}\bigr)^{2}\)</td>
          <td>\(0\)</td>
        </tr>
        <tr>
          <td>Nesterov's method<sup><a href="#method-parameter-note-3">3</a></sup></td>
          <td>\(\tfrac{1}{L}\)</td>
          <td>\(\tfrac{\sqrt{L}-\sqrt{\mu}}{\sqrt{L}+\sqrt{\mu}}\)</td>
          <td>\(\tfrac{\sqrt{L}-\sqrt{\mu}}{\sqrt{L}+\sqrt{\mu}}\)</td>
        </tr>
        <tr>
          <td>Triple momentum method<sup><a href="#method-parameter-note-4">4</a></sup></td>
          <td>\(\tfrac{2\sqrt{L}-\sqrt{\mu}}{L\sqrt{L}}\)</td>
          <td>\(\tfrac{(\sqrt{L}-\sqrt{\mu})^{2}}{\sqrt{L}(\sqrt{L}+\sqrt{\mu})}\)</td>
          <td>\(\tfrac{(\sqrt{L}-\sqrt{\mu})^{2}}{(2\sqrt{L}-\sqrt{\mu})(\sqrt{L}+\sqrt{\mu})}\)</td>
        </tr>
      </tbody>
    </table>
  </div>
</figure>

<ol class="method-parameter-notes numerical-solver-note">
  <li id="method-parameter-note-1">Gradient method: Optimal constant step size for worst-case distance contraction on \(\mathcal{F}_{\mu,L}(\mathbb{R}^{d})\) \nocite{Pol63,Nes18}[<a href="#Pol63">Pol63</a>, Theorem 6; <a href="#Nes18">Nes18</a>, Theorem 2.1.15].</li>
  <li id="method-parameter-note-2">Polyak's heavy-ball method: Optimal parameters for worst-case asymptotic convergence on quadratics in \(\mathcal{F}_{\mu,L}(\mathbb{R}^{d})\) \nocite{Pol64}[<a href="#Pol64">Pol64</a>, Theorem 9(3) and the note on p. 15].</li>
  <li id="method-parameter-note-3">Nesterov's method: Optimal dimension-independent decay exponent for convergence in distance on \(\mathcal{F}_{\mu,L}(\mathbb{R}^{d})\), up to constant factors \nocite{Nes18,DT22}[<a href="#Nes18">Nes18</a>, Theorem 2.2.1 and Equation (2.2.22); <a href="#DT22">DT22</a>, Corollary 3].</li>
  <li id="method-parameter-note-4">Triple momentum method \nocite{VSFL18}[<a href="#VSFL18">VSFL18</a>, Definition 2]: Optimal dimension-independent decay exponent for convergence in distance on \(\mathcal{F}_{\mu,L}(\mathbb{R}^{d})\) \nocite{DT22}[<a href="#DT22">DT22</a>, Corollary 3].</li>
</ol>

##### 3.2 Choosing a family of Lyapunov functions
{: #choosing-a-family-of-lyapunov-functions aria-level="3"}

To establish a convergence rate for a nonnegative performance measure $$\mathcal{M}$$, we look for a Lyapunov function $$\mathcal{V}$$ and a contraction factor $$\rho\in[0,1)$$ satisfying
<div class="math">
\begin{align}
\mathcal{V}(k+1)&\leqslant\rho\mathcal{V}(k),
\tag{C1}\label{eq:memory-lyapunov-contraction}\\
\mathcal{V}(k)&\geqslant\mathcal{M}(k)\geqslant0,
\tag{C2}\label{eq:memory-lyapunov-lower-bound}
\end{align}
</div>
for every $$k\geqslant0$$, every $$f\in\mathcal{F}_{\mu,L}(\mathbb{R}^d)$$, and every trajectory of $$\eqref{eq:gradient-method-with-memory}$$.

Condition $$\eqref{eq:memory-lyapunov-contraction}$$ requires the Lyapunov function to contract, but imposing it alone would allow the trivial choice $$\mathcal{V}\equiv0$$, regardless of $$\mathcal{M}$$. Condition $$\eqref{eq:memory-lyapunov-lower-bound}$$ connects the Lyapunov function to the performance measure by requiring $$\mathcal{V}$$ to bound $$\mathcal{M}$$ from above. Iterating $$\eqref{eq:memory-lyapunov-contraction}$$ and applying $$\eqref{eq:memory-lyapunov-lower-bound}$$ then gives, for $$k\geqslant0$$,
<div class="math">
\begin{equation*}
0\leqslant\mathcal{M}(k)\leqslant\mathcal{V}(k)\leqslant\rho^k\mathcal{V}(0)
\quad\Longrightarrow\quad
\mathcal{M}(k)\in\mathcal{O}(\rho^k)
\quad\text{as}\quad k\to\infty.
\end{equation*}
</div>
Thus, the performance measure $$\mathcal{M}$$ converges linearly to zero with rate at most $$\rho$$. We can therefore keep the performance measure $$\mathcal{M}$$ fixed and search for a contracting upper bound $$\mathcal{V}$$.

We restrict $$\mathcal{V}$$ and $$\mathcal{M}$$ to the following forms:
<div class="math">
\begin{align}
\mathcal{V}(k)
&=\inner{(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k))}{(Q\otimes I_d)(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k))}
+q(f(y^k)-f(x^\star)),
\label{eq:memory-lyapunov-ansatz}\\
\mathcal{M}(k)
&=\inner{(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k))}{(P\otimes I_d)(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k))}
+p(f(y^k)-f(x^\star)),
\label{eq:memory-performance-ansatz}
\end{align}
</div>
where $$Q,P\in\mathbb{S}^3$$ and $$q,p\in\mathbb{R}$$. We fix $$P,p$$ to specify a nonnegative performance measure, i.e., $$\mathcal{M}(k)\geqslant0$$, and search for $$Q,q$$ such that $$\eqref{eq:memory-lyapunov-contraction}$$ and $$\eqref{eq:memory-lyapunov-lower-bound}$$ hold.

For example, this family includes
<div class="math">
\begin{equation*}
\mathcal{M}(k)=
\begin{cases}
\norm{x^k-x^\star}^2,
&\text{if }P=\mathop{\text{diag}}(1,0,0)\;\text{and}\; p=0,\\[0.5em]
\norm{y^k-x^\star}^2,
&\text{if }P=\mathord{\begin{bmatrix}\phantom{-}(1+\alpha)^2&-\alpha(1+\alpha)&0\\-\alpha(1+\alpha)&\phantom{-}\alpha^2&0\\\phantom{-}0&\phantom{-}0&0\end{bmatrix}}\;\text{and}\; p=0,\\[0.5em]
f(y^k)-f(x^\star),
&\text{if }P=0\;\text{and}\; p=1,\\[0.5em]
\norm{\nabla f(y^k)}^2,
&\text{if }P=\mathop{\text{diag}}(0,0,1)\;\text{and}\; p=0.
\end{cases}
\end{equation*}
</div>

##### 3.3 Optimal contraction via semidefinite programming
{: #searching-via-semidefinite-feasibility aria-level="3"}

Adapting the argument of [Section 2.3](#optimal-contraction-via-semidefinite-programming) separately to $$\eqref{eq:memory-lyapunov-contraction}$$ and the inequality $$\mathcal{V}(k)\geqslant\mathcal{M}(k)$$ in $$\eqref{eq:memory-lyapunov-lower-bound}$$ gives [Theorem 3](#theorem-memory-certificates). Nonnegativity of $$\mathcal{M}$$ is ensured by our choice of $$P,p$$. For completeness, we include a proof for the interested reader after the formal statement.

<div class="interpolation-theorem" id="theorem-memory-certificates" role="note" aria-labelledby="memory-certificate-theorem-title">
  <p id="memory-certificate-theorem-title"><strong><a href="#theorem-memory-certificates">Theorem 3</a> (Semidefinite tests for the Lyapunov inequalities).</strong></p>
  <p>Fix \(d\in\mathbb{N}\), \(0<\mu<L\), \(\gamma>0\), \(\alpha,\beta\in\mathbb{R}\), \(\rho\in[0,1)\), \(Q,P\in\mathbb{S}^{3}\), and \(q,p\in\mathbb{R}\). Consider \(\mathcal{V}\) and \(\mathcal{M}\) in \(\eqref{eq:memory-lyapunov-ansatz}\)–\(\eqref{eq:memory-performance-ansatz}\) along the method \(\eqref{eq:gradient-method-with-memory}\). With \(S,S_+\in\mathbb{R}^{3\times4}\), \(A_{i,j}^{\mathrm{C1}}\in\mathbb{S}^{4}\), \(a_{i,j}^{\mathrm{C1}}\in\mathbb{R}^{2}\), \(A_{i,j}^{\mathrm{C2}}\in\mathbb{S}^{3}\), and \(a_{i,j}^{\mathrm{C2}}\in\mathbb{R}\) defined below, the following tests apply.</p>
  <ul>
    <li>
      <p><strong>Contraction.</strong> Condition \(\eqref{eq:memory-lyapunov-contraction}\) holds for every \(f\in\mathcal{F}_{\mu,L}(\mathbb{R}^{d})\), every \(x^0,x^{-1}\in\mathbb{R}^{d}\), and every \(k\geqslant0\), if the semidefinite feasibility problem</p>
      <div class="math">
\begin{equation}
\label{eq:memory-contraction-certificate}
\begin{array}{cl}
\text{find}
&\lambda_{i,j}^{\mathrm{C1}}\in\mathbb{R}\mathord{,}\quad\text{for each pair of distinct indices}\quad i,j\in\{k,k+1,\star\}\\[0.6em]
\text{subject to}
&\lambda_{i,j}^{\mathrm{C1}}\geqslant0\mathord{,}\quad\text{for each pair of distinct indices}\quad i,j\in\{k,k+1,\star\},\\
&\displaystyle\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}^{\mathrm{C1}}A_{i,j}^{\mathrm{C1}}
-(S_+^{\top}QS_+-\rho S^{\top}QS)\succcurlyeq0,\\
&\displaystyle\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}^{\mathrm{C1}}a_{i,j}^{\mathrm{C1}}
-q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}=0
\end{array}
\end{equation}
      </div>
      <p>is feasible. This condition is also necessary if \(d\geqslant4\).</p>
    </li>
    <li>
      <p><strong>Lower bound.</strong> The inequality \(\mathcal{V}(k)\geqslant\mathcal{M}(k)\) in \(\eqref{eq:memory-lyapunov-lower-bound}\) holds for every \(f\in\mathcal{F}_{\mu,L}(\mathbb{R}^{d})\), every \(x^0,x^{-1}\in\mathbb{R}^{d}\), and every \(k\geqslant0\), if the semidefinite feasibility problem</p>
      <div class="math">
\begin{equation}
\label{eq:memory-lower-bound-certificate}
\begin{array}{cl}
\text{find}
&\lambda_{k,\star}^{\mathrm{C2}},\lambda_{\star,k}^{\mathrm{C2}}\in\mathbb{R}\\[0.6em]
\text{subject to}
&\lambda_{k,\star}^{\mathrm{C2}},\lambda_{\star,k}^{\mathrm{C2}}\geqslant0,\\
&Q-P+\lambda_{k,\star}^{\mathrm{C2}}A_{k,\star}^{\mathrm{C2}}
+\lambda_{\star,k}^{\mathrm{C2}}A_{\star,k}^{\mathrm{C2}}\succcurlyeq0,\\
&\lambda_{k,\star}^{\mathrm{C2}}a_{k,\star}^{\mathrm{C2}}
+\lambda_{\star,k}^{\mathrm{C2}}a_{\star,k}^{\mathrm{C2}}-(p-q)=0
\end{array}
\end{equation}
      </div>
      <p>is feasible. This condition is also necessary if \(d\geqslant3\).</p>
    </li>
  </ul>
  <p>All the data are fixed in these tests; only the nonnegative multipliers are variables. The indices \(k,k+1,\star\) are point labels, so neither SDP depends on \(k\).</p>
  <details class="proof-disclosure" id="memory-lyapunov-coefficients">
    <summary><span class="proof-show">Show coefficient matrices</span><span class="proof-hide">Hide coefficient matrices</span></summary>
    <div class="proof-content">
  <p>For the contraction test, set</p>
  <div class="math">
\begin{equation*}
S=\begin{bmatrix}1&0&0&0\\0&1&0&0\\0&0&1&0\end{bmatrix},
\qquad
S_+=\begin{bmatrix}1+\beta&-\beta&-\gamma&0\\1&\phantom{-}0&\phantom{-}0&0\\0&\phantom{-}0&\phantom{-}0&1\end{bmatrix},
\end{equation*}
  </div>
  <p>In the symmetric matrices below, each \(\ast\) denotes the entry determined by symmetry.</p>
  <div class="math">
\begin{equation*}
\begin{aligned}
A_{k,\star}^{\mathrm{C1}}&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\mu L(1+\alpha)^2&\!\!-\mu L\alpha(1+\alpha)&\!\!-\mu(1+\alpha)&\!\!0\\
\ast&\!\!\phantom{-}\mu L\alpha^2&\!\!\phantom{-}\mu\alpha&\!\!0\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1&\!\!0\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\ast&\!\!0
\end{bmatrix},\\[0.8em]
A_{\star,k}^{\mathrm{C1}}&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\mu L(1+\alpha)^2&\!\!-\mu L\alpha(1+\alpha)&\!\!-L(1+\alpha)&\!\!0\\
\ast&\!\!\phantom{-}\mu L\alpha^2&\!\!\phantom{-}L\alpha&\!\!0\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1&\!\!0\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\ast&\!\!0
\end{bmatrix},\\[0.8em]
A_{k+1,\star}^{\mathrm{C1}}&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\mu L(1+\beta+\alpha\beta)^2&\!\!-\mu L\beta(1+\alpha)(1+\beta+\alpha\beta)&\!\!-\gamma\mu L(1+\alpha)(1+\beta+\alpha\beta)&\!\!-\mu(1+\beta+\alpha\beta)\\
\ast&\!\!\phantom{-}\mu L\beta^2(1+\alpha)^2&\!\!\phantom{-}\gamma\mu L\beta(1+\alpha)^2&\!\!\phantom{-}\mu\beta(1+\alpha)\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\gamma^2\mu L(1+\alpha)^2&\!\!\phantom{-}\gamma\mu(1+\alpha)\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1
\end{bmatrix},\\[0.8em]
A_{\star,k+1}^{\mathrm{C1}}&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\mu L(1+\beta+\alpha\beta)^2&\!\!-\mu L\beta(1+\alpha)(1+\beta+\alpha\beta)&\!\!-\gamma\mu L(1+\alpha)(1+\beta+\alpha\beta)&\!\!-L(1+\beta+\alpha\beta)\\
\ast&\!\!\phantom{-}\mu L\beta^2(1+\alpha)^2&\!\!\phantom{-}\gamma\mu L\beta(1+\alpha)^2&\!\!\phantom{-}L\beta(1+\alpha)\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\gamma^2\mu L(1+\alpha)^2&\!\!\phantom{-}\gamma L(1+\alpha)\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1
\end{bmatrix},\\[0.8em]
A_{k,k+1}^{\mathrm{C1}}&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\mu L(\alpha-\beta-\alpha\beta)^2&\!\!-\mu L(\alpha-\beta-\alpha\beta)^2&\!\!\phantom{-}\mu(\alpha-\beta-\alpha\beta)(\gamma L(1+\alpha)-1)&\!\!\phantom{-}L(\alpha-\beta-\alpha\beta)\\
\ast&\!\!\phantom{-}\mu L(\alpha-\beta-\alpha\beta)^2&\!\!-\mu(\alpha-\beta-\alpha\beta)(\gamma L(1+\alpha)-1)&\!\!-L(\alpha-\beta-\alpha\beta)\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1-2\gamma\mu(1+\alpha)+\gamma^2\mu L(1+\alpha)^2&\!\!\phantom{-}\gamma L(1+\alpha)-1\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1
\end{bmatrix},\\[0.8em]
A_{k+1,k}^{\mathrm{C1}}&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\mu L(\alpha-\beta-\alpha\beta)^2&\!\!-\mu L(\alpha-\beta-\alpha\beta)^2&\!\!\phantom{-}L(\alpha-\beta-\alpha\beta)(\gamma\mu(1+\alpha)-1)&\!\!\phantom{-}\mu(\alpha-\beta-\alpha\beta)\\
\ast&\!\!\phantom{-}\mu L(\alpha-\beta-\alpha\beta)^2&\!\!-L(\alpha-\beta-\alpha\beta)(\gamma\mu(1+\alpha)-1)&\!\!-\mu(\alpha-\beta-\alpha\beta)\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1-2\gamma L(1+\alpha)+\gamma^2\mu L(1+\alpha)^2&\!\!\phantom{-}\gamma\mu(1+\alpha)-1\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1
\end{bmatrix},
\end{aligned}
\end{equation*}
  </div>
  <div class="math">
\begin{align*}
a_{k,\star}^{\mathrm{C1}}&=\begin{bmatrix}-1\\\phantom{-}0\end{bmatrix},
&a_{\star,k}^{\mathrm{C1}}&=\begin{bmatrix}\phantom{-}1\\\phantom{-}0\end{bmatrix},\\
a_{k+1,\star}^{\mathrm{C1}}&=\begin{bmatrix}\phantom{-}0\\-1\end{bmatrix},
&a_{\star,k+1}^{\mathrm{C1}}&=\begin{bmatrix}\phantom{-}0\\\phantom{-}1\end{bmatrix},\\
a_{k,k+1}^{\mathrm{C1}}&=\begin{bmatrix}-1\\\phantom{-}1\end{bmatrix},
&a_{k+1,k}^{\mathrm{C1}}&=\begin{bmatrix}\phantom{-}1\\-1\end{bmatrix}.
\end{align*}
  </div>
  <p>For the lower-bound test, set</p>
  <div class="math">
\begin{equation*}
\begin{alignedat}{2}
A_{k,\star}^{\mathrm{C2}}&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\mu L(1+\alpha)^2&-\mu L\alpha(1+\alpha)&-\mu(1+\alpha)\\
\ast&\phantom{-}\mu L\alpha^2&\phantom{-}\mu\alpha\\
\ast&\phantom{-}\ast&\phantom{-}1
\end{bmatrix},\qquad &a_{k,\star}^{\mathrm{C2}}&=-1,\\[0.8em]
A_{\star,k}^{\mathrm{C2}}&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\mu L(1+\alpha)^2&-\mu L\alpha(1+\alpha)&-L(1+\alpha)\\
\ast&\phantom{-}\mu L\alpha^2&\phantom{-}L\alpha\\
\ast&\phantom{-}\ast&\phantom{-}1
\end{bmatrix},\qquad &a_{\star,k}^{\mathrm{C2}}&=1.
\end{alignedat}
\end{equation*}
  </div>
    </div>
  </details>
</div>

<details class="proof-disclosure interpolation-derivation memory-certificate-proof">
  <summary><span class="proof-show">Show proof</span><span class="proof-hide">Hide proof</span></summary>
  <div class="proof-content">
    <p><strong>1. Contraction.</strong> Condition \(\eqref{eq:memory-lyapunov-contraction}\) is equivalent to \(\mathcal{P}_{\mathrm{C1},d}\leqslant0\), where</p>
    <div class="math">
\begin{equation*}
\mathcal{P}_{\mathrm{C1},d}
=\left(
\begin{array}{cl}
\mathop{\text{maximize}}\limits_{\substack{
f\in\mathcal{F}_{\mu,L}(\mathbb{R}^{d})\\
x^{k-1},x^k,x^{k+1},y^k,y^{k+1},x^\star\in\mathbb{R}^{d}
}}
&\mathcal{V}(k+1)-\rho\mathcal{V}(k)\\[0.6em]
\text{subject to}
&\nabla f(x^\star)=0,\\
&y^k=(1+\alpha)x^k-\alpha x^{k-1},\\
&x^{k+1}=(1+\beta)x^k-\beta x^{k-1}-\gamma\nabla f(y^k),\\
&y^{k+1}=(1+\beta(1+\alpha))x^k-\beta(1+\alpha)x^{k-1}-\gamma(1+\alpha)\nabla f(y^k).
\end{array}
\right).
\end{equation*}
    </div>
    <p>To represent both \(\mathcal{V}(k)\) and \(\mathcal{V}(k+1)\), we include the gradients at \(y^k\) and \(y^{k+1}\) alongside \(x^k-x^\star\) and \(x^{k-1}-x^\star\). Set</p>
    <div class="math">
\begin{equation*}
G=\mathtt{Gram}(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k),\nabla f(y^{k+1})),\qquad
F=\begin{bmatrix}f(y^k)-f(x^\star)\\f(y^{k+1})-f(x^\star)\end{bmatrix}.
\end{equation*}
    </div>
    <p>With the selectors</p>
    <div class="math">
\begin{equation*}
S=\begin{bmatrix}1&0&0&0\\0&1&0&0\\0&0&1&0\end{bmatrix},
\qquad
S_+=\begin{bmatrix}1+\beta&-\beta&-\gamma&0\\1&\phantom{-}0&\phantom{-}0&0\\0&\phantom{-}0&\phantom{-}0&1\end{bmatrix},
\end{equation*}
    </div>
    <p>the trace identity in \(\eqref{eq:gram-trace-identities}\) gives</p>
    <div class="math">
\begin{align*}
\mathcal{V}(k)
&=\text{trace}\bigl(Q\,\mathtt{Gram}(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k))\bigr)+q(f(y^k)-f(x^\star))\\
&=\text{trace}\bigl(Q\,\mathtt{Gram}((S\otimes I_d)(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k),\nabla f(y^{k+1})))\bigr)+q(f(y^k)-f(x^\star))\\
&=\text{trace}(S^{\top}QS G)+q\begin{bmatrix}1\\0\end{bmatrix}^{\top}F,\\[0.5em]
\mathcal{V}(k+1)
&=\text{trace}\bigl(Q\,\mathtt{Gram}(x^{k+1}-x^\star,x^k-x^\star,\nabla f(y^{k+1}))\bigr)+q(f(y^{k+1})-f(x^\star))\\
&=\text{trace}\bigl(Q\,\mathtt{Gram}((S_+\otimes I_d)(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k),\nabla f(y^{k+1})))\bigr)+q(f(y^{k+1})-f(x^\star))\\
&=\text{trace}(S_+^{\top}QS_+G)+q\begin{bmatrix}0\\1\end{bmatrix}^{\top}F.
\end{align*}
    </div>
    <p><strong>Interpolation.</strong> To apply <a href="#theorem-interpolation">Theorem 1</a>, write \(y^\star=x^\star\). For each pair of distinct indices \(i,j\in\{k,k+1,\star\}\), the interpolation inequality is</p>
    <div class="math">
\begin{equation}
\label{eq:memory-contraction-interpolation}
f(y^j)-f(y^i)+\inner{\nabla f(y^j)}{y^i-y^j}
+\tfrac{\mu}{2}\norm{y^i-y^j}^2
+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^i)-\nabla f(y^j)-\mu(y^i-y^j)}^2\leqslant0.
\end{equation}
    </div>
    <p>The method gives the point differences</p>
    <div class="math">
\begin{equation*}
\begin{aligned}
y^k-y^\star
&=(1+\alpha)(x^k-x^\star)-\alpha(x^{k-1}-x^\star),\\
y^{k+1}-y^\star
&=(1+\beta(1+\alpha))(x^k-x^\star)-\beta(1+\alpha)(x^{k-1}-x^\star)-\gamma(1+\alpha)\nabla f(y^k),\\
y^k-y^{k+1}
&=(\alpha-\beta(1+\alpha))(x^k-x^{k-1})+\gamma(1+\alpha)\nabla f(y^k).
\end{aligned}
\end{equation*}
    </div>
    <p>Substituting these expressions and \(\nabla f(y^\star)=0\) into \(\eqref{eq:memory-contraction-interpolation}\) and expanding the squared norms gives</p>
    <div class="math">
\begin{equation*}
\text{trace}(A_{i,j}^{\mathrm{C1}}G)+(a_{i,j}^{\mathrm{C1}})^{\top}F\leqslant0,
\qquad i,j\in\{k,k+1,\star\},\quad i\ne j.
\end{equation*}
    </div>
<details class="proof-disclosure interpolation-derivation memory-interpolation-derivation">
  <summary><span class="proof-show">Show derivation</span><span class="proof-hide">Hide derivation</span></summary>
  <div class="proof-content">
    <p>For each of the six ordered pairs, we use \(\nabla f(y^\star)=0\), expand the squared norms, and substitute the point differences. We then write the extraction matrix explicitly and apply \(\eqref{eq:gram-trace-identities}\). Each \(\ast\) in a symmetric matrix denotes the entry determined by symmetry.</p>
<p>For \((i,j)=(k,\star)\), we obtain</p>
<div class="math">
\begin{align*}
&f(y^\star)-f(y^k)+\inner{\nabla f(y^\star)}{y^k-y^\star}+\tfrac{\mu}{2}\norm{y^k-y^\star}^2+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^k)-\nabla f(y^\star)-\mu(y^k-y^\star)}^2\\
&=f(y^\star)-f(y^k)+\tfrac{\mu}{2}\norm{y^k-y^\star}^2+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^k)-\mu(y^k-y^\star)}^2\\
&=f(y^\star)-f(y^k)+\tfrac{1}{2(L-\mu)}\bigl(\mu L\norm{y^k-y^\star}^2-2\mu\inner{y^k-y^\star}{\nabla f(y^k)}+\norm{\nabla f(y^k)}^2\bigr)\\
&=f(y^\star)-f(y^k)+\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-\mu\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}(y^k-y^\star,\nabla f(y^k))\right)\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-\mu\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!((1+\alpha)(x^k-x^\star)-\alpha(x^{k-1}-x^\star),\nabla f(y^k))\right)+(a_{k,\star}^{\mathrm{C1}})^\top F\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-\mu\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!\left(\left(\begin{bmatrix}1+\alpha&\!\!\!\!-\alpha&\!\!\!\!0&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!1&\!\!\!\!0\end{bmatrix}\otimes I_d\right)\begin{bmatrix}x^k-x^\star\\x^{k-1}-x^\star\\\nabla f(y^k)\\\nabla f(y^{k+1})\end{bmatrix}\right)\right)+(a_{k,\star}^{\mathrm{C1}})^\top F\\
&=\text{trace}\bigl(A_{k,\star}^{\mathrm{C1}}\,\mathtt{Gram}(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k),\nabla f(y^{k+1}))\bigr)+(a_{k,\star}^{\mathrm{C1}})^\top F\\
&=\text{trace}(A_{k,\star}^{\mathrm{C1}}G)+(a_{k,\star}^{\mathrm{C1}})^\top F\leqslant0,
\end{align*}
</div>
<p>where</p>
<div class="math">
\begin{equation*}
\begin{aligned}
A_{k,\star}^{\mathrm{C1}}&=\tfrac{1}{2(L-\mu)}\begin{bmatrix}1+\alpha&\!\!\!\!-\alpha&\!\!\!\!0&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!1&\!\!\!\!0\end{bmatrix}^{\top}\,\begin{bmatrix}\mu L&\!\!\!\!-\mu\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\,\begin{bmatrix}1+\alpha&\!\!\!\!-\alpha&\!\!\!\!0&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!1&\!\!\!\!0\end{bmatrix}\\[0.6em]
&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\mu L(1+\alpha)^2&\!\!-\mu L\alpha(1+\alpha)&\!\!-\mu(1+\alpha)&\!\!0\\
\ast&\!\!\phantom{-}\mu L\alpha^2&\!\!\phantom{-}\mu\alpha&\!\!0\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1&\!\!0\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\ast&\!\!0
\end{bmatrix},\\[0.4em]
a_{k,\star}^{\mathrm{C1}}&=\begin{bmatrix}-1\\\phantom{-}0\end{bmatrix}.
\end{aligned}
\end{equation*}
</div>

<p>For \((i,j)=(\star,k)\), we obtain</p>
<div class="math">
\begin{align*}
&f(y^k)-f(y^\star)+\inner{\nabla f(y^k)}{y^\star-y^k}+\tfrac{\mu}{2}\norm{y^\star-y^k}^2+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^\star)-\nabla f(y^k)-\mu(y^\star-y^k)}^2\\
&=f(y^k)-f(y^\star)-\inner{\nabla f(y^k)}{y^k-y^\star}+\tfrac{\mu}{2}\norm{y^k-y^\star}^2+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^k)-\mu(y^k-y^\star)}^2\\
&=f(y^k)-f(y^\star)+\tfrac{1}{2(L-\mu)}\bigl(\mu L\norm{y^k-y^\star}^2-2L\inner{y^k-y^\star}{\nabla f(y^k)}+\norm{\nabla f(y^k)}^2\bigr)\\
&=f(y^k)-f(y^\star)+\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-L\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}(y^k-y^\star,\nabla f(y^k))\right)\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-L\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!((1+\alpha)(x^k-x^\star)-\alpha(x^{k-1}-x^\star),\nabla f(y^k))\right)+(a_{\star,k}^{\mathrm{C1}})^\top F\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-L\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!\left(\left(\begin{bmatrix}1+\alpha&\!\!\!\!-\alpha&\!\!\!\!0&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!1&\!\!\!\!0\end{bmatrix}\otimes I_d\right)\begin{bmatrix}x^k-x^\star\\x^{k-1}-x^\star\\\nabla f(y^k)\\\nabla f(y^{k+1})\end{bmatrix}\right)\right)+(a_{\star,k}^{\mathrm{C1}})^\top F\\
&=\text{trace}\bigl(A_{\star,k}^{\mathrm{C1}}\,\mathtt{Gram}(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k),\nabla f(y^{k+1}))\bigr)+(a_{\star,k}^{\mathrm{C1}})^\top F\\
&=\text{trace}(A_{\star,k}^{\mathrm{C1}}G)+(a_{\star,k}^{\mathrm{C1}})^\top F\leqslant0,
\end{align*}
</div>
<p>where</p>
<div class="math">
\begin{equation*}
\begin{aligned}
A_{\star,k}^{\mathrm{C1}}&=\tfrac{1}{2(L-\mu)}\begin{bmatrix}1+\alpha&\!\!\!\!-\alpha&\!\!\!\!0&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!1&\!\!\!\!0\end{bmatrix}^{\top}\,\begin{bmatrix}\mu L&\!\!\!\!-L\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\,\begin{bmatrix}1+\alpha&\!\!\!\!-\alpha&\!\!\!\!0&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!1&\!\!\!\!0\end{bmatrix}\\[0.6em]
&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\mu L(1+\alpha)^2&\!\!-\mu L\alpha(1+\alpha)&\!\!-L(1+\alpha)&\!\!0\\
\ast&\!\!\phantom{-}\mu L\alpha^2&\!\!\phantom{-}L\alpha&\!\!0\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1&\!\!0\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\ast&\!\!0
\end{bmatrix},\\[0.4em]
a_{\star,k}^{\mathrm{C1}}&=\begin{bmatrix}1\\0\end{bmatrix}.
\end{aligned}
\end{equation*}
</div>

<p>For \((i,j)=(k+1,\star)\), we obtain</p>
<div class="math">
\begin{align*}
&f(y^\star)-f(y^{k+1})+\inner{\nabla f(y^\star)}{y^{k+1}-y^\star}+\tfrac{\mu}{2}\norm{y^{k+1}-y^\star}^2+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^{k+1})-\nabla f(y^\star)-\mu(y^{k+1}-y^\star)}^2\\
&=f(y^\star)-f(y^{k+1})+\tfrac{\mu}{2}\norm{y^{k+1}-y^\star}^2+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^{k+1})-\mu(y^{k+1}-y^\star)}^2\\
&=f(y^\star)-f(y^{k+1})+\tfrac{1}{2(L-\mu)}\bigl(\mu L\norm{y^{k+1}-y^\star}^2-2\mu\inner{y^{k+1}-y^\star}{\nabla f(y^{k+1})}+\norm{\nabla f(y^{k+1})}^2\bigr)\\
&=f(y^\star)-f(y^{k+1})+\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-\mu\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}(y^{k+1}-y^\star,\nabla f(y^{k+1}))\right)\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-\mu\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!(x^k-x^\star+(1+\alpha)\bigl(\beta(x^k-x^{k-1})-\gamma\nabla f(y^k)\bigr),\nabla f(y^{k+1}))\right)+(a_{k+1,\star}^{\mathrm{C1}})^\top F\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-\mu\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!\left(\left(\begin{bmatrix}1+\beta+\alpha\beta&\!\!\!\!-\beta(1+\alpha)&\!\!\!\!-\gamma(1+\alpha)&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!\phantom{-}0&\!\!\!\!1\end{bmatrix}\otimes I_d\right)\begin{bmatrix}x^k-x^\star\\x^{k-1}-x^\star\\\nabla f(y^k)\\\nabla f(y^{k+1})\end{bmatrix}\right)\right)+(a_{k+1,\star}^{\mathrm{C1}})^\top F\\
&=\text{trace}\bigl(A_{k+1,\star}^{\mathrm{C1}}\,\mathtt{Gram}(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k),\nabla f(y^{k+1}))\bigr)+(a_{k+1,\star}^{\mathrm{C1}})^\top F\\
&=\text{trace}(A_{k+1,\star}^{\mathrm{C1}}G)+(a_{k+1,\star}^{\mathrm{C1}})^\top F\leqslant0,
\end{align*}
</div>
<p>where</p>
<div class="math">
\begin{equation*}
\begin{aligned}
A_{k+1,\star}^{\mathrm{C1}}&=\tfrac{1}{2(L-\mu)}\begin{bmatrix}1+\beta+\alpha\beta&\!\!\!\!-\beta(1+\alpha)&\!\!\!\!-\gamma(1+\alpha)&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!\phantom{-}0&\!\!\!\!1\end{bmatrix}^{\top}\,\begin{bmatrix}\mu L&\!\!\!\!-\mu\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\,\begin{bmatrix}1+\beta+\alpha\beta&\!\!\!\!-\beta(1+\alpha)&\!\!\!\!-\gamma(1+\alpha)&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!\phantom{-}0&\!\!\!\!1\end{bmatrix}\\[0.6em]
&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\mu L(1+\beta+\alpha\beta)^2&\!\!-\mu L\beta(1+\alpha)(1+\beta+\alpha\beta)&\!\!-\gamma\mu L(1+\alpha)(1+\beta+\alpha\beta)&\!\!-\mu(1+\beta+\alpha\beta)\\
\ast&\!\!\phantom{-}\mu L\beta^2(1+\alpha)^2&\!\!\phantom{-}\gamma\mu L\beta(1+\alpha)^2&\!\!\phantom{-}\mu\beta(1+\alpha)\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\gamma^2\mu L(1+\alpha)^2&\!\!\phantom{-}\gamma\mu(1+\alpha)\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1
\end{bmatrix},\\[0.4em]
a_{k+1,\star}^{\mathrm{C1}}&=\begin{bmatrix}\phantom{-}0\\-1\end{bmatrix}.
\end{aligned}
\end{equation*}
</div>

<p>For \((i,j)=(\star,k+1)\), we obtain</p>
<div class="math">
\begin{align*}
&f(y^{k+1})-f(y^\star)+\inner{\nabla f(y^{k+1})}{y^\star-y^{k+1}}+\tfrac{\mu}{2}\norm{y^\star-y^{k+1}}^2+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^\star)-\nabla f(y^{k+1})-\mu(y^\star-y^{k+1})}^2\\
&=f(y^{k+1})-f(y^\star)-\inner{\nabla f(y^{k+1})}{y^{k+1}-y^\star}+\tfrac{\mu}{2}\norm{y^{k+1}-y^\star}^2+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^{k+1})-\mu(y^{k+1}-y^\star)}^2\\
&=f(y^{k+1})-f(y^\star)+\tfrac{1}{2(L-\mu)}\bigl(\mu L\norm{y^{k+1}-y^\star}^2-2L\inner{y^{k+1}-y^\star}{\nabla f(y^{k+1})}+\norm{\nabla f(y^{k+1})}^2\bigr)\\
&=f(y^{k+1})-f(y^\star)+\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-L\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}(y^{k+1}-y^\star,\nabla f(y^{k+1}))\right)\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-L\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!(x^k-x^\star+(1+\alpha)\bigl(\beta(x^k-x^{k-1})-\gamma\nabla f(y^k)\bigr),\nabla f(y^{k+1}))\right)+(a_{\star,k+1}^{\mathrm{C1}})^\top F\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-L\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!\left(\left(\begin{bmatrix}1+\beta+\alpha\beta&\!\!\!\!-\beta(1+\alpha)&\!\!\!\!-\gamma(1+\alpha)&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!\phantom{-}0&\!\!\!\!1\end{bmatrix}\otimes I_d\right)\begin{bmatrix}x^k-x^\star\\x^{k-1}-x^\star\\\nabla f(y^k)\\\nabla f(y^{k+1})\end{bmatrix}\right)\right)+(a_{\star,k+1}^{\mathrm{C1}})^\top F\\
&=\text{trace}\bigl(A_{\star,k+1}^{\mathrm{C1}}\,\mathtt{Gram}(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k),\nabla f(y^{k+1}))\bigr)+(a_{\star,k+1}^{\mathrm{C1}})^\top F\\
&=\text{trace}(A_{\star,k+1}^{\mathrm{C1}}G)+(a_{\star,k+1}^{\mathrm{C1}})^\top F\leqslant0,
\end{align*}
</div>
<p>where</p>
<div class="math">
\begin{equation*}
\begin{aligned}
A_{\star,k+1}^{\mathrm{C1}}&=\tfrac{1}{2(L-\mu)}\begin{bmatrix}1+\beta+\alpha\beta&\!\!\!\!-\beta(1+\alpha)&\!\!\!\!-\gamma(1+\alpha)&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!\phantom{-}0&\!\!\!\!1\end{bmatrix}^{\top}\,\begin{bmatrix}\mu L&\!\!\!\!-L\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\,\begin{bmatrix}1+\beta+\alpha\beta&\!\!\!\!-\beta(1+\alpha)&\!\!\!\!-\gamma(1+\alpha)&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!\phantom{-}0&\!\!\!\!1\end{bmatrix}\\[0.6em]
&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\mu L(1+\beta+\alpha\beta)^2&\!\!-\mu L\beta(1+\alpha)(1+\beta+\alpha\beta)&\!\!-\gamma\mu L(1+\alpha)(1+\beta+\alpha\beta)&\!\!-L(1+\beta+\alpha\beta)\\
\ast&\!\!\phantom{-}\mu L\beta^2(1+\alpha)^2&\!\!\phantom{-}\gamma\mu L\beta(1+\alpha)^2&\!\!\phantom{-}L\beta(1+\alpha)\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\gamma^2\mu L(1+\alpha)^2&\!\!\phantom{-}\gamma L(1+\alpha)\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1
\end{bmatrix},\\[0.4em]
a_{\star,k+1}^{\mathrm{C1}}&=\begin{bmatrix}0\\1\end{bmatrix}.
\end{aligned}
\end{equation*}
</div>

<p>For \((i,j)=(k,k+1)\), we obtain</p>
<div class="math">
\begin{align*}
&f(y^{k+1})-f(y^k)+\inner{\nabla f(y^{k+1})}{y^k-y^{k+1}}+\tfrac{\mu}{2}\norm{y^k-y^{k+1}}^2+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^k)-\nabla f(y^{k+1})-\mu(y^k-y^{k+1})}^2\\
&=f(y^{k+1})-f(y^k)+\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-\mu&\!\!\!\!\phantom{-}L\\\ast&\!\!\!\!\phantom{-}1&\!\!\!\!-1\\\ast&\!\!\!\!\phantom{-}\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}(y^k-y^{k+1},\nabla f(y^k),\nabla f(y^{k+1}))\right)\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-\mu&\!\!\!\!\phantom{-}L\\\ast&\!\!\!\!\phantom{-}1&\!\!\!\!-1\\\ast&\!\!\!\!\phantom{-}\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!((\alpha-\beta-\alpha\beta)(x^k-x^{k-1})+\gamma(1+\alpha)\nabla f(y^k),\nabla f(y^k),\nabla f(y^{k+1}))\right)+(a_{k,k+1}^{\mathrm{C1}})^\top F\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-\mu&\!\!\!\!\phantom{-}L\\\ast&\!\!\!\!\phantom{-}1&\!\!\!\!-1\\\ast&\!\!\!\!\phantom{-}\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!\left(\left(\begin{bmatrix}\alpha-\beta-\alpha\beta&\!\!\!\!\beta+\alpha\beta-\alpha&\!\!\!\!\gamma(1+\alpha)&\!\!\!\!0\\0&\!\!\!\!0&\!\!\!\!1&\!\!\!\!0\\0&\!\!\!\!0&\!\!\!\!0&\!\!\!\!1\end{bmatrix}\otimes I_d\right)\begin{bmatrix}x^k-x^\star\\x^{k-1}-x^\star\\\nabla f(y^k)\\\nabla f(y^{k+1})\end{bmatrix}\right)\right)+(a_{k,k+1}^{\mathrm{C1}})^\top F\\
&=\text{trace}\bigl(A_{k,k+1}^{\mathrm{C1}}\,\mathtt{Gram}(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k),\nabla f(y^{k+1}))\bigr)+(a_{k,k+1}^{\mathrm{C1}})^\top F\\
&=\text{trace}(A_{k,k+1}^{\mathrm{C1}}G)+(a_{k,k+1}^{\mathrm{C1}})^\top F\leqslant0,
\end{align*}
</div>
<p>where</p>
<div class="math">
\begin{equation*}
\begin{aligned}
A_{k,k+1}^{\mathrm{C1}}&=\tfrac{1}{2(L-\mu)}\begin{bmatrix}\alpha-\beta-\alpha\beta&\!\!\!\!\beta+\alpha\beta-\alpha&\!\!\!\!\gamma(1+\alpha)&\!\!\!\!0\\0&\!\!\!\!0&\!\!\!\!1&\!\!\!\!0\\0&\!\!\!\!0&\!\!\!\!0&\!\!\!\!1\end{bmatrix}^{\top}\,\begin{bmatrix}\mu L&\!\!\!\!-\mu&\!\!\!\!\phantom{-}L\\\ast&\!\!\!\!\phantom{-}1&\!\!\!\!-1\\\ast&\!\!\!\!\phantom{-}\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\,\begin{bmatrix}\alpha-\beta-\alpha\beta&\!\!\!\!\beta+\alpha\beta-\alpha&\!\!\!\!\gamma(1+\alpha)&\!\!\!\!0\\0&\!\!\!\!0&\!\!\!\!1&\!\!\!\!0\\0&\!\!\!\!0&\!\!\!\!0&\!\!\!\!1\end{bmatrix}\\[0.6em]
&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\mu L(\alpha-\beta-\alpha\beta)^2&\!\!-\mu L(\alpha-\beta-\alpha\beta)^2&\!\!\phantom{-}\mu(\alpha-\beta-\alpha\beta)(\gamma L(1+\alpha)-1)&\!\!\phantom{-}L(\alpha-\beta-\alpha\beta)\\
\ast&\!\!\phantom{-}\mu L(\alpha-\beta-\alpha\beta)^2&\!\!-\mu(\alpha-\beta-\alpha\beta)(\gamma L(1+\alpha)-1)&\!\!-L(\alpha-\beta-\alpha\beta)\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1-2\gamma\mu(1+\alpha)+\gamma^2\mu L(1+\alpha)^2&\!\!\phantom{-}\gamma L(1+\alpha)-1\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1
\end{bmatrix},\\[0.4em]
a_{k,k+1}^{\mathrm{C1}}&=\begin{bmatrix}-1\\\phantom{-}1\end{bmatrix}.
\end{aligned}
\end{equation*}
</div>

<p>For \((i,j)=(k+1,k)\), we obtain</p>
<div class="math">
\begin{align*}
&f(y^k)-f(y^{k+1})+\inner{\nabla f(y^k)}{y^{k+1}-y^k}+\tfrac{\mu}{2}\norm{y^{k+1}-y^k}^2+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^{k+1})-\nabla f(y^k)-\mu(y^{k+1}-y^k)}^2\\
&=f(y^k)-f(y^{k+1})+\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-L&\!\!\!\!\phantom{-}\mu\\\ast&\!\!\!\!\phantom{-}1&\!\!\!\!-1\\\ast&\!\!\!\!\phantom{-}\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}(y^k-y^{k+1},\nabla f(y^k),\nabla f(y^{k+1}))\right)\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-L&\!\!\!\!\phantom{-}\mu\\\ast&\!\!\!\!\phantom{-}1&\!\!\!\!-1\\\ast&\!\!\!\!\phantom{-}\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!((\alpha-\beta-\alpha\beta)(x^k-x^{k-1})+\gamma(1+\alpha)\nabla f(y^k),\nabla f(y^k),\nabla f(y^{k+1}))\right)+(a_{k+1,k}^{\mathrm{C1}})^\top F\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-L&\!\!\!\!\phantom{-}\mu\\\ast&\!\!\!\!\phantom{-}1&\!\!\!\!-1\\\ast&\!\!\!\!\phantom{-}\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!\left(\left(\begin{bmatrix}\alpha-\beta-\alpha\beta&\!\!\!\!\beta+\alpha\beta-\alpha&\!\!\!\!\gamma(1+\alpha)&\!\!\!\!0\\0&\!\!\!\!0&\!\!\!\!1&\!\!\!\!0\\0&\!\!\!\!0&\!\!\!\!0&\!\!\!\!1\end{bmatrix}\otimes I_d\right)\begin{bmatrix}x^k-x^\star\\x^{k-1}-x^\star\\\nabla f(y^k)\\\nabla f(y^{k+1})\end{bmatrix}\right)\right)+(a_{k+1,k}^{\mathrm{C1}})^\top F\\
&=\text{trace}\bigl(A_{k+1,k}^{\mathrm{C1}}\,\mathtt{Gram}(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k),\nabla f(y^{k+1}))\bigr)+(a_{k+1,k}^{\mathrm{C1}})^\top F\\
&=\text{trace}(A_{k+1,k}^{\mathrm{C1}}G)+(a_{k+1,k}^{\mathrm{C1}})^\top F\leqslant0,
\end{align*}
</div>
<p>where</p>
<div class="math">
\begin{equation*}
\begin{aligned}
A_{k+1,k}^{\mathrm{C1}}&=\tfrac{1}{2(L-\mu)}\begin{bmatrix}\alpha-\beta-\alpha\beta&\!\!\!\!\beta+\alpha\beta-\alpha&\!\!\!\!\gamma(1+\alpha)&\!\!\!\!0\\0&\!\!\!\!0&\!\!\!\!1&\!\!\!\!0\\0&\!\!\!\!0&\!\!\!\!0&\!\!\!\!1\end{bmatrix}^{\top}\,\begin{bmatrix}\mu L&\!\!\!\!-L&\!\!\!\!\phantom{-}\mu\\\ast&\!\!\!\!\phantom{-}1&\!\!\!\!-1\\\ast&\!\!\!\!\phantom{-}\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\,\begin{bmatrix}\alpha-\beta-\alpha\beta&\!\!\!\!\beta+\alpha\beta-\alpha&\!\!\!\!\gamma(1+\alpha)&\!\!\!\!0\\0&\!\!\!\!0&\!\!\!\!1&\!\!\!\!0\\0&\!\!\!\!0&\!\!\!\!0&\!\!\!\!1\end{bmatrix}\\[0.6em]
&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}
\mu L(\alpha-\beta-\alpha\beta)^2&\!\!-\mu L(\alpha-\beta-\alpha\beta)^2&\!\!\phantom{-}L(\alpha-\beta-\alpha\beta)(\gamma\mu(1+\alpha)-1)&\!\!\phantom{-}\mu(\alpha-\beta-\alpha\beta)\\
\ast&\!\!\phantom{-}\mu L(\alpha-\beta-\alpha\beta)^2&\!\!-L(\alpha-\beta-\alpha\beta)(\gamma\mu(1+\alpha)-1)&\!\!-\mu(\alpha-\beta-\alpha\beta)\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1-2\gamma L(1+\alpha)+\gamma^2\mu L(1+\alpha)^2&\!\!\phantom{-}\gamma\mu(1+\alpha)-1\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1
\end{bmatrix},\\[0.4em]
a_{k+1,k}^{\mathrm{C1}}&=\begin{bmatrix}\phantom{-}1\\-1\end{bmatrix}.
\end{aligned}
\end{equation*}
</div>

  </div>
</details>
    <p><strong>Primal formulation.</strong> The Gram characterization \(\eqref{eq:gram-characterization}\) and <a href="#theorem-interpolation">Theorem 1</a> give the following equivalent finite-dimensional formulation</p>
    <div class="math">
\begin{equation*}
\mathcal{P}_{\mathrm{C1},d}
=\left(
\begin{array}{cl}
\mathop{\text{maximize}}\limits_{G\in\mathbb{S}_{+}^{4},\,F\in\mathbb{R}^{2}}
&\text{trace}((S_+^{\top}QS_+-\rho S^{\top}QS)G)
+q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}^{\top}F\\[0.6em]
\text{subject to}
&\mathop{\text{rank}}\nolimits(G)\leqslant d,\\
&\text{trace}(A_{i,j}^{\mathrm{C1}}G)+(a_{i,j}^{\mathrm{C1}})^{\top}F\leqslant0
\end{array}
\right).
\end{equation*}
    </div>
    <p>Dropping the rank constraint gives the primal SDP</p>
    <div class="math">
\begin{equation*}
\mathcal{P}_{\mathrm{C1}}^{\mathrm{SDP}}
=\left(
\begin{array}{cl}
\mathop{\text{maximize}}\limits_{G\in\mathbb{S}_{+}^{4},\,F\in\mathbb{R}^{2}}
&\text{trace}((S_+^{\top}QS_+-\rho S^{\top}QS)G)
+q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}^{\top}F\\[0.6em]
\text{subject to}
&\text{trace}(A_{i,j}^{\mathrm{C1}}G)+(a_{i,j}^{\mathrm{C1}})^{\top}F\leqslant0
\end{array}
\right),
\end{equation*}
    </div>
    <p>and hence</p>
    <div class="math">
\begin{equation*}
\mathcal{P}_{\mathrm{C1},d}\leqslant\mathcal{P}_{\mathrm{C1}}^{\mathrm{SDP}}.
\end{equation*}
    </div>
    <p>For \(d\geqslant4\), the rank constraint is automatic, so</p>
    <div class="math">
\begin{equation*}
\mathcal{P}_{\mathrm{C1},d}=\mathcal{P}_{\mathrm{C1}}^{\mathrm{SDP}}.
\end{equation*}
    </div>
    <p><strong>Dual formulation.</strong> Next, we derive the Lagrange dual of the SDP defining \(\mathcal{P}_{\mathrm{C1}}^{\mathrm{SDP}}\). We associate dual multipliers with the constraints as follows</p>
    <div class="math">
\begin{align*}
\text{trace}(A_{i,j}^{\mathrm{C1}}G)+(a_{i,j}^{\mathrm{C1}})^{\top}F\leqslant0
&\qquad:\qquad\lambda_{i,j}^{\mathrm{C1}}\geqslant0
\end{align*}
    </div>
    <p>for each pair of distinct indices \(i,j\in\{k,k+1,\star\}\). With the notation \(\lambda^{\mathrm{C1}}=(\lambda_{i,j}^{\mathrm{C1}})_{i,j\in\{k,k+1,\star\},\,i\ne j}\), the Lagrangian is</p>
    <div class="math">
\begin{align*}
\mathcal{L}_{\mathrm{C1}}(G,F,\lambda^{\mathrm{C1}})
&=\text{trace}((S_+^{\top}QS_+-\rho S^{\top}QS)G)
+q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}^{\top}F
-\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}^{\mathrm{C1}}
\left(\text{trace}(A_{i,j}^{\mathrm{C1}}G)+(a_{i,j}^{\mathrm{C1}})^{\top}F\right)\\
&=\text{trace}\left(\left(S_+^{\top}QS_+-\rho S^{\top}QS
-\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}^{\mathrm{C1}}A_{i,j}^{\mathrm{C1}}\right)G\right)
+\left(q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}
-\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}^{\mathrm{C1}}a_{i,j}^{\mathrm{C1}}\right)^{\top}F.
\end{align*}
    </div>
    <p>Since \(G\) is positive semidefinite and \(F\) is unrestricted, the objective of the Lagrange dual is</p>
    <div class="math">
\begin{equation*}
\mathop{\text{sup}}\limits_{G\in\mathbb{S}_{+}^{4},\,F\in\mathbb{R}^{2}}
\mathcal{L}_{\mathrm{C1}}(G,F,\lambda^{\mathrm{C1}})
=\begin{cases}
0,&\text{if }\begin{cases}
S_+^{\top}QS_+-\rho S^{\top}QS-\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}^{\mathrm{C1}}A_{i,j}^{\mathrm{C1}}\preccurlyeq0,\\[0.25em]
q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}-\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}^{\mathrm{C1}}a_{i,j}^{\mathrm{C1}}=0,
\end{cases}\\[0.4em]
+\infty,&\text{otherwise}.
\end{cases}
\end{equation*}
    </div>
    <p>Minimizing this objective over the nonnegative multipliers gives the dual SDP</p>
    <div class="math">
\begin{equation*}
\mathcal{D}_{\mathrm{C1}}^{\mathrm{SDP}}
=\left(
\begin{array}{cl}
\mathop{\text{minimize}}\limits_{\substack{
\lambda_{i,j}^{\mathrm{C1}}\in\mathbb{R}\\
i,j\in\{k,k+1,\star\},\ i\ne j
}}
&0\\[0.6em]
\text{subject to}
&\lambda_{i,j}^{\mathrm{C1}}\geqslant0\mathord{,}\quad\text{for each pair of distinct indices}\quad i,j\in\{k,k+1,\star\},\\
&\displaystyle\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}^{\mathrm{C1}}A_{i,j}^{\mathrm{C1}}
-(S_+^{\top}QS_+-\rho S^{\top}QS)\succcurlyeq0,\\
&\displaystyle\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}^{\mathrm{C1}}a_{i,j}^{\mathrm{C1}}
-q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}=0.
\end{array}
\right).
\end{equation*}
    </div>
    <p>The primal relaxation and weak duality give</p>
    <div class="math">
\begin{equation*}
\mathcal{P}_{\mathrm{C1},d}\leqslant\mathcal{P}_{\mathrm{C1}}^{\mathrm{SDP}}
\leqslant\mathcal{D}_{\mathrm{C1}}^{\mathrm{SDP}}.
\end{equation*}
    </div>
    <p>If \(\eqref{eq:memory-contraction-certificate}\) is feasible, then \(\mathcal{D}_{\mathrm{C1}}^{\mathrm{SDP}}=0\), which proves \(\eqref{eq:memory-lyapunov-contraction}\) in every dimension.</p>

    <p><strong>Necessity.</strong> Suppose \(d\geqslant4\) and \(\eqref{eq:memory-lyapunov-contraction}\) holds. Exactness and feasibility of \((G,F)=(0,0)\) give \(\mathcal{P}_{\mathrm{C1}}^{\mathrm{SDP}}=0\).</p>
    <p>To prove feasibility of \(\eqref{eq:memory-contraction-certificate}\), equivalently of the dual SDP defining \(\mathcal{D}_{\mathrm{C1}}^{\mathrm{SDP}}\), we verify the refined Slater condition for the primal SDP defining \(\mathcal{P}_{\mathrm{C1}}^{\mathrm{SDP}}\). Since the interpolation constraints are affine in \((G,F)\), a feasible pair with \(G\succ0\) suffices \nocite{BV04}[<a href="#BV04">BV04</a>, Section 5.2.3]. Choose \(\mu<\ell_1<\ell_2<\ell_3<\ell_4<L\) and set</p>
    <div class="math">
\begin{equation*}
\begin{aligned}
H&=\mathop{\text{diag}}(\ell_1,\ell_2,\ell_3,\ell_4),
\qquad f(x)=\tfrac12x^{\top}Hx,
\qquad x^\star=0,\\[0.5em]
Z&=\begin{bmatrix}x^k&x^{k-1}&\nabla f(y^k)&\nabla f(y^{k+1})\end{bmatrix}=\begin{bmatrix}x^k&x^{k-1}&Hy^k&Hy^{k+1}\end{bmatrix}\in\mathbb{R}^{4\times4},\\[0.5em]
G&=\mathtt{Gram}(x^k,x^{k-1},\nabla f(y^k),\nabla f(y^{k+1}))=Z^{\top}Z,\\[0.5em]
F&=\begin{bmatrix}f(y^k)-f(0)\\f(y^{k+1})-f(0)\end{bmatrix}.
\end{aligned}
\end{equation*}
    </div>
    <p>Because \(f\in\mathcal{F}_{\mu,L}(\mathbb{R}^{4})\), these data satisfy the interpolation constraints, i.e.,</p>
    <div class="math">
\begin{equation*}
\text{trace}(A_{i,j}^{\mathrm{C1}}G)+(a_{i,j}^{\mathrm{C1}})^{\top}F\leqslant0,
\qquad i,j\in\{k,k+1,\star\},\quad i\ne j.
\end{equation*}
    </div>
    <p>We choose the initial points so that \(Z\) is nonsingular:</p>
    <ul>
      <li>
        <p>If \(\alpha\ne-1\), take</p>
        <div class="math">
\begin{equation*}
\begin{gathered}
x^k=(1,1,1,0),\qquad x^{k-1}=(0,0,0,1),\\[0.5em]
|\det Z|
=|1+\alpha|^3\gamma\prod_{1\leqslant i<j\leqslant3}(\ell_j-\ell_i)>0.
\end{gathered}
\end{equation*}
        </div>
      </li>
      <li>
        <p>If \(\alpha=-1\), take</p>
        <div class="math">
\begin{equation*}
\begin{gathered}
x^k=(1,1,0,0),\qquad x^{k-1}=(0,0,1,1),\\[0.5em]
|\det Z|
=(\ell_2-\ell_1)(\ell_4-\ell_3)>0.
\end{gathered}
\end{equation*}
        </div>
      </li>
    </ul>
    <p>Thus \(G=Z^{\top}Z\succ0\) in both cases. The refined Slater condition therefore gives</p>
    <div class="math">
\begin{equation*}
\mathcal{P}_{\mathrm{C1},d}=\mathcal{P}_{\mathrm{C1}}^{\mathrm{SDP}}=\mathcal{D}_{\mathrm{C1}}^{\mathrm{SDP}}=0.
\end{equation*}
    </div>
    <p>In particular, the dual SDP is feasible, and its multipliers satisfy \(\eqref{eq:memory-contraction-certificate}\).</p>

    <p><strong>2. Lower bound.</strong> The inequality \(\mathcal{V}(k)\geqslant\mathcal{M}(k)\) in \(\eqref{eq:memory-lyapunov-lower-bound}\) is equivalent to \(\mathcal{P}_{\mathrm{C2},d}\leqslant0\), where</p>
    <div class="math">
\begin{equation*}
\mathcal{P}_{\mathrm{C2},d}
=\left(
\begin{array}{cl}
\mathop{\text{maximize}}\limits_{\substack{
f\in\mathcal{F}_{\mu,L}(\mathbb{R}^{d})\\
x^{k-1},x^k,y^k,x^\star\in\mathbb{R}^{d}
}}
&\mathcal{M}(k)-\mathcal{V}(k)\\[0.6em]
\text{subject to}
&\nabla f(x^\star)=0,\\
&y^k=(1+\alpha)x^k-\alpha x^{k-1}.
\end{array}
\right).
\end{equation*}
    </div>
    <p>Here we compare \(\mathcal{V}(k)\) and \(\mathcal{M}(k)\) at the same iteration, so the Gram matrix uses only \(x^k-x^\star\), \(x^{k-1}-x^\star\), and \(\nabla f(y^k)\). Set</p>
    <div class="math">
\begin{equation*}
G=\mathtt{Gram}(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k)),
\qquad F=f(y^k)-f(x^\star)\in\mathbb{R}.
\end{equation*}
    </div>
    <p>The definitions of \(\mathcal{V}\) and \(\mathcal{M}\) give</p>
<div class="math">
\begin{align*}
\mathcal{V}(k)&=\text{trace}\bigl(Q\,\mathtt{Gram}(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k))\bigr)+q(f(y^k)-f(x^\star))\\
&=\text{trace}(QG)+qF,\\[0.5em]
\mathcal{M}(k)&=\text{trace}\bigl(P\,\mathtt{Gram}(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k))\bigr)+p(f(y^k)-f(x^\star))\\
&=\text{trace}(PG)+pF,\\[0.5em]
\mathcal{M}(k)-\mathcal{V}(k)&=\text{trace}((P-Q)G)+(p-q)F.
\end{align*}
</div>
    <p><strong>Interpolation.</strong> To apply <a href="#theorem-interpolation">Theorem 1</a>, write \(y^\star=x^\star\). For each pair of distinct indices \(i,j\in\{k,\star\}\), the interpolation inequality is</p>
    <div class="math">
\begin{equation}
\label{eq:memory-lower-bound-interpolation}
f(y^j)-f(y^i)+\inner{\nabla f(y^j)}{y^i-y^j}
+\tfrac{\mu}{2}\norm{y^i-y^j}^2
+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^i)-\nabla f(y^j)-\mu(y^i-y^j)}^2\leqslant0.
\end{equation}
    </div>
    <p>The method gives the point difference</p>
    <div class="math">
\begin{equation*}
y^k-y^\star=(1+\alpha)(x^k-x^\star)-\alpha(x^{k-1}-x^\star).
\end{equation*}
    </div>
    <p>Substituting this expression and \(\nabla f(y^\star)=0\) into \(\eqref{eq:memory-lower-bound-interpolation}\) and expanding the squared norms gives</p>
    <div class="math">
\begin{equation*}
\text{trace}(A_{i,j}^{\mathrm{C2}}G)+a_{i,j}^{\mathrm{C2}}F\leqslant0,
\qquad i,j\in\{k,\star\},\quad i\ne j.
\end{equation*}
    </div>
<details class="proof-disclosure interpolation-derivation memory-interpolation-derivation memory-lower-bound-derivation">
  <summary><span class="proof-show">Show derivation</span><span class="proof-hide">Hide derivation</span></summary>
  <div class="proof-content">
    <p>For each of the two ordered pairs, we use \(\nabla f(y^\star)=0\), expand the squared norms, and substitute the point difference. We then write the extraction matrix explicitly and apply \(\eqref{eq:gram-trace-identities}\). Each \(\ast\) in a symmetric matrix denotes the entry determined by symmetry.</p>
<p>For \((i,j)=(k,\star)\), we obtain</p>
<div class="math">
\begin{align*}
&f(y^\star)-f(y^k)+\inner{\nabla f(y^\star)}{y^k-y^\star}+\tfrac{\mu}{2}\norm{y^k-y^\star}^2+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^k)-\nabla f(y^\star)-\mu(y^k-y^\star)}^2\\
&=f(y^\star)-f(y^k)+\tfrac{\mu}{2}\norm{y^k-y^\star}^2+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^k)-\mu(y^k-y^\star)}^2\\
&=f(y^\star)-f(y^k)+\tfrac{1}{2(L-\mu)}\bigl(\mu L\norm{y^k-y^\star}^2-2\mu\inner{y^k-y^\star}{\nabla f(y^k)}+\norm{\nabla f(y^k)}^2\bigr)\\
&=f(y^\star)-f(y^k)+\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-\mu\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}(y^k-y^\star,\nabla f(y^k))\right)\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-\mu\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!((1+\alpha)(x^k-x^\star)-\alpha(x^{k-1}-x^\star),\nabla f(y^k))\right)+a_{k,\star}^{\mathrm{C2}}F\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-\mu\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!\left(\left(\begin{bmatrix}1+\alpha&\!\!\!\!-\alpha&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!1\end{bmatrix}\otimes I_d\right)\begin{bmatrix}x^k-x^\star\\x^{k-1}-x^\star\\\nabla f(y^k)\end{bmatrix}\right)\right)+a_{k,\star}^{\mathrm{C2}}F\\
&=\text{trace}\bigl(A_{k,\star}^{\mathrm{C2}}\,\mathtt{Gram}(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k))\bigr)+a_{k,\star}^{\mathrm{C2}}F\\
&=\text{trace}(A_{k,\star}^{\mathrm{C2}}G)+a_{k,\star}^{\mathrm{C2}}F\leqslant0,
\end{align*}
</div>
<p>where</p>
<div class="math">
\begin{equation*}
\begin{aligned}
A_{k,\star}^{\mathrm{C2}}&=\tfrac{1}{2(L-\mu)}\begin{bmatrix}1+\alpha&\!\!\!\!-\alpha&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!1\end{bmatrix}^{\top}\,\begin{bmatrix}\mu L&\!\!\!\!-\mu\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\,\begin{bmatrix}1+\alpha&\!\!\!\!-\alpha&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!1\end{bmatrix}\\[0.6em]
&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}\mu L(1+\alpha)^2&\!\!-\mu L\alpha(1+\alpha)&\!\!-\mu(1+\alpha)\\
\ast&\!\!\phantom{-}\mu L\alpha^2&\!\!\phantom{-}\mu\alpha\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1\end{bmatrix},\\[0.4em]
a_{k,\star}^{\mathrm{C2}}&=-1.
\end{aligned}
\end{equation*}
</div>

<p>For \((i,j)=(\star,k)\), we obtain</p>
<div class="math">
\begin{align*}
&f(y^k)-f(y^\star)+\inner{\nabla f(y^k)}{y^\star-y^k}+\tfrac{\mu}{2}\norm{y^\star-y^k}^2+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^\star)-\nabla f(y^k)-\mu(y^\star-y^k)}^2\\
&=f(y^k)-f(y^\star)-\inner{\nabla f(y^k)}{y^k-y^\star}+\tfrac{\mu}{2}\norm{y^k-y^\star}^2+\tfrac{1}{2(L-\mu)}\norm{\nabla f(y^k)-\mu(y^k-y^\star)}^2\\
&=f(y^k)-f(y^\star)+\tfrac{1}{2(L-\mu)}\bigl(\mu L\norm{y^k-y^\star}^2-2L\inner{y^k-y^\star}{\nabla f(y^k)}+\norm{\nabla f(y^k)}^2\bigr)\\
&=f(y^k)-f(y^\star)+\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-L\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}(y^k-y^\star,\nabla f(y^k))\right)\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-L\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!((1+\alpha)(x^k-x^\star)-\alpha(x^{k-1}-x^\star),\nabla f(y^k))\right)+a_{\star,k}^{\mathrm{C2}}F\\
&=\tfrac{1}{2(L-\mu)}\text{trace}\!\left(\begin{bmatrix}\mu L&\!\!\!\!-L\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\mathtt{Gram}\!\left(\left(\begin{bmatrix}1+\alpha&\!\!\!\!-\alpha&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!1\end{bmatrix}\otimes I_d\right)\begin{bmatrix}x^k-x^\star\\x^{k-1}-x^\star\\\nabla f(y^k)\end{bmatrix}\right)\right)+a_{\star,k}^{\mathrm{C2}}F\\
&=\text{trace}\bigl(A_{\star,k}^{\mathrm{C2}}\,\mathtt{Gram}(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k))\bigr)+a_{\star,k}^{\mathrm{C2}}F\\
&=\text{trace}(A_{\star,k}^{\mathrm{C2}}G)+a_{\star,k}^{\mathrm{C2}}F\leqslant0,
\end{align*}
</div>
<p>where</p>
<div class="math">
\begin{equation*}
\begin{aligned}
A_{\star,k}^{\mathrm{C2}}&=\tfrac{1}{2(L-\mu)}\begin{bmatrix}1+\alpha&\!\!\!\!-\alpha&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!1\end{bmatrix}^{\top}\,\begin{bmatrix}\mu L&\!\!\!\!-L\\\ast&\!\!\!\!\phantom{-}1\end{bmatrix}\,\begin{bmatrix}1+\alpha&\!\!\!\!-\alpha&\!\!\!\!0\\0&\!\!\!\!\phantom{-}0&\!\!\!\!1\end{bmatrix}\\[0.6em]
&=\tfrac{1}{2(L-\mu)}
\begin{bmatrix}\mu L(1+\alpha)^2&\!\!-\mu L\alpha(1+\alpha)&\!\!-L(1+\alpha)\\
\ast&\!\!\phantom{-}\mu L\alpha^2&\!\!\phantom{-}L\alpha\\
\ast&\!\!\phantom{-}\ast&\!\!\phantom{-}1\end{bmatrix},\\[0.4em]
a_{\star,k}^{\mathrm{C2}}&=1.
\end{aligned}
\end{equation*}
</div>
  </div>
</details>
    <p><strong>Primal formulation.</strong> The Gram characterization \(\eqref{eq:gram-characterization}\) and <a href="#theorem-interpolation">Theorem 1</a> give the following equivalent finite-dimensional formulation</p>
    <div class="math">
\begin{equation*}
\mathcal{P}_{\mathrm{C2},d}
=\left(
\begin{array}{cl}
\mathop{\text{maximize}}\limits_{G\in\mathbb{S}_{+}^{3},\,F\in\mathbb{R}}
&\text{trace}((P-Q)G)+(p-q)F\\[0.6em]
\text{subject to}
&\mathop{\text{rank}}\nolimits(G)\leqslant d,\\
&\text{trace}(A_{k,\star}^{\mathrm{C2}}G)+a_{k,\star}^{\mathrm{C2}}F\leqslant0,\\
&\text{trace}(A_{\star,k}^{\mathrm{C2}}G)+a_{\star,k}^{\mathrm{C2}}F\leqslant0
\end{array}
\right).
\end{equation*}
    </div>
    <p>Dropping the rank constraint gives the primal SDP</p>
    <div class="math">
\begin{equation*}
\mathcal{P}_{\mathrm{C2}}^{\mathrm{SDP}}
=\left(
\begin{array}{cl}
\mathop{\text{maximize}}\limits_{G\in\mathbb{S}_{+}^{3},\,F\in\mathbb{R}}
&\text{trace}((P-Q)G)+(p-q)F\\[0.6em]
\text{subject to}
&\text{trace}(A_{k,\star}^{\mathrm{C2}}G)+a_{k,\star}^{\mathrm{C2}}F\leqslant0,\\
&\text{trace}(A_{\star,k}^{\mathrm{C2}}G)+a_{\star,k}^{\mathrm{C2}}F\leqslant0
\end{array}
\right),
\end{equation*}
    </div>
    <p>and hence</p>
    <div class="math">
\begin{equation*}
\mathcal{P}_{\mathrm{C2},d}\leqslant\mathcal{P}_{\mathrm{C2}}^{\mathrm{SDP}}.
\end{equation*}
    </div>
    <p>For \(d\geqslant3\), the rank constraint is automatic, so</p>
    <div class="math">
\begin{equation*}
\mathcal{P}_{\mathrm{C2},d}=\mathcal{P}_{\mathrm{C2}}^{\mathrm{SDP}}.
\end{equation*}
    </div>
    <p><strong>Dual formulation.</strong> Next, we derive the Lagrange dual of the SDP defining \(\mathcal{P}_{\mathrm{C2}}^{\mathrm{SDP}}\). We associate dual multipliers with the constraints as follows</p>
    <div class="math">
\begin{align*}
\text{trace}(A_{k,\star}^{\mathrm{C2}}G)+a_{k,\star}^{\mathrm{C2}}F\leqslant0
&\qquad:\qquad\lambda_{k,\star}^{\mathrm{C2}}\geqslant0,\\
\text{trace}(A_{\star,k}^{\mathrm{C2}}G)+a_{\star,k}^{\mathrm{C2}}F\leqslant0
&\qquad:\qquad\lambda_{\star,k}^{\mathrm{C2}}\geqslant0.
\end{align*}
    </div>
    <p>With the notation \(\lambda^{\mathrm{C2}}=(\lambda_{k,\star}^{\mathrm{C2}},\lambda_{\star,k}^{\mathrm{C2}})\), the Lagrangian is</p>
    <div class="math">
\begin{align*}
\mathcal{L}_{\mathrm{C2}}(G,F,\lambda^{\mathrm{C2}})
&=\text{trace}((P-Q)G)+(p-q)F
-\lambda_{k,\star}^{\mathrm{C2}}\left(\text{trace}(A_{k,\star}^{\mathrm{C2}}G)+a_{k,\star}^{\mathrm{C2}}F\right)
-\lambda_{\star,k}^{\mathrm{C2}}\left(\text{trace}(A_{\star,k}^{\mathrm{C2}}G)+a_{\star,k}^{\mathrm{C2}}F\right)\\
&=\text{trace}\left(\left(P-Q-\lambda_{k,\star}^{\mathrm{C2}}A_{k,\star}^{\mathrm{C2}}
-\lambda_{\star,k}^{\mathrm{C2}}A_{\star,k}^{\mathrm{C2}}\right)G\right)
+\left(p-q-\lambda_{k,\star}^{\mathrm{C2}}a_{k,\star}^{\mathrm{C2}}
-\lambda_{\star,k}^{\mathrm{C2}}a_{\star,k}^{\mathrm{C2}}\right)F.
\end{align*}
    </div>
    <p>Since \(G\) is positive semidefinite and \(F\) is unrestricted, the objective of the Lagrange dual is</p>
    <div class="math">
\begin{equation*}
\mathop{\text{sup}}\limits_{G\in\mathbb{S}_{+}^{3},\,F\in\mathbb{R}}
\mathcal{L}_{\mathrm{C2}}(G,F,\lambda^{\mathrm{C2}})
=\begin{cases}
0,&\text{if }\begin{cases}
P-Q-\lambda_{k,\star}^{\mathrm{C2}}A_{k,\star}^{\mathrm{C2}}-\lambda_{\star,k}^{\mathrm{C2}}A_{\star,k}^{\mathrm{C2}}\preccurlyeq0,\\[0.25em]
p-q-\lambda_{k,\star}^{\mathrm{C2}}a_{k,\star}^{\mathrm{C2}}-\lambda_{\star,k}^{\mathrm{C2}}a_{\star,k}^{\mathrm{C2}}=0,
\end{cases}\\[0.4em]
+\infty,&\text{otherwise}.
\end{cases}
\end{equation*}
    </div>
    <p>Minimizing this objective over the nonnegative multipliers gives the dual SDP</p>
    <div class="math">
\begin{equation*}
\mathcal{D}_{\mathrm{C2}}^{\mathrm{SDP}}
=\left(
\begin{array}{cl}
\mathop{\text{minimize}}\limits_{\lambda_{k,\star}^{\mathrm{C2}},\lambda_{\star,k}^{\mathrm{C2}}\in\mathbb{R}}
&0\\[0.6em]
\text{subject to}
&\lambda_{k,\star}^{\mathrm{C2}},\lambda_{\star,k}^{\mathrm{C2}}\geqslant0,\\
&Q-P+\lambda_{k,\star}^{\mathrm{C2}}A_{k,\star}^{\mathrm{C2}}
+\lambda_{\star,k}^{\mathrm{C2}}A_{\star,k}^{\mathrm{C2}}\succcurlyeq0,\\
&\lambda_{k,\star}^{\mathrm{C2}}a_{k,\star}^{\mathrm{C2}}
+\lambda_{\star,k}^{\mathrm{C2}}a_{\star,k}^{\mathrm{C2}}-(p-q)=0.
\end{array}
\right).
\end{equation*}
    </div>
    <p>The primal relaxation and weak duality give</p>
    <div class="math">
\begin{equation*}
\mathcal{P}_{\mathrm{C2},d}\leqslant\mathcal{P}_{\mathrm{C2}}^{\mathrm{SDP}}
\leqslant\mathcal{D}_{\mathrm{C2}}^{\mathrm{SDP}}.
\end{equation*}
    </div>
    <p>If \(\eqref{eq:memory-lower-bound-certificate}\) is feasible, then \(\mathcal{D}_{\mathrm{C2}}^{\mathrm{SDP}}=0\), which proves \(\mathcal{V}(k)\geqslant\mathcal{M}(k)\) in every dimension.</p>
    <p><strong>Necessity.</strong> Suppose \(d\geqslant3\) and \(\mathcal{V}(k)\geqslant\mathcal{M}(k)\) holds along every trajectory. Exactness and feasibility of \((G,F)=(0,0)\) give \(\mathcal{P}_{\mathrm{C2}}^{\mathrm{SDP}}=0\).</p>
    <p>To prove feasibility of \(\eqref{eq:memory-lower-bound-certificate}\), equivalently of the dual SDP defining \(\mathcal{D}_{\mathrm{C2}}^{\mathrm{SDP}}\), we verify the refined Slater condition for the primal SDP defining \(\mathcal{P}_{\mathrm{C2}}^{\mathrm{SDP}}\). Since the interpolation constraints are affine in \((G,F)\), a feasible pair with \(G\succ0\) suffices \nocite{BV04}[<a href="#BV04">BV04</a>, Section 5.2.3]. Choose \(\mu<\ell_1<\ell_2<\ell_3<L\) and set</p>
    <div class="math">
\begin{equation*}
\begin{aligned}
H&=\mathop{\text{diag}}(\ell_1,\ell_2,\ell_3),
\qquad f(x)=\tfrac12x^{\top}Hx,
\qquad x^\star=0,\\[0.5em]
Z&=\begin{bmatrix}x^k&x^{k-1}&\nabla f(y^k)\end{bmatrix}=\begin{bmatrix}x^k&x^{k-1}&Hy^k\end{bmatrix}\in\mathbb{R}^{3\times3},\\[0.5em]
G&=\mathtt{Gram}(x^k,x^{k-1},\nabla f(y^k))=Z^{\top}Z,\\[0.5em]
F&=f(y^k)-f(0).
\end{aligned}
\end{equation*}
    </div>
    <p>Because \(f\in\mathcal{F}_{\mu,L}(\mathbb{R}^{3})\), these data satisfy the interpolation constraints, i.e.,</p>
    <div class="math">
\begin{equation*}
\text{trace}(A_{i,j}^{\mathrm{C2}}G)+a_{i,j}^{\mathrm{C2}}F\leqslant0,
\qquad i,j\in\{k,\star\},\quad i\ne j.
\end{equation*}
    </div>
    <p>We choose the initial points so that \(Z\) is nonsingular:</p>
    <ul>
      <li>
        <p>If \(\alpha\ne-1\), take</p>
        <div class="math">
\begin{equation*}
\begin{gathered}
x^k=(1,1,0),\qquad x^{k-1}=(0,0,1),\\[0.5em]
|\det Z|
=|1+\alpha|(\ell_2-\ell_1)>0.
\end{gathered}
\end{equation*}
        </div>
      </li>
      <li>
        <p>If \(\alpha=-1\), take</p>
        <div class="math">
\begin{equation*}
\begin{gathered}
x^k=(1,0,0),\qquad x^{k-1}=(0,1,1),\\[0.5em]
|\det Z|
=\ell_3-\ell_2>0.
\end{gathered}
\end{equation*}
        </div>
      </li>
    </ul>
    <p>Thus \(G=Z^{\top}Z\succ0\) in both cases. The refined Slater condition therefore gives</p>
    <div class="math">
\begin{equation*}
\mathcal{P}_{\mathrm{C2},d}=\mathcal{P}_{\mathrm{C2}}^{\mathrm{SDP}}=\mathcal{D}_{\mathrm{C2}}^{\mathrm{SDP}}=0.
\end{equation*}
    </div>
    <p>In particular, the dual SDP is feasible, and its multipliers satisfy \(\eqref{eq:memory-lower-bound-certificate}\).</p>
  </div>
</details>

**Searching for a Lyapunov function.** We now let the parameters $$Q,q$$ defining $$\mathcal{V}$$ vary and minimize $$\rho$$ subject to both tests in [Theorem 3](#theorem-memory-certificates). The resulting problem has bilinear terms $$\rho Q$$ and $$\rho q$$, but becomes an SDP feasibility problem when $$\rho$$ is fixed. We denote its optimal value by
<div class="math">
\begin{equation}
\label{eq:memory-lyapunov-search}
\rho^\star(P,p,\gamma,\alpha,\beta,\mu,L)
=\left(
\begin{array}{cl}
\mathop{\text{minimize}}\limits_{\substack{
\rho\in[0,1),\ Q\in\mathbb{S}^{3},\ q\in\mathbb{R}\\
\lambda_{i,j}^{\mathrm{C1}}\in\mathbb{R},\ i,j\in\{k,k+1,\star\},\ i\ne j\\
\lambda_{k,\star}^{\mathrm{C2}},\lambda_{\star,k}^{\mathrm{C2}}\in\mathbb{R}
}}
&\rho\\[0.6em]
\text{subject to}
&\lambda_{i,j}^{\mathrm{C1}}\geqslant0,\quad i,j\in\{k,k+1,\star\},\quad i\ne j,\\
&\lambda_{k,\star}^{\mathrm{C2}},\lambda_{\star,k}^{\mathrm{C2}}\geqslant0,\\
&\displaystyle\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}^{\mathrm{C1}}A_{i,j}^{\mathrm{C1}}
-(S_+^{\top}QS_+-\rho S^{\top}QS)\succcurlyeq0,\\
&\displaystyle\sum_{\substack{i,j\in\{k,k+1,\star\}\\i\ne j}}\lambda_{i,j}^{\mathrm{C1}}a_{i,j}^{\mathrm{C1}}
-q\begin{bmatrix}-\rho\\\phantom{-}1\end{bmatrix}=0,\\
&Q-P+\lambda_{k,\star}^{\mathrm{C2}}A_{k,\star}^{\mathrm{C2}}
+\lambda_{\star,k}^{\mathrm{C2}}A_{\star,k}^{\mathrm{C2}}\succcurlyeq0,\\
&\lambda_{k,\star}^{\mathrm{C2}}a_{k,\star}^{\mathrm{C2}}
+\lambda_{\star,k}^{\mathrm{C2}}a_{\star,k}^{\mathrm{C2}}-(p-q)=0
\end{array}
\right).
\end{equation}
</div>
Two observations allow us to use bisection with an SDP solver:
<ol>
  <li><p><strong>SDP feasibility.</strong> With \(\rho\) fixed, the constraints in \(\eqref{eq:memory-lyapunov-search}\) are affine in \(Q,q\) and the multipliers \(\lambda^{\mathrm{C1}},\lambda^{\mathrm{C2}}\), so we have an SDP feasibility problem.</p></li>
  <li>
    <p><strong>Monotonicity.</strong> If \(\eqref{eq:memory-lyapunov-search}\) is feasible at \(\rho\), it is feasible at every \(\rho'\in(\rho,1)\).</p>
    <details class="proof-disclosure" id="lyapunov-search-monotonicity-proof">
      <summary><span class="proof-show">Show proof</span><span class="proof-hide">Hide proof</span></summary>
      <div class="proof-content">
    <p>A feasible point gives \(\mathcal{V}(k)\geqslant\mathcal{M}(k)\geqslant0\). Hence</p>
    <div class="math">
\begin{equation*}
\mathcal{V}(k+1)\leqslant\rho\mathcal{V}(k)\leqslant\rho'\mathcal{V}(k).
\end{equation*}
    </div>
    <p>Since \(\eqref{eq:memory-lyapunov-search}\) does not depend on \(d\), we can take \(d=4\) and apply the necessity part of <a href="#theorem-memory-certificates">Theorem 3</a> to obtain C1 multipliers \(\lambda^{\mathrm{C1}}\) for \(\rho'\), with the same \(Q,q\). Together with the original C2 multipliers \(\lambda^{\mathrm{C2}}\), these give a feasible point of \(\eqref{eq:memory-lyapunov-search}\) at \(\rho'\).</p>
      </div>
    </details>
  </li>
</ol>
We can therefore use bisection to search for the smallest contraction factor $$\rho$$ certifiable by $$\eqref{eq:memory-lyapunov-search}$$, which is also the smallest factor within the class of Lyapunov functions in $$\eqref{eq:memory-lyapunov-ansatz}$$ when $$d\geqslant4$$.

##### 3.4 Numerical results
{: #lyapunov-search-numerical-results aria-level="3"}

<p class="numerical-solver-note">The numerical results were obtained with MOSEK \cite{Mos26}.</p>

For $$\mathcal{M}(k)=\|x^k-x^\star\|^2$$, we now use numerical bisection to estimate the optimal value of $$\eqref{eq:memory-lyapunov-search}$$ for the four methods in [Section 3.1](#gradient-methods-with-memory), using the parameters given there. Figure 4 compares the results with and without the additional constraints $$Q\succcurlyeq0$$ and $$q\geqslant0$$.

{% include lyapunov-memory-figure.liquid %}

For the parameter choices in [Section 3.1](#gradient-methods-with-memory), the optimal value $$\rho^\star$$ of $$\eqref{eq:memory-lyapunov-search}$$ depends only on the ratio $$L/\mu$$, which explains the horizontal axis in Figure 4 and allows us to compute the curves with $$L=1$$ and $$\mu\in(0,1)$$.

<details class="proof-disclosure" id="condition-number-scaling-proof">
  <summary><span class="proof-show">Show proof</span><span class="proof-hide">Hide proof</span></summary>
  <div class="proof-content">
    <p>For \(0<\mu<L\), set</p>
    <div class="math">
\begin{equation*}
\widetilde f=\tfrac{1}{L}f,
\qquad
\widetilde\mu=\tfrac{\mu}{L}\in(0,1).
\end{equation*}
    </div>
    <p>Positive scaling preserves the minimizer \(x^\star\) and gives</p>
    <div class="math">
\begin{equation*}
f\in\mathcal{F}_{\mu,L}(\mathbb{R}^d)
\quad\Longleftrightarrow\quad
\widetilde f\in\mathcal{F}_{\widetilde\mu,1}(\mathbb{R}^d).
\end{equation*}
    </div>
    <p>For each method in <a href="#gradient-methods-with-memory">Section 3.1</a>, evaluating the same parameter formulas at \((\widetilde\mu,1)\) gives</p>
    <div class="math">
\begin{equation*}
\widetilde\gamma=L\gamma,
\qquad
\widetilde\alpha=\alpha,
\qquad
\widetilde\beta=\beta.
\end{equation*}
    </div>
    <p>The gradient term in \(\eqref{eq:gradient-method-with-memory}\) is unchanged, since</p>
    <div class="math">
\begin{equation*}
\widetilde\gamma\nabla\widetilde f(y^k)
=L\gamma\,\tfrac{1}{L}\nabla f(y^k)
=\gamma\nabla f(y^k).
\end{equation*}
    </div>
    <p>Thus the two methods generate the same iterates from the same initial points.</p>
    <p>To transform the Lyapunov function, let \(D=\mathop{\text{diag}}(1,1,L)\) and write</p>
    <div class="math">
\begin{equation*}
\begin{aligned}
z^k&=(x^k-x^\star,x^{k-1}-x^\star,\nabla f(y^k)),\\
\widetilde z^k&=(x^k-x^\star,x^{k-1}-x^\star,\nabla\widetilde f(y^k)),\\
z^k&=(D\otimes I_d)\widetilde z^k.
\end{aligned}
\end{equation*}
    </div>
    <p>The corresponding change of coefficients, together with its inverse, is</p>
    <div class="math">
\begin{equation*}
\begin{alignedat}{2}
\widetilde Q&=D^{\top}QD,\qquad &Q&=D^{-\top}\widetilde QD^{-1},\\[0.4em]
\widetilde q&=Lq, &q&=\tfrac{1}{L}\widetilde q.
\end{alignedat}
\end{equation*}
    </div>
    <p>Substitution in \(\eqref{eq:memory-lyapunov-ansatz}\) gives</p>
    <div class="math">
\begin{equation*}
\begin{aligned}
\widetilde{\mathcal{V}}(k)
&=\inner{\widetilde z^k}{(\widetilde Q\otimes I_d)\widetilde z^k}+\widetilde q(\widetilde f(y^k)-\widetilde f(x^\star))\\
&=\inner{z^k}{(Q\otimes I_d)z^k}+q(f(y^k)-f(x^\star))\\
&=\mathcal{V}(k).
\end{aligned}
\end{equation*}
    </div>
    <p>For Figure 4, \(P=\mathop{\text{diag}}(1,0,0)\) and \(p=0\), so \(\mathcal{M}(k)=\norm{x^k-x^\star}^2\) is also unchanged. Hence \(\eqref{eq:memory-lyapunov-contraction}\) and \(\eqref{eq:memory-lyapunov-lower-bound}\) hold with the same \(\rho\) in either setting.</p>
    <p>Since \(\eqref{eq:memory-lyapunov-search}\) does not depend on \(d\), <a href="#theorem-memory-certificates">Theorem 3</a> at \(d=4\) gives equivalent SDP feasibility before and after normalization. The optimal values therefore agree:</p>
    <div class="math">
\begin{equation*}
\rho^\star(P,0,\gamma,\alpha,\beta,\mu,L)
=\rho^\star(P,0,L\gamma,\alpha,\beta,\tfrac{\mu}{L},1).
\end{equation*}
    </div>
    <p>The right-hand side depends only on \(\mu/L\) for the parameter choices in <a href="#gradient-methods-with-memory">Section 3.1</a>. The same argument applies when the additional constraints are imposed, because</p>
    <div class="math">
\begin{equation*}
Q\succcurlyeq0\quad\Longleftrightarrow\quad\widetilde Q\succcurlyeq0,
\qquad
q\geqslant0\quad\Longleftrightarrow\quad\widetilde q\geqslant0.
\end{equation*}
    </div>
  </div>
</details>

**Conclusions.** Removing the additional constraints $$Q\succcurlyeq0$$ and $$q\geqslant0$$ can improve the certified contraction factors. For triple momentum at larger condition numbers, the search without these additional constraints still certifies contraction, while no factor below $$1$$ is found when they are imposed. The restricted family includes familiar choices such as squared distance to the solution, function-value suboptimality, and squared gradient norm, illustrating the value of searching over a more flexible class of Lyapunov functions.

#### 4. Going further
{: #going-further aria-level="2"}

Both examples use semidefinite programming to combine valid inequalities into a Lyapunov certificate, either for a fixed Lyapunov function or while searching for one within a chosen family.

The theoretical framework in \cite{UBTG25} extends these ideas beyond the contraction bounds considered here. It covers sublinear convergence guarantees and splitting methods, including proximal gradient and Douglas–Rachford.

[AutoLyap](https://autolyap.github.io/), described in \cite{UDGT26}, supports broader classes of optimization and inclusion problems, iteration-dependent methods and analyses, and richer families of Lyapunov functions. Users specify the problem class, method, and desired Lyapunov analysis through a high-level interface. The software constructs and numerically solves the corresponding SDPs. Its [documentation](https://autolyap.github.io/quick_start/) provides worked examples.

**Acknowledgements and use of generative AI.** I thank Adrien Taylor and Adrien Banse for their helpful comments and suggestions. Large language models (LLMs) were used to help produce figures, correct typos, and improve wording.

{% include blog-citation.liquid %}

#### References
{: #references aria-level="2"}

{% bibliography --cited %}
