import {defineConfig} from 'vitepress';

const branch = process.env.DOCS_SOURCE_BRANCH || 'main';
const repository = 'https://github.com/revtel/react-native-nfc-manager';
const maintainers = [
  {text: 'Maintaining', items: [
    {text: 'Contributing', link: '/CONTRIBUTING'},
    {text: 'Documentation', link: '/MAINTAINING_DOCUMENTATION'},
    {text: 'Release validation', link: '/RELEASING'},
    {text: 'Publishing', link: '/GITHUB_ACTIONS_PUBLISHING'},
  ]},
  {text: 'Validation records', collapsed: true, items: [
    {text: 'Stable release · Oct 9', link: '/V4_STABLE_RELEASE_2026-10-09'},
    {text: 'Stable candidate · Oct 9', link: '/V4_CANDIDATE_VALIDATION_2026-10-09'},
    {text: 'Android tag metadata · Oct 9', link: '/ANDROID_TAG_METADATA_VALIDATION_2026-10-09'},
    {text: 'Expo validation · Sep 29', link: '/EXPO_VALIDATION_2026-09-29'},
    {text: 'Expo smoke · Sep 29', link: '/EXPO_SMOKE_2026-09-29'},
    {text: 'v4 release validation · Sep 29', link: '/V4_RELEASE_VALIDATION_2026-09-29'},
    {text: 'Stable preparation · Sep 29', link: '/V4_STABLE_PREPARATION_2026-09-29'},
    {text: 'CI verification', link: '/CI_VERIFICATION'},
  ]},
];
const guide = [
  {text: 'Getting started', items: [
    {text: 'Installation', link: '/guide/installation'},
    {text: 'Expo Development Builds', link: '/guide/expo'},
    {text: 'iOS setup', link: '/guide/ios'},
    {text: 'Android setup', link: '/guide/android'},
    {text: 'Read NDEF tags', link: '/guide/reading-ndef'},
  ]},
  {text: 'Reference', items: [
    {text: 'API and handlers', link: '/reference/api'},
    {text: 'Technology compatibility', link: '/reference/compatibility'},
    {text: 'Expo troubleshooting', link: '/EXPO_TROUBLESHOOTING'},
    {text: 'Support policy', link: '/SUPPORT_POLICY'},
    {text: 'Migration', link: '/MIGRATING_V3_TO_V4'},
  ]},
];
const sidebar = {};
for (const group of maintainers) {
  for (const item of group.items) sidebar[item.link] = maintainers;
}

// Page prefixes must precede the root fallback in VitePress's matching order.
sidebar['/'] = guide;

export default defineConfig({
  title: 'NFC Manager',
  description: 'NFC for React Native New Architecture and Expo Development Builds.',
  lang: 'en-US',
  base: '/react-native-nfc-manager/',
  // Markdown files are shared with GitHub; the build checks local links by default.
  ignoreDeadLinks: false,
  transformPageData(page) {
    // Historical records retain their original claims and stay out of user search.
    if (/VALIDATION_|SMOKE_|PREPARATION_|STABLE_RELEASE_|CI_VERIFICATION/.test(page.relativePath)) {
      page.frontmatter.search = false;
    }
  },
  themeConfig: {
    nav: [
      {text: 'Guide', link: '/guide/installation'},
      {text: 'Reference', link: '/reference/api'},
      {text: 'Maintainers', link: '/CONTRIBUTING'},
      {text: 'v4 releases', link: `${repository}/blob/${branch}/CHANGELOG.md`},
    ],
    sidebar,
    search: {provider: 'local'},
    socialLinks: [{icon: 'github', link: repository}],
    editLink: {pattern: `${repository}/edit/${branch}/docs/:path`},
    outline: [2, 3],
    footer: {message: 'Released under the MIT License.'},
  },
});
