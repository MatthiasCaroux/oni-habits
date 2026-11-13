@echo off
rem Double-clic : monte la version du cache (sw.js) puis met l'app en ligne sur Vercel.
chcp 65001 >nul
title Mise en ligne ONI Habits
cd /d "%~dp0app" || goto :fail

rem Proxy de l'entreprise : Node doit connaitre son certificat racine.
if exist "%~dp0corporate-root-ca.pem" set "NODE_EXTRA_CA_CERTS=%~dp0corporate-root-ca.pem"

set "NEWV="
for /f %%v in ('powershell -NoProfile -Command "$p = Resolve-Path 'sw.js'; $t = [IO.File]::ReadAllText($p); $m = [regex]::Match($t, 'oni-habits-v(\d+)'); if (-not $m.Success) { exit 1 }; $n = [int]$m.Groups[1].Value + 1; [IO.File]::WriteAllText($p, $t.Replace($m.Value, 'oni-habits-v' + $n), (New-Object Text.UTF8Encoding $false)); $n"') do set "NEWV=%%v"
if not defined NEWV (
  echo Impossible de lire la version dans app\sw.js.
  goto :fail
)
set /a OLDV=NEWV-1

echo.
echo  Nouvelle version : oni-habits-v%NEWV%
echo  Envoi sur Vercel ...
echo.

rem Premiere fois : connexion au compte Vercel puis creation du projet oni-habits.
call npx --yes vercel@48 whoami >nul 2>&1 || call npx --yes vercel@48 login
if not exist ".vercel\project.json" call npx --yes vercel@48 link --yes --project oni-habits
call npx --yes vercel@48 deploy --prod --yes
if errorlevel 1 (
  rem Echec : on remet l'ancienne version pour ne pas sauter de numero.
  powershell -NoProfile -Command "$p = Resolve-Path 'sw.js'; $t = [IO.File]::ReadAllText($p); [IO.File]::WriteAllText($p, $t.Replace('oni-habits-v%NEWV%', 'oni-habits-v%OLDV%'), (New-Object Text.UTF8Encoding $false))"
  goto :fail
)

echo.
echo  ============================================
echo   C'est en ligne : oni-habits-v%NEWV%
echo   Adresse : la ligne "Production" ci-dessus
echo   Les telephones prennent la mise a jour
echo   apres 1 ou 2 ouvertures de l'app.
echo  ============================================
echo.
pause
exit /b 0

:fail
echo.
echo  La mise en ligne a echoue, rien n'a change sur le site.
echo  Copie le message ci-dessus a Claude.
echo.
pause
exit /b 1
