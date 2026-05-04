# Distribuição de Salas de Prova — Ensino Médio

Sistema web para geração automatizada de listas e mapas de aplicação de provas. Distribui alunos do 1º, 2º e 3º anos de forma aleatória e balanceada entre as salas, com mapa visual de carteiras e exportação em PDF e Excel.

## Funcionalidades

- **Upload flexível** de planilha `.xlsx` (detecta automaticamente as colunas `AlunoNome`, `Ciclo2026`, `Turma2026`, `AlunoMatricula`)
- **Distribuição proporcional**: cada sala recebe a mesma proporção de alunos de cada série
- **Mapa visual** de carteiras com código de cores por série
- **Exportação**: PDF de listas, PDF de mapa de sala, Excel com aba por sala
- **Regeneração** com um clique (mesmo embaralhamento, novas distribuições)
- **Histórico** de todas as distribuições geradas, consultável a qualquer momento
- **Parâmetros configuráveis**: máximo por sala (10–45), número de fileiras, carteiras por fileira, nome da instituição, data

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + Vite + TypeScript + TailwindCSS |
| Backend | Node.js + Express + TypeScript |
| Storage | JSON em disco (sem banco externo necessário) |
| PDF | PDFKit |
| Excel | ExcelJS + SheetJS |

## Rodando localmente

### Pré-requisitos
- Node.js 18+

### Backend
```bash
cd backend
cp .env.example .env   # ajuste FRONTEND_URL se necessário
npm install
npm run dev            # porta 3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # porta 5173
```

Acesse `http://localhost:5173`.

## Deploy no Railway

1. Crie dois serviços no Railway: um para `backend/` e um para `frontend/`
2. No serviço backend, adicione a variável `FRONTEND_URL` com a URL do frontend
3. No serviço frontend, adicione `VITE_API_URL` com a URL do backend

O `railway.toml` na raiz define os comandos de build e start de cada serviço.

## Estrutura da planilha

| Coluna | Descrição |
|--------|-----------|
| `AlunoNome` | Nome completo do aluno |
| `Ciclo2026` | `1ª SÉRIE`, `2ª SÉRIE` ou `3ª SÉRIE` |
| `Turma2026` | Código da turma (ex: `EM-211M`) |
| `AlunoMatricula` | Número de matrícula |
| `Curso2026` | Curso (opcional) |

O parser detecta as colunas automaticamente — funciona mesmo que os nomes mudem ligeiramente em planilhas futuras.
