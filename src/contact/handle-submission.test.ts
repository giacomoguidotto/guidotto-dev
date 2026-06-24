import { describe, expect, test } from "bun:test";
import {
  type ContactDeps,
  type ContactMessage,
  handleContactSubmission,
  RATE_MAX,
  type RateLimitStore,
  type VerifyTurnstile,
} from "./handle-submission";

// Seam #2: the contact handler runs entirely against fakes swapped in at the
// seam — a recording sender, a fixed Turnstile answer, an in-memory rolling
// rate store, and a frozen clock. No real email leaves and no env var is read.

const FIXED_NOW = 1_700_000_000_000;
const STATUS_INVALID = 400;
const STATUS_FORBIDDEN = 403;
const STATUS_RATE_LIMITED = 429;

const VALID = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "I'd love to talk about your physics library.",
  token: "turnstile-ok",
  honeypot: "",
};

const CTX = { remoteIp: "203.0.113.7" };

/** A sender that records every message instead of delivering it. */
function recordingSender() {
  const sent: ContactMessage[] = [];
  const send = (message: ContactMessage) => {
    sent.push(message);
    return Promise.resolve();
  };
  return { send, sent };
}

/** A hand-written in-memory rolling-window store (the seam's rate store). */
function inMemoryRateStore(): RateLimitStore {
  const hits = new Map<string, number[]>();
  return {
    count(key, sinceMs) {
      const live = (hits.get(key) ?? []).filter((at) => at >= sinceMs);
      hits.set(key, live);
      return Promise.resolve(live.length);
    },
    record(key, atMs) {
      const live = hits.get(key) ?? [];
      live.push(atMs);
      hits.set(key, live);
      return Promise.resolve();
    },
  };
}

const passTurnstile: VerifyTurnstile = () => Promise.resolve(true);
const failTurnstile: VerifyTurnstile = () => Promise.resolve(false);

/** Assemble a dependency set, overriding only what a test cares about. */
function makeDeps(overrides: Partial<ContactDeps> = {}) {
  const sender = recordingSender();
  const deps: ContactDeps = {
    now: () => FIXED_NOW,
    rateLimit: inMemoryRateStore(),
    sendEmail: sender.send,
    verifyTurnstile: passTurnstile,
    ...overrides,
  };
  return { deps, sent: sender.sent };
}

describe("handleContactSubmission (seam #2)", () => {
  test("a valid submission sends exactly once", async () => {
    const { deps, sent } = makeDeps();
    const outcome = await handleContactSubmission(VALID, CTX, deps);

    expect(outcome.ok).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toEqual({
      name: VALID.name,
      email: VALID.email,
      message: VALID.message,
    });
  });

  test("a honeypot hit is silently accepted and never sends", async () => {
    const { deps, sent } = makeDeps();
    const outcome = await handleContactSubmission(
      { ...VALID, honeypot: "i am a bot" },
      CTX,
      deps
    );

    expect(outcome.ok).toBe(true);
    expect(sent).toHaveLength(0);
  });

  test("a failing Turnstile token is rejected without sending", async () => {
    const { deps, sent } = makeDeps({ verifyTurnstile: failTurnstile });
    const outcome = await handleContactSubmission(VALID, CTX, deps);

    expect(outcome).toEqual({
      ok: false,
      status: STATUS_FORBIDDEN,
      error: "verification failed",
    });
    expect(sent).toHaveLength(0);
  });

  test("invalid input is a validation error without sending", async () => {
    const { deps, sent } = makeDeps();
    const outcome = await handleContactSubmission(
      { ...VALID, email: "not-an-email" },
      CTX,
      deps
    );

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.status).toBe(STATUS_INVALID);
    }
    expect(sent).toHaveLength(0);
  });

  test("a non-object body is a validation error", async () => {
    const { deps } = makeDeps();
    const outcome = await handleContactSubmission("nope", CTX, deps);

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.status).toBe(STATUS_INVALID);
    }
  });

  test("submissions past the window cap are rejected, earlier ones sent", async () => {
    const { deps, sent } = makeDeps();

    for (let i = 0; i < RATE_MAX; i++) {
      const accepted = await handleContactSubmission(VALID, CTX, deps);
      expect(accepted.ok).toBe(true);
    }
    const over = await handleContactSubmission(VALID, CTX, deps);

    expect(over).toEqual({
      ok: false,
      status: STATUS_RATE_LIMITED,
      error: "too many requests, try again later",
    });
    expect(sent).toHaveLength(RATE_MAX);
  });
});
