import { spawnSync } from "node:child_process";
import { appendFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const origin = new URL(process.env.LIGHTHOUSE_PREVIEW_ORIGIN || "http://127.0.0.1:8080");
if (origin.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname)) {
  throw new Error("Lighthouse previews must use a local HTTP server");
}
const pages = [
  { name: "Blog index", path: "/blog/" },
  { name: "Lyapunov article", path: "/blog/computer-aided-lyapunov-analyses-in-optimization/" },
];
const profiles = [
  { name: "Mobile", flags: ["--throttling.cpuSlowdownMultiplier=2"] },
  { name: "Desktop", flags: ["--preset=desktop", "--throttling.cpuSlowdownMultiplier=1"] },
];
const categories = ["performance", "accessibility", "best-practices", "seo"];
const reports = await mkdtemp(join(tmpdir(), "blog-lighthouse-"));
const summary = [
  "## Blog Lighthouse preview",
  "",
  "Production build including unpublished posts, served only on this runner with gzip compression. Lighthouse 13.5.0; the CPU settings match the production badges.",
  "",
  "| Page | Profile | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
];

try {
  for (const page of pages) {
    const url = new URL(page.path, origin).href;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${page.name} preview returned HTTP ${response.status}`);
    await response.body?.cancel();

    for (const profile of profiles) {
      const reportPath = join(reports, `${pages.indexOf(page)}-${profile.name.toLowerCase()}.json`);
      const audit = spawnSync(
        "lighthouse",
        [
          url,
          "--quiet",
          "--only-categories=performance,accessibility,best-practices,seo",
          "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage",
          "--output=json",
          `--output-path=${reportPath}`,
          ...profile.flags,
        ],
        { stdio: "inherit", timeout: 180_000 }
      );
      if (audit.error) throw audit.error;
      if (audit.status !== 0) throw new Error(`Lighthouse failed for ${page.name} (${profile.name})`);

      const report = JSON.parse(await readFile(reportPath, "utf8"));
      if (report.runtimeError) throw new Error(`Lighthouse runtime error: ${report.runtimeError.code}`);
      const scores = categories.map((category) => {
        const score = report.categories?.[category]?.score;
        if (typeof score !== "number" || !Number.isFinite(score)) throw new Error(`Missing ${category} score for ${page.name}`);
        return Math.round(score * 100);
      });
      const metric = (id, divisor = 1, digits = 0) => {
        const value = report.audits?.[id]?.numericValue;
        if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Missing ${id} metric for ${page.name}`);
        return (value / divisor).toFixed(digits);
      };
      summary.push(
        `| ${page.name} | ${profile.name} | ${scores.join(" | ")} | ${metric("largest-contentful-paint", 1000, 2)} s | ${metric(
          "total-blocking-time"
        )} ms | ${metric("cumulative-layout-shift", 1, 3)} |`
      );
    }
  }
} finally {
  // Raw reports can contain draft content. Never upload them or retain them.
  await rm(reports, { recursive: true, force: true });
}

const result = `${summary.join("\n")}\n`;
console.log(result);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, result);
