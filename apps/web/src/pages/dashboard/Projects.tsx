import { useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/layout/DashboardLayout';
import { Plus, ArrowRight, AlertTriangle, FolderGit2, Search, Copy, Check } from 'lucide-react';
import { useProjects } from '../../hooks/useDashboardData';
import type { Project } from '../../hooks/useDashboardData';
import { useUserProfile } from '../../hooks/useUserProfile';
import { isPremium } from '../../lib/subscription';
import { UpgradeModal } from '../../components/dashboard/shared/UpgradeModal';
import { ConfirmDialog } from '../../components/dashboard/shared/ConfirmDialog';
import { PageHeader } from '../../components/dashboard/shared/PageHeader';
import { StatusBadge, type Tone } from '../../components/dashboard/shared/StatusBadge';
import { EmptyState, ErrorState, SkeletonCards } from '../../components/dashboard/shared/States';
import { Modal } from '../../components/dashboard/ui/Modal';
import { Card, Btn, SearchInput, KV } from '../../components/dashboard/ui/kit';
import { db, doc, deleteDoc } from '../../lib/firebase';

const statusTone = (s: string): Tone =>
  s === 'synced' ? 'green' : s === 'error' ? 'red' : 'amber';

export function Projects() {
  const { data: projects, loading: projectsLoading, error: projectsError } = useProjects();
  const {
    subscription,
    currentUser,
    loading: profileLoading,
    error: profileError,
  } = useUserProfile();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const handleDeleteProject = async (projectId: string) => {
    if (!currentUser) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'projects', projectId));
      setSelectedProject(null);
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting project:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const loading = projectsLoading || profileLoading;
  const error = projectsError || profileError;

  const filtered = useMemo(
    () =>
      projects.filter((p) =>
        `${p.name} ${p.framework} ${p.env}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [projects, search],
  );

  const hasPremium = subscription ? isPremium(subscription) : false;
  const handleNewProjectClick = () => {
    if (!hasPremium) setIsUpgradeModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />

        <PageHeader
          eyebrow="Environments"
          title="Projects"
          description="Repositories and environments connected to your workspace."
          actions={
            <Btn
              variant="accent"
              onClick={handleNewProjectClick}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              New Project
            </Btn>
          }
        />

        {!hasPremium && (
          <Card className="p-4 !border-warn/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-warn shrink-0" />
              <span className="text-white/70">
                Project creation requires an active premium subscription.
              </span>
            </div>
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="shrink-0"
            >
              Upgrade
            </Btn>
          </Card>
        )}

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search projects..."
          icon={<Search className="w-4 h-4" />}
        />

        {loading ? (
          <SkeletonCards count={6} height="h-36" />
        ) : error ? (
          <ErrorState message={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FolderGit2 className="w-8 h-8" />}
            title={search ? 'No matching projects' : 'No projects yet'}
            description="Install the Derivo CLI and run derivo setup to register your first project."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <Card
                key={project.id}
                hover
                onClick={() => {
                  setSelectedProject(project);
                  setCopied(false);
                }}
                className="p-5 flex flex-col cursor-pointer"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-semibold text-white/90">{project.name}</h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-white/40">
                      <span>{project.framework}</span>
                      <span>·</span>
                      <span>{project.env}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20" />
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.05]">
                  <StatusBadge label={project.status} tone={statusTone(project.status)} />
                  <span className="text-[10px] text-white/30">{project.lastSync}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!selectedProject}
        title="Project Details"
        onClose={() => setSelectedProject(null)}
        footer={
          selectedProject && (
            <>
              <Btn
                variant="danger"
                className="mr-auto"
                onClick={() => setConfirmDelete(selectedProject)}
              >
                Delete Project
              </Btn>
              <Btn variant="secondary" onClick={() => setSelectedProject(null)}>
                Close
              </Btn>
            </>
          )
        }
      >
        {selectedProject && (
          <div className="p-6">
            <KV label="Project Name">{selectedProject.name}</KV>
            <div className="grid grid-cols-3 gap-3 items-center py-2.5 border-b border-white/[0.05]">
              <span className="text-xs text-white/40">Project ID</span>
              <div className="col-span-2 flex items-center gap-2">
                <code className="text-xs font-mono text-white/90 bg-canvas border border-white/[0.08] px-2 py-1 rounded-lg truncate">
                  {selectedProject.id}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(selectedProject.id);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="h-7 w-7 rounded-lg flex items-center justify-center border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
                  title="Copy ID"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-good" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <KV label="Framework">{selectedProject.framework}</KV>
            <KV label="Environment">{selectedProject.env}</KV>
            <div className="grid grid-cols-3 gap-3 items-center py-2.5 border-b border-white/[0.05]">
              <span className="text-xs text-white/40">Status</span>
              <span className="col-span-2">
                <StatusBadge
                  label={selectedProject.status}
                  tone={statusTone(selectedProject.status)}
                />
              </span>
            </div>
            <KV label="Last Synced">{selectedProject.lastSync}</KV>
            <KV label="Created At">{new Date(selectedProject.createdAt).toLocaleString()}</KV>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete project?"
        message="This permanently removes the project from your workspace. This action cannot be undone."
        confirmLabel="Delete"
        busy={isDeleting}
        onConfirm={() => confirmDelete && handleDeleteProject(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />
    </DashboardLayout>
  );
}
