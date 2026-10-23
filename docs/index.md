---
layout: home
hero:
  name: react-native-nfc-manager
  text: NFC for React Native
  actions:
    - theme: brand
      text: Get started
      link: ./guide/installation
    - theme: alt
      text: Expo setup
      link: ./guide/expo
    - theme: alt
      text: API reference
      link: ./reference/api
features:
  - title: Choose your setup
    details: Follow the Expo Development Build or React Native CLI path, then read your first NDEF tag.
    link: ./guide/installation
  - title: Work with your tags
    details: Find platform support, technology handlers and the request/read/cleanup lifecycle.
    link: ./reference/compatibility
  - title: Resolve integration problems
    details: Find native rebuild, config-plugin dependency and iOS entitlement guidance.
    link: ./EXPO_TROUBLESHOOTING
---

Requires React Native **0.76+ with the New Architecture** and an NFC-capable physical device for scans. Expo Go cannot load this module. Install `react-native-nfc-manager` for stable v4.

[Support policy](./SUPPORT_POLICY.md) · [Migration](./MIGRATING_V3_TO_V4.md) · [Contributing](./CONTRIBUTING.md)

In [4.1.0](https://github.com/revtel/react-native-nfc-manager/releases/tag/v4.1.0),
Android apps can query [NFC antenna positions](./guide/android.md#nfc-antenna-location)
on Android 14 and newer to help users position a tag. This API is Android-only.

## Start here

- [Install the package](./guide/installation.md) and choose Expo or React Native CLI.
- Follow [Expo](./guide/expo.md), [iOS](./guide/ios.md) or [Android](./guide/android.md) setup.
- [Read your first NDEF tag](./guide/reading-ndef.md).
- Find [API handlers](./reference/api.md), [technology support](./reference/compatibility.md) and [troubleshooting](./EXPO_TROUBLESHOOTING.md).
