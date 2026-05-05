# Sistema de Distribuição de Salas de Prova
## Guia de Implantação e Uso

---

## Escolha como quer usar o sistema

Você tem duas opções:

| | Opção A — Uso Local | Opção B — Nuvem (Railway) |
|---|---|---|
| **Internet** | Não precisa (após configuração) | Necessária |
| **Custo** | Gratuito | Gratuito até certo uso |
| **Acesso** | Só no computador onde está instalado (ou rede local) | De qualquer lugar, qualquer dispositivo |
| **Dados** | Ficam salvos no computador | Ficam salvos na nuvem (Supabase) |
| **Dificuldade** | Mais simples | Um pouco mais de configuração |

---

# OPÇÃO A — Uso Local (no próprio computador)

## O que você vai precisar

Apenas dois programas, ambos gratuitos:

- **Node.js** → nodejs.org *(escolha a versão "LTS")*
- **Git** → git-scm.com

Instale os dois antes de começar. Em ambos, basta avançar o instalador com as opções padrão.

---

## Configuração inicial (feita uma única vez)

### 1. Baixar o código

Abra o **Prompt de Comando** (Windows) ou o **Terminal** (Mac) e execute:

```
git clone LINK-DO-REPOSITÓRIO
cd NOME-DA-PASTA
```

> Substitua pelo link do repositório que foi enviado a você.

**Alternativa sem Git:** na página do repositório no GitHub, clique em **Code → Download ZIP**, extraia a pasta em algum lugar fácil de encontrar (ex: `C:\SistemaProvas`).

### 2. Pronto

Não há mais nada para configurar. Na primeira vez que iniciar, o sistema instala tudo sozinho.

---

## Como iniciar o sistema

### Windows

Dentro da pasta do projeto, dê **duplo clique** no arquivo **`start.bat`**.

Uma janela preta vai abrir — ela precisa ficar aberta enquanto você usa o sistema. O navegador abre automaticamente em `http://localhost:8080`.

> Na primeira vez, a configuração leva alguns minutos (só acontece uma vez).

### Mac / Linux

Abra o Terminal, navegue até a pasta do projeto e execute:

```
chmod +x start.sh   ← apenas na primeira vez
./start.sh
```

O navegador abre automaticamente.

---

## Como encerrar o sistema

Feche a janela preta (Windows) ou pressione **Ctrl + C** no Terminal (Mac).

---

## Onde os dados ficam salvos

Todos os registros e o histórico de distribuições ficam salvos na pasta **`data/`** dentro do projeto, no próprio computador. Não é necessária internet nem nenhum serviço externo.

> **Importante:** não apague essa pasta. Para backup, copie a pasta `data/` para outro local.

---

## Usando na rede local (opcional)

Se quiser que outros computadores da mesma rede acessem o sistema enquanto ele está rodando:

1. No computador que roda o sistema, descubra o IP local:
   - **Windows:** abra o Prompt e digite `ipconfig` → anote o "Endereço IPv4" (algo como `192.168.1.10`)
   - **Mac:** Preferências do Sistema → Rede → anote o IP
2. Nos outros computadores, acesse no navegador: `http://192.168.1.10:8080` *(substituindo pelo IP anotado)*

---

## Atualizar o sistema (versão nova)

**Com Git:** dentro da pasta do projeto, execute `git pull` no Prompt/Terminal, depois inicie normalmente.

**Sem Git (baixou ZIP):** substitua toda a pasta pelo ZIP novo — mas **copie antes a pasta `data/`** para dentro da nova pasta, para manter o histórico.

---

---

# OPÇÃO B — Nuvem (acesso de qualquer lugar)

## O que você vai precisar

Três contas, todas gratuitas:

- **GitHub** → github.com
- **Railway** → railway.app *(hospedagem do sistema)*
- **Supabase** → supabase.com *(banco de dados na nuvem)*

---

## Passo 1 — Copiar o código para sua conta do GitHub

1. Acesse o link do repositório que foi enviado a você
2. No canto superior direito, clique em **Fork → Create fork**
3. Agora você tem uma cópia do projeto na sua própria conta do GitHub

---

## Passo 2 — Criar o banco de dados no Supabase

1. Acesse **supabase.com**, crie uma conta e clique em **New project**
2. Preencha um nome e uma senha (guarde a senha) e clique em **Create new project**
3. Aguarde o projeto ser criado (cerca de 1 minuto)
4. No menu lateral, clique em **SQL Editor → New query**
5. Cole o código abaixo e clique em **Run**:

```sql
CREATE TABLE IF NOT EXISTS exam_sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  config JSONB NOT NULL,
  total_students INTEGER NOT NULL,
  total_rooms INTEGER NOT NULL,
  rooms JSONB
);
```

6. Vá em **Settings → Data API** e anote:
   - **Project URL** — algo como `https://abcdefgh.supabase.co`
   - Chave **service_role** (clique em "Reveal" para ver)

---

## Passo 3 — Publicar no Railway

1. Acesse **railway.app** e crie uma conta com **Login with GitHub**
2. Clique em **New Project → Deploy from GitHub repo**
3. Selecione o repositório que você criou no Passo 1
4. Selecione o branch **`claude/generate-exam-lists-puvwQ`**
5. Clique em **Deploy Now** e aguarde 2 a 4 minutos

---

## Passo 4 — Configurar as variáveis de ambiente

1. Clique no serviço criado → aba **Variables**
2. Adicione as três variáveis abaixo:

| Nome | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | A Project URL anotada no Passo 2 |
| `SUPABASE_SERVICE_KEY` | A chave service_role anotada no Passo 2 |

O Railway reinicia o serviço automaticamente após salvar.

---

## Passo 5 — Gerar o endereço do sistema

1. Vá em **Settings → Networking → Public Networking**
2. Clique em **Generate Domain**
3. No campo de porta, digite **`8080`**
4. Clique em **Generate Domain**
5. Aguarde 1 a 2 minutos e acesse a URL gerada — o sistema estará no ar

---

## Sobre os custos

| Serviço | Plano gratuito |
|---|---|
| GitHub | Ilimitado |
| Supabase | Até 500 MB de banco e 50.000 linhas |
| Railway | US$ 5 de crédito por mês (suficiente para uso escolar normal) |

---

---

# Solução de problemas

## Opção A (Local)

**"Node.js não encontrado"** → Instale o Node.js em nodejs.org (versão LTS) e reinicie o computador antes de tentar novamente.

**A janela fecha sozinha com erro** → Verifique se tem conexão com internet na primeira execução (necessária para baixar as dependências). Depois, funciona offline.

**O navegador não abriu automaticamente** → Abra manualmente e acesse `http://localhost:8080`.

## Opção B (Railway)

**"Application failed to respond"** → A porta configurada no domínio não é 8080. Delete o domínio e gere novamente com a porta 8080.

**"Supabase saveSession: Invalid path"** → A `SUPABASE_URL` está incorreta. Confirme que começa com `https://` e não tem barra no final.

**O histórico some após atualização** → Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` estão configuradas nas variáveis do Railway.

---

## Como atualizar a planilha de alunos

Em ambas as opções, **não é necessário alterar nada no sistema**. Basta acessar o sistema pelo navegador e arrastar o novo arquivo `.xlsx` na tela inicial — o sistema aceita qualquer planilha nova a qualquer momento.
