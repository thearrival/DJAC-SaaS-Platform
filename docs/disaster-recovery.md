# Disaster Recovery & Backup Runbook

Status: procedure defined; **restore drill not yet executed** (see §5).

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

- Script: `scripts/db-backup.mjs` (`pg_dump --clean --if-exists --no-owner --no-acl`).
- Output: `backup/djac-saas-<timestamp>.sql`; **keeps the last 7 files**.
- Requires `DATABASE_URL` and `pg_dump` on the host that runs it.
- Verification helper: `scripts/yh-backup-check.sh` (+ `install-yh-backup-check-cron.sh`).

> ⚠️ **Gap:** backups are written to local disk on the host that runs the script.
> They are not encrypted and there is no confirmed off-site copy or schedule for
> the Vercel deployment. Supabase's own automated backups (dashboard →
> Database → Backups / PITR) should be treated as the primary source of truth
> until an off-site dump pipeline is in place.

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

- The dump/restore scripts were code-reviewed and their bugs fixed
  (commit history: `fix(scripts): make db-restore work with the plain-SQL
backups db-backup produces`).
- A live restore **has not been executed** in this audit because the audit
  environment has neither Docker nor usable database credentials.
- **Action required (owner: platform):** run §4 against a Supabase scratch branch
  and record the result here (date, file, table count, duration).

## 6. Rollback (application)

1. `git revert <bad-commit>` (or redeploy the previous known-good deployment).
2. Vercel: promote the previous production deployment from the dashboard, or
   `vercel rollback <url>`.
3. Database schema rollback: only via a forward, reviewed migration — never
   `DROP` production data.

## 7. Responsible parties

| Concern                           | Owner                   |
| --------------------------------- | ----------------------- |
| Backup schedule & off-site copies | Platform / DevOps       |
| Restore drill + verification      | Platform / DevOps + DBA |
| Post-incident review              | Engineering lead        |
