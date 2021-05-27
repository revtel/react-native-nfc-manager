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

function addValuesToEntitlementsArray(entitlements, key, values) {
  if (!Array.isArray(values) || !values.length) {
    return entitlements;
  }
  if (!Array.isArray(entitlements[key])) {
    entitlements[key] = [];
  }
  // Add the required values
  entitlements[key].push(...values);

  // Remove duplicates
  entitlements[key] = [...new Set(entitlements[key])];

  return entitlements;
}

function withIosNFCEntitlement(c, {selectIdentifiers}) {
  return withEntitlementsPlist(c, (config) => {
    // Add the required formats
    config.modResults = addValuesToEntitlementsArray(
      config.modResults,
      'com.apple.developer.nfc.readersession.formats',
      ['NDEF', 'TAG'],
    );
    // Add the user defined identifiers
    config.modResults = addValuesToEntitlementsArray(
      config.modResults,
      // https://developer.apple.com/documentation/bundleresources/information_property_list/select-identifiers
      'com.apple.developer.nfc.readersession.iso7816.select-identifiers',
      selectIdentifiers || [],
    );
    return config;
  });
}

function withNFC(config, props = {}) {
  const {nfcPermission, selectIdentifiers} = props;
  config = withIosNFCEntitlement(config, {selectIdentifiers});
  if (nfcPermission !== false) {
    config = withIosPermission(config, props);
    config = AndroidConfig.Permissions.withPermissions(config, [
      'android.permission.NFC',
    ]);
  }
  return config;
}

module.exports = withNFC;
