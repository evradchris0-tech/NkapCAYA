@echo off
echo ═══════════════════════════════════════════════════════
echo  CAYA API — Build de production pour Hostinger
echo ═══════════════════════════════════════════════════════

cd /d D:\NkapCAYA

echo [1/4] Installation des dependances...
pnpm install --frozen-lockfile

echo [2/4] Generation du client Prisma...
pnpm --filter api exec npx prisma generate --schema=../../database/schema.prisma

echo [3/4] Build NestJS...
pnpm --filter api build

echo [4/4] Preparation du dossier de deploiement...
if exist deploy\api-dist rmdir /s /q deploy\api-dist
mkdir deploy\api-dist

xcopy apps\api\dist deploy\api-dist\dist\ /E /I /Q
copy apps\api\package.json deploy\api-dist\package.json
copy apps\api\package-lock.json deploy\api-dist\package-lock.json 2>nul
xcopy node_modules\.prisma deploy\api-dist\node_modules\.prisma\ /E /I /Q 2>nul
xcopy node_modules\@prisma deploy\api-dist\node_modules\@prisma\ /E /I /Q 2>nul

echo.
echo ✓ Build API termine : deploy\api-dist\
echo   → Uploader ce dossier sur Hostinger via FTP ou Git
pause
