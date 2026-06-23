"use client";

// ProofCard — one peer in the 2x2 proof grid: recording-forward with an earned
// caption. The whole card is an <a> to the project's public GitHub repo, and it
// is itself the focus / hover / touch target that blooms the project accent (via
// useAccent — the same single-root --live-accent mechanism the hero uses, so
// only one card is ever loud at a time). At rest it shows the sharp work + the
// one weighted line + a mono tag; on focus the media sharpens, the accent
// blooms, gloss sweeps, and the bigger-picture copy surfaces with at most one
// proof badge.
//
// An anchor (not GlassVessel's <button>) is used on purpose: the card's primary
// job is to navigate to the repo, and an <a href> receives focus and hover
// natively, so the earned-color wiring (onFocus/onBlur/onPointerEnter/
// onPointerLeave) drives the accent exactly as a button would while staying a
// real link that is keyboard-operable (Enter activates it).

import { type CSSProperties, useCallback } from "react";
import { ProjectMedia } from "~/components/showcase/project-media";
import { useAccent } from "~/components/showcase/showcase-root";
import type { Project } from "~/content";
import styles from "./proof-grid.module.css";

export function ProofCard({
  project,
  badge,
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
}) {
  const accent = useAccent();

  const bloom = useCallback(() => {
    accent.set(project.accent);
  }, [accent, project.accent]);

  const fade = useCallback(() => {
    accent.clear();
  }, [accent]);

  return (
    <a
      // A concise, meaningful name for assistive tech: the project plus its one
      // weighted line (both verbatim content). The decorative motif is already
      // aria-hidden inside ProjectMedia.
      aria-label={`${project.label}. ${project.atRestLine}`}
      className={styles.card}
      href={project.repoUrl}
      onBlur={fade}
      onFocus={bloom}
      onPointerEnter={bloom}
      onPointerLeave={fade}
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
        <span className={styles.onFocusWrap}>
          <span className={styles.onFocus}>
            <span>{project.onFocus}</span>
            {badge ? <span className={styles.badge}>{badge}</span> : null}
          </span>
        </span>
      </span>
    </a>
  );
}
