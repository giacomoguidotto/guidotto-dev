import { content } from "~/content";

// Masthead — the site chrome at frame 1: the wordmark plus a small
// signature-scale avatar slot (attribution, subordinate to the work). Present so
// the site is never faceless; this begins the human escalation that pays off as
// a full warm face before the CTA. The avatar slot is intentionally empty until
// Jack's portrait lands; the monogram is a name-derived placeholder, not content.

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.at(0) ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Masthead() {
  const { wordmark, name } = content.site;
  return (
    <header className="masthead">
      <a aria-label={name} className="masthead__home" href="/">
        <span aria-hidden="true" className="masthead__avatar">
          {initials(name)}
        </span>
        <span className="masthead__wordmark">{wordmark}</span>
      </a>
    </header>
  );
}
