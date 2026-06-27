import { describe, expect, test } from "bun:test";
import type { PointerEvent as ReactPointerEvent } from "react";
import { isPenHover } from "./pen-hover";

// A minimal stand-in for the only two fields the predicate reads. Everything else
// on a React PointerEvent is irrelevant to the pointer-type split.
const event = (pointerType: string, pressure: number) =>
  ({ pointerType, pressure }) as ReactPointerEvent;

describe("isPenHover", () => {
  // The whole point: one predicate lights for a hovering Apple Pencil AND a
  // hovering Samsung S Pen, because both report pen + pressure 0.
  test("a hovering stylus (pen, pressure 0) counts as a mouse hover", () => {
    expect(isPenHover(event("pen", 0))).toBe(true);
  });

  // A pressing pen is a press/tap, not a hover, so it must not light via the
  // hover path.
  test("a pressing pen (pressure > 0) is not a hover", () => {
    expect(isPenHover(event("pen", 0.5))).toBe(false);
  });

  // Finger touch must never pass: this is what keeps the coarse tap gate and its
  // sticky-hover fix intact.
  test("finger touch never counts as a hover, even at pressure 0", () => {
    expect(isPenHover(event("touch", 0))).toBe(false);
  });

  // A mouse goes through its own (fine-pointer) path; it is not a pen.
  test("a mouse is not a pen hover", () => {
    expect(isPenHover(event("mouse", 0))).toBe(false);
  });
});
