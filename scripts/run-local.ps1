$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$driveLetter = "X"
$drive = "$driveLetter`:\"

$pnpmCmd = Join-Path $env:APPDATA "npm\pnpm.cmd"
if (-not (Test-Path $pnpmCmd)) {
  Write-Host "pnpm not found. Installing pnpm@10.4.1 for current user..."
  $npmCmd = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
  if (-not $npmCmd) {
    throw "npm.cmd is not available on PATH. Install Node.js first."
  }

  & npm.cmd install -g pnpm@10.4.1

  if (-not (Test-Path $pnpmCmd)) {
    throw "pnpm installation completed but '$pnpmCmd' is still missing."
  }
}

# Use a short mapped drive to avoid Windows path-length issues in nested node_modules paths.
$substOutput = cmd /c subst
$existingMapping = $null
foreach ($line in ($substOutput -split "`r?`n")) {
  if ($line -match "^$driveLetter`:\\: => (.+)$") {
    $existingMapping = $Matches[1].Trim()
    break
  }
}

if ($existingMapping -and ($existingMapping -ne $projectRoot)) {
  cmd /c "subst $driveLetter`: /D" 1>$null 2>$null
  $existingMapping = $null
}

if (-not $existingMapping) {
  cmd /c "subst $driveLetter`: `"$projectRoot`"" 1>$null 2>$null
}

Set-Location $drive

$killedServers = @()
foreach ($port in 3000..3010) {
  $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($listener in $listeners) {
    try {
      $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)" -ErrorAction Stop
    }
    catch {
      continue
    }

    $commandLine = $process.CommandLine
    if (-not $commandLine -or $commandLine -notmatch "server/_core/index\.ts") {
      continue
    }

    try {
      Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop
      $killedServers += "Stopped stale DJAC server on port $port (PID $($listener.OwningProcess))."
    }
    catch {
      continue
    }
  }
}

if ($killedServers.Count -gt 0) {
  foreach ($message in ($killedServers | Sort-Object -Unique)) {
    Write-Host $message
  }
}

if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example"
}

# If local MySQL is configured but unavailable, keep DATABASE_URL intact and warn.
# This allows the app to reconnect automatically as soon as DB comes online.
$rawDatabaseUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL")
if (-not $rawDatabaseUrl -and (Test-Path ".env")) {
  $databaseUrlLine = Select-String -Path ".env" -Pattern '^DATABASE_URL=(.*)$' -CaseSensitive -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($databaseUrlLine) {
    $rawDatabaseUrl = $databaseUrlLine.Matches[0].Groups[1].Value.Trim()
  }
}

if ($rawDatabaseUrl) {
  try {
    $dbUri = [System.Uri]$rawDatabaseUrl
    $dbHost = $dbUri.Host
    $dbPort = if ($dbUri.Port -gt 0) { $dbUri.Port } else { 3306 }

    $isLocalHost = $dbHost -in @("localhost", "127.0.0.1", "::1")
    if ($isLocalHost) {
      $dbProbe = Test-NetConnection -ComputerName $dbHost -Port $dbPort -WarningAction SilentlyContinue
      if (-not $dbProbe.TcpTestSucceeded) {
        Write-Host "Warning: local database at $dbHost`:$dbPort is unreachable. Auth and persistence flows may fail until DB is available."
      }
    }
  }
  catch {
    Write-Host "Skipping local database reachability probe: invalid DATABASE_URL format."
  }
}

if (-not (Test-Path "node_modules")) {
  & $pnpmCmd install
}

& $pnpmCmd dev
