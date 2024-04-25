// Type definitions for react-native-nfc-manager
// Project: https://github.com/whitedogg13/react-native-nfc-manager
// Definitions by: April Ayres <april.ayres@papercut.com> and Paul Huynh <paul.huynh@papercut.com>

declare module 'react-native-nfc-manager' {
  export enum NfcEvents {
    DiscoverTag = 'NfcManagerDiscoverTag',
    DiscoverBackgroundTag = 'NfcManagerDiscoverBackgroundTag',
    SessionClosed = 'NfcManagerSessionClosed',
    StateChanged = 'NfcManagerStateChanged',
  }

  export enum NfcTech {
    Ndef = 'Ndef',
    NfcA = 'NfcA',
    NfcB = 'NfcB',
    NfcF = 'NfcF',
    NfcV = 'NfcV',
    IsoDep = 'IsoDep',
    MifareClassic = 'MifareClassic',
    MifareUltralight = 'MifareUltralight',
    MifareIOS = 'mifare',
    Iso15693IOS = 'iso15693',
    FelicaIOS = 'felica',
    NdefFormatable = 'NdefFormatable',
  }

  export enum NdefStatus {
    NotSupported = 1,
    ReadWrite = 2,
    ReadOnly = 3,
  }

  export enum NfcAdapter {
    FLAG_READER_NFC_A = 0x1,
    FLAG_READER_NFC_B = 0x2,
    FLAG_READER_NFC_F = 0x4,
    FLAG_READER_NFC_V = 0x8,
    FLAG_READER_NFC_BARCODE = 0x10,
    FLAG_READER_SKIP_NDEF_CHECK = 0x80,
    FLAG_READER_NO_PLATFORM_SOUNDS = 0x100,
  }

  export enum Nfc15693RequestFlagIOS {
    DualSubCarriers = 1 << 0,
    HighDataRate = 1 << 1,
    ProtocolExtension = 1 << 3,
    Select = 1 << 4,
    Address = 1 << 5,
    Option = 1 << 6,
    CommandSpecificBit8 = 1 << 7,
  }

  export enum Nfc15693ResponseFlagIOS {
    Error = 1 << 0,
    ResponseBufferValid = 1 << 1,
    FinalResponse = 1 << 2,
    ProtocolExtension = 1 << 3,
    BlockSecurityStatusBit5 = 1 << 4,
    BlockSecurityStatusBit6 = 1 << 5,
    WaitTimeExtension = 1 << 6,
  }

  type TNF = 0x0 | 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07;

  export interface NdefRecord {
    id?: number[];
    tnf: TNF;
    type: number[] | string;
    payload: any[];
  }

  export interface TagEvent {
    ndefMessage: NdefRecord[];
    maxSize?: number;
    type?: string;
    techTypes?: string[];
    id?: string;
  }

  export interface RegisterTagEventOpts {
    alertMessage?: string;
    invalidateAfterFirstRead?: boolean;
    isReaderModeEnabled?: boolean;
    readerModeFlags?: number;
    readerModeDelay?: number;
  }

  export interface CancelTechReqOpts {
    throwOnError?: boolean = false;
    delayMsAndroid?: number = 1000;
  }

  interface NdefHandler {
    writeNdefMessage: (bytes: number[] , options?: { reconnectAfterWrite: boolean }) => Promise<void>;
    getNdefMessage: () => Promise<TagEvent | null>;
    makeReadOnly: () => Promise<void>;
    getNdefStatus: () => Promise<{
      status: NdefStatus;
      capacity: number;
    }>;
    getCachedNdefMessageAndroid: () => Promise<TagEvent | null>;
  }

  interface NfcAHandler {
    transceive: (bytes: number[]) => Promise<number[]>;
  }

  interface NfcVHandler {
    transceive: (bytes: number[]) => Promise<number[]>;
  }

  interface IsoDepHandler {
    transceive: (bytes: number[]) => Promise<number[]>;
  }

  interface MifareClassicHandlerAndroid {
    mifareClassicSectorToBlock: (sector: number) => Promise<ArrayLike<number>>;
    mifareClassicReadBlock: (
      block: ArrayLike<number>,
    ) => Promise<ArrayLike<number>>;
    mifareClassicWriteBlock: (
      block: ArrayLike<number>,
      simpliArr: any[],
    ) => Promise<void>;
    mifareClassicIncrementBlock: (
      block: ArrayLike<number>,
      data: number,
    ) => Promise<void>;
    mifareClassicDecrementBlock: (
      block: ArrayLike<number>,
      data: number,
    ) => Promise<void>;
    mifareClassicTransferBlock: (
      block: ArrayLike<number>,
    ) => Promise<void>;
    mifareClassicGetSectorCount: () => Promise<number>;
    mifareClassicAuthenticateA: (
      sector: number,
      keys: number[],
    ) => Promise<void>;
    mifareClassicAuthenticateB: (
      sector: number,
      keys: number[],
    ) => Promise<void>;
  }

