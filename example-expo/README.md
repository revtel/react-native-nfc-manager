# Expo Development Build NFC smoke test

Run from the repository root with Node.js 22:

```sh
npm run prepare:expo:smoke
```

This builds and packs the current checkout, creates a pinned Expo SDK 57 consumer in the system temporary directory, installs the tarball plus `expo-dev-client`, copies this small test UI, runs prebuild, and checks the generated NFC configuration and installed package version. The command prints the preserved consumer path. `example-expo/` contains only test source; the generated `ios/`, `android/`, dependencies, and build output are not checked in.

Connect an NFC-capable phone, then run one of the printed `npx expo run:ios --device` or `npx expo run:android --device` commands from the generated consumer. iOS requires signing for your Apple development team and NFC-capable provisioning; Android requires an enabled NFC adapter. Start Metro from that same consumer with `npx expo start --dev-client` if it is not already running. Expo Go cannot load this native module.

The upper log and lower actions scroll independently. With a compatible tag, run:

1. Start + support checks, then Read NDEF. Record `requestTechnology`, `getTag`, cleanup, and any `discoverTag`/`sessionClosed` lines.
2. Run Cancel pending NDEF without scanning, then Read NDEF again. Record rejection, cancellation, repeated-request result, and whether any duplicate events occurred.
3. Run One-shot tag event and scan once. Record discovery and session-close counts; use Stop one-shot event if the session remains active.
4. On Android only, run NfcA transceive with a compatible tag. `0x30 0x00` reads page 0 on compatible tags, but other NfcA tags may reject it. Record the response/error and cleanup.
5. Repeat after backgrounding and resuming the app. For timeout coverage, wait without scanning and record the actual timeout/cancellation behavior. On iOS, test ISO 15693 separately using the main `example/` when suitable hardware exists.

For each run, record platform, device, OS, tag technology, package version/tarball, result, errors, and event counts in the release checklist. Preparation, simulator/native compilation, and mocked tests are not physical NFC evidence. A device result remains pending until an actual scan is observed.
