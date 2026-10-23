# Quest Deadline Control — Quest Consult

> Sistema executivo de controle e monitoramento de prazos de projetos em funil Kanban de 4 colunas temporais, desenvolvido especialmente para a **Quest Consult**.

---

## 1. Visão Geral da Arquitetura

O **Quest Deadline Control** foi projetado como um monólito moderno em **Next.js 14 (App Router) + TypeScript Strict (`strict: true`) + Tailwind CSS**, unindo em uma única base desacoplada:
1. **Frontend Interativo**: Painel visual Kanban corporativo com Drag-and-Drop (arrastar e soltar), filtros por lei/mecanismo (Rouanet, PROAC, PROMAC, Emendas, etc.), contadores em tempo real e pesquisa dinâmica.
2. **Parser Multi-Abas de Planilhas**: Leitura e normalização de arquivos `.xlsx` e `.csv`, tratando células vazias com o padrão `"Sem informação Migrada"` e executando **Upsert** automático (atualiza registros existentes e cadastra novos).
3. **Serviço de Notificação Desacoplado**: Disparo de eventos `onCardMove` com mock estruturado para **3 destinatários fixos** da Quest Consult (Diretoria, Coordenação de Projetos e Operações/Compliance).
4. **Rotina de Avanço Automático de Funil (Cron Job)**: Recálculo diário de `data_vencimento - hoje`, realocando cards automaticamente sem sobrescrever movimentações manuais do usuário.
5. **Geração de Snapshot / PDF**: Interface de captura do layout dos 4 Kanbans para exportação e anexo de relatórios gerenciais em PDF.

---

## 2. Estrutura de Pastas do Projeto

```plaintext
Control Project Deadlines 1.0/
├── package.json                   # Dependências (Next 14, React 18, Tailwind, xlsx, Lucide)
├── tsconfig.json                  # TypeScript estrito (strict: true) com path alias @/*
├── tailwind.config.ts             # Paleta de cores corporativa da Quest Consult
├── postcss.config.mjs             # Pipeline do PostCSS
├── next.config.mjs                # Configurações do Next.js
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout com branding da Quest Consult e SEO
│   │   ├── page.tsx               # Página principal unindo o painel e modais
│   │   ├── globals.css            # Estilos globais e tokens de impressão para PDF
│   │   └── api/                   # API Routes (Backend desacoplado)
│   │       ├── upload/route.ts    # Endpoint de upload e parsing de planilhas
│   │       ├── notify/route.ts    # Endpoint de disparo de notificação por card
│   │       └── cron/advance-funnel/route.ts # Endpoint para agendador de avanço diário
│   │
│   ├── components/                # Componentes Visuais
│   │   ├── Header.tsx             # Topbar executiva Quest Consult e botões de ação
│   │   ├── MetricsOverview.tsx    # KPIs resumidos, abas de mecanismo e barra de busca
│   │   ├── KanbanBoard.tsx        # Grid responsivo das 4 colunas temporais
│   │   ├── KanbanColumn.tsx       # Coluna com dropzone HTML5 e contador
│   │   ├── ProjectCard.tsx        # Card rico com badge de dias, datas, líder e menu rápido
│   │   ├── ProjectModal.tsx       # Modal de cadastro e edição manual de projetos (CRUD)
│   │   ├── UploadModal.tsx        # Modal de upload com drag & drop e relatório de upsert
│   │   ├── NotificationDrawer.tsx # Drawer com logs dos e-mails e 3 destinatários fixos
│   │   └── NotificationToast.tsx  # Toast flutuante com feedback de disparos em tempo real
│   │
│   ├── context/
│   │   └── ProjectContext.tsx     # Estado global com persistência em LocalStorage
│   │
│   ├── services/                  # Camada de Serviços Desacoplados
│   │   ├── spreadsheetService.ts  # Parser .xlsx/.csv, normalizador e tratador de vazios
│   │   ├── notificationService.ts # Event dispatcher e serviço de e-mail (3 destinatários)
│   │   ├── funnelService.ts       # Algoritmo de cálculo de prazos e avanço do funil
│   │   └── pdfSnapshotService.ts  # Interface de snapshot e exportação de PDF
│   │
│   ├── types/
│   │   └── index.ts               # Interfaces TypeScript de domínio (Project, Eventos, etc.)
│   │
│   └── data/
│       └── initialProjects.json   # Base inicial pré-carregada (163 projetos da planilha)
```

