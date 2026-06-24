/**
 * showpiece-asset codec — the ingest/transport packing for the Lorenz weights.
 *
 * The raw export is ~14.8 MB of float32. This codec reduces it for the
 * committed deploy asset and reverses the reduction at runtime:
 *
 *   pack:   float32 -> round to float16 (half size) -> gzip
 *   unpack: gunzip -> widen float16 -> float32 ArrayBuffer
 *
 * The widened float32 buffer is exactly what `lorenz-forward` consumes, so its
 * manifest `byteOffset`s stay float32 offsets regardless of how the bytes were
 * shipped. float16 (~3 decimal digits) is lossy, but the showpiece's claim is
 * the butterfly forming (both lobes, no divergence), not parameter precision —
 * the pack script's verification gate proves the packed trajectory still holds.
 *
 * Isomorphic: uses Web Streams (`CompressionStream` / `DecompressionStream`) and
 * `Float16Array`, so the same decode runs in the browser and under `bun test`.
 */

/** On-disk description of a packed weights buffer (committed in the manifest). */
export interface WeightsEncoding {
  /** Byte order of the float16 words. All deploy/CI targets are little-endian. */
  readonly byteOrder: "little";
  readonly compression: "gzip";
  /** Quantisation applied to each float32 before compression. */
  readonly dtype: "float16";
  /** Number of float32 elements after dequantisation (whole weights buffer). */
  readonly floatCount: number;
}

export const WEIGHTS_ENCODING = {
  dtype: "float16",
  byteOrder: "little",
  compression: "gzip",
} as const satisfies Omit<WeightsEncoding, "floatCount">;

function assertLittleEndian(): void {
  const probe = new Uint16Array([1]);
  const littleEndian = new Uint8Array(probe.buffer)[0] === 1;
  if (!littleEndian) {
    throw new Error(
      "showpiece codec requires a little-endian host (manifest byteOrder is 'little')"
    );
  }
}

function streamOf(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

// lib.dom types `CompressionStream` with a `BufferSource` writable side, which
// trips `pipeThrough`'s invariant chunk check against a `Uint8Array` source.
// The runtime contract (byte stream in, byte stream out) is sound; narrow it.
type ByteTransform = ReadableWritablePair<Uint8Array, Uint8Array>;

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  const transform = new CompressionStream("gzip") as unknown as ByteTransform;
  const compressed = streamOf(bytes).pipeThrough(transform);
  return new Uint8Array(await new Response(compressed).arrayBuffer());
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const transform = new DecompressionStream("gzip") as unknown as ByteTransform;
  const inflated = streamOf(bytes).pipeThrough(transform);
  return new Uint8Array(await new Response(inflated).arrayBuffer());
}

/** Pack a float32 weights buffer into the committed `dtype=float16 + gzip` form. */
export async function encodeWeights(weights: Float32Array): Promise<{
  readonly bytes: Uint8Array;
  readonly encoding: WeightsEncoding;
}> {
  assertLittleEndian();
  const half = new Float16Array(weights);
  const halfBytes = new Uint8Array(
    half.buffer,
    half.byteOffset,
    half.byteLength
  );
  const bytes = await gzip(halfBytes);
  return {
    bytes,
    encoding: { ...WEIGHTS_ENCODING, floatCount: weights.length },
  };
}

/**
 * Reverse {@link encodeWeights}: gunzip and widen back to a float32 ArrayBuffer
 * laid out exactly as `lorenz-forward` expects.
 */
export async function decodeWeights(
  packed: Uint8Array | ArrayBuffer,
  encoding: WeightsEncoding
): Promise<ArrayBuffer> {
  assertLittleEndian();
  if (encoding.dtype !== "float16" || encoding.compression !== "gzip") {
    throw new Error(
      `unsupported weights encoding: ${encoding.dtype}/${encoding.compression}`
    );
  }

  const gzBytes =
    packed instanceof ArrayBuffer ? new Uint8Array(packed) : packed;
  const halfBytes = await gunzip(gzBytes);
  // gunzip returns a fresh, byte-offset-0 Uint8Array, so reinterpreting as
  // Float16Array is aligned. Length is validated against the declared count.
  if (
    halfBytes.byteLength !==
    encoding.floatCount * Float16Array.BYTES_PER_ELEMENT
  ) {
    throw new Error(
      `decoded ${halfBytes.byteLength} bytes, expected ${encoding.floatCount * 2} for ${encoding.floatCount} float16 words`
    );
  }
  const half = new Float16Array(halfBytes.buffer, 0, encoding.floatCount);
  return new Float32Array(half).buffer;
}
