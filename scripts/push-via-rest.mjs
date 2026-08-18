#!/usr/bin/env node
/**
 * DJAC Deploy Script
 *
 * Pushes committed changes to GitHub via the REST Git Data API (byte-exact
 * blob uploads via cmd redirection, then tree → commit → PATCH ref).
 * Supports both branches from a single invocation.
 *
 * Usage:
 *   node scripts/push-via-rest.mjs [--branch develop|main|both] [--dry-run]
 *
 * Requires: gh CLI authenticated, git index up-to-date (ran git add).
 */

import { execSync } from "child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { tmpdir } from "os";

const REPO = "thearrival/DJAC-SaaS-Platform";
const TMP = path.join(tmpdir(), "djac-push");
if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true });

function sh(cmd) {
  return execSync(cmd, {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "ignore"],
  }).trim();
}

function ghApi(endpoint, method = "GET", bodyFile) {
  const args = ["api", `repos/${REPO}/${endpoint}`, "-X", method];
  if (bodyFile) args.push("--input", bodyFile);
  return JSON.parse(sh(`gh ${args.join(" ")}`));
}

function getBlobSha(filePath) {
  const indexSha = sh(`git ls-files -s -- "${filePath}"`).split(/\s+/)[1];
  const binFile = path.join(TMP, "blob.bin");
  sh(`cmd /c "git cat-file blob ${indexSha} > ${binFile}"`);
  const bytes = readFileSync(binFile);
  const b64 = Buffer.from(bytes).toString("base64");
  const payload = JSON.stringify({ content: b64, encoding: "base64" });
  const payloadFile = path.join(TMP, "blob.json");
  writeFileSync(payloadFile, payload, "utf-8");
  const resp = ghApi("git/blobs", "POST", payloadFile);
  if (resp.sha !== indexSha) {
    console.error(
      `WARN: blob SHA mismatch for ${filePath}: local=${indexSha} remote=${resp.sha}`
    );
  }
  return resp.sha;
}

function pushBranch(branch) {
  console.log(`\n=== Pushing ${branch} ===`);
  const ref = ghApi(`git/ref/heads/${branch}`);
  const baseSha = ref.object.sha;
  console.log(`base: ${baseSha.substring(0, 7)}`);

  const changed = sh("git diff --name-only HEAD~1").split("\n").filter(Boolean);
  const added = sh("git diff --name-only --diff-filter=A HEAD~1")
    .split("\n")
    .filter(Boolean);
  const allChanged = [...new Set([...changed, ...added])];

  if (allChanged.length === 0) {
    console.log("No changed files — pushing empty commit.");
    const emptyTree = ghApi(`git/trees/${baseSha}?recursive=1`)
      .tree.filter(e => e.type === "blob")
      .map(e => ({ path: e.path, mode: e.mode, type: "blob", sha: e.sha }));
    return createCommit(branch, baseSha, emptyTree, "chore: empty commit");
  }

  console.log(`Files: ${allChanged.length}`);

  const blobMap = {};
  for (const f of allChanged) {
    try {
      const sha = getBlobSha(f);
      blobMap[f] = sha;
      console.log(`  blob ${f} -> ${sha.substring(0, 7)}`);
    } catch (e) {
      console.error(`  SKIP ${f}: ${e.message}`);
    }
  }

  const baseTree = ghApi(`git/trees/${baseSha}?recursive=1`).tree;
  const entries = [];
  const seen = new Set();

  for (const entry of baseTree) {
    if (entry.type !== "blob") continue;
    if (blobMap[entry.path]) {
      entries.push({
        path: entry.path,
        mode: entry.mode,
        type: "blob",
        sha: blobMap[entry.path],
      });
      seen.add(entry.path);
    } else {
      entries.push({
        path: entry.path,
        mode: entry.mode,
        type: "blob",
        sha: entry.sha,
      });
    }
  }

  for (const f of allChanged) {
    if (!seen.has(f)) {
      entries.push({ path: f, mode: "100644", type: "blob", sha: blobMap[f] });
    }
  }

  const treePayload = JSON.stringify({ base_tree: baseSha, tree: entries });
  const treeFile = path.join(TMP, `tree-${branch}.json`);
  writeFileSync(treeFile, treePayload, "utf-8");
  const treeSha = ghApi("git/trees", "POST", treeFile).sha;
  console.log(`tree: ${treeSha.substring(0, 7)}`);

  return createCommitWithTree(branch, baseSha, treeSha);
}

function createCommitWithTree(branch, baseSha, treeSha) {
  const msg = sh("git log -1 --format=%s");
  const now = new Date().toISOString();
  const author = {
    name: process.env.GIT_AUTHOR_NAME || "DJAC Bot",
    email: process.env.GIT_AUTHOR_EMAIL || "dev@localhost",
  };
  const commitPayload = JSON.stringify({
    message: msg,
    tree: treeSha,
    parents: [baseSha],
    author,
    committer: author,
  });
  const commitFile = path.join(TMP, `commit-${branch}.json`);
  writeFileSync(commitFile, commitPayload, "utf-8");
  const commitResp = ghApi("git/commits", "POST", commitFile);
  const commitSha = commitResp.sha;
  console.log(`commit: ${commitSha.substring(0, 7)}`);

  ghApi(`git/refs/heads/${branch}`, "PATCH", null);
  // PATCH via form field
  sh(
    `gh api repos/${REPO}/git/refs/heads/${branch} -X PATCH -f sha=${commitSha}`
  );
  console.log(`pushed: ${commitSha.substring(0, 7)}`);
  return commitSha;
}

// ── Main ────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const branch = args.includes("--branch")
  ? args[args.indexOf("--branch") + 1]
  : "both";
const dryRun = args.includes("--dry-run");

if (dryRun) {
  console.log(
    "DRY RUN — would push to:",
    branch === "both" ? "develop + main" : branch
  );
  process.exit(0);
}

if (branch === "develop" || branch === "both") pushBranch("develop");
if (branch === "main" || branch === "both") pushBranch("main");
