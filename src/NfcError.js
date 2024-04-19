import {Platform} from 'react-native';

export class NfcErrorBase extends Error {}
export class UnsupportedFeature extends NfcErrorBase {}
export class SecurityViolation extends NfcErrorBase {}
export class InvalidParameter extends NfcErrorBase {}
export class InvalidParameterLength extends NfcErrorBase {}
export class ParameterOutOfBound extends NfcErrorBase {}
export class RadioDisabled extends NfcErrorBase {}
// transceive errors
export class TagConnectionLost extends NfcErrorBase {}
export class RetryExceeded extends NfcErrorBase {}
export class TagResponseError extends NfcErrorBase {}
export class SessionInvalidated extends NfcErrorBase {}
export class TagNotConnected extends NfcErrorBase {}
export class PacketTooLong extends NfcErrorBase {}
// reader session errors
export class UserCancel extends NfcErrorBase {}
export class Timeout extends NfcErrorBase {}
export class Unexpected extends NfcErrorBase {}
export class SystemBusy extends NfcErrorBase {}
export class FirstNdefInvalid extends NfcErrorBase {}
// tag command configuration errors
export class InvalidConfiguration extends NfcErrorBase {}
// ndef reader session error
export class TagNotWritable extends NfcErrorBase {}
export class TagUpdateFailure extends NfcErrorBase {}
export class TagSizeTooSmall extends NfcErrorBase {}
export class ZeroLengthMessage extends NfcErrorBase {}

export const NfcErrorIOS = {
  errCodes: {
    unknown: -1,
    unsupportedFeature: 1,
    securityViolation: 2,
    invalidParameter: 3,
    invalidParameterLength: 4,
    parameterOutOfBound: 5,
    radioDisabled: 6,
    // transceive errors
    tagConnectionLost: 100,
    retryExceeded: 101,
    tagResponseError: 102,
    sessionInvalidated: 103,
    tagNotConnected: 104,
    packetTooLong: 105,
    // reader session errors
    userCancel: 200,
    timeout: 201,
    unexpected: 202,
    systemBusy: 203,
    firstNdefInvalid: 204,
    // tag command configuration errors
    invalidConfiguration: 300,
    // ndef reader session error
    tagNotWritable: 400,
    tagUpdateFailure: 401,
    tagSizeTooSmall: 402,
    zeroLengthMessage: 403,
  },

  parse: (error) => {
    if (typeof error === 'string') {
      const [domainError] = error.split(',');

      if (domainError) {
        const [nfcError, nfcErrorCode] = domainError.split(':');
        if (nfcError === 'NFCError') {
          return parseInt(nfcErrorCode, 10);
        }
      }
    } else if (error instanceof UserCancel) {
      // this is for backward capability only
      console.warn('API Deprecated: please use NfcError.UserCancel instead');
      return NfcErrorIOS.errCodes.userCancel;
    }
    return NfcErrorIOS.errCodes.unknown;
  },
};

export function buildNfcExceptionIOS(error) {
  const [domainError] = error.split(',');

  if (domainError) {
    const [nfcError, nfcErrorCode] = domainError.split(':');
    if (nfcError === 'NFCError') {
      const code = parseInt(nfcErrorCode, 10);
      if (code === NfcErrorIOS.errCodes.unsupportedFeature) {
        return new UnsupportedFeature();
      } else if (code === NfcErrorIOS.errCodes.securityViolation) {
        return new SecurityViolation();
      } else if (code === NfcErrorIOS.errCodes.invalidParameter) {
        return new InvalidParameter();
      } else if (code === NfcErrorIOS.errCodes.invalidParameterLength) {
        return new InvalidParameterLength();
      } else if (code === NfcErrorIOS.errCodes.parameterOutOfBound) {
        return new ParameterOutOfBound();
      } else if (code === NfcErrorIOS.errCodes.radioDisabled) {
        return new RadioDisabled();
      } else if (code === NfcErrorIOS.errCodes.tagConnectionLost) {
        return new TagConnectionLost();
      } else if (code === NfcErrorIOS.errCodes.retryExceeded) {
        return new RetryExceeded();
      } else if (code === NfcErrorIOS.errCodes.tagResponseError) {
        return new TagResponseError();
      } else if (code === NfcErrorIOS.errCodes.sessionInvalidated) {
        return new SessionInvalidated();
      } else if (code === NfcErrorIOS.errCodes.tagNotConnected) {
        return new TagNotConnected();
      } else if (code === NfcErrorIOS.errCodes.packetTooLong) {
        return new PacketTooLong();
      } else if (code === NfcErrorIOS.errCodes.userCancel) {
        return new UserCancel();
      } else if (code === NfcErrorIOS.errCodes.timeout) {
        return new Timeout();
      } else if (code === NfcErrorIOS.errCodes.unexpected) {
        return new Unexpected();
      } else if (code === NfcErrorIOS.errCodes.systemBusy) {
        return new SystemBusy();
      } else if (code === NfcErrorIOS.errCodes.firstNdefInvalid) {
        return new FirstNdefInvalid();
      } else if (code === NfcErrorIOS.errCodes.invalidConfiguration) {
        return new InvalidConfiguration();
      } else if (code === NfcErrorIOS.errCodes.tagNotWritable) {
        return new TagNotWritable();
      } else if (code === NfcErrorIOS.errCodes.tagUpdateFailure) {
        return new TagUpdateFailure();
      } else if (code === NfcErrorIOS.errCodes.tagSizeTooSmall) {
        return new TagSizeTooSmall();
      } else if (code === NfcErrorIOS.errCodes.zeroLengthMessage) {
        return new ZeroLengthMessage();
      }
    }
  }

  return new NfcErrorBase(error);
}

export function buildNfcExceptionAndroid(error) {
  if (error === 'cancelled') {
    return new UserCancel();
  }

  return new NfcErrorBase(error);
}

export async function handleNativeException(
  callNativePromise,
  ignoreError = false,
) {
  try {
    return await callNativePromise;
  } catch (err) {
    if (!ignoreError) {
      // the error from the native side will always be a string
      if (typeof err === 'string') {
        if (Platform.OS === 'ios') {
          throw buildNfcExceptionIOS(err);
        } else if (Platform.OS === 'android') {
          throw buildNfcExceptionAndroid(err);
        }
      }

      // unexpected condition, simply throws them out without conversion
      throw err;
    }
  }
}
