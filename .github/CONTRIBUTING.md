# Contributing

Thanks for your interest in guidotto.dev! Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before getting started.

guidotto.dev is a personal portfolio site with a specific public-source boundary, so contributions are accepted on a limited basis.

## What We Accept

- Bug fixes.
- Documentation improvements.
- Accessibility improvements.
- Security fixes reported responsibly through [SECURITY.md](../SECURITY.md).
- Small implementation improvements discussed in an issue first.

## What We Do Not Accept

- Pull requests that add private Notion content, broad personal context, or unsupported claims.
- Generated marketing copy that is not grounded in a narrow approved Notion lookup or already-public source.
- Unsolicited design overhauls.
- Refactoring for its own sake.

## Setup

1. Fork and clone the repo, then install dependencies:

    ```sh
    bun install
    ```

    > Optional: if you use [mise](https://mise.jdx.dev), run `mise install` first.

2. Start the development server:

    ```sh
    bun run dev
    ```

3. Before pushing, run the full CI check locally:

    ```sh
    bun run ci
    ```

    This runs lint, typecheck, and build, the same confidence signal as CI.

## Tooling

- Runtime / package manager: [Bun](https://bun.sh)
- Framework: [Next.js](https://nextjs.org)
- Styling: [Tailwind CSS](https://tailwindcss.com)
- Linting and formatting: [Biome](https://biomejs.dev) via Ultracite, not ESLint or Prettier

## Conventions

- Branch names: `feat/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) such as `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, and `chore:`.
- Public content must stay inside the public-safe source boundaries described in `AGENTS.md`.
- Use `bun run ci` before opening a pull request.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](../LICENSE).
