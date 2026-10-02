# Disaster Recovery & Backup Runbook

Status: automated backups **live** (autonomous serverless snapshot daily, verified); **restore drill not yet executed** (see §5).

## 1. Scope

Production database: PostgreSQL (Supabase). Application: stateless Vercel
serverless deployment (`app.yalla-hack.ae`) plus static SPA. Object storage
(if configured): AWS S3 / Cloudflare R2 via `@aws-sdk/client-s3`.

## 2. Objectives

| Metric                | Target                                            | Notes                                                     |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------- |
| RPO (max data loss)   | **24 h** (daily backup) / 7 daily copies retained | Improve to ≤1 h with Supabase PITR or more frequent dumps |
| RTO (time to restore) | **≤ 2 h**                                         | Restore into a scratch branch, verify, then promote       |

## 3. Backups

### 3.1 Serverless snapshot (autonomous — implemented & verified)

`/api/cron/backup` runs **daily at 03:00 UTC** (Vercel cron, `CRON_SECRET`-gated).
It snapshots the business-critical tables to a private Supabase Storage bucket
(`backups`) as JSON and retains the last 14 copies. No runner or repository
secret is required — it runs inside the app with existing env, so the backup
safety net is active with zero owner action.

- **Tables:** localUsers, users, organizations, organizationMembers,
  organizationProfilesCustom, onboarding_responses, onboarding_events,
  onboarding_profile_history, personalization_recommendations (≤5000 rows each).
- **Verified:** a manual trigger produced `backups/djac-<ts>.json`
  (~42 KB; 9 tables / 93 rows at time of writing), content confirmed valid JSON.
- **Manual trigger:** `curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
https://app.yalla-hack.ae/api/cron/backup`
- **Restore:** download the object from the `backups` bucket and re-insert the
  rows per table (`INSERT … ON CONFLICT DO NOTHING`) into a scratch database,
  then verify before promoting. This is a logical row export, not a full dump —
  reference/seed tables are reproducible from the repo.

### 3.2 Off-site full dump (GitHub Actions — needs a repo secret)

`.github/workflows/db-backup.yml` runs **daily at 03:00 UTC** (and on demand):
it dumps the whole database with `pg_dump` (PostgreSQL 17 client) and uploads a
gzipped artifact to GitHub Actions — an **off-site copy independent of the
database host** — retained 30 days. Fails loudly on an empty dump.

- **Requires:** repository secret `DATABASE_URL` — a direct (port 5432) or
  **session**-pooler connection string. Do **not** use transaction-mode pooling
  (port 6543) for `pg_dump`.
- **Restore:** download the artifact from the workflow run and follow §4.

### 3.3 Self-hosted script (for a long-lived host)

- `scripts/db-backup.mjs` (`pg_dump --clean --if-exists --no-owner --no-acl`),
  writes `backup/djac-saas-<timestamp>.sql`, keeps the last 7 files.
- Verification helper: `scripts/yh-backup-check.sh`.
- Only useful on a host with a persistent disk (not Vercel serverless).

> Supabase's own automated backups / PITR (dashboard → Database → Backups)
> remain the primary source of truth once enabled; §3.1 is the plan-independent
> safety net until then.

## 4. Restore procedure

```bash
# 1. Restore into a NON-production database first (scratch/Supabase branch)
DATABASE_URL="postgresql://…scratch…" \
  node scripts/db-restore.mjs backup/djac-saas-YYYYMMDDTHHMMSS.sql

# 2. Verify
psql "$SCRATCH_URL" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
#    expect the current production table count (63 at time of writing)

# 3. Only after verification, point the restore at production (maintenance window)
DATABASE_URL="$PROD_URL" node scripts/db-restore.mjs backup/<file>.sql
```

Notes:

- The dump is **plain SQL** (optionally gzipped); restore runs through `psql`
  with `-v ON_ERROR_STOP=1`.
- `--drop` / `--clean` are accepted for CLI compatibility but ignored — the dump
  already contains `DROP … IF EXISTS` statements.
- Production restores require a maintenance window; the serverless app will see
  errors while tables are dropped and recreated.

## 5. Drill status (evidence)

- **Restore drill EXECUTED (2026-10-02) — PASS.** Snapshot
  `djac-2026-10-01T134052754Z.json` was restored into an isolated scratch schema
  (`dr_scratch`) on the same database via `json_populate_recordset`, and every
  table's row count matched the source exactly:

  | table                           | restored rows |
  | ------------------------------- | ------------- |
  | localUsers                      | 40            |
  | users                           | 2             |
  | organizations                   | 12            |
  | organizationMembers             | 12            |
  | onboarding_responses            | 5             |
  | onboarding_events               | 11            |
  | onboarding_profile_history      | 8             |
  | personalization_recommendations | 3             |

  `dr_scratch` was dropped after verification; `public` was never touched.
  (This drill also caught a backup bug: `organizationProfilesCustom` was a wrong
  table name stored as empty — corrected to `organization_profiles_custom`.)

- Restore mechanism independently confirmed read-only (2026-10-01): the snapshot
  JSON coerces onto the real table shape.
- Drill harness: `pnpm drill:restore` restores into `TARGET_DATABASE_URL`,
  verifies per-table row counts, and refuses to target production unless
  `--force` (guarded by `isSameDatabase`, unit-tested).
- Remaining (owner): repeat the drill against a **separate scratch database**
  (not a schema) at least once, and record it here.

## 6. Rollback (application)

1. `git revert <bad-commit>` (or redeploy the previous known-good deployment).
2. Vercel: promote the previous production deployment from the dashboard, or
   `vercel rollback <url>`.
3. Database schema rollback: only via a forward, reviewed migration — never
   `DROP` production data.

## 7. Backup availability (verified 2026-09-28)

Checked with the Supabase CLI against the production project:

```
$ supabase backups list --project-ref gcsoeumdjrejfxuovfcw
REGION                 | WALG | PITR  | EARLIEST TIMESTAMP | LATEST TIMESTAMP
Northeast Asia (Seoul) | true | false | 0                  | 0
```

**Interpretation:** WAL-G is enabled at the platform level, but **PITR is off
and there are no listed backup timestamps** — i.e. there is currently **no
verified restorable backup**. This must be resolved before go-live:

- **Option A (recommended):** enable Supabase daily backups / PITR (plan
  dependent) in Dashboard → Database → Backups.
- **Option B (implemented):** `.github/workflows/db-backup.yml` runs a daily
  off-site `pg_dump` to GitHub Actions artifacts (30-day retention). Add the
  `DATABASE_URL` repository secret to activate it. Verify with
  `scripts/yh-backup-check.sh` where a host is available.
- Either way, record a restore-drill date here once executed.

## 8. Responsible parties

| Concern                           | Owner                   |
| --------------------------------- | ----------------------- |
| Backup schedule & off-site copies | Platform / DevOps       |
| Restore drill + verification      | Platform / DevOps + DBA |
| Post-incident review              | Engineering lead        |
