"use client";

// LiveInstrument — the client orchestrator for the finale's instrument area.
//
// It owns the degradation ladder and the lazy-load discipline:
//   - it detects capability (prefers-reduced-motion, WebGL support) up front;
//   - it loads the showpiece asset + precomputes the trajectories only once the
//     finale scrolls into view (an IntersectionObserver gates `loadFinaleData`),
//     so neither the 6.8 MB asset nor — via the ssr:false dynamic import below —
//     three.js ever enters the initial HTML / critical JS budget;
//   - it picks the tier: full spectacle (R3F scene) for a capable, motion-welcome
//     visitor; a static converged butterfly otherwise; and it drops to the static
//     tier if the live scene throws (the SceneBoundary).
//
// The HUD and scrubber render as DOM overlays beside the canvas, sharing the one
// mutable controller with the scene (see controller.ts).

import dynamic from "next/dynamic";
import {
  Component,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { content } from "~/content";
import styles from "./attractor.module.css";
import { createController, type FinaleController } from "./controller";
import { type FinaleData, loadFinaleData } from "./finale-data";
import { Hud } from "./hud";
import { Scrubber } from "./scrubber";
import { StaticButterfly } from "./static-butterfly";

// The single WebGL spend, code-split behind a dynamic import so three.js loads
// only when this component actually renders the scene (capable + in view).
const AttractorScene = dynamic(() => import("./attractor-scene"), {
  ssr: false,
  loading: () => null,
});

type Mode = "full" | "static";
type Status = "idle" | "loading" | "ready" | "failed";

const copy = content.showpiece;

function webglAvailable(): boolean {
  try {
    const probe = document.createElement("canvas");
    return Boolean(probe.getContext("webgl2") || probe.getContext("webgl"));
  } catch {
    return false;
  }
}

interface BoundaryProps {
  readonly children: ReactNode;
  readonly onError: () => void;
}

/** Drop the live scene to the static tier if WebGL throws at runtime. */
class SceneBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Settle a controller onto the converged snapshot (the static / failed tier). */
function freezeConverged(controller: FinaleController): void {
  controller.progress = 1;
  controller.reveal = 1;
  controller.autoplayActive = false;
}

export function LiveInstrument() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<FinaleData | null>(null);
  const controllerRef = useRef<FinaleController | null>(null);
  const started = useRef(false);
  const [status, setStatus] = useState<Status>("idle");
  const [mode, setMode] = useState<Mode>("full");

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const initialMode: Mode = reduced || !webglAvailable() ? "static" : "full";
    setMode(initialMode);

    const begin = () => {
      if (started.current) {
        return;
      }
      started.current = true;
      setStatus("loading");
      loadFinaleData()
        .then((data) => {
          const controller = createController(data.snapshotCount);
          if (initialMode === "static") {
            freezeConverged(controller);
          }
          dataRef.current = data;
          controllerRef.current = controller;
          setStatus("ready");
        })
        .catch(() => setStatus("failed"));
    };

    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      begin();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          begin();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const failToStatic = useCallback(() => {
    if (controllerRef.current) {
      freezeConverged(controllerRef.current);
    }
    setMode("static");
  }, []);

  const data = dataRef.current;
  const controller = controllerRef.current;
  const ready = status === "ready" && data && controller;

  return (
    <div className={styles.live} ref={rootRef}>
      {status === "loading" && (
        <div aria-hidden="true" className={styles.loading} />
      )}
      {ready && (
        <>
          <div className={styles.canvas}>
            {mode === "full" ? (
              <SceneBoundary onError={failToStatic}>
                <AttractorScene
                  accent={copy.accent}
                  controller={controller}
                  data={data}
                />
              </SceneBoundary>
            ) : (
              <StaticButterfly accent={copy.accent} data={data} />
            )}
          </div>
          <div className={styles.console}>
            <Hud
              controller={controller}
              live={mode === "full"}
              lossLabel={copy.hud.loss}
              parametersLabel={copy.hud.parameters}
              showpiece={data.showpiece}
            />
            {mode === "full" && (
              <>
                <p className={styles.interaction}>{copy.interaction}</p>
                <Scrubber controller={controller} label={copy.interaction} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
