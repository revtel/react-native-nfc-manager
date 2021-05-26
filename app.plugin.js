const {
  AndroidConfig,
  withInfoPlist,
  withEntitlementsPlist,
} = require('@expo/config-plugins');

const NFC_READER = 'Allow $(PRODUCT_NAME) to interact with nearby NFC devices';

function withIosPermission(c, props = {}) {
  const {nfcPermission} = props;
  return withInfoPlist(c, (config) => {
    // https://developer.apple.com/documentation/bundleresources/information_property_list/nfcreaderusagedescription?language=objc
    config.modResults.NFCReaderUsageDescription =
      nfcPermission ||
      config.modResults.NFCReaderUsageDescription ||
      NFC_READER;
    return config;
  });
}

function withIosNFCEntitlement(c) {
  return withEntitlementsPlist(c, (config) => {
    if (
      !Array.isArray(
        config.modResults['com.apple.developer.nfc.readersession.formats'],
      )
    ) {
      config.modResults['com.apple.developer.nfc.readersession.formats'] = [];
    }
    // Add the required formats
    config.modResults['com.apple.developer.nfc.readersession.formats'].push(
      'NDEF',
      'TAG',
    );

    // Remove duplicates
    config.modResults['com.apple.developer.nfc.readersession.formats'] = [
      ...new Set(
        config.modResults['com.apple.developer.nfc.readersession.formats'],
      ),
    ];

    return config;
  });
}

function withNFC(config, props = {}) {
  const {nfcPermission} = props;
  config = withIosNFCEntitlement(config);
  if (nfcPermission !== false) {
    config = withIosPermission(config, props);
    config = AndroidConfig.Permissions.withPermissions(config, [
      'android.permission.NFC',
    ]);
  }
  return config;
}

module.exports = withNFC;
