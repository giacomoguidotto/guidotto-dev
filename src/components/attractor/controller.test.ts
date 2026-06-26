import { describe, expect, test } from "bun:test";
import {
  createController,
  type FinaleController,
  snapshotFloat,
  snapshotIndex,
} from "./controller";

// The controller's pure index maths — including the clamp that keeps a stray
// out-of-range progress from deriving an out-of-bounds snapshot index (which the
// HUD's params/loss reads assert on, and would otherwise throw inside an rAF).

const at = (progress: number): FinaleController => ({
  ...createController(37),
  progress,
});

describe("snapshotFloat", () => {
  test("maps progress across the snapshot span", () => {
    expect(snapshotFloat(at(0))).toBe(0);
    expect(snapshotFloat(at(1))).toBe(36);
    expect(snapshotFloat(at(0.5))).toBeCloseTo(18, 10);
  });

  test("clamps overshoot on both ends (never out of bounds)", () => {
    expect(snapshotFloat(at(-0.5))).toBe(0);
    expect(snapshotFloat(at(2))).toBe(36);
  });
});

describe("snapshotIndex", () => {
  test("rounds to the nearest in-range integer snapshot", () => {
    expect(snapshotIndex(at(0))).toBe(0);
    expect(snapshotIndex(at(1))).toBe(36);
    expect(snapshotIndex(at(0.49 / 36))).toBe(0);
    expect(snapshotIndex(at(0.51 / 36))).toBe(1);
  });

  test("a clamped overshoot still indexes a real snapshot", () => {
    expect(snapshotIndex(at(99))).toBe(36);
    expect(snapshotIndex(at(-99))).toBe(0);
  });
});

describe("createController", () => {
  test("starts at epoch 0, autoplay armed, nothing revealed", () => {
    const controller = createController(37);
    expect(controller.progress).toBe(0);
    expect(controller.reveal).toBe(0);
    expect(controller.autoplayActive).toBe(true);
    expect(controller.userScrubbing).toBe(false);
    expect(controller.snapshotCount).toBe(37);
  });
});
