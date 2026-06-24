"use client";

// GlassVessel — a single piece of work under CSS-faked glass.
//
// Purely presentational: it never navigates and it owns no state. The browsable
// links to the work live in the proof grid below the hero, so the vitrine stays
// a calm display case, not a wall of outbound links. Glass is a frame (rim
// light, gloss sweep, specular, inner shadow), never a lens that distorts the
// media beneath it.
//
// The vessel only ever earns color, and a single coordinator (VitrineStage)
// decides which one is lit at a time and writes the root `--live-accent`. The
// vessel just reports intent and reflects the `active` flag:
//   - "hover" (fine pointer): hover / keyboard focus reports activation, leave /
//     blur reports release; the lit look is CSS-driven (:hover / :focus-visible)
//     and transient.
//   - "tap" (coarse pointer): hover does not exist, so a tap reports activation
//     and the coordinator toggles `active`, which drives the lit look.

import type { CSSProperties } from "react";
import type { Motif } from "~/content";
import { ProjectMedia } from "./project-media";

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
  interaction = "hover",
  onActivate,
  onDeactivate,
}: {
  subject: PlaneSubject;
  shape: VesselShape;
  /** Depth-of-field layer: 1 = near/sharp, 3 = far/blurred. */
  depth: 1 | 2 | 3;
  /** Whether this is the coordinator's single lit vessel (drives the loud CSS). */
  active?: boolean;
  /** Lighting trigger: hover/focus, or an explicit tap (default hover). */
  interaction?: VesselInteraction;
  /** Activation intent (hover-enter / focus, or tap), reported with this key. */
  onActivate?: (key: string) => void;
  /** Release intent (hover-leave / blur); unused in tap mode. */
  onDeactivate?: () => void;
}) {
  const tap = interaction === "tap";

  const activate = () => onActivate?.(subject.key);
  const deactivate = () => onDeactivate?.();

  const vesselStyle = { "--accent": subject.accent } as CSSProperties;

  // A button in both modes (the vessel never navigates). On a fine pointer it
  // reports hover/focus and the lit look is CSS-driven; on a coarse pointer a
  // tap reports activation and the coordinator toggles `active`.
  return (
    <button
      aria-label={tap ? subject.label : `Focus ${subject.label}`}
      className={`vessel vessel--${shape}`}
      data-active={active}
      data-depth={depth}
      onBlur={tap ? undefined : deactivate}
      onClick={tap ? activate : undefined}
      onFocus={tap ? undefined : activate}
      onPointerEnter={tap ? undefined : activate}
      onPointerLeave={tap ? undefined : deactivate}
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
