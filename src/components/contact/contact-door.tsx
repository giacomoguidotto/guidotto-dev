"use client";

// ContactDoor — the one loud owned door of the CTA close (#7) plus the quiet
// rail beneath it. The reactivity law: one loud door, a quiet rail of
// alternatives, never an equal-weight menu.
//
// Static-first: the door is a native <details>/<summary>, so "Get in touch"
// expands the form frame in place with no JS at all, never a modal or a nav. The
// JS here is pure enhancement — it moves focus to the first field on open, and
// (when scripting is on) posts the form to /api/contact and resolves to the warm
// confirmation in place, so the handshake never dead-ends on a JSON page. The
// FLIP-style reveal (transform + opacity) lives in the stylesheet and collapses
// to an instant show under prefers-reduced-motion.
//
// Anti-spam is load-bearing and split across the seam: a honeypot field and the
// Cloudflare Turnstile token ride along in the body; the actual verification,
// rate limiting, and send all happen in the deep handler behind /api/contact.
// No raw mailto — the form IS the spam-safe email.

import Script from "next/script";
import {
  type FormEvent,
  type ReactNode,
  type SyntheticEvent,
  useRef,
  useState,
} from "react";
import { content } from "~/content";
import styles from "./contact-door.module.css";
import { GitHubMark, LinkedInMark, XMark } from "./social-icons";

const { cta } = content;

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const TURNSTILE_SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";

type Status = "idle" | "sending" | "sent" | "error";

type Mark = (props: { readonly className?: string }) => ReactNode;

const RAIL_ICONS: Record<string, Mark> = {
  GitHub: GitHubMark,
  LinkedIn: LinkedInMark,
  X: XMark,
};

function QuietRail() {
  return (
    <nav aria-label="Other ways to reach me" className={styles.rail}>
      {cta.rail.map((link) => {
        const Icon = RAIL_ICONS[link.label];
        if (link.href) {
          return (
            <a
              aria-label={link.label}
              className={styles.railLink}
              href={link.href}
              key={link.label}
              rel="me noreferrer"
              target="_blank"
            >
              <Icon className={styles.railIcon} />
            </a>
          );
        }
        // Dark until a handle is sourced (X): present for visual completeness
        // but inert, so it is hidden from assistive tech (nothing to action).
        return (
          <span
            aria-hidden="true"
            className={`${styles.railLink} ${styles.railLinkDark}`}
            key={link.label}
          >
            <Icon className={styles.railIcon} />
          </span>
        );
      })}
    </nav>
  );
}

export function ContactDoor() {
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");

  // Enhancement: when the door opens, hand focus to the first field.
  const handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    if (event.currentTarget.open) {
      firstFieldRef.current?.focus();
    }
  };

  const submit = async (form: HTMLFormElement) => {
    const data = new FormData(form);
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          honeypot: data.get("company"),
          token: data.get("cf-turnstile-response"),
        }),
      });
      setStatus(response.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(event.currentTarget).catch(() => {
      setStatus("error");
    });
  };

  return (
    <section className={styles.contact} id="contact">
      <details className={styles.door} onToggle={handleToggle}>
        <summary className={styles.summary}>
          <span aria-hidden="true" className={styles.summaryDot} />
          {cta.button}
        </summary>

        <div className={styles.panel}>
          {status === "sent" ? (
            <p className={styles.confirmation} role="status">
              {cta.confirmation}
            </p>
          ) : (
            <form className={styles.form} noValidate onSubmit={handleSubmit}>
              {/* Honeypot: off-screen, no human ever fills it; a bot that does
                  gets a friendly 200 and nothing sent. */}
              <div aria-hidden="true" className={styles.honeypot}>
                <label htmlFor="contact-company">Company</label>
                <input
                  autoComplete="off"
                  id="contact-company"
                  name="company"
                  tabIndex={-1}
                />
              </div>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>{cta.fields.name}</span>
                <input
                  autoComplete="name"
                  className={styles.input}
                  name="name"
                  ref={firstFieldRef}
                  required
                  type="text"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>{cta.fields.email}</span>
                <input
                  autoComplete="email"
                  className={styles.input}
                  name="email"
                  required
                  type="email"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>{cta.fields.message}</span>
                <textarea
                  className={styles.textarea}
                  name="message"
                  required
                  rows={4}
                />
              </label>

              {TURNSTILE_SITE_KEY ? (
                <>
                  <Script async defer src={TURNSTILE_SCRIPT} />
                  <div
                    className="cf-turnstile"
                    data-sitekey={TURNSTILE_SITE_KEY}
                    data-theme="dark"
                  />
                </>
              ) : null}

              <button
                className={styles.send}
                disabled={status === "sending"}
                type="submit"
              >
                {cta.send}
              </button>

              {status === "error" ? (
                <p className={styles.error} role="alert">
                  Something went wrong. Please try again.
                </p>
              ) : null}
            </form>
          )}
        </div>
      </details>

      <QuietRail />
    </section>
  );
}
