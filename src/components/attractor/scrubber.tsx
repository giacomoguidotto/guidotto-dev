"use client";

// Scrubber — the slim epoch control that doubles as the progress bar.
//
// It is the "epoch as a clean progress bar (no counter label)" and the "scrub
// through training" affordance in one element: its fill tracks the controller's
// progress (so during the once-on-view autoplay it fills itself), and dragging it
// (mouse, touch, or keyboard) scrubs training back and forth. Taking it over
// cancels the autoplay for good (the auto-play is a single on-view beat), but
// never locks scrolling.
//
// An rAF loop reflects the controller's progress into the fill width and the
// native input's value when the visitor is not actively dragging; while dragging,
// the input drives the controller. No per-frame React state.

import { useEffect, useRef } from "react";
import styles from "./attractor.module.css";
import type { FinaleController } from "./controller";

interface ScrubberProps {
  readonly controller: FinaleController;
  readonly label: string;
}

export function Scrubber({ controller, label }: ScrubberProps) {
  const input = useRef<HTMLInputElement>(null);
  const fill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const pct = `${controller.progress * 100}%`;
      if (fill.current) {
        fill.current.style.width = pct;
      }
      if (input.current && !controller.userScrubbing) {
        input.current.value = String(controller.progress);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [controller]);

  const onInput = (event: React.FormEvent<HTMLInputElement>) => {
    controller.userScrubbing = true;
    controller.autoplayActive = false;
    controller.progress = Number(event.currentTarget.value);
  };
  const release = () => {
    controller.userScrubbing = false;
  };

  return (
    <div className={styles.scrubber}>
      <span className={styles.scrubberTrack}>
        <span className={styles.scrubberFill} ref={fill} />
      </span>
      <input
        aria-label={label}
        className={styles.scrubberInput}
        defaultValue={0}
        max={1}
        min={0}
        onBlur={release}
        onInput={onInput}
        onPointerCancel={release}
        onPointerUp={release}
        ref={input}
        step={0.001}
        type="range"
      />
    </div>
  );
}
