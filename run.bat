@echo off
title Entire Checkpoint Intelligence Application
cls

echo ====================================================
echo  ⚡ Entire Checkpoint Intelligence Application
echo ====================================================
echo  Starting Application Server...
echo.

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Found Node.js environment. Launching server.js...
    echo.
    echo  Server URL:  http://localhost:8080
    echo  REST API:    http://localhost:8080/api/health
    echo  Dashboard:   http://localhost:8080/
    echo ====================================================
    start http://localhost:8080/
    node server.js
    goto :end
)

where go >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Found Go environment. Launching app/main.go...
    echo.
    echo  Server URL:  http://localhost:8080
    echo  REST API:    http://localhost:8080/api/health
    echo  Dashboard:   http://localhost:8080/
    echo ====================================================
    start http://localhost:8080/
    go run ./app/main.go
    goto :end
)

echo [ERROR] Neither Node.js nor Go runtime was found in system PATH.
pause

:end
