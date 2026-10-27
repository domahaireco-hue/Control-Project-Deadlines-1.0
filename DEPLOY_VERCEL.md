# Guia de Publicação na Vercel • Quest Deadline Control

O projeto foi totalmente configurado e otimizado para deploy imediato e de alta performance na **Vercel** (zero-config).

---

## 🚀 Método 1: Deploy Automático via GitHub / GitLab / Bitbucket (Recomendado)

1. Envie o código para o seu repositório Git:
   ```bash
   git add .
   git commit -m "feat: configuracoes de deploy na vercel e rotinas cron"
   git push origin main
   ```
2. Acesse [vercel.com](https://vercel.com) e faça login.
3. Clique em **"Add New..."** > **"Project"**.
4. Importe o repositório `Control Project Deadlines v1.0` (ou o nome do seu repositório).
5. A Vercel detectará automaticamente as configurações:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./`
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
6. Clique no botão **"Deploy"**.
7. Pronto! Em menos de 1 minuto seu site estará online com HTTPS gratuito e CDN global.

---

## 💻 Método 2: Deploy Direto via Vercel CLI

Se preferir publicar diretamente pelo terminal:

1. Instale ou execute a CLI da Vercel:
   ```bash
   npx vercel
   ```
2. Siga as instruções rápidas no terminal (pode aceitar os padrões).
3. Para publicar diretamente em produção:
   ```bash
   npx vercel --prod
   ```

---

## ⏰ Rotinas Automáticas (Vercel Cron Jobs)

O arquivo [`vercel.json`](./vercel.json) já está configurado com as rotinas diárias:
- **Avanço automático do funil de prazos**: `/api/cron/advance-funnel`
- **Disparo diário de relatórios por e-mail**: `/api/send-daily-report`

Horário configurado: **Todos os dias às 08h00 BRT** (`11:00 UTC` - expressão cron: `0 11 * * *`).

*(Opcional)* Se desejar proteger os endpoints de cron para serem chamados apenas pela Vercel, adicione a variável de ambiente no painel da Vercel:
- `CRON_SECRET`: Uma chave secreta qualquer gerada por você.

---

## ⚙️ Arquivos Configurados

- [`vercel.json`](./vercel.json): Configuração do framework Next.js, cabeçalhos de segurança HTTP e agendamento de Cron Jobs diários.
- [`next.config.mjs`](./next.config.mjs): Otimização de build para ambiente serverless da Vercel com checagem de tipos estrita e bypass de lint interativo.
- [`package.json`](./package.json): Especificação de compatibilidade de runtime Node.js `>=18.18.0`.
- [`.env.example`](./.env.example): Referência de variáveis de ambiente.
