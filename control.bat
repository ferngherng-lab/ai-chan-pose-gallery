@echo off
title ai-pose-gallery-zh Dev Control
cd /d "%~dp0"

REM ============================================================
REM  ai-pose-gallery-zh dev control console
REM  Local iteration loop: dev / typecheck / lint / build.
REM  Deploy to Cloudflare is a separate step (see checkpoint docs).
REM  Usage:
REM    control.bat              -> interactive menu
REM    control.bat dev          -> start dev server (server.bat)
REM    control.bat check        -> tsc typecheck
REM    control.bat lint         -> oxlint
REM    control.bat build        -> tsc + vite build
REM    control.bat deps         -> check / repair node_modules
REM    control.bat stop         -> stop dev server
REM    control.bat status       -> show server status
REM
REM  Portable: no absolute paths (uses "%~dp0"). Repairs node_modules
REM  automatically if it was copied between machines/drives.
REM ============================================================

if "%~1"=="" goto menu
if /i "%~1"=="dev"    goto do_dev
if /i "%~1"=="check"  goto do_check
if /i "%~1"=="lint"   goto do_lint
if /i "%~1"=="build"  goto do_build
if /i "%~1"=="deps"   goto do_deps
if /i "%~1"=="stop"   goto do_stop
if /i "%~1"=="status" goto do_status
goto menu

:menu
cls
echo.
echo  ==================================================
echo     ai-pose-gallery-zh  Dev Control
echo  ==================================================
echo     [1] Start dev server    http://localhost:5173
echo     [2] Typecheck            tsc -b
echo     [3] Lint                 oxlint src
echo     [4] Build                tsc -b + vite build
echo     [5] Check deps           repair node_modules
echo     [6] Stop dev server
echo     [7] Status
echo     [0] Exit
echo  ==================================================
echo     Quick: control.bat dev / check / lint / build / deps / stop
echo.
set "choice="
set /p "choice=Enter a number and press Enter: "
if "%choice%"=="1" goto do_dev
if "%choice%"=="2" goto do_check
if "%choice%"=="3" goto do_lint
if "%choice%"=="4" goto do_build
if "%choice%"=="5" goto do_deps
if "%choice%"=="6" goto do_stop
if "%choice%"=="7" goto do_status
if "%choice%"=="0" goto end
echo  Invalid input, try again.
ping -n 2 127.0.0.1 >nul
goto menu

:do_dev
call server.bat start
goto back

:do_check
call :ensure_env
if errorlevel 1 goto back
echo.
echo  Typechecking (tsc -b)...
call pnpm exec tsc -b
echo  Typecheck exit code: %errorlevel%
goto back

:do_lint
call :ensure_env
if errorlevel 1 goto back
echo.
echo  Linting (oxlint src)...
call pnpm exec oxlint src
echo  Lint exit code: %errorlevel%
goto back

:do_build
call :ensure_env
if errorlevel 1 goto back
echo.
echo  Building (tsc -b + vite build)...
call pnpm exec tsc -b
if errorlevel 1 goto build_fail
call pnpm exec vite build
echo  Build exit code: %errorlevel%
goto back

:build_fail
echo  Build aborted: typecheck failed.
goto back

:do_deps
call :ensure_env
if errorlevel 1 goto back
echo  [OK] Dependencies are ready.
goto back

:do_stop
call server.bat stop
goto back

:do_status
call server.bat status
goto back

REM ------------------------------------------------------------
REM  Self-heal: verify Node.js + pnpm, repair node_modules.
REM  Returns errorlevel 0 = ready, 1 = could not fix.
REM ------------------------------------------------------------
:ensure_env
where node >nul 2>&1
if errorlevel 1 (
    echo  [Error] Node.js not found. Install it from https://nodejs.org/ and re-run.
    exit /b 1
)
where pnpm >nul 2>&1
if errorlevel 1 (
    echo  [Error] pnpm not found. Install it with:  npm i -g pnpm
    exit /b 1
)
if not exist node_modules\vite\bin\vite.js goto deps_broken
exit /b 0

:deps_broken
echo.
echo  [Info] node_modules is missing or incomplete. Reinstalling with pnpm...
if exist node_modules rmdir /s /q node_modules
call pnpm install --frozen-lockfile
if errorlevel 1 (
    echo  [Warn] Frozen install failed; retrying without lockfile...
    call pnpm install
)
if errorlevel 1 (
    echo  [Error] Dependency install failed. Check your network and re-run "control.bat deps".
    exit /b 1
)
echo  [OK] Dependencies installed.
exit /b 0

:back
echo.
pause
goto menu

:end
