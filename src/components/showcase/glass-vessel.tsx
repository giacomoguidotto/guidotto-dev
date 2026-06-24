"use client";

// GlassVessel — a single piece of work under CSS-faked glass.
//
// The vessel only ever earns color; it never navigates (the browsable links
// live in the proof grid below the hero, so the vitrine stays a calm display
// case, not a wall of outbound links). Glass is a frame (rim light, gloss
// sweep, specular, inner shadow), never a lens that distorts the media beneath
// it.
//
// Lighting is driven differently per pointer, matching how each is used:
//   - "hover" (fine pointer): the vessel lights itself on hover / keyboard
//     focus and blooms its accent onto the root's `--live-accent` (via
//     useAccent), then clears on leave. The lit state is transient.
//   - "tap" (coarse pointer): hover does not exist, so a tap toggles the lit
//     state instead. The parent owns that state (it sets `active` and the field
//     accent), and the vessel just reports the tap through `onActivate`.

import { type CSSProperties, useCallback } from "react";
import type { Motif } from "~/content";
import { ProjectMedia } from "./project-media";
import { useAccent } from "./showcase-root";

/** Orbs flatter ambient art; rects keep rectangular app UIs legible. */
export type VesselShape = "orb" | "rect";

/** How the vessel earns its lit state: hover/focus, or an explicit tap. */
export type VesselInteraction = "hover" | "tap";

/** The minimum a vessel needs: identity, earned accent, and its media. */
export interface PlaneSubject {
  accent: string;
  key: string;
  label: string;
  motif: Motif;
}

export function GlassVessel({
  subject,
  shape,
  depth,
  active = false,
  manageAccent = true,
  interaction = "hover",
  onActivate,
  style,
}: {
  subject: PlaneSubject;
  shape: VesselShape;
  /** Depth-of-field layer: 1 = near/sharp, 3 = far/blurred. */
  depth: 1 | 2 | 3;
  /** Force the lit (bloomed) state regardless of pointer (used by tap mode). */
  active?: boolean;
  /** Whether hover/focus writes the root accent (default true; hover mode). */
  manageAccent?: boolean;
  /** Lighting trigger: hover/focus, or an explicit tap (default hover). */
  interaction?: VesselInteraction;
  /** Reported on hover-enter or on tap, so a parent can react. */
  onActivate?: () => void;
  style?: CSSProperties;
}) {
  const accent = useAccent();

  const onEnter = useCallback(() => {
    if (manageAccent) {
      accent.set(subject.accent);
    }
    onActivate?.();
  }, [accent, manageAccent, onActivate, subject.accent]);

  const onLeave = useCallback(() => {
    if (manageAccent) {
      accent.clear();
    }
  }, [accent, manageAccent]);

  const tap = interaction === "tap";

  const vesselStyle = { ...style, "--accent": subject.accent } as CSSProperties;

  // In tap mode the parent owns the accent (it toggles on tap), so the button
  // only reports the tap; in hover mode the vessel lights itself and clears on
  // leave. A button either way: the vessel never navigates.
  return (
    <button
      aria-label={tap ? subject.label : `Focus ${subject.label}`}
      className={`vessel vessel--${shape}`}
      data-active={active}
      data-depth={depth}
      onBlur={tap ? undefined : onLeave}
      onClick={tap ? onActivate : undefined}
      onFocus={tap ? undefined : onEnter}
      onPointerEnter={tap ? undefined : onEnter}
      onPointerLeave={tap ? undefined : onLeave}
      style={vesselStyle}
      type="button"
    >
      <span className="vessel__surface">
        <ProjectMedia motif={subject.motif} />
        <span className="vessel__glass" />
        <span className="vessel__sweep" />
      </span>
      <span className="vessel__tag">{subject.label}</span>
    </button>
  );
}
