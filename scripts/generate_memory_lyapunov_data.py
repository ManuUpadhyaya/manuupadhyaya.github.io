#!/usr/bin/env python3
"""Generate Figure 4 by checked MOSEK Fusion feasibility/bisection solves.

The solver uses g/mu and (f-f*)/mu as coordinates, with native-coordinate
fallback. Three scalar equalities are eliminated before each solve. Positive rescaling of
the four performance measures leaves their optimal factors unchanged and
keeps the slow-curvature direction visible at small mu/L.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
import gzip
import hashlib
import json
import math
from pathlib import Path
import time

import numpy as np
import mosek
from mosek.fusion import AccSolutionStatus, Domain, Expr, Matrix, Model, ObjectiveSense


METHODS = ("gradient", "heavy_ball", "nesterov", "triple_momentum")
METRICS = ("distance", "extrapolated_distance", "function", "gradient_norm")
MODES = ("free", "positive")
PAIRS = ((0, 2), (2, 0), (1, 2), (2, 1), (0, 1), (1, 0))
TOLERANCE = 1e-10
PSD_MARGIN = 1e-9
RESIDUAL_TOLERANCE = 2e-8


def parameters(method: str, ratio: float) -> tuple[float, float, float]:
    r = math.sqrt(ratio)
    if method == "gradient":
        return 2 / (1 + ratio), 0.0, 0.0
    if method == "heavy_ball":
        return 4 / (1 + r) ** 2, 0.0, ((1 - r) / (1 + r)) ** 2
    if method == "nesterov":
        b = (1 - r) / (1 + r)
        return 1.0, b, b
    if method == "triple_momentum":
        b = (1 - r) ** 2 / (1 + r)
        return 2 - r, b / (2 - r), b
    raise ValueError(method)


def matrices(method: str, ratio: float, coordinates="balanced"):
    """Divide interpolation by the coordinate scale, then multiply by2(1-mu)."""
    gamma, alpha, beta = parameters(method, ratio)
    scale = ratio if coordinates == "balanced" else 1.
    S = np.eye(4)[:3]
    Sp = np.array([[1 + beta, -beta, -gamma * scale, 0],
                   [1, 0, 0, 0], [0, 0, 0, 1]], dtype=float)
    points = [np.array([1 + alpha, -alpha, 0, 0.0]),
              np.array([1 + beta * (1 + alpha), -beta * (1 + alpha),
                        -gamma * scale * (1 + alpha), 0]), np.zeros(4)]
    grads = [np.eye(4)[2], np.eye(4)[3], np.zeros(4)]
    values = [np.array([1., 0.]), np.array([0., 1.]), np.zeros(2)]
    A, a = [], []
    for i, j in PAIRS:
        d = points[i] - points[j]
        dg = grads[i] - grads[j]
        # 2(1-mu) times the original inequality, divided by the scale.
        A.append((ratio / scale) * np.outer(d, d) + scale * np.outer(dg, dg)
                 - ratio * (np.outer(grads[i], d) + np.outer(d, grads[i]))
                 + np.outer(grads[j], d) + np.outer(d, grads[j]))
        a.append(2 * (1 - ratio) * (values[j] - values[i]))
    # Balance the weak history direction when momentum is small. This is an
    # invertible congruence, so both the unrestricted and Q-positive feasible
    # sets and their rate infima are preserved exactly.
    history = math.sqrt(beta) if beta > 0 else 1.
    T = np.diag([1., 1/history, 1., 1.])
    Sp = np.diag([1., history, 1.]) @ Sp @ T
    A = np.einsum("ij,njk,kl->nil", T, np.array(A), T)
    return S, Sp, A, np.array(a), A[:2, :3, :3], np.array(a[:2])[:, 0]


def performance(metric: str, alpha: float, ratio: float, history=1.):
    if metric == "distance":
        return np.diag([1., 0., 0.]), 0.
    if metric == "extrapolated_distance":
        c = np.array([1 + alpha, -alpha/history, 0.])
        return np.outer(c, c), 0.
    if metric == "function":
        return np.zeros((3, 3)), 2*(1-ratio)
    if metric == "gradient_norm":
        return np.diag([0., 0., 1.]), 0.
    raise ValueError(metric)


def spectral_lower_bound(method: str, ratio: float) -> float:
    # Maximum squared spectral radius over scalar curvatures in [mu,1].
    if method == "gradient":
        return ((1-ratio)/(1+ratio))**2
    if method == "heavy_ball":
        return ((1-math.sqrt(ratio))/(1+math.sqrt(ratio)))**2
    return (1-math.sqrt(ratio))**2


def dense(a):
    return Matrix.dense(np.asarray(a, dtype=float))


class Unresolved(RuntimeError):
    pass


class Feasibility:
    def __init__(self, method, ratio, metric, mode, coordinates="balanced", reduced=True, magnitude=False):
        self.method, self.ratio, self.metric, self.mode = method, ratio, metric, mode
        self.coordinates = coordinates
        self.reduced = reduced
        self.magnitude = magnitude
        self.scale = ratio if coordinates == "balanced" else 1.
        self.S, self.Sp, self.A, self.a, self.B, self.b = matrices(method, ratio, coordinates)
        _, alpha, beta = parameters(method, ratio)
        self.history = math.sqrt(beta) if beta > 0 else 1.
        self.P, self.p = performance(metric, alpha, ratio, self.history)
        self.model = Model()
        m = self.model
        m.setSolverParam("numThreads", 1)
        m.setSolverParam("intpntCoTolPfeas", 1e-10)
        m.setSolverParam("intpntCoTolDfeas", 1e-10)
        m.setSolverParam("intpntCoTolRelGap", 1e-9)
        m.setSolverParam("intpntMaxIterations", 150)
        self.rho = m.parameter()
        self.Pparameter = m.parameter(3, 3)
        self.p_ratio = m.parameter()
        self.Pparameter.setValue(self.P)
        self.p_ratio.setValue([self.p / (2*(1-ratio))])
        self.Qv = m.variable(6, Domain.unbounded())
        if reduced:
            self.partial = m.variable(4, Domain.greaterThan(0.))
        else:
            self.q = m.variable(1, Domain.unbounded())
            self.l1 = m.variable(6, Domain.greaterThan(0.))
        self.l2 = m.variable(2, Domain.greaterThan(0.))
        if reduced:
            c = 2*(1-ratio)
            q_ratio = Expr.add(self.p_ratio, Expr.dot([1., -1.], self.l2))
            q_expression = Expr.mul(c, q_ratio)
            x, z, u, v = [self.partial.index(i) for i in range(4)]
            y = Expr.sub(Expr.add(x, Expr.sub(u, v)), Expr.mul(self.rho, q_ratio))
            w = Expr.add(Expr.sub(z, Expr.sub(u, v)), q_ratio)
            m.constraint(y, Domain.greaterThan(0.))
            m.constraint(w, Domain.greaterThan(0.))
            l1_expression = Expr.vstack([x, y, z, w, u, v])
        else:
            q_expression = self.q
            l1_expression = self.l1
        basis = []
        for i, j in ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2)):
            e = np.zeros((3, 3)); e[i, j] = e[j, i] = 1.; basis.append(e)
        self.basis = np.array(basis)
        Q = Expr.reshape(Expr.mul(dense(self.basis.reshape(6, 9).T), self.Qv), 3, 3)
        c1Q = np.array([self.S.T @ e @ self.S for e in self.basis])
        cpQ = np.array([self.Sp.T @ e @ self.Sp for e in self.basis])
        c1 = Expr.sub(Expr.mul(dense(self.A.reshape(6, 16).T), l1_expression),
                      Expr.mul(dense(cpQ.reshape(6, 16).T), self.Qv))
        c1 = Expr.add(c1, Expr.mul(self.rho, Expr.mul(dense(c1Q.reshape(6, 16).T), self.Qv)))
        m.constraint(Expr.sub(Expr.reshape(c1, 4, 4), dense(PSD_MARGIN * np.eye(4))), Domain.inPSDCone(4))
        # sum lambda*a + rho*q*(1,0) - q*(0,1) = 0.
        if not reduced:
            balance = Expr.sub(Expr.mul(dense(self.a.T), self.l1), Expr.mul(dense([[0.], [1.]]), self.q))
            balance = Expr.add(balance, Expr.mul(dense([[1.], [0.]]), Expr.mul(self.rho, self.q)))
            m.constraint(balance, Domain.equalsTo(0.))
        c2 = Expr.add(Expr.mul(dense(self.basis.reshape(6, 9).T), self.Qv),
                      Expr.mul(dense(self.B.reshape(2, 9).T), self.l2))
        c2 = Expr.sub(Expr.reshape(c2, 3, 3), Expr.add(self.Pparameter, dense(PSD_MARGIN * np.eye(3))))
        m.constraint(c2, Domain.inPSDCone(3))
        if not reduced:
            m.constraint(Expr.sub(Expr.add(Expr.dot(self.b, self.l2), self.q.index(0)), Expr.mul(2*(1-ratio), self.p_ratio)), Domain.equalsTo(0.))
        if mode == "positive":
            m.constraint(Q, Domain.inPSDCone(3))
            m.constraint(q_expression, Domain.greaterThan(0.))
        # A constant objective is essential: an otherwise equivalent magnitude
        # objective can give spurious infeasibility reports near unbounded
        # boundary certificates. Every feasible solution is checked below.
        if magnitude:
            absQ = m.variable(6, Domain.greaterThan(0.))
            absq = m.variable(Domain.greaterThan(0.))
            scalar_q = q_expression if reduced else self.q.index(0)
            m.constraint(Expr.sub(absQ, self.Qv), Domain.greaterThan(0.))
            m.constraint(Expr.add(absQ, self.Qv), Domain.greaterThan(0.))
            m.constraint(Expr.sub(absq, scalar_q), Domain.greaterThan(0.))
            m.constraint(Expr.add(absq, scalar_q), Domain.greaterThan(0.))
            m.objective(ObjectiveSense.Minimize, Expr.add([
                Expr.dot([1.,2.,2.,1.,2.,1.], absQ), absq,
                Expr.mul(1e-4, Expr.add(Expr.sum(l1_expression), Expr.sum(self.l2)))]))
        else:
            m.objective(ObjectiveSense.Minimize, Expr.constTerm(0.))
        self.calls = 0
        self.failures = []

    def set_metric(self, metric):
        self.metric = metric
        _, alpha, _ = parameters(self.method, self.ratio)
        self.P, self.p = performance(metric, alpha, self.ratio, self.history)
        self.Pparameter.setValue(self.P)
        self.p_ratio.setValue([self.p / (2*(1-self.ratio))])

    def close(self):
        self.model.dispose()

    def solve(self, rho):
        self.calls += 1
        self.rho.setValue([float(rho)])
        try:
            self.model.solve()
        except Exception as exc:
            raise RuntimeError(f"{self.method}/{self.metric}/{self.mode}, ratio={self.ratio}, rho={rho}: {exc}") from exc
        problem_status = str(self.model.getProblemStatus())
        status = str(self.model.getPrimalSolutionStatus())
        self.last_status = {"coordinates": self.coordinates, "magnitudeObjective": self.magnitude,
                            "problemStatus": problem_status, "primalSolutionStatus": status}
        if "PrimalInfeasible" in problem_status:
            return None
        self.model.acceptedSolutionStatus(AccSolutionStatus.Anything)
        try:
            Q = np.einsum("i,ijk->jk", self.Qv.level(), self.basis)
            l2 = np.maximum(0., self.l2.level())
            if self.reduced:
                x, z, u, v = self.partial.level()
                q = float(self.p - l2 @ self.b)
                q_ratio = q / (2*(1-self.ratio))
                l1 = np.maximum(0., [x, x+u-v-rho*q_ratio, z, z-u+v+q_ratio, u, v])
            else:
                q = float(self.q.level()[0]); l1 = np.maximum(0., self.l1.level())
        except Exception as exc:
            raise Unresolved(f"No candidate for {problem_status}/{status}: {exc}") from None
        # Repair the three linear balances using increases in nonnegative
        # star-pair multipliers; check both matrix inequalities after repair.
        original_q = q
        q = float(self.p - l2 @ self.b)
        e1 = l1 @ self.a - q * np.array([-rho, 1.])
        c = 2 * (1 - self.ratio)
        for coordinate, negative, positive in ((0, 0, 1), (1, 2, 3)):
            error = float(e1[coordinate])
            l1[negative if error >= 0 else positive] += abs(error) / c
        c1 = np.einsum("i,ijk->jk", l1, self.A) - self.Sp.T @ Q @ self.Sp + rho * self.S.T @ Q @ self.S
        e1 = l1 @ self.a - q * np.array([-rho, 1.])
        c2 = Q - self.P + np.einsum("i,ijk->jk", l2, self.B)
        e2 = float(l2 @ self.b - (self.p - q))
        eig1 = float(np.linalg.eigvalsh(c1)[0]); eig2 = float(np.linalg.eigvalsh(c2)[0])
        eq = max(float(np.max(np.abs(e1))), abs(e2))
        minimum = min(float(np.min(l1)), float(np.min(l2)))
        eigQ = float(np.linalg.eigvalsh(Q)[0])
        D4 = np.diag([1., self.history, 1 / self.scale, 1 / self.scale])
        D3 = D4[:3, :3]
        original1 = D4 @ c1 @ D4
        original2 = D3 @ c2 @ D3
        original_eigenvalues1 = np.linalg.eigvalsh(original1)
        original_eigenvalues2 = np.linalg.eigvalsh(original2)
        original_eig1 = float(original_eigenvalues1[0])
        original_eig2 = float(original_eigenvalues2[0])
        relative_original = max(0., -original_eig1 / max(1., float(np.max(np.abs(original_eigenvalues1)))), -original_eig2 / max(1., float(np.max(np.abs(original_eigenvalues2)))))
        valid = eig1 >= -RESIDUAL_TOLERANCE and eig2 >= -RESIDUAL_TOLERANCE and eq <= RESIDUAL_TOLERANCE and minimum >= -RESIDUAL_TOLERANCE and relative_original <= RESIDUAL_TOLERANCE
        if self.mode == "positive":
            valid = valid and eigQ >= -RESIDUAL_TOLERANCE and q >= -RESIDUAL_TOLERANCE
        certificate = {"rho": float(rho), "Q": Q.tolist(), "q": q,
                       "problemStatus": problem_status, "primalSolutionStatus": status,
                       "formulation": "three_equalities_eliminated" if self.reduced else "explicit_equalities",
                       "objective": "coefficient_magnitude" if self.magnitude else "constant_zero",
                       "coordinates": self.coordinates, "gradientScale": self.scale,
                       "historyScale": self.history,
                       "functionScale": self.scale,
                       "lambdaC1": l1.tolist(), "lambdaC2": l2.tolist(),
                       "validation": {"minEigenvalueC1": eig1, "minEigenvalueC2": eig2,
                                      "maxEqualityResidual": eq, "minMultiplier": minimum,
                                      "minEigenvalueQ": eigQ,
                                      "minEigenvalueC1Original": original_eig1,
                                      "minEigenvalueC2Original": original_eig2,
                                      "relativePSDResidualOriginal": relative_original,
                                      "balanceRepair": max(abs(q - original_q), float(np.max(np.abs(e1)))),
                                      "maxCoefficient": max(float(np.max(np.abs(Q))), abs(q), float(np.max(l1)), float(np.max(l2)))}}
        if not valid:
            raise Unresolved(f"Certificate residual rejection at {self.method}/{self.metric}/{self.mode}, ratio={self.ratio}, rho={rho}: {certificate['validation']}")
        return certificate


def bisect(method, ratio, metric, mode, tolerance=TOLERANCE, problems=None):
    start = time.monotonic()
    own_models = problems is None
    if problems is None:
        problems = [Feasibility(method, ratio, metric, mode, "balanced")]
    for problem in problems:
        problem.set_metric(metric)
    initial_calls = sum(p.calls for p in problems)
    unresolved = []
    def solve(rho):
        outcomes = []
        for index in range(4):
            if index == len(problems):
                problems.append(Feasibility(method, ratio, metric, mode, "balanced" if index % 2 == 0 else "native", magnitude=index>=2))
            problem = problems[index]
            try:
                candidate = problem.solve(rho)
                if candidate is not None:
                    return candidate
                outcomes.append("infeasible" if index < 2 else "polish_infeasible")
            except Unresolved as exc:
                outcomes.append(str(exc))
            if index == 1 and outcomes == ["infeasible", "infeasible"]:
                return None
        if "infeasible" in outcomes:
            return None
        raise Unresolved(f"Both coordinate scalings unresolved at rho={rho}: {outcomes}")
    lower = spectral_lower_bound(method, ratio)
    # A subunit upper bound is established by an actual checked feasible solve.
    upper = 1 - 1e-7
    try:
        witness = solve(upper)
        if witness is None:
            return {"rho": None, "lower": lower, "upperTest": upper,
                    "calls": sum(p.calls for p in problems)-initial_calls, "seconds": time.monotonic() - start,
                    "upperTestStatuses": [p.last_status for p in problems],
                    "status": "no_subunit_certificate", "certificate": None}
        if lower >= upper:
            raise RuntimeError("A feasible certificate contradicts the quadratic spectral lower bound")
        attempts = 0
        while upper - lower > tolerance:
            attempts += 1
            # If a boundary point is numerically unresolved, bisect the largest
            # remaining interval instead of assigning it a feasibility label.
            cuts = [lower] + sorted(x for x in unresolved if lower < x < upper) + [upper]
            left, right = max(zip(cuts[:-1], cuts[1:]), key=lambda pair: pair[1] - pair[0])
            midpoint = (left + right) / 2
            try:
                candidate = solve(midpoint)
            except Unresolved:
                unresolved.append(midpoint)
                if attempts >= 96 or right - left < max(tolerance / 16, 1e-12):
                    if upper - lower > .005:
                        raise Unresolved(f"Unresolved bracket [{lower}, {upper}] is too wide")
                    break
                continue
            if candidate is None:
                lower = midpoint
            else:
                upper, witness = midpoint, candidate
        return {"rho": upper, "lower": lower, "bracketWidth": upper - lower,
                "unresolvedPoints": len(unresolved), "calls": sum(p.calls for p in problems)-initial_calls,
                "seconds": time.monotonic() - start,
                "status": "validated_feasible" if upper-lower <= tolerance else "validated_feasible_with_numerical_band",
                "certificate": witness}
    finally:
        if own_models:
            for problem in problems:
                problem.close()


def ratio_grid(count):
    # Concentration near zero and the observed heavy-ball transition; no endpoint is fabricated.
    base = np.geomspace(.001, .999, count)
    local = np.linspace(.03, .12, max(9, count // 5))
    near_one = np.array([.5, .6, .7, .8, .9, .95, .975, .99, .999])
    return sorted(set(float(f"{v:.12g}") for v in np.r_[base, local, near_one]))


def run_task(task):
    method, ratio, mode, metrics, tolerance = task
    problems = []
    results = []
    try:
        problems.append(Feasibility(method, ratio, metrics[0], mode, "balanced"))
        for metric in metrics:
            results.append(((method, ratio, metric, mode), bisect(method, ratio, metric, mode, tolerance, problems)))
        return results
    except Exception as exc:
        # Fusion's generated exception classes cannot cross a worker boundary.
        raise RuntimeError(f"{method}/{ratio}/{mode}: {exc}") from None
    finally:
        for problem in problems:
            problem.close()


def refine_heavy_ball_boundaries(results, ratios, tolerance, target, save_result):
    """Add actual solves approaching each observed subunit-certificate boundary."""
    summaries = []
    for mode in MODES:
        points = sorted((key[1], result) for key, result in results.items()
                        if key[0] == "heavy_ball" and key[2:] == ("distance", mode))
        feasible = [(ratio, result) for ratio, result in points if result["rho"] is not None]
        if not feasible:
            raise RuntimeError(f"No initial heavy-ball feasible point for {mode}")
        upper, endpoint = feasible[0]
        missing = [ratio for ratio, result in points if result["rho"] is None and ratio < upper]
        if not missing:
            raise RuntimeError(f"No initial heavy-ball missing point below the {mode} boundary")
        lower = max(missing)
        probes = []
        for _ in range(32):
            if endpoint["rho"] >= target:
                break
            ratio = (lower + upper) / 2
            key = ("heavy_ball", ratio, "distance", mode)
            result = results.get(key)
            if result is None:
                result = bisect("heavy_ball", ratio, "distance", mode, tolerance)
                results[key] = result
                save_result(key, result)
            ratios.add(ratio)
            probes.append(ratio)
            print(json.dumps({"boundaryRefinement": mode, "ratio": ratio, "rho": result["rho"],
                              "target": target}), flush=True)
            if result["rho"] is None:
                lower = ratio
            else:
                upper, endpoint = ratio, result
        if endpoint["rho"] < target:
            raise RuntimeError(f"Heavy-ball {mode} refinement did not reach rho={target}")
        summaries.append({"mode": mode, "targetEndpointFactor": target,
                          "missingRatioBelowEndpoint": lower, "endpointRatio": upper,
                          "endpointConditionNumber": 1/upper, "endpointFactor": endpoint["rho"],
                          "probeRatios": probes})
    return summaries


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("assets/data/lyapunov-memory.json"))
    parser.add_argument("--samples", type=int, default=75)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--tolerance", type=float, default=TOLERANCE)
    parser.add_argument("--probe", nargs="*", type=float, help="Only probe these ratios, with console results")
    parser.add_argument("--metrics", nargs="+", choices=METRICS, default=["distance"])
    parser.add_argument("--checkpoint", type=Path, default=Path("/tmp/lyapunov-memory-checkpoint.jsonl"))
    parser.add_argument("--refine-heavy-ball", action="store_true",
                        help="Reuse the saved dataset and refine both heavy-ball curve endpoints")
    parser.add_argument("--endpoint-factor", type=float, default=.9999)
    args = parser.parse_args()
    ratios = args.probe or ratio_grid(args.samples)
    if any(not 0 < x < 1 for x in ratios):
        raise ValueError("Every sampled mu/L must lie strictly between zero and one")
    results = {}
    previous_count = 0
    boundary_summaries = []
    if args.refine_heavy_ball:
        if args.probe or args.metrics != ["distance"] or not 0 < args.endpoint_factor < 1:
            raise ValueError("Boundary refinement requires distance-only output and an interior target factor")
        previous_data = json.loads(args.output.read_text())
        ratios = previous_data["axes"]["ratio"]
        previous_audit = args.output.with_name(previous_data["metadata"]["auditFile"])
        with gzip.open(previous_audit, "rt") as audit:
            for record in json.load(audit)["records"]:
                key = (record["method"], record["ratio"], record["metric"], record["mode"])
                results[key] = {name: value for name, value in record.items()
                                if name not in ("method", "ratio", "metric", "mode")}
        previous_count = len(results)
    run_signature = hashlib.sha256(Path(__file__).read_bytes() + str(args.tolerance).encode()).hexdigest()
    if not args.probe and args.checkpoint.exists():
        for line in args.checkpoint.read_text().splitlines():
            record = json.loads(line)
            if record.get("signature") == run_signature:
                results[tuple(record["key"])] = record["result"]
    def save_result(key, result):
        if not args.probe:
            with args.checkpoint.open("a") as checkpoint:
                checkpoint.write(json.dumps({"signature": run_signature, "key": key, "result": result}, separators=(",", ":")) + "\n")
    if args.refine_heavy_ball:
        ratio_set = set(ratios) | {key[1] for key in results}
        boundary_summaries = refine_heavy_ball_boundaries(results, ratio_set, args.tolerance,
                                                         args.endpoint_factor, save_result)
        ratios = sorted(ratio_set)
    tasks = [(method, ratio, mode, tuple(args.metrics), args.tolerance)
             for ratio in ratios for method in METHODS for mode in MODES]
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(run_task, task): task for task in tasks
                   if any((task[0],task[1],metric,task[2]) not in results for metric in task[3])}
        for future in as_completed(futures):
            for key, result in future.result():
                results[key] = result
                save_result(key, result)
                print(json.dumps({"progress": f"{len(results)}/{len(tasks)*len(args.metrics)}", "method": key[0], "ratio": key[1],
                                  "metric": key[2], "mode": key[3], "rho": result["rho"],
                                  "calls": result["calls"], "seconds": round(result["seconds"], 3)}), flush=True)
    if args.probe:
        return
    data = {"version": 1, "solver": "MOSEK Fusion 11.2.3", "axes": {"ratio": ratios},
            "modes": list(MODES), "methods": list(METHODS), "metrics": {},
            "metadata": {"L": 1, "tolerance": args.tolerance, "targetBisectionTolerance": args.tolerance, "psdMargin": PSD_MARGIN,
                         "bisectionAccuracy": "Requested interval width; actual wider numerical bands are retained in the compressed audit and summarized below",
                         "formulation": "Three scalar balances eliminated analytically; pure feasibility with two coordinate scalings, optional coefficient-size recovery; objective recovery never establishes infeasibility",
                         "absoluteResidualTolerance": RESIDUAL_TOLERANCE,
                         "normalization": {"gradientCoordinates": "grad f / mu, with native-coordinate fallback", "functionCoordinates": "(f-f*) / mu, with native-coordinate fallback",
                                           "historyCoordinates": "sqrt(beta)*x_previous; scale1 when beta=0",
                                           "functionPerformance": "2(1-mu)*(f(y)-f*) / coordinateScale", "gradientPerformance": "||grad f(y)||^2 / coordinateScale^2",
                                           "interpolationScale": "2(L-mu), applied to matrix and function coefficients"},
                         "missingValueMeaning": "Primal infeasible in at least one coordinate scaling at rho=1-1e-7, with no validated feasible witness in either; not a claim of divergence",
                         "auditFile": args.output.stem + "-certificates.json.gz",
                         "representativeCertificates": []}}
    if args.refine_heavy_ball:
        data["metadata"]["heavyBallBoundaryRefinement"] = {
            "reusedRecords": previous_count, "addedRecords": len(results)-previous_count,
            "boundaries": boundary_summaries}
    for metric in args.metrics:
        data["metrics"][metric] = {mode: {method: [results[method, ratio, metric, mode]["rho"] for ratio in ratios]
                                          for method in METHODS} for mode in MODES}
    records = []
    for key, result in sorted(results.items()):
        record = {"method": key[0], "ratio": key[1], "metric": key[2], "mode": key[3], **result}
        records.append(record)
    feasible = [r for r in records if r["rho"] is not None]
    gd_errors = [abs(r["rho"] - ((1-r["ratio"])/(1+r["ratio"]))**2) for r in feasible if r["method"] == "gradient"]
    positive_order_violations = []
    for metric in args.metrics:
        for method in METHODS:
            for ratio in ratios:
                free = results[method, ratio, metric, "free"]["rho"]
                positive = results[method, ratio, metric, "positive"]["rho"]
                if free is None and positive is not None:
                    raise RuntimeError("A positive certificate exists where the unrestricted search reports none")
                if free is not None and positive is not None and positive < free - 5e-4:
                    positive_order_violations.append([method, ratio, metric, free, positive])
    if max(gd_errors, default=0.) > 5e-4 or positive_order_violations:
        raise RuntimeError(f"Independent rate checks failed: GD={max(gd_errors, default=0.)}, order={positive_order_violations}")
    data["metadata"]["validation"] = {
        "feasibleCertificates": len(feasible), "missingCertificates": len(records)-len(feasible),
        "totalSolverCalls": sum(r["calls"] for r in records),
        "maxBracketWidth": max(r["bracketWidth"] for r in feasible),
        "bracketsWiderThanTarget": sum(r["bracketWidth"] > args.tolerance for r in feasible),
        "maxGradientDescentAnalyticError": max(gd_errors, default=0.),
        "positiveOrderViolations": positive_order_violations,
        "minEigenvalueC1": min(r["certificate"]["validation"]["minEigenvalueC1"] for r in feasible),
        "minEigenvalueC2": min(r["certificate"]["validation"]["minEigenvalueC2"] for r in feasible),
        "maxEqualityResidual": max(r["certificate"]["validation"]["maxEqualityResidual"] for r in feasible),
        "maxRelativePSDResidualOriginal": max(r["certificate"]["validation"]["relativePSDResidualOriginal"] for r in feasible),
        "maxCoefficient": max(r["certificate"]["validation"]["maxCoefficient"] for r in feasible)}
    target_ratio = min(ratios, key=lambda x: abs(x-.25))
    data["metadata"]["representativeCertificates"] = [r for r in records if r["ratio"] == target_ratio and r["metric"] == "distance"]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    audit_path = args.output.with_name(data["metadata"]["auditFile"])
    # Fixed gzip timestamp makes repeated identical results byte reproducible.
    with audit_path.open("wb") as raw:
        with gzip.GzipFile(filename="", mode="wb", fileobj=raw, mtime=0) as compressed:
            compressed.write(json.dumps({"version": 1, "records": records}, separators=(",", ":"), allow_nan=False).encode())
    args.output.write_text(json.dumps(data, separators=(",", ":"), allow_nan=False) + "\n")
    print(f"Wrote {args.output}", flush=True)


if __name__ == "__main__":
    main()
