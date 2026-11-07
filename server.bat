@echo off
title ai-pose-gallery-zh Local Server
cd /d "%~dp0"

REM ============================================================
REM  ai-pose-gallery-zh local server console
REM  Usage:
REM    double-click this file   -> interactive menu
REM    server.bat start         -> start server (background + open browser)
REM    server.bat stop          -> stop server
REM    server.bat status        -> show status
REM    server.bat open          -> open browser
REM    server.bat log           -> view log
REM    server.bat deps          -> check / repair node_modules (self-heal)
REM
REM  Portable: no absolute paths. Uses "%~dp0" as the project root, so it
REM  runs from any folder or drive. On startup it verifies Node.js + pnpm
REM  and repairs node_modules if it was copied between machines/drives
REM  (pnpm symlinks break on copy) or is missing entirely.
REM ============================================================

if "%~1"=="" goto menu
if /i "%~1"=="start"   goto do_start
if /i "%~1"=="stop"    goto do_stop
if /i "%~1"=="status"  goto do_status
if /i "%~1"=="open"    goto do_open
if /i "%~1"=="log"     goto do_log
if /i "%~1"=="deps"    goto do_deps
if /i "%~1"=="install" goto do_deps
goto menu

:menu
cls
echo.
echo  ==================================================
echo     ai-pose-gallery-zh  Local Server
echo  ==================================================
echo     [1] Start server    opens http://localhost:5173
echo     [2] Open browser
echo     [3] Status
echo     [4] Stop server
echo     [5] View log        logs\dev.log
echo     [6] Check deps      repair node_modules if broken
echo     [0] Exit
echo  ==================================================
echo     Quick: server.bat start / stop / status / open / log / deps
echo.
set "choice="
set /p "choice=Enter a number and press Enter: "
if "%choice%"=="1" goto do_start
if "%choice%"=="2" goto do_open
if "%choice%"=="3" goto do_status
if "%choice%"=="4" goto do_stop
if "%choice%"=="5" goto do_log
if "%choice%"=="6" goto do_deps
if "%choice%"=="0" goto end
echo  Invalid input, try again.
ping -n 2 127.0.0.1 >nul
goto menu

:do_start
call :ensure_env
if errorlevel 1 goto do_start_done
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto already_running
echo  Starting server in background (log: logs\dev.log)...
if not exist logs mkdir logs
start "ai-pose-dev" /min cmd /c "pnpm dev > logs\dev.log 2>&1"
echo  Waiting for server...
set /a _tries=0
:waitloop
ping -n 2 127.0.0.1 >nul
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto ready
set /a _tries+=1
if %_tries% geq 30 goto start_timeout
goto waitloop
:already_running
echo  Server is already running. Opening browser...
start "" http://localhost:5173
goto do_start_done
:ready
echo  Server is ready: http://localhost:5173
start "" http://localhost:5173
goto do_start_done
:start_timeout
echo  Timed out after 30s. Run "server.bat log" to inspect the log.
goto do_start_done
:do_start_done
if "%~1"=="" goto menu
goto end

:do_deps
call :ensure_env
if errorlevel 1 goto do_deps_done
echo  [OK] Dependencies are ready.
:do_deps_done
if "%~1"=="" goto menu
goto end

:do_stop
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 goto not_running_stop
echo  Stopping server...
set "STOPPED="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    set "STOPPED=1"
)
if defined STOPPED (echo  Server stopped.) else (echo  Failed to stop. Try again.)
goto do_stop_done
:not_running_stop
echo  Server is not running.
goto do_stop_done
:do_stop_done
if "%~1"=="" goto menu
goto end

:do_status
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo  Status: not running
) else (
    echo  Status: running  http://localhost:5173
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do echo    Listening PID: %%a
)
goto do_status_done
:do_status_done
if "%~1"=="" goto menu
goto end

:do_open
start "" http://localhost:5173
if "%~1"=="" goto menu
goto end

:do_log
if exist logs\dev.log (
    echo  ---- logs\dev.log ----
    type logs\dev.log
) else (
    echo  No log file yet (server may not have been started).
)
if "%~1"=="" goto menu
goto end

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
REM vite\bin\vite.js only exists when pnpm's symlinks are intact. If the
REM folder was copied between drives, the links break and this file is gone.
if not exist node_modules\vite\bin\vite.js goto deps_broken
exit /b 0

:deps_broken
echo.
echo  [Info] node_modules is missing or incomplete. Folders copied between
echo         machines/drives lose pnpm symlinks; reinstalling fixes it.
echo  [Info] Running pnpm install (first time may need network access)...
if exist node_modules rmdir /s /q node_modules
call pnpm install --frozen-lockfile
if errorlevel 1 (
    echo  [Warn] Frozen install failed; retrying without lockfile...
    call pnpm install
)
if errorlevel 1 (
    echo  [Error] Dependency install failed. Check your network and re-run "server.bat deps".
    exit /b 1
)
echo  [OK] Dependencies installed.
exit /b 0

:end