---

## 3. As 4 Colunas do Kanban (Janela Temporal)

| Coluna | Janela Temporal | Cor de Destaque | Significado Operacional |
| :--- | :--- | :--- | :--- |
| **90 Dias** | > 60 dias (em torno de 90d+) | Emerald / Verde | Prazo confortável; execução padrão |
| **60 Dias** | 31 a 60 dias restantes | Sky / Azul | Atenção operacional; acompanhamento próximo |
| **30 Dias** | 16 a 30 dias restantes | Amber / Laranja | Alerta de entrega e preparação de prestação |
| **Risco (15 Dias)** | <= 15 dias ou vencidos | Red / Vermelho | Crítico; risco iminente de glosa ou expiração |

---

## 4. Regras de Importação de Planilha & Células Vazias

1. **Multi-Abas**: O parser lê todas as abas da planilha (ex: `Rouanet - Execução`, `Proac - Execução`, `PROMAC`, `Emenda 2026`, `Emenda 24-25`, `Esportes - Execução`, `MG - ICMS`).
2. **Tratamento de Células Vazias**:
   - Conforme especificação, qualquer célula vazia (`null`, `undefined`, `""`, `"None"`, `"N/A"`, `#VALUE!`, `#REF!`) é automaticamente preenchida com o texto:
     ```plaintext
     "Sem informação Migrada"
     ```
3. **Mecanismo de Upsert**:
   - Se o projeto já existir na base (verificado por `Código/PRONAC` ou `Nome do Projeto` normalizado), ele é atualizado mantendo a integridade de dados.
   - Novos projetos são inseridos automaticamente na coluna correspondente aos seus dias restantes.

---

## 5. Disparo de Notificações (3 Destinatários Fixos)

Ao mover qualquer card de projeto no Kanban (ou quando o cron job avança um card), o evento `onCardMove(event)` é disparado para o `NotificationService`.

**Destinatários Fixos Configurados:**
1. **Diretoria Executiva**: `diretoria@questconsult.com.br`
2. **Coordenação de Projetos**: `gestao.projetos@questconsult.com.br`
3. **Operações & Compliance**: `operacoes@questconsult.com.br`

O serviço registra o histórico na Central de Notificações e exibe um toast na interface com os detalhes do envio. Está preparado para integração direta com bibliotecas como `nodemailer` ou `resend`.

---

## 6. Avanço Automático no Funil (Cron Job)

- **Algoritmo**: `diasRestantes = data_vencimento - hoje`.
- **Comportamento**: Se o card não estiver com trava manual de posicionamento (`isManualColumn: false`), o sistema realoca o projeto para a coluna temporal correta conforme o tempo passa.
- **Acionamento**:
  - Via botão no cabeçalho: **"Avançar Funil"**
  - Via API REST: `GET /api/cron/advance-funnel` (pode ser agendado via Vercel Cron, GitHub Actions ou crontab).

---

## 7. Como Executar Localmente

### Pré-requisitos
- Node.js 18+ (testado no Node.js v24.22.1)
- npm 9+

### Passos de Execução

1. **Instalar Dependências**:
   ```bash
   npm install
   ```

2. **Modo de Desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse no navegador: `http://localhost:3000`

3. **Build de Produção**:
   ```bash
   npm run build
   npm start
   ```

---

## 8. Extensões Futuras Preparadas

- **Nodemailer / Resend**: O `NotificationService` já possui a montagem do e-mail em formato texto e HTML, bastando instanciar o transportador SMTP.
- **Headless Browser / Puppeteer**: O `PdfSnapshotService` possui os stubs e a rota para geração de buffer de PDF acoplável aos e-mails de alerta crítico.
