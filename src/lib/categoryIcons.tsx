import {
  Baby,
  Bath,
  BedDouble,
  Flame,
  Gem,
  HeartPulse,
  LayoutGrid,
  Milk,
  PartyPopper,
  Shapes,
  Shirt,
  Sparkles,
  ToyBrick,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Category slug → icon. Fallback: Shapes. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  toys: ToyBrick,
  "baby-clothing": Shirt,
  "feeding-nursing": Milk,
  "health-safety": HeartPulse,
  "skincare-bath": Bath,
  party: PartyPopper,
  "strollers-carriers": Baby,
  "accessories-jewelry": Gem,
  "nursery-bedding": BedDouble,
};

export function categoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug] ?? Shapes;
}

export { Flame, LayoutGrid, Sparkles, Zap };
