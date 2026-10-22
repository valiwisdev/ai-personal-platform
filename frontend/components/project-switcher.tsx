"use client";

import { FolderGit2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project } from "@/lib/projects";

export function ProjectSwitcher({
  projects,
  projectId,
}: Readonly<{ projects: readonly Project[]; projectId: string }>) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      value={projectId}
      onValueChange={(nextProjectId) =>
        router.push(`${pathname}?project=${encodeURIComponent(nextProjectId)}`)
      }
    >
      <SelectTrigger aria-label="Project" size="sm" className="w-56 max-w-full">
        <FolderGit2 aria-hidden />
        <SelectValue placeholder="Select a project" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
