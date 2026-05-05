@echo off
chcp 65001 >nul
title Sistema de Distribuição de Salas de Prova

echo.
echo  =====================================================
echo   Sistema de Distribuição de Salas de Prova
echo  =====================================================
echo.

:: Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERRO] Node.js nao encontrado.
    echo.
    echo  Instale o Node.js em: https://nodejs.org
    echo  Escolha a versao "LTS" e siga o instalador.
    echo.
    pause
    exit /b 1
)

:: Primeira execucao: instalar dependencias e compilar
if not exist "backend\dist\index.js" (
    echo  Configurando pela primeira vez... isso leva alguns minutos.
    echo.
    call npm run build
    if %errorlevel% neq 0 (
        echo.
        echo  [ERRO] Falha na configuracao inicial.
        echo  Verifique sua conexao com a internet e tente novamente.
        pause
        exit /b 1
    )
    echo.
)

:: Criar pasta de dados se nao existir
if not exist "data" mkdir data

:: Iniciar o servidor
echo  Iniciando o sistema...
echo.
echo  Acesse no navegador: http://localhost:8080
echo.
echo  Para encerrar o sistema, feche esta janela.
echo.

set NODE_ENV=production
set PORT=8080

:: Abrir o navegador apos 2 segundos
start /b cmd /c "timeout /t 2 >nul && start http://localhost:8080"

:: Iniciar o servidor (mantém a janela aberta)
node backend\dist\index.js

echo.
echo  O servidor foi encerrado.
pause
