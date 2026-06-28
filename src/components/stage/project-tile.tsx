"use client";

// ProjectTile — ONE DOM node that is the hero vitrine vessel at rest and the proof
// card once landed (the "same DOM element in both states" the scroll handoff calls
// for, realised literally). It is a single <a>:
//
//   - the real `href` is ALWAYS present so search crawlers can follow every tile to
//     its repo from first paint (the morph stage replaces the crawlable PlainStage,
//     so the tiles themselves have to carry the link — see #SEO crawlable-anchors).
//     Navigation for HUMANS is gated by the tile's data-phase, not by the href:
//   - at rest it is a calm, hover-reactive contact-sheet vessel (data-phase "rest")
//     that matches the hero vessel 1:1 — same depth blur, same 1.4rem corner, same
//     earn-colour-on-hover. The stage's click guard swallows a click here, and the
//     tile sits out of the tab order (tabindex -1), so it never navigates;
//   - mid-flight (data-phase "flight") it is inert: pointer events off, out of the
//     tab order, click-guarded, so a half-formed card can't be navigated or lit;
//   - once the morph resolves (data-phase "live") the stage drops the tabindex and
//     the click guard stands down, so the tile behaves exactly like a ProofCard: the
//     whole card navigates to the repo, hover/focus light it, and the caption's
//     bigger-picture copy reveals.
//
// It reuses the proof grid's own CSS module for every card layer (poster, glass,
// bloom, sweep, caption) so the resolved 2x2 is pixel-identical to the standalone
// grid; the stage drives the vitrine<->card morph imperatively through the stable
// data hooks (`data-key`, `data-poster`, `data-caption`) and the `.tile` class
// here. Soft -> sharp is the hero's OWN treatment: the stage fades the poster's
// `filter: blur()` (the same per-depth radii the hero uses, divided by the live
// FLIP scale so the on-screen blur is exactly the hero's) to none as it lands; the
// corner stays a constant 1.4rem (the hero's and the card's shared value).
//
// The "see the story" affordance is deliberately absent: only the showpiece owns a
// `storyHref`, and it is null until a story page is sourced (content boundary). The
// slot lives structurally in the caption order and lights up the day the link is real.

import type { CSSProperties } from "react";
import proofStyles from "~/components/proof-grid/proof-grid.module.css";
import { ProjectMedia } from "~/components/showcase/project-media";
import type { Motif } from "~/content";
import styles from "./stage.module.css";

/** The minimum a tile needs in either state. Caption fields are peer-only; the
 *  showpiece is poster-only (it sets itself aside and never grows a card). */
export interface TileModel {
  readonly accent: string;
  readonly atRestLine?: string;
  readonly badge?: string;
  readonly key: string;
  readonly label: string;
  readonly motif: Motif;
  readonly onFocus?: string;
  readonly repoUrl: string;
  /** The showpiece is poster-only and never joins the grid. */
  readonly showpiece?: boolean;
  readonly tag?: string;
}

// A concise name for assistive tech once the tile is a live card: the project plus
// its one weighted line (both verbatim content). The decorative logo is aria-hidden
// inside ProjectMedia.
function TileCaption({ model }: { model: TileModel }) {
  return (
    <span className={proofStyles.caption} data-caption>
      <span className={proofStyles.title}>{model.label}</span>
      <span className={proofStyles.atRest}>{model.atRestLine}</span>
      <span className={proofStyles.tag}>{model.tag}</span>
      <span className={proofStyles.onFocus}>
        <span>{model.onFocus}</span>
        {model.badge ? (
          <span className={proofStyles.badge}>{model.badge}</span>
        ) : null}
        {/* "see the story" slot — rendered only when a real storyHref is sourced. */}
      </span>
    </span>
  );
}

export function ProjectTile({
  model,
  active,
  priority = false,
}: {
  model: TileModel;
  /**
   * Declarative lit state for the React-driven contact sheets (the mobile portrait
   * morph, #27 Part C). The desktop MotionStage leaves this undefined and writes
   * `data-active` imperatively per scroll frame, so an undefined `active` renders no
   * attribute and never fights that imperative write.
   */
  active?: boolean;
  /**
   * Eager-load this tile's logo. The stages set it on the showpiece (the top
   * portrait card) so the mobile LCP element paints the instant the post-hydration
   * morph tree mounts, instead of waiting for a lazy fetch. The hero already
   * preloads the same optimized URL, so this only flips the swapped-in node eager.
   */
  priority?: boolean;
}) {
  return (
    // The href is always present so crawlers can follow the tile to its repo; the
    // stage arms navigation for humans only once the card resolves (data-phase
    // "live") — until then it is out of the tab order (tabindex -1) and the stage's
    // click guard swallows clicks. Its accessible name, once it is an armed link,
    // comes from its visible caption text.
    <a
      className={`${proofStyles.card} ${styles.tile}`}
      data-active={active ? "true" : undefined}
      data-key={model.key}
      href={model.repoUrl}
      rel="noreferrer"
      style={{ "--accent": model.accent } as CSSProperties}
      tabIndex={-1}
    >
      <span className={proofStyles.vessel} data-poster>
        <span className={proofStyles.surface}>
          <span className={proofStyles.media}>
            <ProjectMedia motif={model.motif} priority={priority} />
          </span>
          <span className={proofStyles.bloom} />
          <span className={`${proofStyles.glass} glass-frame`} />
          <span className={proofStyles.sweep} />
        </span>
        {/* the hero's floating name tag, restored at rest: it fades in under a
            lit vessel exactly like the hero's .vessel__tag (every tile has one,
            the showpiece included). The stage divides its size + offset by the
            live FLIP scale so it renders at the hero's pixel size; a landed card
            shows its in-flow caption below instead. */}
        <span className={styles.restTag} data-tag>
          {model.label}
        </span>
      </span>
      {model.showpiece ? null : <TileCaption model={model} />}
    </a>
  );
}
