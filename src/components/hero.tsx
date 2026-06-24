"use client";

// Hero — the "Vitrine" (the converged design language, folded in from the
// throwaway prototype). The work sits under glass like a museum vitrine /
// contact sheet; a horizontally-centered Fraunces thesis floats over it. The
// cool near-black-blue field earns the focused project's accent through
// attention. The thesis is the LCP (server-rendered text); the reactivity is a
// second-6 retention reward, not a first-5-seconds device.
//
// The contact sheet carries all five planes including the AnyPINN showpiece
// plane (it does not join the later 2x2 grid, but it is present in the hero).
// The vessels are a calm display case, not links: a vessel only earns color,
// and the browsable links to the work live in the proof grid below. Real
// per-project recordings replace the motif media as they land; the composition
// is designed to read as intentional with a partial set (a missing/renamed
// content key simply drops that plane, never white-screens the route).
//
// Lighting follows the pointer, coordinated by VitrineStage (one vessel lit at a
// time, one `--live-accent` write). On a fine pointer the vessels glow on hover;
// on a coarse (touch) pointer there is no hover, so a tap lights one vessel at a
// time and keeps it lit (re-tapping replays its spring; a tap outside dismisses)
// while the rest stay hidden behind their depth blur. Portrait also re-authors
// the geometry: each plane is placed from CSS custom properties so the
// stylesheet can flank the thesis with three larger tiles and hide the two
// deepest (see globals.css).

import { type CSSProperties, useCallback, useEffect, useState } from "react";
import {
  GlassVessel,
  type PlaneSubject,
} from "~/components/showcase/glass-vessel";
import { ShowcaseRoot, useAccent } from "~/components/showcase/showcase-root";
import { content } from "~/content";

/** Position + width inside the field. The height is not given: it comes from
 *  `ar` (CSS aspect-ratio), so a vessel keeps its shape on resize instead of
 *  stretching as independent vw width / vh height. */
interface Placement {
  w: string;
  x: string;
  y: string;
}

/** A placement plus its aspect ratio, depth, and the content key that fills it. */
interface PlaneSpec extends Placement {
  /** Width-to-height ratio (CSS aspect-ratio), shared by both layouts. */
  ar: string;
  depth: 1 | 2 | 3;
  /** The content key (a project or the showpiece) that fills this plane. */
  key: string;
  /** Portrait placement (position + width); absent means hidden on mobile. */
  mobile?: Placement;
}

interface Plane extends Omit<PlaneSpec, "key"> {
  subject: PlaneSubject;
}

const { showpiece, projects, hero } = content;

// Resolve a plane's content by key. Returns undefined for an unknown key so a
// renamed/removed subject drops just its plane instead of throwing at module
// load and white-screening the whole route (the vitrine is designed to read
// with a partial set).
const subjectFor = (key: string): PlaneSubject | undefined =>
  key === showpiece.key ? showpiece : projects.find((p) => p.key === key);

// Two flanking clusters that leave a central band clear for the thesis, pulled
// in from the far edges so the contact sheet reads as one grouped composition
// rather than scattered corners. Each vessel is sized by width + `ar`, so it
// holds its shape on resize. The three planes with a `mobile` placement (the
// showpiece plus one warm and one cool project, for accent variety) reframe to
// flank the thesis on portrait; the two without it drop out so the small
// composition stays legible.
const PLANE_SPECS: PlaneSpec[] = [
  {
    key: showpiece.key,
    depth: 2,
    x: "10%",
    y: "15%",
    w: "21vw",
    ar: "1.08",
    mobile: { x: "27%", y: "4%", w: "46vw" },
  },
  { key: "orray", depth: 1, x: "12%", y: "53%", w: "19vw", ar: "1.08" },
  {
    key: "scry",
    depth: 2,
    x: "67%",
    y: "11%",
    w: "21vw",
    ar: "1.24",
    mobile: { x: "53%", y: "71%", w: "43vw" },
  },
  {
    key: "tempo",
    depth: 3,
    x: "69%",
    y: "50%",
    w: "19vw",
    ar: "1.02",
    mobile: { x: "4%", y: "66%", w: "45vw" },
  },
  { key: "ginevra", depth: 3, x: "42%", y: "6%", w: "18vw", ar: "1.85" },
];

const PLANES: Plane[] = PLANE_SPECS.flatMap(({ key, ...rest }) => {
  const subject = subjectFor(key);
  return subject ? [{ ...rest, subject }] : [];
});

export function Hero() {
  return (
    <ShowcaseRoot className="field vitrine">
      <VitrineStage />

      <div className="vignette" />

      <div className="vitrine__copy">
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

      <p className="scroll-baton">{hero.scrollBaton}</p>
    </ShowcaseRoot>
  );
}

// VitrineStage renders the tint + vessels and is the single coordinator for the
// earned color: it owns `activeKey` (which one vessel is lit) and is the only
// place that writes `--live-accent`, so hover and tap share one source of truth
// and exactly one accent is ever live. It lives inside ShowcaseRoot to reach the
// accent channel. On a fine pointer hover/focus set the lit key transiently; on
// a coarse pointer a tap lights a vessel and keeps it lit (re-tapping the same
// one just replays its spring, never dims it), and a tap anywhere outside the
// vessels dismisses.
function VitrineStage() {
  const accent = useAccent();
  const [coarse, setCoarse] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Track the primary pointer live, so a hybrid device (iPad + trackpad,
  // Surface) that switches input mode flips between hover and tap.
  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarse(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  // The single accent write: derive `--live-accent` from the lit key, set on
  // activation and cleared on change / unmount. Keeping this in an effect (not
  // inside the state updaters) leaves those updaters pure, so React can safely
  // replay them under StrictMode / concurrency.
  useEffect(() => {
    if (!activeKey) {
      return;
    }
    const lit = PLANES.find((plane) => plane.subject.key === activeKey);
    if (!lit) {
      return;
    }
    accent.set(lit.subject.accent);
    return () => accent.clear();
  }, [activeKey, accent]);

  // Touch dismissal: with no hover there is no "leave", so a tap that lands
  // outside every vessel releases the lit one (a tap on a vessel is handled by
  // its own click, and never reaches here as an outside tap).
  useEffect(() => {
    if (!(coarse && activeKey)) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(".vessel")) {
        setActiveKey(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [coarse, activeKey]);

  const activate = useCallback((key: string) => setActiveKey(key), []);
  const release = useCallback(() => setActiveKey(null), []);

  return (
    <>
      <div className="field__tint" />

      <div className="field__vessels">
        {PLANES.map((plane) => (
          <span
            className="case"
            data-mobile-hidden={plane.mobile ? undefined : true}
            key={plane.subject.key}
            style={
              {
                "--x": plane.x,
                "--y": plane.y,
                "--w": plane.w,
                "--ar": plane.ar,
                ...(plane.mobile && {
                  "--mob-x": plane.mobile.x,
                  "--mob-y": plane.mobile.y,
                  "--mob-w": plane.mobile.w,
                }),
              } as CSSProperties
            }
          >
            <GlassVessel
              active={coarse && plane.subject.key === activeKey}
              depth={plane.depth}
              interaction={coarse ? "tap" : "hover"}
              onActivate={activate}
              onDeactivate={release}
              shape="rect"
              subject={plane.subject}
            />
          </span>
        ))}
      </div>
    </>
  );
}
