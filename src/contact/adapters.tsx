/**
 * Production adapters for the contact seam — the real Resend / Turnstile /
 * rate-limit / clock implementations that `route.ts` injects into the deep
 * handler. They live apart from `handle-submission.ts` so the handler stays free
 * of env vars and the network, and so seam-#2 tests can replace every one of
 * them with a fake. This file is the single place env vars are read.
 */

import { Resend } from "resend";
import { ContactEmail } from "./contact-email";
import type {
  ContactDeps,
  RateLimitStore,
  SendContactEmail,
  VerifyTurnstile,
} from "./handle-submission";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_TIMEOUT_MS = 5000;

const CONTACT_TO = process.env.CONTACT_TO_EMAIL ?? "hello@guidotto.dev";
const CONTACT_FROM =
  process.env.CONTACT_FROM_EMAIL ?? "guidotto.dev <contact@guidotto.dev>";

/** Real send: Resend renders the React Email template and delivers it. */
export function createResendSender(apiKey: string): SendContactEmail {
  const resend = new Resend(apiKey);
  return async (message) => {
    const { error } = await resend.emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      replyTo: message.email,
      subject: `New message from ${message.name}`,
      react: (
        <ContactEmail
          email={message.email}
          message={message.message}
          name={message.name}
        />
      ),
    });
    if (error) {
      throw new Error(`resend failed: ${error.message}`);
    }
  };
}

interface SiteVerifyResponse {
  readonly success?: boolean;
}

/**
 * Real verify: Cloudflare Turnstile siteverify. An empty token never reaches it.
 * Fails closed: a non-2xx, a malformed body, a timeout, or any network error all
 * resolve to `false` rather than throwing, so a Cloudflare hiccup rejects the
 * submission instead of leaking a framework 500.
 */
export function createTurnstileVerifier(secret: string): VerifyTurnstile {
  return async (token, remoteIp) => {
    if (token === "") {
      return false;
    }
    const form = new FormData();
    form.set("secret", secret);
    form.set("response", token);
    if (remoteIp) {
      form.set("remoteip", remoteIp);
    }
    try {
      const response = await fetch(TURNSTILE_VERIFY_URL, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(TURNSTILE_TIMEOUT_MS),
      });
      if (!response.ok) {
        return false;
      }
      const result = (await response.json()) as SiteVerifyResponse;
      return result.success === true;
    } catch {
      return false;
    }
  };
}

/**
 * A process-local rate-limit store. Adequate for a single warm serverless
 * instance at low volume; swap for a durable store (e.g. Upstash) when the door
 * gets loud. Turnstile + honeypot carry the real anti-spam weight.
 *
 * `consume` does its read-modify-write synchronously, so on a single event loop
 * the reserve-and-record is atomic — no gap a concurrent request can race into.
 */
export function createInMemoryRateLimitStore(): RateLimitStore {
  const hits = new Map<string, number[]>();
  return {
    consume(key, atMs, windowMs, max) {
      const live = (hits.get(key) ?? []).filter((at) => at > atMs - windowMs);
      if (live.length >= max) {
        hits.set(key, live);
        return Promise.resolve(false);
      }
      live.push(atMs);
      hits.set(key, live);
      return Promise.resolve(true);
    },
  };
}

// One store per warm instance, shared across requests.
const sharedRateLimitStore = createInMemoryRateLimitStore();

// Fail closed when a key is missing: the door rejects rather than leaking or
// spamming. Provisioning RESEND_API_KEY / TURNSTILE_SECRET_KEY lights it up.
const denyAll: VerifyTurnstile = () => Promise.resolve(false);
const missingKeySender: SendContactEmail = () => {
  throw new Error("RESEND_API_KEY is not configured");
};

/** The real dependency set for the live route, assembled from the environment. */
export function defaultContactDeps(): ContactDeps {
  const resendKey = process.env.RESEND_API_KEY;
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;

  return {
    now: Date.now,
    rateLimit: sharedRateLimitStore,
    sendEmail: resendKey ? createResendSender(resendKey) : missingKeySender,
    verifyTurnstile: turnstileSecret
      ? createTurnstileVerifier(turnstileSecret)
      : denyAll,
  };
}
