-- ==============================================================================
-- QUEST DEADLINE CONTROL • QUEST CONSULT
-- Supabase PostgreSQL Schema & Realtime Setup
-- ==============================================================================

-- 1. Criação da Tabela de Projetos (projects)
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL DEFAULT 'Sem informação Migrada',
  name TEXT NOT NULL DEFAULT 'Sem informação Migrada',
  client TEXT DEFAULT 'Sem informação Migrada',
  sponsor TEXT DEFAULT 'Sem informação Migrada',
  responsible TEXT DEFAULT 'Quest Consult',
  start_date TEXT,
  target_date TEXT,
  days_remaining INTEGER,
  status TEXT DEFAULT 'Em Execução',
  law_mechanism TEXT DEFAULT 'Geral',
  column_id TEXT NOT NULL DEFAULT 'col_90',
  is_manual_column BOOLEAN DEFAULT FALSE,
  notes TEXT DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  kv_status TEXT DEFAULT 'nao_enviado',
  kv_sent BOOLEAN DEFAULT FALSE,
  agenda_viva_registered BOOLEAN DEFAULT FALSE,
  proac_system_registered BOOLEAN DEFAULT FALSE,
  is_in_treaty BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  readequation_date TEXT,
  readequation_notes TEXT DEFAULT '',
  original_status_col_c TEXT DEFAULT '',
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices de Alta Performance para Pesquisa e Filtros
CREATE INDEX IF NOT EXISTS idx_projects_column_id ON public.projects (column_id);
CREATE INDEX IF NOT EXISTS idx_projects_law_mechanism ON public.projects (law_mechanism);
CREATE INDEX IF NOT EXISTS idx_projects_target_date ON public.projects (target_date);
CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects (code);
CREATE INDEX IF NOT EXISTS idx_projects_is_completed ON public.projects (is_completed);
CREATE INDEX IF NOT EXISTS idx_projects_is_in_treaty ON public.projects (is_in_treaty);

-- 3. Tabela de Logs de Notificações / E-mails (Opcional para auditoria)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  recipients JSONB DEFAULT '[]'::jsonb,
  subject TEXT,
  preview TEXT,
  status TEXT DEFAULT 'SENT',
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitação de Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acesso (Leitura e Escrita Completa para a Equipe Quest Consult)
-- Remove políticas antigas caso já existam para evitar duplicidade
DROP POLICY IF EXISTS "Permitir Leitura Geral de Projetos" ON public.projects;
DROP POLICY IF EXISTS "Permitir Insercao de Projetos" ON public.projects;
DROP POLICY IF EXISTS "Permitir Atualizacao de Projetos" ON public.projects;
DROP POLICY IF EXISTS "Permitir Exclusao de Projetos" ON public.projects;

DROP POLICY IF EXISTS "Permitir Leitura de Logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Permitir Gravacao de Logs" ON public.notification_logs;

-- Cria políticas para anon e authenticated
CREATE POLICY "Permitir Leitura Geral de Projetos"
  ON public.projects FOR SELECT
  USING (true);

CREATE POLICY "Permitir Insercao de Projetos"
  ON public.projects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir Atualizacao de Projetos"
  ON public.projects FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir Exclusao de Projetos"
  ON public.projects FOR DELETE
  USING (true);

CREATE POLICY "Permitir Leitura de Logs"
  ON public.notification_logs FOR SELECT
  USING (true);

CREATE POLICY "Permitir Gravacao de Logs"
  ON public.notification_logs FOR INSERT
  WITH CHECK (true);

-- 6. Ativação do Supabase Realtime para a tabela projects
-- Permite que alterações feitas por um usuário apareçam instantaneamente na tela dos outros
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'projects'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  END IF;
END $$;

