<#
.SYNOPSIS
    One-command QA smoke-test data cleanup for DJAC local dev.

.DESCRIPTION
    Archives access requests, closes consultations, and marks notifications read
    for records that match QA email patterns or were created during smoke testing.

    Run this after any end-to-end smoke test pass to reset admin counters to zero.

.PARAMETER BaseUrl
    Base URL of the running dev server. Defaults to http://localhost:3000

.PARAMETER EmailPattern
    Substring match against contact email. Defaults to "qa+" which covers
    addresses like qa+smoke@example.com used in test data generation.

.EXAMPLE
    .\scripts\smoke-cleanup.ps1
    .\scripts\smoke-cleanup.ps1 -BaseUrl http://localhost:3001 -EmailPattern "test+"
#>

param(
    [string]$BaseUrl     = "http://localhost:3000",
    [string]$EmailPattern = "qa+"
)

$ErrorActionPreference = "Stop"

function Invoke-TrpcQuery {
    param([string]$Procedure, [string]$Method = "GET", [hashtable]$Input = $null)

    $url = "$BaseUrl/api/trpc/$Procedure"

    if ($Method -eq "GET" -and $Input) {
        $json = $Input | ConvertTo-Json -Compress
        $encoded = [System.Uri]::EscapeDataString("{`"json`":$json}")
        $url = "$url`?input=$encoded"
    }

    $params = @{
        Uri                = $url
        Method             = $Method
        UseBasicParsing    = $true
        Headers            = @{ "Accept" = "application/json" }
    }

    if ($Method -eq "POST" -and $Input) {
        $body = @{ json = $Input } | ConvertTo-Json -Compress
        $params["Body"]        = $body
        $params["ContentType"] = "application/json"
    }

    try {
        $response = Invoke-WebRequest @params
        return ($response.Content | ConvertFrom-Json).result.data.json
    } catch {
        Write-Warning "  tRPC call failed for $Procedure`: $_"
        return $null
    }
}

function Invoke-TrpcMutation {
    param([string]$Procedure, [hashtable]$Input)
    Invoke-TrpcQuery -Procedure $Procedure -Method "POST" -Input $Input
}

Write-Host ""
Write-Host "=== DJAC Smoke Cleanup ===" -ForegroundColor Cyan
Write-Host "  Server : $BaseUrl"
Write-Host "  Pattern: '$EmailPattern'"
Write-Host ""

# ── 1. Snapshot admin totals before ────────────────────────────────────────────
Write-Host "[ 1/4 ] Reading admin overview..." -ForegroundColor Yellow
$overview = Invoke-TrpcQuery -Procedure "admin.overview"
if ($overview) {
    Write-Host "  BEFORE → openAccessRequests=$($overview.totals.openAccessRequests)  openConsultations=$($overview.totals.openConsultations)  unreadNotifications=$($overview.totals.unreadNotifications)"
} else {
    Write-Host "  Could not read overview (server may be down or not authenticated)." -ForegroundColor Red
    exit 1
}

# ── 2. Archive matching access requests ────────────────────────────────────────
Write-Host ""
Write-Host "[ 2/4 ] Fetching access requests..." -ForegroundColor Yellow
$accessRequests = Invoke-TrpcQuery -Procedure "admin.accessRequests" -Input @{ limit = 200 }
$archivedCount  = 0

if ($accessRequests) {
    foreach ($req in $accessRequests) {
        $isQa = ($req.email -like "*$EmailPattern*") -or ($req.status -eq "new" -and $req.organizationName -like "*smoke*") -or ($req.status -eq "new" -and $req.organizationName -like "*test*")
        if ($isQa -and $req.status -ne "archived") {
            Write-Host "  Archiving access request #$($req.id): $($req.organizationName) ($($req.email))" -ForegroundColor DarkGray
            Invoke-TrpcMutation -Procedure "admin.updateAccessRequestStatus" -Input @{ accessRequestId = $req.id; status = "archived" } | Out-Null
            $archivedCount++
        }
    }
}
Write-Host "  Archived $archivedCount access request(s)."

# ── 3. Close matching consultations ───────────────────────────────────────────
Write-Host ""
Write-Host "[ 3/4 ] Fetching consultations..." -ForegroundColor Yellow
$consultations = Invoke-TrpcQuery -Procedure "admin.consultations" -Input @{ limit = 200 }
$closedCount   = 0

if ($consultations) {
    foreach ($c in $consultations) {
        $isQa = ($c.contactEmail -like "*$EmailPattern*") -or ($c.organizationName -like "*smoke*") -or ($c.organizationName -like "*test*")
        if ($isQa -and $c.status -ne "closed") {
            Write-Host "  Closing consultation #$($c.id): $($c.organizationName) ($($c.contactEmail))" -ForegroundColor DarkGray
            Invoke-TrpcMutation -Procedure "admin.respondConsultation" -Input @{
                consultationId = $c.id
                status         = "closed"
                priority       = "low"
                adminResponse  = "QA smoke-cleanup: auto-closed by smoke-cleanup.ps1"
            } | Out-Null
            $closedCount++
        }
    }
}
Write-Host "  Closed $closedCount consultation(s)."

# ── 4. Mark all unread notifications read ─────────────────────────────────────
Write-Host ""
Write-Host "[ 4/4 ] Clearing unread notifications..." -ForegroundColor Yellow
$notifications  = Invoke-TrpcQuery -Procedure "admin.notifications" -Input @{ limit = 200 }
$notifCount     = 0

if ($notifications) {
    foreach ($n in $notifications) {
        if (-not $n.isRead) {
            Invoke-TrpcMutation -Procedure "admin.markNotificationRead" -Input @{ notificationId = $n.id } | Out-Null
            $notifCount++
        }
    }
}
Write-Host "  Marked $notifCount notification(s) as read."

# ── 5. Final snapshot ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ Done ] Reading final admin overview..." -ForegroundColor Yellow
$after = Invoke-TrpcQuery -Procedure "admin.overview"
if ($after) {
    Write-Host "  AFTER  → openAccessRequests=$($after.totals.openAccessRequests)  openConsultations=$($after.totals.openConsultations)  unreadNotifications=$($after.totals.unreadNotifications)"
}

Write-Host ""
Write-Host "=== Cleanup complete ===" -ForegroundColor Green
Write-Host "  Access requests archived : $archivedCount"
Write-Host "  Consultations closed     : $closedCount"
Write-Host "  Notifications cleared    : $notifCount"
Write-Host ""
