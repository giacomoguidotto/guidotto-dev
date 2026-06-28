"use client";

// ProofCard — one peer: recording-forward with an earned caption. The whole card
// is an <a> to the project's public GitHub repo, and it is itself the focus /
// hover / touch target. At rest it shows the sharp square work + the one weighted
// line + a mono tag; when it is the grid's single active card the media sharpens,
// the accent blooms, gloss sweeps, and the bigger-picture copy fades in (it is
// always laid out, so the reveal causes no layout shift).
//
// An anchor (not GlassVessel's <button>) is used on purpose: the card's primary
// job is to navigate. The loud state is driven by `isActive` (the single-active-
// card coordinator in ProofGrid), never by this card's own :hover / :focus-
// visible, so two cards can never answer loudly at once.
//
// Input paths, all funnelled through the coordinator:
//   - desktop mouse / hovering stylus (fine pointer, OR a pen at pressure 0 —
//     Apple Pencil / S Pen — even on a coarse-primary device): pointer-enter
//     activates, pointer-leave releases, first click navigates;
//   - keyboard (either layout): focus-visible activates (and, in the carousel,
//     centres the card), blur releases on desktop, Enter navigates;
//   - mobile carousel (coarse / <= 40rem): the centred card is set by the
//     coordinator's scroll observer; a tap on a NON-centred card brings it to
//     centre + focuses it instead of leaving, a tap on the already-centred card
//     follows the link. Hover never activates here (mouse and pen alike), so
//     scrolling can't light a card.
//   - non-carousel coarse (e.g. a tablet on the grid): a hovering pen lights the
//     card like a mouse; a finger's first tap reveals, second tap on the active
//     card navigates.

import {
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { isPenHover } from "~/components/showcase/pen-hover";
import { ProjectMedia } from "~/components/showcase/project-media";
import { useAccent } from "~/components/showcase/showcase-root";
import type { Project } from "~/content";
import styles from "./proof-grid.module.css";

// Bring a card to the centre of its scroll container (the carousel), honouring
// reduced-motion by skipping the smooth scroll.
function centerInView(el: HTMLElement) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
}

export function ProofCard({
  project,
  badge,
  carousel,
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
  /** Whether the mobile carousel layout is active (changes hover/tap behaviour). */
  carousel: boolean;
  /** Whether this is the grid's single loud card (drives all of the loud CSS). */
  isActive: boolean;
  /** Hover / first-tap / tap-to-centre activation request to the coordinator. */
  onActivate: (key: string) => void;
  /** Keyboard (focus-visible) focus request to the coordinator. */
  onFocus: (key: string) => void;
  onBlur: (key: string) => void;
  onPointerLeave: (key: string) => void;
}) {
  const accent = useAccent();
  // Whether this device's primary pointer is coarse (touch). Read once on mount;
  // gates the desktop-grid two-tap navigation gate on for touch only.
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
      // Only keyboard / programmatic focus reveals. A touch tap that incidentally
      // focuses the link is not focus-visible, so it is left to the click gate.
      if (event.currentTarget.matches(":focus-visible")) {
        onFocus(project.key);
        // In the carousel, keep the keyboard-focused card centred and legible.
        if (carousel) {
          centerInView(event.currentTarget);
        }
      }
    },
    [carousel, onFocus, project.key]
  );

  const handleBlur = useCallback(() => {
    onBlur(project.key);
  }, [onBlur, project.key]);

  const handlePointerEnter = useCallback(
    (event: PointerEvent<HTMLAnchorElement>) => {
      // Hover is a desktop-grid affordance. A hovering stylus (pen, pressure 0 —
      // Apple Pencil / S Pen) counts as a mouse hover, so it lights the card on a
      // coarse-primary device too; finger touch never does (the tap gate rules,
      // which is the scroll-triggers-hover fix). The carousel never hovers — the
      // scroll observer owns the active card — and a mouse is blocked there too,
      // so a pen matches the mouse and stays out as well.
      if (carousel) {
        return;
      }
      if (!coarseRef.current || isPenHover(event)) {
        onActivate(project.key);
      }
    },
    [carousel, onActivate, project.key]
  );

  const handlePointerLeave = useCallback(
    (event: PointerEvent<HTMLAnchorElement>) => {
      if (carousel) {
        return;
      }
      if (!coarseRef.current || isPenHover(event)) {
        onPointerLeave(project.key);
      }
    },
    [carousel, onPointerLeave, project.key]
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (carousel) {
        // Scroll picks/focuses. A tap on a card that isn't centred brings it to
        // centre and focuses it instead of leaving; a tap on the centred (active)
        // card falls through to navigation.
        if (!isActive) {
          event.preventDefault();
          onActivate(project.key);
          centerInView(event.currentTarget);
        }
        return;
      }
      // Desktop-grid touch gate: on a coarse pointer, a pointer-driven tap
      // (detail !== 0) on a not-yet-active card reveals it instead of navigating.
      // Keyboard / screen-reader activations report detail === 0 and navigate on
      // the first try, as do all fine-pointer (mouse) clicks.
      if (coarseRef.current && event.detail !== 0 && !isActive) {
        event.preventDefault();
        onActivate(project.key);
      }
    },
    [carousel, isActive, onActivate, project.key]
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
          <span className={`${styles.glass} glass-frame`} />
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
