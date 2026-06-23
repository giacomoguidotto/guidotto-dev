// Ambient typing for CSS Modules.
//
// Next.js declares `*.module.css` in `node_modules/next/types/global.d.ts`, but
// that is only pulled in via the generated, git-ignored `next-env.d.ts` (which
// does not exist when `tsc --noEmit` runs standalone in CI, before `next
// build`). Committing this minimal, identical declaration keeps `bun run
// typecheck` self-contained for the proof-grid CSS module's default import.

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
