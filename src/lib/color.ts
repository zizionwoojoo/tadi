const MEMBER_TAG_PALETTE = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
  "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
  "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200",
  "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200",
  "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200",
];

export function memberTagClasses(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return MEMBER_TAG_PALETTE[hash % MEMBER_TAG_PALETTE.length];
}
