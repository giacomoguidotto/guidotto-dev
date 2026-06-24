"use client";

// Stage — the scroll choreography that ties the hero contact sheet and the proof
// grid into one continuous scroll story (Option C: the showpiece is excluded from
// the grid and sets itself aside). This is the enhancement layer over the plain
// hero (#4) and grid (#3); the plain sectioned versions those slices ship are the
// reduced-motion / fallback presentation.
//
// Deep module: <Stage /> is the entire interface. Behind it sit two presentations
// and one physics:
//
//   - PLAIN (the default, and what reduced-motion / coarse pointer / narrow /
//     no-JS always get): the already-verified <Hero /> then <ProofGrid /> as two
//     stacked sections. Server-rendered, indexable, fully legible. This is also
//     the SSR + first-client-render output, so there is never a hydration
//     mismatch; the morph is layered on only after mount, and only where welcome.
//
//   - MOTION (a progressive enhancement on motion-welcome fine pointers wide
//     enough for the 2x2): the SAME proof-grid cells become the shared DOM
//     elements of a FLIP morph. A sticky pin holds the stage for ~one viewport of
//     free scrolling (a visual pin, never a scroll-jack or scroll-lock), while a
//     single scroll-progress property --p drives the cells out of a depth-stacked
//     contact sheet (--p 0) into the sharp aligned grid (--p 1): chaos -> order,
//     soft -> sharp, depth -> flat. The thesis hands the baton (rises + fades);
//     the AnyPINN showpiece plane gives a brief "wait for me" lift then slides
//     off-stage (a curatorial set-aside, never a vanish), seeding the "where did
//     it go" loop the finale (#9) pays off.
//
// The morph is transform / opacity only (GPU-composited, zero reflow). The cell
// transforms are measured and written imperatively from JS (the FLIP engine, an
// internal seam); the thesis, baton, atmosphere, and accent tint read --p / the
// earned --live-accent straight from CSS. So there is no per-frame React work and
// no animated blur radius (the softness cross-fades as a dimming atmosphere). The
// grid keeps its own single-active-card coordinator, captions, and repo links
// untouched, so once resolved it behaves exactly like the standalone grid.

import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Hero } from "~/components/hero";
import { ProofGrid } from "~/components/proof-grid/proof-grid";
import proofStyles from "~/components/proof-grid/proof-grid.module.css";
import { GlassVessel } from "~/components/showcase/glass-vessel";
import { ShowcaseRoot } from "~/components/showcase/showcase-root";
import { content } from "~/content";
import styles from "./stage.module.css";

type Mode = "plain" | "motion";

// The morph is enhancement-only: it needs a fine pointer (hover precision to read
// the contact sheet), motion permission, and enough width for the 2x2 (below the
// grid's own 40rem carousel switch, so the two layouts never fight). Everything
// else gets the plain sectioned story. One query covers all three so a reduced-
// motion toggle, an input-mode switch, or a resize across the threshold all flip
// the presentation live.
const MOTION_QUERY =
  "(pointer: fine) and (prefers-reduced-motion: no-preference) and (min-width: 48rem)";

// The contact-sheet "First" pose for each grid peer (keyed by content key) and
// the showpiece plane: a center expressed as a fraction of the pinned viewport,
// the scale relative to the card's natural grid size, the resting opacity, and a
// depth-stacking order. These mirror the hero's overlapping, depth-led contact
// sheet so the morph reads as "the same work developing," and are the one knob to
// tune the choreography by eye.
interface ContactPose {
  readonly cx: number;
  readonly cy: number;
  readonly opacity: number;
  readonly scale: number;
  readonly z: number;
}

const CONTACT: Record<string, ContactPose> = {
  orray: { cx: 0.24, cy: 0.64, scale: 0.58, opacity: 0.9, z: 4 },
  scry: { cx: 0.76, cy: 0.3, scale: 0.5, opacity: 0.74, z: 3 },
  tempo: { cx: 0.74, cy: 0.66, scale: 0.44, opacity: 0.62, z: 2 },
  ginevra: { cx: 0.5, cy: 0.2, scale: 0.42, opacity: 0.6, z: 1 },
};

const DEFAULT_POSE: ContactPose = {
  cx: 0.5,
  cy: 0.4,
  scale: 0.5,
  opacity: 0.7,
  z: 1,
};

// The morph completes over the first MORPH_END of the track's one-viewport pin;
// the remaining sliver is a hold where the resolved grid reads as a normal grid
// before the page continues (so the settle is bounded, never a journey).
const MORPH_END = 0.8;
// Below this progress the half-formed cells are not yet meant to be clicked.
const RESOLVE_AT = 0.85;

const clamp = (value: number, lo: number, hi: number): number =>
  Math.min(Math.max(value, lo), hi);

