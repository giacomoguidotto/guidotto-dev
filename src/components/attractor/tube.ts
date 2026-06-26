// tube — a parallel-ish-transport tube swept around a polyline centerline,
// written in place into a fixed-size position buffer every frame.
//
// Why not THREE.TubeGeometry: that rebuilds (and must dispose) a geometry per
// frame as the centerline morphs. Instead we own one BufferGeometry of a fixed
// vertex count and overwrite its positions each frame — zero per-frame
// allocation, zero disposal, and (unlike fat lines) it is a real triangle mesh,
// so three's depth fog dims the far lobe for free and bloom thickens it into a
// glowing strand. The material is unlit/additive, so we never need normals.
//
// The cross-section frame uses a fixed up vector with a fallback when the
// tangent runs parallel to it; a thin tube under bloom hides the slight twist
// that a non-transported frame can introduce, which keeps this allocation-free.

const UP_X = 0;
const UP_Y = 1;
const UP_Z = 0;
const FALLBACK_X = 1;
const FALLBACK_Y = 0;
const FALLBACK_Z = 0;
const PARALLEL_EPS = 0.92;

/** Triangle index for a `samples` x `radial` tube. Built once, reused forever. */
export function buildTubeIndex(samples: number, radial: number): Uint16Array {
  const index = new Uint16Array((samples - 1) * radial * 6);
  let o = 0;
  for (let i = 0; i < samples - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const jn = (j + 1) % radial;
      const a = i * radial + j;
      const b = i * radial + jn;
      const c = (i + 1) * radial + j;
      const d = (i + 1) * radial + jn;
      index[o++] = a;
      index[o++] = c;
      index[o++] = b;
      index[o++] = b;
      index[o++] = c;
      index[o++] = d;
    }
  }
  return index;
}

/** Linear blend of two same-length centerlines into `out` (the morph step). */
export function lerpCenterline(
  out: Float32Array,
  a: Float32Array,
  b: Float32Array,
  t: number
): void {
  for (let i = 0; i < out.length; i++) {
    out[i] = a[i] + (b[i] - a[i]) * t;
  }
}

/** Tangent at sample `i` (central difference, clamped at the ends), normalised. */
function tangentAt(
  line: Float32Array,
  i: number,
  samples: number,
  out: Float32Array
): void {
  const prev = Math.max(0, i - 1);
  const next = Math.min(samples - 1, i + 1);
  let tx = line[next * 3] - line[prev * 3];
  let ty = line[next * 3 + 1] - line[prev * 3 + 1];
  let tz = line[next * 3 + 2] - line[prev * 3 + 2];
  const len = Math.hypot(tx, ty, tz) || 1;
  tx /= len;
  ty /= len;
  tz /= len;
  out[0] = tx;
  out[1] = ty;
  out[2] = tz;
}

/** Sweep a `radius` tube of `radial` sides around `line` into `positions`. */
export function writeTube(
  positions: Float32Array,
  line: Float32Array,
  samples: number,
  radial: number,
  radius: number
): void {
  const tan = new Float32Array(3);
  for (let i = 0; i < samples; i++) {
    tangentAt(line, i, samples, tan);
    const [tx, ty, tz] = tan;

    // up x tangent -> normal; swap up if they are near-parallel.
    const parallel = Math.abs(tx * UP_X + ty * UP_Y + tz * UP_Z) > PARALLEL_EPS;
    const ux = parallel ? FALLBACK_X : UP_X;
    const uy = parallel ? FALLBACK_Y : UP_Y;
    const uz = parallel ? FALLBACK_Z : UP_Z;
    let nx = uy * tz - uz * ty;
    let ny = uz * tx - ux * tz;
    let nz = ux * ty - uy * tx;
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl;
    ny /= nl;
    nz /= nl;
    // binormal = tangent x normal (already unit, both orthonormal).
    const bx = ty * nz - tz * ny;
    const by = tz * nx - tx * nz;
    const bz = tx * ny - ty * nx;

    const cx = line[i * 3];
    const cy = line[i * 3 + 1];
    const cz = line[i * 3 + 2];
    for (let j = 0; j < radial; j++) {
      const theta = (j / radial) * Math.PI * 2;
      const co = Math.cos(theta) * radius;
      const si = Math.sin(theta) * radius;
      const v = (i * radial + j) * 3;
      positions[v] = cx + co * nx + si * bx;
      positions[v + 1] = cy + co * ny + si * by;
      positions[v + 2] = cz + co * nz + si * bz;
    }
  }
}
