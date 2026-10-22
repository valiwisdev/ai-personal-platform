export type Project = Readonly<{ id: string; name: string }>;

// Sample projects until projects come from a real source.
export const projects: readonly Project[] = [
  { id: "ai-personal-platform", name: "AI Personal Platform" },
  { id: "portfolio", name: "Portfolio" },
  { id: "dotfiles", name: "Dotfiles" },
];
