// finale-data — the bridge from the framework-free `lorenz-forward` core to the
// R3F scene. It loads the packed showpiece asset once, then precomputes every
// snapshot's trajectory into scene-space centerlines the renderer morphs between.
//
// Two concerns live here, both pure of React/WebGL:
//   - axis mapping + centering: the forward core returns physical Lorenz
//     coordinates (x, y, z with z ~ [9, 42]); the scene wants the iconic
//     butterfly face-on (x horizontal, z vertical, y depth) recentred on the
//     origin so it orbits cleanly. We map (x, y, z) -> (x - cx, z - cz, y - cy).
//   - cost amortisation: forwarding all 37 snapshots x SAMPLES points x 3 MLPs is
//     ~0.5s of compute. We do it in chunks that yield to the event loop, so the
//     main thread never blocks long enough to drop the page (the scene mounts
//     only once this resolves, behind a quiet loading state).
//
// It hands back the live `Showpiece` (so the HUD can read params/loss per
// snapshot) plus the precomputed Float32 centerlines and the observation motes.

import {
  type LoadShowpieceAssetOptions,
  loadShowpieceAsset,
} from "~/showpiece/asset";
import type { Showpiece } from "~/showpiece/lorenz-forward";

/** Centerline samples per snapshot. Enough for a smooth tube, cheap to morph. */
export const TUBE_SAMPLES = 180;

/** Snapshots forwarded per yield, so the precompute never blocks too long. */
const CHUNK = 3;

/** Recentred bounds midpoint of one axis (cx, cy, cz from the final snapshot). */
interface Center {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface FinaleData {
  /** One Float32Array[TUBE_SAMPLES * 3] of scene-space centerline points per
   *  snapshot, in epoch order. The renderer lerps between adjacent entries. */
  readonly centerlines: readonly Float32Array[];
  readonly moteCount: number;
  /** Scene-space observation motes [count * 3] (the noisy data the net fit). */
  readonly motes: Float32Array;
  readonly showpiece: Showpiece;
  readonly snapshotCount: number;
}

/** Midpoint of the final trajectory's bounding box, per axis. */
function centerOf(showpiece: Showpiece): Center {
  const final = showpiece.trajectory(showpiece.snapshotCount - 1, TUBE_SAMPLES);
  const mid = (values: Float64Array): number => {
    let lo = Number.POSITIVE_INFINITY;
    let hi = Number.NEGATIVE_INFINITY;
    for (const v of values) {
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    return (lo + hi) / 2;
  };
  return { x: mid(final.x), y: mid(final.y), z: mid(final.z) };
}

/** Map physical (x, y, z) -> scene (x, z, y), recentred on the origin. */
function toScene(
  out: Float32Array,
  i: number,
  x: number,
  y: number,
  z: number,
  c: Center
): void {
  out[i * 3] = x - c.x;
  out[i * 3 + 1] = z - c.z;
  out[i * 3 + 2] = y - c.y;
}

const yieldToEventLoop = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Load + precompute the finale's render data, yielding between snapshot chunks.
 *
 * `options` is forwarded to {@link loadShowpieceAsset} (tests inject a `fetch`).
 */
export async function loadFinaleData(
  options: LoadShowpieceAssetOptions = {}
): Promise<FinaleData> {
  const { showpiece } = await loadShowpieceAsset(options);
  const { snapshotCount } = showpiece;
  const center = centerOf(showpiece);

  const centerlines: Float32Array[] = [];
  for (let s = 0; s < snapshotCount; s++) {
    const trajectory = showpiece.trajectory(s, TUBE_SAMPLES);
    const line = new Float32Array(TUBE_SAMPLES * 3);
    for (let k = 0; k < TUBE_SAMPLES; k++) {
      toScene(
        line,
        k,
        trajectory.x[k],
        trajectory.y[k],
        trajectory.z[k],
        center
      );
    }
    centerlines.push(line);
    if (s % CHUNK === CHUNK - 1) {
      await yieldToEventLoop();
    }
  }

  const observations = showpiece.observations;
  const moteCount = observations.count;
  const motes = new Float32Array(moteCount * 3);
  for (let k = 0; k < moteCount; k++) {
    toScene(
      motes,
      k,
      observations.x[k],
      observations.y[k],
      observations.z[k],
      center
    );
  }

  return { centerlines, motes, moteCount, showpiece, snapshotCount };
}
