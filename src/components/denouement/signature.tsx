"use client";

// Signature — the handwritten mark that draws itself on.
//
// The SVG path is server-rendered in its finished state, so a no-JS visitor (and
// a prefers-reduced-motion visitor) sees the completed signature with no motion
// at all. When motion is allowed, the path is armed (hidden) on mount and then
// drawn on exactly once, the moment it scrolls into view, by transitioning
// `stroke-dashoffset` from the full normalized length to zero. pathLength is
// normalized to 1 so the dash math is independent of the placeholder geometry.
//
// This is the single earned micro-motion of the denouement: it is triggered by
// attention (scroll-into-view), never autonomous, and it runs once. The path is
// a deliberate placeholder until Giacomo's traced signature lands; swapping the
// `d` (and viewBox) is the only change the real trace needs.

import { useEffect, useRef } from "react";
import styles from "./denouement.module.css";

// Duration of the one draw-on pass.
const DRAW_MS = 1500;

// A flowing one-stroke placeholder mark (reads as a signature; the pen never
// lifts so it draws on as a single continuous gesture). Replaced by the trace of
// Giacomo's real signature when it is supplied.
const SIGNATURE_PATH = [
  "M 24 96",
  "C 40 70 44 30 64 26",
  "C 78 23 80 40 74 56",
  "C 70 70 70 86 64 98",
  "C 60 112 44 118 36 108",
  "C 30 100 38 92 50 94",
  "C 60 96 64 84 64 76",
  "C 64 64 80 60 86 70",
  "C 92 80 88 92 78 92",
  "C 68 92 66 78 76 74",
  "C 84 72 86 82 86 90",
  "C 88 94 94 94 98 92",
  "C 104 96 112 94 118 86",
  "C 126 74 122 62 112 64",
  "C 102 66 100 84 110 90",
  "C 116 94 124 92 128 86",
  "C 138 72 150 36 152 28",
  "C 153 24 150 22 148 26",
  "C 144 40 140 64 138 84",
  "C 144 74 154 66 162 64",
  "C 154 70 150 78 158 82",
  "C 164 86 168 92 178 96",
  "C 188 100 150 110 96 106",
  "C 64 103 44 100 30 98",
].join(" ");

export function Signature() {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) {
      return;
    }
    // prefers-reduced-motion keeps the finished, server-rendered mark (the
    // default state): never armed, never animated, shown instantly.
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) {
      return;
    }
    // If scroll-into-view cannot be observed, never arm. Arming hides the stroke,
    // and without an observer to un-hide it the visitor would be left with a blank
    // signature (worse than no motion). Bail to the finished mark instead. This
    // guard must stay before the arming below.
    if (typeof IntersectionObserver === "undefined") {
      return;
    }
    // Arm: hide the stroke with no transition, so nothing moves on its own until
    // the signature is scrolled into view.
    path.style.transition = "none";
    path.style.strokeDasharray = "1";
    path.style.strokeDashoffset = "1";

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Draw on, once, then stop observing.
            path.style.transition = `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`;
            path.style.strokeDashoffset = "0";
            obs.disconnect();
          }
        }
      },
      { threshold: 0.45 }
    );
    // Observe the replaced <svg> root, not the inner <path>: intersection on SVG
    // geometry children is unreliable across engines, and a missed callback is the
    // same blank-signature failure mode the guard above protects against.
    observer.observe(path.ownerSVGElement ?? path);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      aria-hidden="true"
      className={styles.signature}
      fill="none"
      viewBox="0 0 300 130"
    >
      <path
        className={styles.signaturePath}
        d={SIGNATURE_PATH}
        pathLength={1}
        ref={pathRef}
      />
    </svg>
  );
}
