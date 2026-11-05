# Guia Completo de Configuração • Supabase PostgreSQL & Realtime
## Quest Deadline Control • Quest Consult

Este guia detalha o passo a passo completo para conectar o sistema ao **Supabase**, transformando a aplicação em um sistema corporativo multiusuário com sincronização em nuvem e tempo real.

---

## 📋 Sumário dos Recursos Implementados

1. **PostgreSQL Gerenciado**: Tabela `projects` com índices de alta performance e campos normalizados.
2. **Sincronização em Tempo Real (Supabase Realtime)**: Se um usuário arrastar um card ou registrar uma anotação, a tela de todos os outros membros atualiza instantaneamente sem precisar recarregar a página.
3. **Persistência Híbrida Inteligente**: Funciona com o Supabase quando configurado, mas mantém fallback local no `localStorage` caso as credenciais não estejam presentes ou ocorra queda de conexão.
4. **Atualizações Otimistas**: A interface responde instantaneamente (0ms de atraso visual) e persiste em segundo plano na nuvem.
5. **Endpoints de Servidor Sincronizados**: Rotinas como `/api/cron/advance-funnel` e `/api/upload` agora leem e gravam diretamente no Supabase.

---

## 🚀 Passo a Passo de Configuração

### Passo 1: Criar o Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login (ou crie sua conta gratuita).
2. Clique no botão **"New project"**.
3. Preencha os dados do projeto:
   - **Name**: `quest-deadline-control` (ou outro nome de sua preferência)
   - **Database Password**: Defina uma senha forte e guarde-a em local seguro.
   - **Region**: Selecione **`South America (São Paulo) [sa-east-1]`** para menor tempo de resposta no Brasil.
   - **Pricing Plan**: `Free tier` (suficiente para milhares de acessos mensais).
4. Clique em **"Create new project"** e aguarde cerca de 1 a 2 minutos até o banco ser provisionado.

---

### Passo 2: Executar o Script de Criação da Estrutura SQL

1. No painel do seu projeto no Supabase, clique no menu lateral em **"SQL Editor"** (ícone `>_`).
2. Clique em **"New Query"**.
3. Abra o arquivo [`supabase/schema.sql`](./supabase/schema.sql) deste projeto, copie todo o conteúdo e cole no editor do Supabase.
4. Clique no botão verde **"Run"** (ou pressione `Ctrl + Enter`).
5. Você verá a mensagem `Success. No rows returned`.
   > ✅ O script criou a tabela `projects`, índices de busca rápida, políticas de segurança Row Level Security (RLS) e ativou a publicação **Realtime**.

---

### Passo 3: Fazer a Carga Inicial dos Projetos (Seed)

Você pode escolher **uma** das duas opções abaixo para carregar os 155 projetos da Quest Consult no banco de dados:

#### Opção A: Executar via SQL Editor no Supabase (Recomendado se não quiser rodar comandos)
1. No **SQL Editor** do Supabase, clique em **"New Query"**.
2. Abra o arquivo [`supabase/seed.sql`](./supabase/seed.sql) gerado na pasta do projeto.
3. Copie todo o conteúdo, cole no editor e clique em **"Run"**.
4. Pronto! Todos os projetos estarão cadastrados.

#### Opção B: Executar via Script Automático no Terminal
1. Configure o arquivo `.env.local` com as chaves (ver Passo 4 abaixo).
2. No terminal da sua máquina, execute:
   ```bash
   npm run seed:supabase
   ```
3. O script enviará todos os projetos em lotes e exibirá o progresso no console.

---

### Passo 4: Obter as Chaves de Conexão do Supabase

1. No menu lateral do Supabase, clique no ícone de engrenagem **"Project Settings"**.
2. Clique na aba **"API"**.
3. Localize e copie as seguintes informações:
   - **Project URL**: Algo como `https://abcdefghijklmnopqrst.supabase.co`
   - **Project API Keys**:
     - `anon` `public`: Chave pública do cliente (usada no navegador)
     - `service_role` `secret`: Chave de serviço para o backend/cron (mantenha confidencial!)

---

### Passo 5: Configurar as Variáveis de Ambiente

#### A. No seu computador local (para testes e desenvolvimento)
Abra o arquivo [`.env.local`](./.env.local) na raiz do projeto e preencha:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://sua-url-aqui.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

#### B. Na Vercel (Produção Online)
1. Acesse o painel do seu projeto na [Vercel](https://vercel.com).
2. Vá em **Settings** > **Environment Variables**.
3. Adicione as 3 variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://sua-url-aqui.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sua-chave-anon-aqui`
   - `SUPABASE_SERVICE_ROLE_KEY` = `sua-chave-service-role-aqui`
4. Selecione os ambientes **Production**, **Preview** e **Development**.
5. Salve e faça um novo Deploy (Redeploy).

---

### Passo 6: Como Validar o Funcionamento

1. Abra o site no navegador.
2. Observe o topo da tela no cabeçalho:
   - Se estiver conectado, aparecerá a tag verde pulsante:
     **`🟢 Supabase Nuvem`**
   - Se as chaves não estiverem configuradas, aparecerá:
     **`⚪ Modo Local`**
3. **Teste em tempo real:**
   - Abra o site em duas abas ou em computadores diferentes.
   - Mova um card ou edite um projeto em uma aba.
   - Note que na outra aba o card se moverá instantaneamente sem necessidade de `F5` ou recarregamento!

---

## 🛠️ Arquivos Criados e Modificados

- [`supabase/schema.sql`](./supabase/schema.sql): Script DDL completo com tabelas, RLS e Realtime.
- [`supabase/seed.sql`](./supabase/seed.sql): Script SQL com 155 projetos para importação direta no SQL Editor.
- [`scripts/seed-supabase.mjs`](./scripts/seed-supabase.mjs): Script interativo Node.js para envio em lotes.
- [`src/lib/supabase.ts`](./src/lib/supabase.ts): Cliente Supabase para o navegador com suporte a Realtime.
- [`src/lib/supabaseAdmin.ts`](./src/lib/supabaseAdmin.ts): Cliente Supabase para APIs de servidor e cron jobs.
- [`src/services/projectService.ts`](./src/services/projectService.ts): Camada de repositório e sincronização com banco.
- [`src/context/ProjectContext.tsx`](./src/context/ProjectContext.tsx): Hook global com Realtime, optimistic UI e fallback.
- [`src/components/Header.tsx`](./src/components/Header.tsx): Indicador visual de sincronização em tempo real.
- [`src/app/api/cron/advance-funnel/route.ts`](./src/app/api/cron/advance-funnel/route.ts): Avanço automático diário diretamente no Supabase.
- [`src/app/api/upload/route.ts`](./src/app/api/upload/route.ts): Upsert de planilhas sincronizado na nuvem.
- [`src/app/api/send-daily-report/route.ts`](./src/app/api/send-daily-report/route.ts): Relatórios diários consumindo dados do banco.

