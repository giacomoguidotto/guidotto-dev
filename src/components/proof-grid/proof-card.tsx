"use client";

// ProofCard — one peer in the 2x2 proof grid: recording-forward with an earned
// caption. The whole card is an <a> to the project's public GitHub repo, and it
// is itself the focus / hover / touch target. At rest it shows the sharp work +
// the one weighted line + a mono tag; when it is the grid's single active card
// the media sharpens, the accent blooms, gloss sweeps, and the bigger-picture
// copy surfaces with at most one proof badge.
//
// An anchor (not GlassVessel's <button>) is used on purpose: the card's primary
// job is to navigate to the repo. The loud state is driven by `isActive` (the
// single-active-card coordinator in ProofGrid), never by this card's own :hover
// / :focus-visible, so two cards can never answer loudly at once.
//
// Input paths, all funnelled through the coordinator:
//   - mouse (fine pointer): pointer-enter activates, pointer-leave releases,
//     first click navigates;
//   - keyboard: focus-visible activates, blur releases, Enter navigates;
//   - touch (coarse pointer): the FIRST tap reveals + blooms without leaving for
//     GitHub, a SECOND tap on the already-active card follows the link. Hover is
//     ignored on coarse pointers, and keyboard / screen-reader activations
//     (click detail === 0) are never gated, so they navigate on the first try.

import {
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { ProjectMedia } from "~/components/showcase/project-media";
import { useAccent } from "~/components/showcase/showcase-root";
import type { Project } from "~/content";
import styles from "./proof-grid.module.css";

export function ProofCard({
  project,
  badge,
  isActive,
  onActivate,
  onFocus,
  onBlur,
  onPointerLeave,
}: {
  project: Project;
  /**
   * The single proof badge (the one hardest artifact). Optional and dark until a
   * real KPI is sourced into the content surface: copy.md locks the four grid
   * peers as "No badges" and CONTEXT keeps badges dark until real KPIs, so today
   * no peer passes one. Keeping it a prop makes the one-badge cap structural and
   * the slot ready the moment a verifiable metric lands.
   */
  badge?: string;
  /** Whether this is the grid's single loud card (drives all of the loud CSS). */
  isActive: boolean;
  /** Hover / first-tap activation request to the coordinator. */
  onActivate: (key: string) => void;
  /** Keyboard (focus-visible) focus request to the coordinator. */
  onFocus: (key: string) => void;
  onBlur: (key: string) => void;
  onPointerLeave: (key: string) => void;
}) {
  const accent = useAccent();
  // Whether this device's primary pointer is coarse (touch). Read once on mount;
  // gates hover off and the two-tap navigation gate on for touch only.
  const coarseRef = useRef(false);

  useEffect(() => {
    coarseRef.current = window.matchMedia("(pointer: coarse)").matches;
  }, []);

  // The field bloom (single-root --live-accent) follows the one active card, so
  // exactly one accent is ever live regardless of how the card was activated.
  useEffect(() => {
    if (!isActive) {
      return;
    }
    accent.set(project.accent);
    return () => {
      accent.clear();
    };
  }, [isActive, accent, project.accent]);

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLAnchorElement>) => {
      // Only keyboard / programmatic focus reveals on focus. A touch tap that
      // incidentally focuses the link is not focus-visible, so it is left to the
      // click gate (preserving the two-tap reveal-then-go on coarse pointers).
      if (event.currentTarget.matches(":focus-visible")) {
        onFocus(project.key);
      }
    },
    [onFocus, project.key]
  );

  const handleBlur = useCallback(() => {
    onBlur(project.key);
  }, [onBlur, project.key]);

  const handlePointerEnter = useCallback(() => {
    // Hover is a fine-pointer affordance only; on touch the tap gate rules.
    if (!coarseRef.current) {
      onActivate(project.key);
    }
  }, [onActivate, project.key]);

  const handlePointerLeave = useCallback(() => {
    if (!coarseRef.current) {
      onPointerLeave(project.key);
    }
  }, [onPointerLeave, project.key]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      // The touch gate: on a coarse pointer, a pointer-driven tap (detail !== 0)
      // on a not-yet-active card reveals it instead of navigating. Keyboard and
      // screen-reader activations report detail === 0 and fall straight through
      // to navigation, as do all fine-pointer (mouse) clicks.
      if (coarseRef.current && event.detail !== 0 && !isActive) {
        event.preventDefault();
        onActivate(project.key);
      }
    },
    [isActive, onActivate, project.key]
  );

  return (
    <a
      // A concise, meaningful name for assistive tech: the project plus its one
      // weighted line (both verbatim content). The decorative motif is already
      // aria-hidden inside ProjectMedia.
      aria-label={`${project.label}. ${project.atRestLine}`}
      className={styles.card}
      data-active={isActive}
      href={project.repoUrl}
      onBlur={handleBlur}
      onClick={handleClick}
      onFocus={handleFocus}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      rel="noreferrer"
      style={{ "--accent": project.accent } as CSSProperties}
    >
      <span className={styles.vessel}>
        <span className={styles.surface}>
          <span className={styles.media}>
            <ProjectMedia motif={project.motif} />
          </span>
          <span className={styles.bloom} />
          <span className={styles.glass} />
          <span className={styles.sweep} />
        </span>
      </span>

      <span className={styles.caption}>
        <span className={styles.title}>{project.label}</span>
        <span className={styles.atRest}>{project.atRestLine}</span>
        <span className={styles.tag}>{project.tag}</span>
        <span className={styles.onFocus}>
          <span>{project.onFocus}</span>
          {badge ? <span className={styles.badge}>{badge}</span> : null}
        </span>
      </span>
    </a>
  );
}
