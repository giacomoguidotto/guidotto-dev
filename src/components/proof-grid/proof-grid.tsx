"use client";

// ProofGrid — the 2x2 grid of the four peer proof cards (Orray, Tempo, Scry,
// Ginevra), rendered straight from the canonical content surface. This is the
// plain standalone section; the scroll-morph that delivers these cards out of
// the hero contact sheet is a later slice and is deliberately not built here.
//
// ProofGrid is the single-active-card coordinator that enforces the reactivity
// law ("only one card loud at a time"). The loud state is keyed off one
// `activeKey`, never off each card's own :hover / :focus-visible, so keyboard-
// focusing one card and hovering another can never both answer loudly. Last
// interaction wins. Each card still uses useAccent() for the field bloom, which
// therefore follows the one active card too.
//
// Deep module: <ProofGrid /> is the entire interface; the cards, the glass, the
// media seam, the accent wiring, and the touch gate are all hidden inside.

import { useCallback, useRef, useState } from "react";
import { content } from "~/content";
import { ProofCard } from "./proof-card";
import styles from "./proof-grid.module.css";

export function ProofGrid() {
  // The single loud card. Set by keyboard focus, fine-pointer hover, and the
  // first touch tap; the only thing the cards read to decide "am I loud".
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // Which card holds keyboard focus (focus-visible only), so a pointer pass-over
  // that ends can restore the keyboard-focused card instead of stranding it dark.
  const focusedKeyRef = useRef<string | null>(null);

  // Hover / first-tap activation (not keyboard focus, so it doesn't touch the
  // focused-card ref).
  const activate = useCallback((key: string) => {
    setActiveKey(key);
  }, []);

  // Keyboard (focus-visible) focus: remember it and make it loud.
  const focus = useCallback((key: string) => {
    focusedKeyRef.current = key;
    setActiveKey(key);
  }, []);

  // Blur clears the loud card outright; the next focus (if any) re-lights its own.
  const blur = useCallback((key: string) => {
    if (focusedKeyRef.current === key) {
      focusedKeyRef.current = null;
    }
    setActiveKey((prev) => (prev === key ? null : prev));
  }, []);

  // Ending a hover restores the keyboard-focused card (or nothing) rather than
  // leaving a focused card dark after a mouse pass-over.
  const pointerLeave = useCallback((key: string) => {
    setActiveKey((prev) => (prev === key ? focusedKeyRef.current : prev));
  }, []);

  return (
    <section className={styles.section}>
      <ul className={styles.grid}>
        {content.projects.map((project) => (
          <li className={styles.item} key={project.key}>
            <ProofCard
              isActive={activeKey === project.key}
              onActivate={activate}
              onBlur={blur}
              onFocus={focus}
              onPointerLeave={pointerLeave}
              project={project}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
