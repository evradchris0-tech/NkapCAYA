@echo off
echo ═══════════════════════════════════════════════════════
echo  CAYA Web — Build de production pour Hostinger
echo ═══════════════════════════════════════════════════════

cd /d D:\NkapCAYA

echo [1/3] Installation des dependances...
pnpm install --frozen-lockfile

echo [2/3] Build Next.js (avec variables de prod)...
set NEXT_PUBLIC_API_URL=https://api.nkapzen.com/api/v1
set NEXT_PUBLIC_APP_URL=https://caya.nkapzen.com
pnpm --filter web build

echo [3/3] Preparation du dossier de deploiement...
if exist deploy\web-dist rmdir /s /q deploy\web-dist
mkdir deploy\web-dist

xcopy apps\web\.next deploy\web-dist\.next\ /E /I /Q
xcopy apps\web\public deploy\web-dist\public\ /E /I /Q
copy apps\web\package.json deploy\web-dist\package.json
copy apps\web\next.config.* deploy\web-dist\ 2>nul

echo.
echo ✓ Build Web termine : deploy\web-dist\
echo   → Uploader ce dossier sur Hostinger via FTP ou Git
pause
