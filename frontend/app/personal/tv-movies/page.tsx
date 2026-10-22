import { Clapperboard, Tv } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SiteHeader } from "@/components/site-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkspaceEmptyState } from "@/components/workspace-page";

export default function TvMoviesPage() {
  return (
    <AppShell>
      <SiteHeader title="TV Shows & Movies" />
      <Tabs
        defaultValue="tv-shows"
        className="animate-view-enter flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="border-b border-slate-200 px-4 py-2 lg:px-6">
          <TabsList aria-label="TV shows and movies">
            <TabsTrigger value="tv-shows" className="gap-2">
              <Tv className="size-4" aria-hidden />
              TV Shows
            </TabsTrigger>
            <TabsTrigger value="movies" className="gap-2">
              <Clapperboard className="size-4" aria-hidden />
              Movies
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="tv-shows"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6"
        >
          <WorkspaceEmptyState
            title="TV Shows"
            icon={<Tv className="size-6" aria-hidden />}
          />
        </TabsContent>
        <TabsContent
          value="movies"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6"
        >
          <WorkspaceEmptyState
            title="Movies"
            icon={<Clapperboard className="size-6" aria-hidden />}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
