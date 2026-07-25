export interface RecentItem {
  slug: string;
  name: string;
  image?: string;
  price: string; // already formatted, so the widget needs no prices object
}

const KEY = "gedu_recent";
const MAX = 12;

export function addRecent(item: RecentItem) {
  if (typeof window === "undefined") return;
  try {
    const list: RecentItem[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    const next = [item, ...list.filter((x) => x.slug !== item.slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full / disabled — ignore
  }
}

export function getRecent(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
