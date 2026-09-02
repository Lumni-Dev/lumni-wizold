import {
  Backpack,
  Bed,
  Beer,
  Bell,
  BookOpen,
  Check,
  CircleHelp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Coins,
  Copy,
  Dumbbell,
  Hammer,
  Mail,
  Mars,
  MessageSquare,
  Pause,
  PawPrint,
  Pickaxe,
  Play,
  Settings,
  Shield,
  ShoppingBag,
  Smile,
  Store,
  Swords,
  Trash2,
  X,
  Trophy,
  User,
  UserPlus,
  Users,
  Venus,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import type { Gender } from "@/models/entities/character";
import { cn } from "@/shared/utils/class-names";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/character": User,
  "/inventory": Backpack,
  "/training": Dumbbell,
  "/hunt": Swords,
  "/arena": Shield,
  "/pet": PawPrint,
  "/market": Store,
  "/forge": Hammer,
  "/bazaar": Coins,
  "/tavern": Beer,
  "/ranking": Trophy,
  "/wiki": BookOpen,
  tutorial: CircleHelp,
  "/store": ShoppingBag,
  "/settings": Settings,
};

const SOURCE_ICONS: Record<string, LucideIcon> = {
  Personagem: User,
  Recuperação: Bed,
  Caça: Swords,
  Arena: Shield,
  Treino: Dumbbell,
  Inventário: Backpack,
  Mercado: Store,
  Bazar: Coins,
  Mina: Pickaxe,
  Bigorna: Hammer,
  Forja: Hammer,
  Loja: ShoppingBag,
  Mascote: PawPrint,
  Taverna: Beer,
  Matilha: Users,
  Sistema: Settings,
};

const ACTION_ICONS = {
  message: MessageSquare,
  remove: Trash2,
  keep: UserPlus,
  stop: X,
  play: Play,
  pause: Pause,
  previous: ChevronLeft,
  next: ChevronRight,
  collapse: ChevronDown,
  expand: ChevronUp,
  mail: Mail,
  copy: Copy,
  check: Check,
  smile: Smile,
  sound: Volume2,
  mute: VolumeX,
} as const;

export type AppAction = keyof typeof ACTION_ICONS;

export function NavIcon({ href, className }: { href: string; className?: string }) {
  const Icon = NAV_ICONS[href] ?? Bell;
  return <Icon aria-hidden strokeWidth={1.75} className={cn("h-4 w-4", className)} />;
}

export function SourceIcon({ source, className }: { source: string; className?: string }) {
  const Icon = SOURCE_ICONS[source] ?? Bell;
  return <Icon aria-hidden strokeWidth={1.75} className={cn("h-3.5 w-3.5", className)} />;
}

export function ActionIcon({ action, className }: { action: AppAction; className?: string }) {
  const Icon = ACTION_ICONS[action];
  return <Icon aria-hidden strokeWidth={1.75} className={cn("h-3.5 w-3.5", className)} />;
}

export function GenderSymbol({ gender, className }: { gender: Gender; className?: string }) {
  const Icon = gender === "male" ? Mars : Venus;
  return <Icon aria-hidden strokeWidth={1.75} className={cn("h-3.5 w-3.5", className)} />;
}
