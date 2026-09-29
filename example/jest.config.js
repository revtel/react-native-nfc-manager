module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react-native$': '<rootDir>/node_modules/react-native',
    '^react-native-safe-area-context$': '<rootDir>/node_modules/react-native-safe-area-context',
    '^react-native-nfc-manager$': '<rootDir>/../dist/src/index.js',
  },
};
