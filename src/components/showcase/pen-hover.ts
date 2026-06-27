import type { PointerEvent as ReactPointerEvent } from "react";

// A hovering stylus reads as a mouse hover. Apple Pencil and the Samsung S Pen
// both report `pointerType: "pen"` with `pressure: 0` while they hover above the
// glass (a real press raises `pressure`), so this one predicate routes both pens'
// hover to the same light-the-vessel path a mouse uses. Finger `"touch"` never
// matches, so the coarse tap gate — and the sticky-hover glitch that gate exists
// to kill — stays intact. The split is made here on the pointer type, never by
// re-enabling CSS `:hover` (CONTEXT → Mobile-native input → "Pen hover = mouse
// hover").
export function isPenHover(event: ReactPointerEvent): boolean {
  return event.pointerType === "pen" && event.pressure === 0;
}
