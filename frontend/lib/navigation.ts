import {
  BookOpen,
  Bot,
  Clapperboard,
  Code2,
  CreditCard,
  FileText,
  FlaskConical,
  House,
  Music,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type NavItem = Readonly<{
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}>;

export type NavSection = Readonly<{
  title: string;
  description: string;
  icon: LucideIcon;
  items: readonly NavItem[];
}>;

export const newChatHref = "/agents";

export const mainNavItems: readonly NavItem[] = [
  {
    title: "Home",
    description: "Overview of your workspaces.",
    href: "/",
    icon: House,
  },
  {
    title: "Agents",
    description: "Chat with your agents and saved conversations.",
    href: "/agents",
    icon: Bot,
  },
];

export const navSections: readonly NavSection[] = [
  {
    title: "Personal",
    description: "Your documents, music, shows, movies, and payments.",
    icon: UserRound,
    items: [
      {
        title: "Documents",
        description: "Organize and work with your personal documents.",
        href: "/personal/documents",
        icon: FileText,
      },
      {
        title: "Music",
        description: "Discover, organize, and listen to your music.",
        href: "/personal/music",
        icon: Music,
      },
      {
        title: "TV Shows & Movies",
        description: "Keep track of what you watch and want to watch.",
        href: "/personal/tv-movies",
        icon: Clapperboard,
      },
      {
        title: "Payments",
        description: "Track your payments, bills, and subscriptions.",
        href: "/personal/payments",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Coding",
    description: "Your code, technical documentation, and sandbox.",
    icon: Code2,
    items: [
      {
        title: "Coding",
        description: "Work on code with AI assistance.",
        href: "/coding",
        icon: Code2,
      },
      {
        title: "Documentation",
        description: "Keep specs, guides, and references for your code.",
        href: "/coding/documentation",
        icon: BookOpen,
      },
      {
        title: "Sandbox",
        description: "Experiment with code in an isolated environment.",
        href: "/coding/sandbox",
        icon: FlaskConical,
      },
    ],
  },
];
