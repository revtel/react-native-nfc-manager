import {Platform} from 'react-native';

export class UnsupportedFeature extends Error {}
export class SecurityViolation extends Error {}
export class InvalidParameter extends Error {}
export class InvalidParameterLength extends Error {}
export class ParameterOutOfBound extends Error {}
export class RadioDisabled extends Error {}
// transceive errors
export class TagConnectionLost extends Error {}
export class RetryExceeded extends Error {}
export class TagResponseError extends Error {}
export class SessionInvalidated extends Error {}
export class TagNotConnected extends Error {}
export class PacketTooLong extends Error {}
// reader session errors
export class UserCancel extends Error {}
export class Timeout extends Error {}
export class Unexpected extends Error {}
export class SystemBusy extends Error {}
export class FirstNdefInvalid extends Error {}
// tag command configuration errors
export class InvalidConfiguration extends Error {}
// ndef reader session error
export class TagNotWritable extends Error {}
export class TagUpdateFailure extends Error {}
export class TagSizeTooSmall extends Error {}
export class ZeroLengthMessage extends Error {}

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
  if (typeof error === 'string') {
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
  }

  return error;
}

export function buildNfcExceptionAndroid(error) {
  if (typeof error === 'string') {
    if (error === 'cancelled') {
      return new UserCancel();
    }
  }

  return error;
}

export async function handleNativeException(
  callNativePromise,
  ignoreError = false,
) {
  try {
    return await callNativePromise;
  } catch (err) {
    if (!ignoreError) {
      if (Platform.OS === 'ios') {
        throw buildNfcExceptionIOS(err);
      } else if (Platform.OS === 'android') {
        throw buildNfcExceptionAndroid(err);
      }
    }
  }
}
