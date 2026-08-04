# DJAC Documentation Subdomain Deployment Script
# ==============================================
# This script guides you through deploying docs.app.yalla-hack.ae
#
# PREREQUISITES:
#   - Vercel CLI installed (npm i -g vercel)
#   - Access to yalla-hack.ae DNS (Cloudflare, GoDaddy, etc.)
#   - Vercel project: djac-saas-platform (linked via `vercel link`)

Write-Host @"

  ╔═══════════════════════════════════════════════════════════╗
  ║     DJAC Documentation Subdomain Deployment              ║
  ║     docs.app.yalla-hack.ae                               ║
  ╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# ── Step 1: Verify Vercel CLI ───────────────────────────────────────────
Write-Host "[1/4] Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version 2>$null
    Write-Host "  ✓ Vercel CLI $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Vercel CLI not found. Install: npm i -g vercel" -ForegroundColor Red
    exit 1
}

# ── Step 2: Verify project link ─────────────────────────────────────────
Write-Host "`n[2/4] Checking Vercel project link..." -ForegroundColor Yellow
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Resolve-Path "$projectDir\.."
Push-Location $projectDir

$vercelLink = vercel link --confirm 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ! Run 'vercel link' first to connect this directory to your Vercel project." -ForegroundColor Yellow
} else {
    Write-Host "  ✓ Project linked" -ForegroundColor Green
}

# ── Step 3: Deploy with subdomain config ─────────────────────────────────
Write-Host "`n[3/4] Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "  Building and deploying (production)..."

$deployOutput = vercel --prod 2>&1 | Out-String
Write-Host $deployOutput

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Deployment failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "  ✓ Deployed to production" -ForegroundColor Green

# ── Step 4: Instructions for DNS ────────────────────────────────────────
Write-Host @"

[4/4] DNS Configuration Required
=================================
Add the following DNS record to your yalla-hack.ae domain:

  Type:   CNAME
  Name:   docs
  Target: cname.vercel-dns.com
  TTL:    3600 (or Auto)

Then add the domain in Vercel dashboard:
  1. Go to https://vercel.com/yalla-hack-s-projects/djac-saas-platform/settings/domains
  2. Click "Add Domain"
  3. Enter: docs.app.yalla-hack.ae
  4. Follow Vercel's verification steps

After DNS propagates (~5-10 min), verify:
  https://docs.app.yalla-hack.ae          → Documentation portal
  https://docs.app.yalla-hack.ae/getting-started/welcome  → Welcome page

  https://app.yalla-hack.ae/docs          → Also works (fallback)

"@ -ForegroundColor White

Pop-Location
Write-Host "Done." -ForegroundColor Green
