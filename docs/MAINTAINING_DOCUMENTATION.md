# Maintaining the documentation

The repository Markdown in `docs/` is the full documentation source. README is a short introduction and quickstart; keep detailed setup, API and troubleshooting guidance on their respective pages. The site uses VitePress 1.6.4 with its default theme and local search.

## Local development

Use Node.js 22. Dependencies and the lockfile are isolated in `docs/`; install from the repository root:

```sh
npm ci --prefix docs
npm run dev --prefix docs
```

VitePress prints the local URL with the `/react-native-nfc-manager/` project path. For a production preview:

```sh
npm run build --prefix docs
npm run preview --prefix docs
```

The build fails on broken internal page links. Also check anchors, JSON/shell/code examples, desktop/mobile navigation and local search. When editing the quickstart, retain initialization, repeated-request guards and awaited cleanup. Markdown examples do not prove NFC hardware behavior.

## Navigation and content

- Add user pages under `guide/` or `reference/`, then update `.vitepress/config.mjs`.
- Keep current support, migration and Expo troubleshooting links available from the user sidebar.
- Keep release/compiler/device evidence attributed to its original candidate. Records remain accessible from maintainer navigation and are excluded from local search.
- Use relative Markdown links and images so the same page works in GitHub and the site. Link to source files outside `docs/` using GitHub URLs.
- Preserve existing file/anchor URLs when moving content, and update inbound links. The README's legacy anchors remain entrypoints to the corresponding guides.
- Keep the root package's CommonJS configuration and dependencies independent from the site. `docs/package.json` is private. `.vitepress/dist/`, `.vitepress/cache/` and `node_modules/` are generated and ignored.

## Continuous integration

The build-only `Documentation` workflow runs for documentation, image and workflow changes on PRs and `v4`/`main` pushes. It installs the pinned docs lockfile, builds the site and uploads a short-lived static artifact. It does not deploy to GitHub Pages. The package CI and native build gates retain their own checks.

## Publishing the site

The repository is prepared for a GitHub Pages project URL with base `/react-native-nfc-manager/`. No public documentation URL is announced until deployment is verified. Before enabling publication:

1. Review the built artifact and authorize Pages activation/deployment.
2. Configure Pages to use GitHub Actions. Add a deployment job on the agreed documentation branch with `pages: write`, `id-token: write` and a `github-pages` environment. Use the official Pages artifact/deployment actions, separate from npm publication.
3. Verify the public homepage, nested routes, images, anchors, mobile navigation and search at the project base path.
4. Point README and the repository website link to the verified URL. Coordinate a Wiki notice linking to current docs while preserving historical URLs.

See [GitHub's Pages workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [VitePress deployment instructions](https://vuejs.github.io/vitepress/v1/guide/deploy).

When promoting v4 to main, set `DOCS_SOURCE_BRANCH=main` in the docs build environment (the default is `v4`), review source/edit links and the workflow's branch filters, and update absolute GitHub links in Markdown. If adopting a custom domain or a different repository URL, adjust `base` and verify nested routes before publishing. Documentation deployment is independent from package releases.
