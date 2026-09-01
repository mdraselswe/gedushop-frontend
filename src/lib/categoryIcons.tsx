import {
  Baby,
  Bath,
  BedDouble,
  Flame,
  Gem,
  Gift,
  GraduationCap,
  HeartPulse,
  LayoutGrid,
  Milk,
  PackageCheck,
  PartyPopper,
  Shapes,
  Shirt,
  Sparkles,
  Target,
  ToyBrick,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Category slug → icon.
 *
 * Every category the shop actually has belongs here. The fallback exists for a
 * category created after this file was last touched, not as a resting place:
 * four of them sat on it at once — Combo Offers, Education, Gift Box and
 * Sports — so the sidebar showed the same shape four times and the icons
 * stopped telling anyone anything.
 *
 * Combos take the mark they carry everywhere else: the /combos page heading
 * and the "What's in this combo" panel both use it, so one shape means one
 * thing across the site.
 */
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
  "combo-offers": PackageCheck,
  education: GraduationCap,
  "gift-box": Gift,
  // The shop's sports category is a dart board and soft-dart guns, so a target
  // says what is in there better than a ball or a dumbbell would.
  sports: Target,
};

export function categoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug] ?? Shapes;
}

export { Flame, LayoutGrid, Sparkles, Zap };
