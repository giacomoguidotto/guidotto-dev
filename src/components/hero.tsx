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
// Each vessel links to its project's public repo (the always-on proof, the same
// cross-origin destination the proof cards use) and stays keyboard-operable.
// Real per-project recordings replace the motif media as they land; the
// composition is designed to read as intentional with a partial set. The
// contact CTA lives in the lower-page contact slice, never the hero.
//
// Portrait (touch) reframing: the landscape contact sheet does not survive a
// narrow portrait viewport, and its whole reactivity is hover/pointer-driven,
// so a tap can only navigate away. On mobile we therefore (1) place each plane
// from CSS custom properties so the stylesheet can re-author portrait geometry,
// (2) show three larger vessels framing the thesis and hide the two deepest,
// and (3) run an ambient accent cycle so the earned-color mechanic still
// breathes one lead at a time without a pointer. The cycle is touch-only and
// freezes under reduced motion (see VitrineStage).

import { type CSSProperties, useEffect, useState } from "react";
import {
  GlassVessel,
  type PlaneSubject,
} from "~/components/showcase/glass-vessel";
import { ShowcaseRoot, useAccent } from "~/components/showcase/showcase-root";
import { content, type Project } from "~/content";

/** Absolute placement inside the field (landscape or portrait). */
interface Placement {
  h: string;
  w: string;
  x: string;
  y: string;
}

interface Plane extends Placement {
  depth: 1 | 2 | 3;
  /** Portrait placement; absent means the plane is hidden on mobile. */
  mobile?: Placement;
  /** Subject carries a repo URL, so the plane can link to the work. */
  subject: PlaneSubject & { repoUrl: string };
}

const { showpiece, projects, hero } = content;

const project = (key: string): Project => {
  const found = projects.find((p) => p.key === key);
  if (!found) {
    throw new Error(`Unknown project: ${key}`);
  }
  return found;
};

// Cases hug the edges and leave a central band clear for the thesis. The three
// planes with a `mobile` placement (the showpiece plus one warm and one cool
// project, for accent variety) reframe to flank the thesis on portrait; the two
// without it drop out so the small composition stays legible.
const PLANES: Plane[] = [
  {
    subject: showpiece,
    depth: 2,
    x: "4%",
    y: "13%",
    w: "23vw",
    h: "34vh",
    mobile: { x: "27%", y: "4%", w: "46vw", h: "20vh" },
  },
  {
    subject: project("orray"),
    depth: 1,
    x: "6%",
    y: "55%",
    w: "21vw",
    h: "31vh",
  },
  {
    subject: project("scry"),
    depth: 2,
    x: "73%",
    y: "9%",
    w: "23vw",
    h: "30vh",
    mobile: { x: "53%", y: "71%", w: "43vw", h: "21vh" },
  },
  {
    subject: project("tempo"),
    depth: 3,
    x: "75%",
    y: "51%",
    w: "21vw",
    h: "33vh",
    mobile: { x: "4%", y: "66%", w: "45vw", h: "22vh" },
  },
  {
    subject: project("ginevra"),
    depth: 3,
    x: "40%",
    y: "5%",
    w: "22vw",
    h: "19vh",
  },
];

/** Planes that appear on portrait, in cycle order. */
const MOBILE_PLANES = PLANES.filter((plane) => plane.mobile);

const CYCLE_MS = 2600;

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

// VitrineStage renders the tint + vessels and owns the portrait ambient cycle.
// It lives inside ShowcaseRoot so it can write `--live-accent` through the same
// earned-color channel hover uses on desktop. On a coarse pointer (and only
// when motion is allowed) it walks the mobile planes one at a time, marking each
// active (its glass blooms, the field tint rises) and pushing its accent to the
// root. On a fine pointer the effect bails immediately, so desktop hover is
// untouched and there is no idle re-render.
function VitrineStage() {
  const accent = useAccent();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!(coarse && MOBILE_PLANES.length > 0) || reduce) {
      return;
    }
    let i = 0;
    const step = () => {
      const plane = MOBILE_PLANES[i % MOBILE_PLANES.length];
      setActiveKey(plane.subject.key);
      accent.set(plane.subject.accent);
      i += 1;
    };
    step();
    const id = window.setInterval(step, CYCLE_MS);
    return () => {
      window.clearInterval(id);
      accent.clear();
      setActiveKey(null);
    };
  }, [accent]);

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
                "--h": plane.h,
                ...(plane.mobile && {
                  "--mob-x": plane.mobile.x,
                  "--mob-y": plane.mobile.y,
                  "--mob-w": plane.mobile.w,
                  "--mob-h": plane.mobile.h,
                }),
              } as CSSProperties
            }
          >
            <GlassVessel
              active={plane.subject.key === activeKey}
              depth={plane.depth}
              href={plane.subject.repoUrl}
              shape="rect"
              subject={plane.subject}
            />
          </span>
        ))}
      </div>
    </>
  );
}
