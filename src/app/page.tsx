'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { MetricsOverview } from '@/components/MetricsOverview';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ProjectModal } from '@/components/ProjectModal';
import { UploadModal } from '@/components/UploadModal';
import { NotificationDrawer } from '@/components/NotificationDrawer';
import { NotificationToast } from '@/components/NotificationToast';
import { DailyReportModal } from '@/components/DailyReportModal';
import { Project } from '@/types';

export default function HomePage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isDailyReportOpen, setIsDailyReportOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const handleOpenNewProject = () => {
    setProjectToEdit(null);
    setIsProjectModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setIsProjectModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70">
      {/* Cabeçalho Corporativo Quest Consult */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenNewProject={handleOpenNewProject}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onOpenDailyReport={() => setIsDailyReportOpen(true)}
      />

      {/* Visão de Métricas, KPIs e Filtros por Mecanismo/Aba */}
      <MetricsOverview />

      {/* Área Principal do Kanban Board com as 4 Colunas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <KanbanBoard onEditProject={handleEditProject} />
      </main>

      {/* Modal de Criação / Edição de Projeto */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setProjectToEdit(null);
        }}
        projectToEdit={projectToEdit}
      />

      {/* Modal de Disparo Diário de Relatório por E-mail (Catelani, TK, Lucas, Bruno Britto) */}
      <DailyReportModal
        isOpen={isDailyReportOpen}
        onClose={() => setIsDailyReportOpen(false)}
      />

      {/* Modal de Upload e Importação de Planilha */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      {/* Drawer de Notificações de E-mail (4 Destinatários) */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />

      {/* Toast Flutuante em tempo real */}
      <NotificationToast />
    </div>
  );
}
