import { describe, expect, test } from "bun:test";
import { buildTubeIndex, lerpCenterline, writeTube } from "./tube";

// The tube's pure geometry: the triangle index, the morph blend, and the swept
// cross-section. These run every frame on a fixed buffer, so the invariants that
// matter are "right size, all in range, every ring point sits `radius` off the
// centerline" — independent of WebGL.

/** A straight centerline of `samples` points spaced 1 apart along an axis. */
function axisLine(samples: number, axis: 0 | 1 | 2): Float32Array {
  const line = new Float32Array(samples * 3);
  for (let i = 0; i < samples; i++) {
    line[i * 3 + axis] = i;
  }
  return line;
}

describe("buildTubeIndex", () => {
  test("emits two triangles per quad, all within the vertex range", () => {
    const samples = 5;
    const radial = 6;
    const index = buildTubeIndex(samples, radial);
    expect(index).toHaveLength((samples - 1) * radial * 6);
    const vertexCount = samples * radial;
    for (const i of index) {
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(vertexCount);
    }
  });
});

describe("lerpCenterline", () => {
  test("blends endpoints (t=0 -> a, t=1 -> b, t=0.5 -> midpoint)", () => {
    const a = new Float32Array([0, 0, 0, 2, 4, 6]);
    const b = new Float32Array([10, 10, 10, 4, 8, 12]);
    const out = new Float32Array(6);

    lerpCenterline(out, a, b, 0);
    expect([...out]).toEqual([...a]);

    lerpCenterline(out, a, b, 1);
    expect([...out]).toEqual([...b]);

    lerpCenterline(out, a, b, 0.5);
    expect([...out]).toEqual([5, 5, 5, 3, 6, 9]);
  });
});

describe("writeTube", () => {
  const radial = 8;
  const radius = 0.5;

  test("fills the whole position buffer with finite values", () => {
    const samples = 12;
    const positions = new Float32Array(samples * radial * 3);
    writeTube(positions, axisLine(samples, 0), samples, radial, radius);
    expect(positions.every(Number.isFinite)).toBe(true);
  });

  for (const [name, axis] of [
    ["off-axis tangent", 0],
    ["up-parallel tangent (fallback frame)", 1],
  ] as const) {
    test(`every ring vertex sits exactly radius off the centerline (${name})`, () => {
      const samples = 16;
      const line = axisLine(samples, axis);
      const positions = new Float32Array(samples * radial * 3);
      writeTube(positions, line, samples, radial, radius);

      for (let i = 0; i < samples; i++) {
        const cx = line[i * 3];
        const cy = line[i * 3 + 1];
        const cz = line[i * 3 + 2];
        for (let j = 0; j < radial; j++) {
          const v = (i * radial + j) * 3;
          const d = Math.hypot(
            positions[v] - cx,
            positions[v + 1] - cy,
            positions[v + 2] - cz
          );
          expect(d).toBeCloseTo(radius, 5);
        }
      }
    });
  }
});