// Smooth (ease-in-out) ramp between two edges, for the showpiece's two-beat
// set-aside (a soft lift, then a slide off-stage) without piecewise CSS.
const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export function Stage() {
  // Default to plain so SSR and the first client render agree; the effect upgrades
  // to motion only where it is welcome.
  const [mode, setMode] = useState<Mode>("plain");

  useEffect(() => {
    const mql = window.matchMedia(MOTION_QUERY);
    const sync = () => setMode(mql.matches ? "motion" : "plain");
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  if (mode === "motion") {
    return <MotionStage />;
  }
  return <PlainStage />;
}

// The plain sectioned story: hero, then the 2x2 grid, composed straight from the
// verified deep modules (the grid on the same cool stage + accent tint as its own
// standalone preview). No morph, no set-aside.
function PlainStage() {
  return (
    <>
      <Hero />
      <ShowcaseRoot className={proofStyles.stage}>
        <div className={proofStyles.tint} />
        <ProofGrid />
      </ShowcaseRoot>
    </>
  );
}

interface MorphCell {
  readonly el: HTMLElement;
  readonly fx: number;
  readonly fy: number;
  readonly opacity: number;
  readonly scale: number;
  readonly z: number;
}

function MotionStage() {
  const { hero, showpiece } = content;

  const stageRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const showpieceRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const pin = pinRef.current;
    const grid = gridRef.current;
    const showpiecePlane = showpieceRef.current;
    if (!(stage && pin && grid)) {
      return;
    }

    const cells = Array.from(grid.querySelectorAll<HTMLElement>("[data-key]"));
    let morphCells: MorphCell[] = [];

    // FLIP measurement: read each cell's natural grid pose (Last), then derive the
    // translate + scale that places it at its contact-sheet pose (First). Cells are
    // reset to their natural transform first so the read is the true grid box.
    const measure = () => {
      const pinRect = pin.getBoundingClientRect();
      morphCells = cells.map((el) => {
        el.style.transformOrigin = "center";
        el.style.transform = "";
        const pose = CONTACT[el.dataset.key ?? ""] ?? DEFAULT_POSE;
        const rect = el.getBoundingClientRect();
        const lastCx = rect.left - pinRect.left + rect.width / 2;
        const lastCy = rect.top - pinRect.top + rect.height / 2;
        return {
          el,
          fx: pose.cx * pinRect.width - lastCx,
          fy: pose.cy * pinRect.height - lastCy,
          scale: pose.scale,
          opacity: pose.opacity,
          z: pose.z,
        };
      });
    };

    const apply = (progress: number) => {
      stage.style.setProperty("--p", progress.toFixed(4));
      const inv = 1 - progress;

      for (const cell of morphCells) {
        const tx = (cell.fx * inv).toFixed(2);
        const ty = (cell.fy * inv).toFixed(2);
        const sc = (1 + (cell.scale - 1) * inv).toFixed(4);
        cell.el.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${sc})`;
        cell.el.style.opacity = (1 + (cell.opacity - 1) * inv).toFixed(3);
        cell.el.style.zIndex = inv > 0.001 ? String(cell.z) : "";
        // The half-formed cells are not click targets until the grid resolves.
        cell.el.style.pointerEvents = progress > RESOLVE_AT ? "" : "none";
      }

      if (showpiecePlane) {
        // Two beats: a brief lift + brighten ("wait for me"), then a slide off the
        // left of the stage with a fade tail (it leaves by moving, never popping).
        const lift = smoothstep(0, 0.18, progress);
        const exit = smoothstep(0.2, 0.62, progress);
        const tx = -exit * window.innerWidth * 0.95;
        const ty = -lift * 16 - exit * 36;
        showpiecePlane.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
        showpiecePlane.style.opacity = (1 - exit).toFixed(3);
        showpiecePlane.style.filter = `brightness(${(1 + lift * 0.12 - exit * 0.12).toFixed(3)})`;
      }

      // A hook for video media to freeze to its poster during the settle, then
      // resume (today the media is a static logo, so this is already satisfied).
      stage.dataset.settling =
        progress > 0.001 && progress < 0.999 ? "true" : "false";
    };

    let lastProgress = -1;
    const compute = () => {
      const denom = stage.offsetHeight - window.innerHeight;
      const top = stage.getBoundingClientRect().top;
      const rawProgress = denom > 0 ? clamp(-top / denom, 0, 1) : 0;
      const progress = clamp(rawProgress / MORPH_END, 0, 1);
      if (progress === lastProgress) {
        return;
      }
      lastProgress = progress;
      apply(progress);
    };

    let raf = 0;
    const onScroll = () => {
      if (raf === 0) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          compute();
        });
      }
    };
    const remeasure = () => {
      measure();
      lastProgress = -1;
      compute();
    };

    measure();
    compute();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", remeasure);
    // The grid box can shift after web fonts swap in (caption metrics) or any
    // reflow; re-measure so the contact-sheet offsets stay true.
    const observer = new ResizeObserver(remeasure);
    observer.observe(grid);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", remeasure);
      observer.disconnect();
      if (raf !== 0) {
        cancelAnimationFrame(raf);
      }
      // Release the cells back to their natural grid state on unmount.
      for (const cell of morphCells) {
        cell.el.style.transform = "";
        cell.el.style.opacity = "";
        cell.el.style.zIndex = "";
        cell.el.style.pointerEvents = "";
        cell.el.style.transformOrigin = "";
      }
    };
  }, []);

  return (
    <ShowcaseRoot className={styles.root}>
      <div className={styles.stage} ref={stageRef}>
        <div className={styles.pin} ref={pinRef}>
          <div className={styles.tint} />

          <div className={styles.gridStage} ref={gridRef}>
            <ProofGrid />
          </div>

          {/* The showpiece plane: decorative atmosphere that sets itself aside, so
              it is inert (the real, interactive AnyPINN is the finale). */}
          <div
            className={styles.showpiecePlane}
            inert
            ref={showpieceRef}
            style={{ "--sx": "27%", "--sy": "36%" } as CSSProperties}
          >
            <GlassVessel depth={2} shape="rect" subject={showpiece} />
          </div>

          <div className={styles.atmosphere} />

          <div className={styles.heroCopy}>
            <p className="eyebrow">{hero.eyebrow}</p>
            <h1 aria-label={hero.thesis} className="thesis">
              {hero.thesisLines.map((line) => (
                <span className="thesis__line" key={line}>
                  {line}
                </span>
              ))}
            </h1>
            <p className="subline">{hero.subline}</p>
          </div>

          <p className={`scroll-baton ${styles.baton}`}>{hero.scrollBaton}</p>
        </div>
      </div>
    </ShowcaseRoot>
  );
}
