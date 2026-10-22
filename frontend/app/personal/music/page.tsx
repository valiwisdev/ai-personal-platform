import { Music } from "lucide-react";
import { WorkspacePage } from "@/components/workspace-page";

export default function MusicPage() {
  return (
    <WorkspacePage
      title="Music"
      icon={<Music className="size-6" aria-hidden />}
    />
  );
}