  interface MifareUltralightHandlerAndroid {
    mifareUltralightReadPages: (offset: number) => Promise<ArrayLike<number>>;
    mifareUltralightWritePage: (
      offset: number,
      data: number[],
    ) => Promise<void>;
  }

  interface NdefFormatableHandlerAndroid {
    formatNdef: (bytes: number[], options?: { readOnly: boolean }) => Promise<void>;
  }

  /** [iOS ONLY] */
  interface Iso15693HandlerIOS {
    getSystemInfo: (
      requestFloags: number,
    ) => Promise<{
      dsfid: number;
      afi: number;
      blockSize: number;
      blockCount: number;
      icReference: number;
    }>;
    readSingleBlock: (params: {
      flags: number;
      blockNumber: number;
    }) => Promise<number[]>;
    readMultipleBlocks: (params: {
      flags: number;
      blockNumber: number;
      blockCount: number;
    }) => Promise<number[][]>;
    writeSingleBlock: (params: {
      flags: number;
      blockNumber: number;
      dataBlock: number[];
    }) => Promise<void>;
    lockBlock: (params: {flags: number; blockNumber: number}) => Promise<void>;
    writeAFI: (params: {flags: number; afi: number}) => Promise<void>;
    lockAFI: (params: {flags: number}) => Promise<void>;
    writeDSFID: (params: {flags: number; dsfid: number}) => Promise<void>;
    lockDSFID: (params: {flags: number}) => Promise<void>;
    resetToReady: (params: {flags: number}) => Promise<void>;
    select: (params: {flags: number}) => Promise<void>;
    stayQuite: () => Promise<void>;
    customCommand: (params: {
      flags: number;
      customCommandCode: number;
      customRequestParameters: number[];
    }) => Promise<number[]>;
    sendRequest: (params: {
      flags: number;
      commandCode: number;
      data: number[];
    }) => Promise<[number, number[]]>;
    extendedReadSingleBlock: (params: {
      flags: number;
      blockNumber: number;
    }) => Promise<number[]>;
    extendedWriteSingleBlock: (params: {
      flags: number;
      blockNumber: number;
      dataBlock: number[];
    }) => Promise<void>;
    extendedLockBlock: (params: {
      flags: number;
      blockNumber: number;
    }) => Promise<void>;
  }

  type OnDiscoverTag = (evt: TagEvent) => void;
  type OnSessionClosed = (error?: NfcError.NfcErrorBase) => void;
  type OnStateChanged = (evt: {state: string}) => void;
  type OnNfcEvents = OnDiscoverTag | OnSessionClosed | OnStateChanged;

  interface NfcManager {
    start(): Promise<void>;
    isSupported(): Promise<boolean>;
    isEnabled(): Promise<boolean>;
    registerTagEvent(options?: RegisterTagEventOpts): Promise<void>;
    unregisterTagEvent(): Promise<void>;
    setEventListener(name: NfcEvents, callback: OnNfcEvents | null): void;
    requestTechnology(
      tech: NfcTech | NfcTech[],
      options?: RegisterTagEventOpts,
    ): Promise<NfcTech | null>;
    cancelTechnologyRequest: (options?: CancelTechReqOpts) => Promise<void>;
    getTag: () => Promise<TagEvent | null>;
    getBackgroundTag: () => Promise<TagEvent | null>;
    clearBackgroundTag: () => Promise<void>;
    setAlertMessage: (alertMessage: string) => Promise<void>;

    /**
     * common tech handler getters for both iOS / Android
     */
    ndefHandler: NdefHandler;
    nfcAHandler: NfcAHandler;
    nfcVHandler: NfcVHandler;
    isoDepHandler: IsoDepHandler;

    /**
     * iOS only
     */
    getBackgroundNdef: () => Promise<NdefRecord[] | null>;
    setAlertMessageIOS: (alertMessage: string) => Promise<void>;
    invalidateSessionIOS: () => Promise<void>;
    invalidateSessionWithErrorIOS: (errorMessage: string) => Promise<void>;
    sendMifareCommandIOS: (bytes: number[]) => Promise<number[]>;
    sendFelicaCommandIOS: (bytes: number[]) => Promise<number[]>;
    sendCommandAPDUIOS: (
      bytesOrApdu:
        | number[]
        | {
            cla: number;
            ins: number;
            p1: number;
            p2: number;
            data: number[];
            le: number;
          },
    ) => Promise<{response: number[]; sw1: number; sw2: number}>;
    restartTechnologyRequestIOS: () => Promise<NfcTech | null>;
    iso15693HandlerIOS: Iso15693HandlerIOS;

