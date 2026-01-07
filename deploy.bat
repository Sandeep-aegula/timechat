@echo off
REM TimeChat Deployment Script for Windows
echo 🚀 Deploying TimeChat Application...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=v." %%i in ('node --version') do set NODE_MAJOR=%%i
if %NODE_MAJOR% lss 18 (
    echo ❌ Node.js version 18+ is required. Current version: & node --version
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm run install:all
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Build frontend
echo 🔨 Building frontend...
call npm run build
if errorlevel 1 (
    echo ❌ Failed to build frontend
    pause
    exit /b 1
)

REM Create uploads directory
if not exist "backend\uploads" mkdir backend\uploads

REM Check if .env file exists
if not exist "backend\.env" (
    echo ⚠️  .env file not found. Copying from .env.example...
    copy backend\.env.example backend\.env
    echo ✏️  Please update backend\.env with your production values before running in production.
)

REM Set production environment
set NODE_ENV=production

echo ✅ Deployment preparation complete!
echo.
echo To start the application:
echo   npm run prod
echo.
echo Or for development:
echo   npm run dev
echo.
echo Application will be available at: http://localhost:5000
pause