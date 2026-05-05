#!/bin/bash

echo ""
echo " ====================================================="
echo "  Sistema de Distribuição de Salas de Prova"
echo " ====================================================="
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo " [ERRO] Node.js não encontrado."
    echo ""
    echo " Instale o Node.js em: https://nodejs.org"
    echo " Escolha a versão 'LTS' e siga o instalador."
    echo ""
    exit 1
fi

# Ir para a pasta do projeto (onde o script está)
cd "$(dirname "$0")"

# Primeira execução: instalar dependências e compilar
if [ ! -f "backend/dist/index.js" ]; then
    echo " Configurando pela primeira vez... isso leva alguns minutos."
    echo ""
    npm run build
    if [ $? -ne 0 ]; then
        echo ""
        echo " [ERRO] Falha na configuração inicial."
        echo " Verifique sua conexão com a internet e tente novamente."
        exit 1
    fi
    echo ""
fi

# Criar pasta de dados se não existir
mkdir -p data

echo " Iniciando o sistema..."
echo ""
echo " Acesse no navegador: http://localhost:8080"
echo ""
echo " Para encerrar: pressione Ctrl+C"
echo ""

export NODE_ENV=production
export PORT=8080

# Abrir o navegador automaticamente (funciona no Mac)
sleep 2 && open "http://localhost:8080" 2>/dev/null &

node backend/dist/index.js
