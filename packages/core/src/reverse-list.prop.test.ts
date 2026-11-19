import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { reverseList } from "./reverse-list";

// Feature: phase-0-bootstrap, Property 1: reversing twice returns the input. Validates: Phase 0 step 2
describe("reverseList", () => {
  it("is its own inverse and keeps length", () => {
    fc.assert(
      fc.property(fc.array(fc.anything()), (items) => {
        const once = reverseList(items);
        expect(once).toHaveLength(items.length);
        expect(reverseList(once)).toEqual(items);
      }),
      { numRuns: 100 },
    );
  });

  it("does not mutate its input", () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (items) => {
        const snapshot = [...items];
        reverseList(items);
        expect(items).toEqual(snapshot);
      }),
      { numRuns: 100 },
    );
  });
});