    /**
     * Android only
     */
    goToNfcSetting(): Promise<boolean>;
    getLaunchTagEvent(): Promise<TagEvent | null>;
    transceive(bytes: number[]): Promise<number[]>;
    getMaxTransceiveLength(): Promise<number>;
    setTimeout(timeout: number): Promise<void>;
    connect: (techs: NfcTech[]) => Promise<void>;
    close: () => Promise<void>;
    mifareClassicHandlerAndroid: MifareClassicHandlerAndroid;
    mifareUltralightHandlerAndroid: MifareUltralightHandlerAndroid;
    ndefFormatableHandlerAndroid: NdefFormatableHandlerAndroid;
  }

  const nfcManager: NfcManager;

  type ISOLangCode = 'en' | string;
  type URI = string;

  export interface WifiSimpleCredentials {
    ssid: string;
    networkKey: string;
    authType?: number[];
  }

  export const Ndef: {
    TNF_EMPTY: 0x0;
    TNF_WELL_KNOWN: 0x01;
    TNF_MIME_MEDIA: 0x02;
    TNF_ABSOLUTE_URI: 0x03;
    TNF_EXTERNAL_TYPE: 0x04;
    TNF_UNKNOWN: 0x05;
    TNF_UNCHANGED: 0x06;
    TNF_RESERVED: 0x07;

    RTD_TEXT: 'T'; // [0x54]
    RTD_URI: 'U'; // [0x55]
    RTD_SMART_POSTER: 'Sp'; // [0x53, 0x70]
    RTD_ALTERNATIVE_CARRIER: 'ac'; //[0x61, 0x63]
    RTD_HANDOVER_CARRIER: 'Hc'; // [0x48, 0x63]
    RTD_HANDOVER_REQUEST: 'Hr'; // [0x48, 0x72]
    RTD_HANDOVER_SELECT: 'Hs'; // [0x48, 0x73]

    RTD_BYTES_TEXT: [0x54];
    RTD_BYTES_URI: [0x55];
    RTD_BYTES_SMART_POSTER: [0x53, 0x70];
    RTD_BYTES_ALTERNATIVE_CARRIER: [0x61, 0x63];
    RTD_BYTES_HANDOVER_CARRIER: [0x48, 0x63];
    RTD_BYTES_HANDOVER_REQUEST: [0x48, 0x72];
    RTD_BYTES_HANDOVER_SELECT: [0x48, 0x73];

    MIME_WFA_WSC: 'application/vnd.wfa.wsc';

    RTD_URI_PROTOCOLS: [
      '',
      'http://www.',
      'https://www.',
      'http://',
      'https://',
      'tel:',
      'mailto:',
      'ftp://anonymous:anonymous@',
      'ftp://ftp.',
      'ftps://',
      'sftp://',
      'smb://',
      'nfs://',
      'ftp://',
      'dav://',
      'news:',
      'telnet://',
      'imap:',
      'rtsp://',
      'urn:',
      'pop:',
      'sip:',
      'sips:',
      'tftp:',
      'btspp://',
      'btl2cap://',
      'btgoep://',
      'tcpobex://',
      'irdaobex://',
      'file://',
      'urn:epc:id:',
      'urn:epc:tag:',
      'urn:epc:pat:',
      'urn:epc:raw:',
      'urn:epc:',
      'urn:nfc:',
    ];

    text: {
      encodePayload: (
        text: string,
        lang?: ISOLangCode,
        encoding?: any,
      ) => NdefRecord;
      decodePayload: (data: Uint8Array) => string;
    };
    uri: {
      encodePayload: (uri: URI) => NdefRecord;
      decodePayload: (data: Uint8Array) => string;
    };
    wifiSimple: {
      encodePayload: (credentials: WifiSimpleCredentials) => NdefRecord;
      decodePayload: (data: Uint8Array) => WifiSimpleCredentials;
    };
    util: {
      stringToBytes: (string: string) => any[];
      bytesToString: (bytes: any) => string;
      bytesToHexString: (bytes: any) => string;
      toHex: (i: any) => any;
      toPrintable: (i: any) => string;
    };
    isType(record: NdefRecord, tnf: TNF, type: string): boolean;
    stringify(data: number[], separator: string): string;
    encodeMessage(records: NdefRecord[]): number[];
    decodeMessage(bytes: number[]): NdefRecord[];
    textRecord(text: string, lang?: ISOLangCode, encoding?: any): NdefRecord;
    uriRecord(uri: URI, id?: any): NdefRecord;
    wifiSimpleRecord(credentials: WifiSimpleCredentials, id?: any): NdefRecord;
    androidApplicationRecord(pkgName: string): NdefRecord;
    record(
      tnf: TNF,
      type: string,
      id: string | any[],
      payload: string | any[],
    ): NdefRecord;
  };

  export const NfcErrorIOS: {
    errCodes: {
      unknown: -1;
      userCancel: 200;
      timeout: 201;
      unexpected: 202;
      systemBusy: 203;
      firstNdefInvalid: 204;
    };
    parse(errorString: string): number;
  }

  export namespace NfcError {
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
  }
}

export default nfcManager;
