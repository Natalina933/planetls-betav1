$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env.local"

if (-not (Test-Path -LiteralPath $envFile)) {
  Write-Error ".env.local introuvable."
}

$supabaseUrl = $null
Get-Content -LiteralPath $envFile | ForEach-Object {
  if ($_ -match '^NEXT_PUBLIC_SUPABASE_URL="?([^"]+)"?$') {
    $script:supabaseUrl = $matches[1]
  }
}

if (-not $supabaseUrl) {
  Write-Error "NEXT_PUBLIC_SUPABASE_URL manquante dans .env.local."
}

$uri = [Uri]$supabaseUrl
$hostName = $uri.Host

Write-Host "Supabase URL: $supabaseUrl"
Write-Host "Host: $hostName"
Write-Host ""

Write-Host "1. DNS lookup"
try {
  $dnsResult = Resolve-DnsName -Name $hostName -Type A -ErrorAction Stop
  $dnsResult | Select-Object Name, IPAddress | Format-Table -AutoSize
} catch {
  Write-Warning "DNS KO: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "2. TCP 443"
try {
  $tcpResult = Test-NetConnection -ComputerName $hostName -Port 443 -WarningAction SilentlyContinue
  $tcpResult | Select-Object ComputerName, RemoteAddress, RemotePort, TcpTestSucceeded | Format-Table -AutoSize
} catch {
  Write-Warning "TCP KO: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "3. HTTPS health check"
try {
  $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/" -Method Head -TimeoutSec 15 -UseBasicParsing
  Write-Host "HTTP status: $($response.StatusCode)"
} catch {
  if ($_.Exception.Response) {
    Write-Host "HTTP status: $([int]$_.Exception.Response.StatusCode)"
  } else {
    Write-Warning "HTTPS KO: $($_.Exception.Message)"
  }
}

Write-Host ""
Write-Host "4. Recommendations"
Write-Host "- Si DNS KO: verifier connexion, DNS, VPN, proxy, antivirus."
Write-Host "- Si TCP KO: verifier firewall ou blocage reseau sortant."
Write-Host "- Si HTTPS repond: le domaine est joignable, le probleme est ailleurs."
