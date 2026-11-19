/** Returns a reversed copy. Phase 0 smoke module so `pnpm test:prop` has something to run. */
export function reverseList<T>(items: readonly T[]): T[] {
  return [...items].reverse();
}
