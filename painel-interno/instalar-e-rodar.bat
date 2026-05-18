@echo off
echo.
echo === Painel Interno — Synapse Code ===
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado.
    echo Instale em: https://nodejs.org
    pause
    exit /b 1
)

cd /d "%~dp0"

if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
    if %errorlevel% neq 0 (
        echo ERRO na instalacao.
        pause
        exit /b 1
    )
)

echo.
echo Iniciando servidor de desenvolvimento...
echo Acesse: http://localhost:3000
echo.
npm run dev
