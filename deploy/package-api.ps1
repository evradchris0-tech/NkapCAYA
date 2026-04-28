# CAYA API - Build + Packaging pour Hostinger (Managed Node.js)
# Executer depuis D:\NkapCAYA : powershell -ExecutionPolicy Bypass -File deploy\package-api.ps1

$Root    = "D:\NkapCAYA"
$OutDir  = "$Root\deploy\api-package"
$ZipPath = "$Root\deploy\caya-api.zip"

Set-Location $Root
Write-Host "=== CAYA API - Build de production ===" -ForegroundColor Cyan

# 1. Nettoyage
Write-Host "[1/6] Nettoyage..." -ForegroundColor Yellow
if (Test-Path $OutDir)  { Remove-Item $OutDir  -Recurse -Force }
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
New-Item -ItemType Directory -Path $OutDir | Out-Null

# 2. Installation des dependances
Write-Host "[2/6] Installation des dependances..." -ForegroundColor Yellow
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { Write-Error "pnpm install a echoue"; exit 1 }

# 3. Generation du client Prisma (avec binary Linux)
Write-Host "[3/6] Generation Prisma (Windows + Linux)..." -ForegroundColor Yellow
npx prisma generate --schema=database/schema.prisma
if ($LASTEXITCODE -ne 0) { Write-Error "prisma generate a echoue"; exit 1 }

# 4. Build NestJS
Write-Host "[4/6] Build NestJS..." -ForegroundColor Yellow
pnpm --filter api build
if ($LASTEXITCODE -ne 0) { Write-Error "nest build a echoue"; exit 1 }

# 5. Assemblage du package
Write-Host "[5/6] Assemblage du package..." -ForegroundColor Yellow

# index.js racine — point d'entree standard reconnu par Hostinger
@'
'use strict';
require('./dist/main');
'@ | Set-Content "$OutDir\index.js" -Encoding UTF8

# dist/ compile
Copy-Item -Path "$Root\apps\api\dist" -Destination "$OutDir\dist" -Recurse

# package.json — structure Node.js standard (pas NestJS specifique)
$ApiPkg = Get-Content "$Root\apps\api\package.json" | ConvertFrom-Json
$PkgJson = [ordered]@{
    name    = "caya-api"
    version = "1.0.0"
    private = $true
    main    = "index.js"
    engines = [ordered]@{ node = ">=20.0.0" }
    scripts = [ordered]@{
        start       = "node index.js"
        postinstall = "npx prisma generate --schema=./schema.prisma"
        migrate     = "npx prisma migrate deploy --schema=./schema.prisma"
    }
    dependencies    = $ApiPkg.dependencies
}
$PkgJson | ConvertTo-Json -Depth 10 | Set-Content "$OutDir\package.json" -Encoding UTF8

# Schema Prisma
Copy-Item -Path "$Root\database\schema.prisma" -Destination "$OutDir\schema.prisma"

# Migrations
Copy-Item -Path "$Root\database\migrations" -Destination "$OutDir\migrations" -Recurse

# Client Prisma genere (inclut binary Linux)
$PrismaClient = "$Root\node_modules\.prisma"
if (Test-Path $PrismaClient) {
    New-Item -ItemType Directory -Path "$OutDir\node_modules" -Force | Out-Null
    Copy-Item -Path $PrismaClient -Destination "$OutDir\node_modules\.prisma" -Recurse
}
$PrismaClientPkg = "$Root\node_modules\@prisma"
if (Test-Path $PrismaClientPkg) {
    New-Item -ItemType Directory -Path "$OutDir\node_modules\@prisma" -Force | Out-Null
    Copy-Item -Path $PrismaClientPkg -Destination "$OutDir\node_modules\@prisma" -Recurse
}

# 6. Creation du ZIP
Write-Host "[6/6] Creation du ZIP..." -ForegroundColor Yellow
Compress-Archive -Path "$OutDir\*" -DestinationPath $ZipPath -Force

$ZipSize = [math]::Round((Get-Item $ZipPath).Length / 1MB, 1)
Write-Host ""
Write-Host "OK - Package cree : deploy\caya-api.zip ($ZipSize MB)" -ForegroundColor Green
Write-Host ""
