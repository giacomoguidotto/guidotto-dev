import { defaultContactDeps } from "~/contact/adapters";
import { handleContactSubmission } from "~/contact/handle-submission";

// POST /api/contact — the thin HTTP edge of the contact seam (#2). It reads the
// JSON body and the client IP, builds the real adapters once, and hands both to
// the deep handler. Every policy decision (validation, honeypot, Turnstile, rate
// limiting, send) lives in handle-submission.ts, where the seam-#2 tests drive
// it with fakes. No raw mailto: the form post IS the spam-safe email.

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);

  const forwarded = request.headers.get("x-forwarded-for");
  const remoteIp = forwarded ? (forwarded.split(",")[0]?.trim() ?? null) : null;

  const outcome = await handleContactSubmission(
    body,
    { remoteIp },
    defaultContactDeps()
  );

  if (outcome.ok) {
    return Response.json({ ok: true });
  }
  return Response.json({ error: outcome.error }, { status: outcome.status });
}
