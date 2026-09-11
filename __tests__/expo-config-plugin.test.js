'use strict';

const {compileModsAsync} = require('@expo/config-plugins');
const withNfc = require('../app.plugin');
const packageJson = require('../package.json');

const NFC_FORMATS_KEY =
  'com.apple.developer.nfc.readersession.formats';
const ISO7816_KEY =
  'com.apple.developer.nfc.readersession.iso7816.select-identifiers';
const FELICA_KEY =
  'com.apple.developer.nfc.readersession.felica.systemcodes';

function createConfig() {
  return {
    name: 'NfcPluginFixture',
    slug: 'nfc-plugin-fixture',
    ios: {},
    android: {},
    _internal: {
      projectRoot: '/tmp/nfc-plugin-fixture',
      dynamicConfigPath: null,
      staticConfigPath: null,
      packageJsonPath: '/tmp/nfc-plugin-fixture/package.json',
    },
  };
}

async function evaluate(props, evaluations = 1) {
  let config = createConfig();
  for (let index = 0; index < evaluations; index += 1) {
    config = withNfc(config, props);
  }
  return compileModsAsync(config, {
    projectRoot: config._internal.projectRoot,
    platforms: ['ios', 'android'],
    introspect: true,
  });
}

function androidPermissions(config) {
  return config._internal.modResults.android.manifest.manifest[
    'uses-permission'
  ].map((permission) => permission.$);
}

describe('Expo config plugin', () => {
  test('applies default iOS and Android NFC configuration', async () => {
    const config = await evaluate({});
    const infoPlist = config._internal.modResults.ios.infoPlist;
    const entitlements = config._internal.modResults.ios.entitlements;

    expect(infoPlist.NFCReaderUsageDescription).toBe(
      'Interact with nearby NFC devices',
    );
    expect(entitlements[NFC_FORMATS_KEY]).toEqual(['NDEF', 'TAG']);
    expect(androidPermissions(config)).toContainEqual({
      'android:name': 'android.permission.NFC',
    });
  });

  test('deduplicates custom identifiers across repeated evaluation', async () => {
    const config = await evaluate(
      {
        nfcPermission: 'Scan an NFC tag',
        selectIdentifiers: ['A0000002471001', 'A0000002471001'],
        systemCodes: ['8008', '8008'],
      },
      2,
    );
    const infoPlist = config._internal.modResults.ios.infoPlist;

    expect(infoPlist.NFCReaderUsageDescription).toBe('Scan an NFC tag');
    expect(infoPlist[ISO7816_KEY]).toEqual(['A0000002471001']);
    expect(infoPlist[FELICA_KEY]).toEqual(['8008']);
    expect(androidPermissions(config).filter(
      (permission) => permission['android:name'] === 'android.permission.NFC',
    )).toHaveLength(1);
  });

  test('can exclude the NDEF entitlement', async () => {
    const config = await evaluate({includeNdefEntitlement: false});

    expect(
      config._internal.modResults.ios.entitlements[NFC_FORMATS_KEY],
    ).toEqual(['TAG']);
  });

  test('blocks automatic native permission configuration when disabled', async () => {
    const config = await evaluate({nfcPermission: false});
    const infoPlist = config._internal.modResults.ios.infoPlist;
    const nfcPermission = androidPermissions(config).find(
      (permission) => permission['android:name'] === 'android.permission.NFC',
    );

    expect(infoPlist.NFCReaderUsageDescription).toBeUndefined();
    expect(nfcPermission).toMatchObject({
      'android:name': 'android.permission.NFC',
      'tools:node': 'remove',
    });
  });

  test('keeps the Expo runtime host-owned and optional', () => {
    expect(packageJson.dependencies?.['@expo/config-plugins']).toBeUndefined();
    expect(packageJson.peerDependencies['@expo/config-plugins']).toBe('*');
    expect(
      packageJson.peerDependenciesMeta['@expo/config-plugins'].optional,
    ).toBe(true);
  });
});
