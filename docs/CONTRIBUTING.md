# Contributing

Contributions are welcome. The primary development app is the [RN 0.84 New Architecture example](https://github.com/revtel/react-native-nfc-manager/tree/main/example); its [README](https://github.com/revtel/react-native-nfc-manager/blob/main/example/README.md) covers local setup and physical-device testing.

## Build and checks

Run from the repository root using Node.js 22:

```sh
npm run build
npm run lint
npm run typecheck
npm test -- --runInBand --no-watchman
npm run test:example
```

TypeScript builds distributable JavaScript into `dist/`; `prepack` builds it automatically. Keep source changes in `src/`, `ndef-lib/` and `specs/`, and avoid manually editing generated output.

Jest verifies mocked behavior. Native compiler checks and NFC physical-device checks supply different evidence. CI runs the basic/package/Codegen checks, with Android and iOS New Architecture builds selected for relevant changes. Manual candidate CI forces both native builds. See [release validation](./RELEASING.md#native-ci-selection-and-verification) and [support policy](./SUPPORT_POLICY.md) for the exact gates.

For documentation edits, follow [maintaining the documentation](./MAINTAINING_DOCUMENTATION.md).

## NFC ReWriter

- [NFC ReWriter app source](https://github.com/revtel/react-native-nfc-rewriter)
- [NFC ReWriter on the App Store](https://apps.apple.com/tw/app/nfc-rewriter/id1551243964)
- [NFC ReWriter on Google Play](https://play.google.com/store/apps/details?id=com.washow.nfcopenrewriter)

Created by [whitedogg13](https://github.com/whitedogg13).
