const ReactNative = {};

let _os = 'ios';

const Platform = {
  get OS() {
    return _os;
  },

  setOS: (os) => {
    _os = os;
  },
};

ReactNative.Platform = Platform;

module.exports = ReactNative;
