"use client";

// Hud — the quiet mono readout over the instrument.
//
// It shows the solver settling: sigma / rho / beta as knobs that drift to their
// recovered values (NO ground-truth target is ever drawn — the trajectory is the
// payoff, the parameters are garnish) and the loss ticking down. Like the rest of
// the page's reactivity, the 60fps values never flow through React: an rAF loop
// reads the shared controller and writes straight to the DOM (textContent + a CSS
// custom property for each knob), so the HUD costs no re-renders.
//
// In the static / reduced-motion tier there is no animation loop: the converged
// snapshot's values are written once and held.

import { useEffect, useRef } from "react";
import type { Showpiece } from "~/showpiece/lorenz-forward";
import styles from "./attractor.module.css";
import { type FinaleController, snapshotIndex } from "./controller";

// Plausible display spans for each knob (NOT truth targets — just the dial
// range the settling dot travels within). Kept generous so the recovered values
// sit mid-dial rather than pinned to an edge.
const KNOB_RANGE = {
  sigma: [0, 20],
  rho: [0, 30],
  beta: [0, 10],
} as const;

interface KnobProps {
  readonly dotRef: React.RefObject<HTMLSpanElement | null>;
  readonly symbol: string;
  readonly valueRef: React.RefObject<HTMLSpanElement | null>;
}

function Knob({ symbol, dotRef, valueRef }: KnobProps) {
  return (
    <div className={styles.knob}>
      <span className={styles.knobSymbol}>{symbol}</span>
      <span className={styles.knobTrack}>
        <span className={styles.knobDot} ref={dotRef} />
      </span>
      <span className={styles.knobValue} ref={valueRef} />
    </div>
  );
}

/** Loss at a snapshot, falling back to the first measured epoch (epoch 0 is null). */
function lossAt(showpiece: Showpiece, index: number): number {
  for (let i = index; i < showpiece.snapshotCount; i++) {
    const loss = showpiece.loss(i);
    if (loss !== null) {
      return loss;
    }
  }
  return showpiece.loss(showpiece.snapshotCount - 1) ?? 0;
}

const norm = (value: number, [lo, hi]: readonly [number, number]): number =>
  Math.min(1, Math.max(0, (value - lo) / (hi - lo)));

interface HudProps {
  readonly controller: FinaleController;
  /** When false, the converged snapshot is written once and held (static tier). */
  readonly live: boolean;
  readonly lossLabel: string;
  readonly parametersLabel: string;
  readonly showpiece: Showpiece;
}

export function Hud({
  controller,
  live,
  parametersLabel,
  lossLabel,
  showpiece,
}: HudProps) {
  const sigmaDot = useRef<HTMLSpanElement>(null);
  const sigmaVal = useRef<HTMLSpanElement>(null);
  const rhoDot = useRef<HTMLSpanElement>(null);
  const rhoVal = useRef<HTMLSpanElement>(null);
  const betaDot = useRef<HTMLSpanElement>(null);
  const betaVal = useRef<HTMLSpanElement>(null);
  const lossVal = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const paint = (index: number) => {
      const { sigma, rho, beta } = showpiece.params(index);
      const set = (
        dot: HTMLSpanElement | null,
        val: HTMLSpanElement | null,
        value: number,
        range: readonly [number, number]
      ) => {
        if (dot) {
          dot.style.setProperty("--knob", `${norm(value, range) * 100}%`);
        }
        if (val) {
          val.textContent = value.toFixed(2);
        }
      };
      set(sigmaDot.current, sigmaVal.current, sigma, KNOB_RANGE.sigma);
      set(rhoDot.current, rhoVal.current, rho, KNOB_RANGE.rho);
      set(betaDot.current, betaVal.current, beta, KNOB_RANGE.beta);
      if (lossVal.current) {
        lossVal.current.textContent = lossAt(showpiece, index).toFixed(4);
      }
    };

    if (!live) {
      paint(showpiece.snapshotCount - 1);
      return;
    }

    let raf = 0;
    const tick = () => {
      paint(snapshotIndex(controller));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [controller, live, showpiece]);

  return (
    <div className={styles.hud}>
      <div className={styles.hudParams}>
        <span className={styles.hudLabel}>{parametersLabel}</span>
        <Knob dotRef={sigmaDot} symbol="σ" valueRef={sigmaVal} />
        <Knob dotRef={rhoDot} symbol="ρ" valueRef={rhoVal} />
        <Knob dotRef={betaDot} symbol="β" valueRef={betaVal} />
      </div>
      <div className={styles.hudLoss}>
        <span className={styles.hudLabel}>{lossLabel}</span>
        <span className={styles.lossValue} ref={lossVal} />
      </div>
    </div>
  );
}
