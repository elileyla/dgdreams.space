# Deploys the site to the EC2 server by building locally and shipping only
# .next (the t3.micro has 1 GB RAM — it cannot run the build itself).
#
#   pwsh scripts/deploy-ec2.ps1 [-KeyPath <pem>] [-Host <ssh host>]
#
# Prereqs on the server (already done once): git clone at /var/www/dgdreams,
# .env, node_modules (npm ci), systemd unit `dgdreams`, nginx.

param(
    [string]$KeyPath = "$env:USERPROFILE\Downloads\pic\vps amazun\elshia.pem",
    [string]$ServerHost = "ubuntu@ec2-13-60-40-219.eu-north-1.compute.amazonaws.com",
    [string]$RemoteDir = "/var/www/dgdreams"
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot | Split-Path | Split-Path
Push-Location $root
try {
    Write-Host "== build (local) ==" -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "build failed" }

    Write-Host "== pack .next (dev/cache excluded) ==" -ForegroundColor Cyan
    $tgz = Join-Path $env:TEMP "dgdreams-next.tgz"
    tar -czf $tgz --exclude='.next/dev' --exclude='.next/cache' .next

    Write-Host "== ship + activate ==" -ForegroundColor Cyan
    ssh -i $KeyPath $ServerHost "cd $RemoteDir && rm -rf .next"
    scp -i $KeyPath $tgz "${ServerHost}:/tmp/next.tgz"
    ssh -i $KeyPath $ServerHost "cd $RemoteDir && tar -xzf /tmp/next.tgz && rm /tmp/next.tgz && sudo systemctl restart dgdreams && sleep 3 && curl -sf http://127.0.0.1:3000/api/health"

    Write-Host "== deployed ==" -ForegroundColor Green
} finally {
    Pop-Location
}
