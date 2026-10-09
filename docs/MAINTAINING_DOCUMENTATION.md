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

The `Documentation` workflow runs for documentation, image and workflow changes on PRs and `v4`/`main` pushes. It installs the pinned docs lockfile, builds the site and uploads a short-lived static preview artifact. Only main pushes or manual runs on main upload a Pages artifact and deploy through the `github-pages` environment. PRs and other branches build previews only. Deployment permissions are confined to the deploy job; npm publication and native build gates remain independent.

## Publishing the site

The site uses GitHub Actions deployment with project base `/react-native-nfc-manager/`. To maintain the deployment:

1. Review the built artifact before merging documentation changes to main.
2. Keep Pages configured to use GitHub Actions and the `github-pages` environment restricted to main. The workflow uses official Pages artifact/deployment actions with `pages: write` and `id-token: write` only on the deployment job.
3. Verify the public homepage, nested routes, images, anchors, mobile navigation and search at the project base path.
4. Keep README and the repository website link pointed to the verified URL. A Wiki notice or historical issue replies require their own authorized follow-up; preserve historical URLs.

See [GitHub's Pages workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [VitePress deployment instructions](https://vuejs.github.io/vitepress/v1/guide/deploy).

The default development branch and local docs source-link fallback are `main`. CI supplies the target/current branch through `DOCS_SOURCE_BRANCH`; set it explicitly when previewing another branch. Review source/edit links and workflow branch filters after any future branch rename. If adopting a custom domain or a different repository URL, adjust `base` and verify nested routes before publishing. Documentation deployment is independent from package releases.
