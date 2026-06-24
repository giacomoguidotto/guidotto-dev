/**
 * Contact submission — the deep module behind `POST /api/contact` (test seam #2).
 *
 * Everything the contact door needs to be a spam-safe owned email lives here:
 * schema validation, the honeypot trap, Turnstile verification, rate limiting,
 * and the send. None of it is constructed in-place — the four side-effecting
 * dependencies (send, verify, rate store, clock) arrive by injection, exactly
 * like the showpiece-asset loader takes its `fetch`. The production wiring in
 * `adapters.tsx` + `route.ts` is the only place that touches Resend, Cloudflare,
 * or `Date.now`; the seam-#2 tests replace all four with fakes and never send a
 * real email or read an env var.
 */

// === the injected seam =====================================================

/** A validated, honeypot-clear, human-verified message ready to deliver. */
export interface ContactMessage {
  readonly email: string;
  readonly message: string;
  readonly name: string;
}

/** Delivers the contact email. Production wraps Resend; tests record the calls. */
export type SendContactEmail = (message: ContactMessage) => Promise<void>;

/**
 * Verifies a Cloudflare Turnstile token for a client. Production calls
 * Cloudflare's siteverify; tests return a fixed answer.
 */
export type VerifyTurnstile = (
  token: string,
  remoteIp: string | null
) => Promise<boolean>;

/** Wall clock in epoch milliseconds. Production is `Date.now`; tests pin it. */
export type Clock = () => number;

/** A rolling submission counter keyed by client. Production is durable; tests in-memory. */
export interface RateLimitStore {
  /**
   * Atomically reserve a slot for `key` in the `windowMs` window ending at
   * `atMs`. Returns `true` and records the hit when the client is under `max`,
   * or `false` (recording nothing) once the cap is reached. One call — so a
   * burst of concurrent submissions can't all slip past a separate read/record.
   */
  consume(
    key: string,
    atMs: number,
    windowMs: number,
    max: number
  ): Promise<boolean>;
}

export interface ContactDeps {
  readonly now: Clock;
  readonly rateLimit: RateLimitStore;
  readonly sendEmail: SendContactEmail;
  readonly verifyTurnstile: VerifyTurnstile;
}

// === outcome ===============================================================

/**
 * What the HTTP edge turns into a response. `ok` is a 200; a failure carries the
 * status to return and a short, client-safe reason.
 */
export type ContactOutcome =
  | { readonly ok: true }
  | { readonly error: string; readonly ok: false; readonly status: number };

// === policy ================================================================

/** Rolling rate-limit window (one hour, in ms). */
export const RATE_WINDOW_MS = 3_600_000;
/** Max accepted submissions per client per window. */
export const RATE_MAX = 5;

const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS_INVALID = 400;
const STATUS_FORBIDDEN = 403;
const STATUS_RATE_LIMITED = 429;
const STATUS_SEND_FAILED = 502;

// === validation ============================================================

interface ParsedSubmission {
  readonly email: string;
  readonly honeypot: string;
  readonly message: string;
  readonly name: string;
  readonly token: string;
}

type ParseResult =
  | { readonly ok: true; readonly value: ParsedSubmission }
  | { readonly error: string; readonly ok: false };

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Narrow the untrusted JSON body into a {@link ParsedSubmission}, or fail with a
 * legible reason. The Turnstile token rides in `token`; the client maps the
 * widget's native `cf-turnstile-response` field into it before posting.
 */
function parseSubmission(input: unknown): ParseResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "expected a JSON object" };
  }
  const body = input as Record<string, unknown>;
  const name = readString(body.name).trim();
  const email = readString(body.email).trim();
  const message = readString(body.message).trim();
  const token = readString(body.token);
  const honeypot = readString(body.honeypot);

  if (name.length === 0 || name.length > MAX_NAME) {
    return { ok: false, error: "name is required" };
  }
  if (email.length > MAX_EMAIL || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "a valid email is required" };
  }
  if (message.length === 0 || message.length > MAX_MESSAGE) {
    return { ok: false, error: "message is required" };
  }
  return { ok: true, value: { email, honeypot, message, name, token } };
}

// === the handler ===========================================================

/**
 * Validate, screen, and (on success) send one contact submission.
 *
 * Order is deliberate: cheap local checks first, then the network proof, then
 * the rate gate, then the send. A honeypot hit returns a friendly `ok` with
 * nothing sent, so a bot never learns it was caught. The rate slot is reserved
 * before the send — atomically, and whether or not the send succeeds — so a
 * flapping provider can't invite an unbounded retry storm.
 */
export async function handleContactSubmission(
  input: unknown,
  context: { readonly remoteIp: string | null },
  deps: ContactDeps
): Promise<ContactOutcome> {
  const parsed = parseSubmission(input);
  if (!parsed.ok) {
    return { ok: false, status: STATUS_INVALID, error: parsed.error };
  }
  const { email, honeypot, message, name, token } = parsed.value;

  if (honeypot !== "") {
    return { ok: true };
  }

  const human = await deps.verifyTurnstile(token, context.remoteIp);
  if (!human) {
    return {
      ok: false,
      status: STATUS_FORBIDDEN,
      error: "verification failed",
    };
  }

  const key = context.remoteIp ?? email.toLowerCase();
  const allowed = await deps.rateLimit.consume(
    key,
    deps.now(),
    RATE_WINDOW_MS,
    RATE_MAX
  );
  if (!allowed) {
    return {
      ok: false,
      status: STATUS_RATE_LIMITED,
      error: "too many requests, try again later",
    };
  }

  try {
    await deps.sendEmail({ email, message, name });
  } catch {
    return {
      ok: false,
      status: STATUS_SEND_FAILED,
      error: "couldn't send right now",
    };
  }
  return { ok: true };
}
