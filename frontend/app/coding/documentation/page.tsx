import { BookOpen } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProjectSwitcher } from "@/components/project-switcher";
import { SiteHeader } from "@/components/site-header";
import { WorkspaceEmptyState } from "@/components/workspace-page";
import { projects } from "@/lib/projects";

type CodingDocumentationPageProps = Readonly<{
  searchParams: Promise<{ project?: string | string[] }>;
}>;

export default async function CodingDocumentationPage({
  searchParams,
}: CodingDocumentationPageProps) {
  const { project } = await searchParams;
  const selectedProject =
    projects.find((candidate) => candidate.id === project) ?? projects[0];

  return (
    <AppShell>
      <SiteHeader title="Documentation" />
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2 lg:px-6">
        <ProjectSwitcher projects={projects} projectId={selectedProject.id} />
      </div>
      <section
        aria-label={`${selectedProject.name} documentation`}
        className="animate-view-enter flex min-h-0 flex-1 flex-col overflow-y-auto p-6"
      >
        <WorkspaceEmptyState
          title={selectedProject.name}
          icon={<BookOpen className="size-6" aria-hidden />}
        />
      </section>
    </AppShell>
  );
}
