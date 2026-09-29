param(
  [string]$OutputDirectory = "./backups"
)

$ErrorActionPreference = 'Stop'
if (-not $env:DATABASE_URL) { throw 'DATABASE_URL is not set' }
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$output = Join-Path $OutputDirectory "library-$timestamp.dump"
pg_dump $env:DATABASE_URL --format=custom --file=$output
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
Write-Output "Backup created: $output"
