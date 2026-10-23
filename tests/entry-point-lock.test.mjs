import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const entryPoint = readFileSync(new URL("../bin/entry_point.sh", import.meta.url), "utf8");
const manageLock = entryPoint.match(/^manage_gemfile_lock\(\) \{[\s\S]*?^\}/m)?.[0];
assert.ok(manageLock, "The entry point must expose its lockfile management function");

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "entry-point-lock-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  // The current entry point configures Git globally. Isolate that configuration
  // so this regression never changes the developer's own Git settings.
  const env = { ...process.env, GIT_CONFIG_GLOBAL: join(directory, "gitconfig"), GIT_CONFIG_NOSYSTEM: "1" };
  const run = (command, args) => {
    const result = spawnSync(command, args, { cwd: directory, env, encoding: "utf8" });
    assert.equal(result.status, 0, `${command} failed: ${result.stderr || result.error || result.stdout}`);
    return result.stdout;
  };
  run("git", ["init", "--quiet"]);
  const lock = join(directory, "Gemfile.lock");
  return { lock, run, manage: () => run("bash", ["-c", `set -euo pipefail\n${manageLock}\nmanage_gemfile_lock`]) };
}

test("tracked lockfile edits survive startup and repeated config reload checks", (t) => {
  const f = fixture(t);
  const staged = "GEM\n  specs:\n    jekyll (4.3.4)\n";
  writeFileSync(f.lock, staged);
  f.run("git", ["add", "Gemfile.lock"]);
  for (const version of ["4.4.1", "4.4.2"]) {
    const edited = staged.replace("4.3.4", version);
    writeFileSync(f.lock, edited);
    f.manage();
    assert.equal(readFileSync(f.lock, "utf8"), edited, "Local dependency edits must not be restored from Git");
    assert.equal(f.run("git", ["show", ":Gemfile.lock"]), staged, "Lock management must not change the index either");
  }
});

test("an untracked lockfile keeps the existing regeneration behavior", (t) => {
  const f = fixture(t);
  writeFileSync(f.lock, "untracked local lock\n");
  f.manage();
  assert.equal(existsSync(f.lock), false);
});
