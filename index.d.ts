// Type definitions for react-native-nfc-manager
// Project: https://github.com/whitedogg13/react-native-nfc-manager
// Definitions by: April Ayres <april.ayres@papercut.com> and Paul Huynh <paul.huynh@papercut.com>

declare module 'react-native-nfc-manager' {
  export enum NfcEvents {
    DiscoverTag = 'NfcManagerDiscoverTag',
    SessionClosed = 'NfcManagerSessionClosed',
    StateChanged = 'NfcManagerStateChanged',
  }

  type OnDiscoverTag = (evt: TagEvent) => void;
  type OnSessionClosed = (evt: {}) => void;
  type OnStateChanged = (evt: {state: string}) => void;
  type OnNfcEvents = OnDiscoverTag | OnSessionClosed | OnStateChanged;

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
  }

  /** [iOS ONLY] */
  export enum Nfc15693RequestFlagIOS {
    DualSubCarriers = (1 << 0),
    HighDataRate = (1 << 1),
    ProtocolExtension = (1 << 3),
    Select = (1 << 4),
    Address = (1 << 5),
    Option = (1 << 6),
  }

  /** [ANDROID ONLY] */
  export enum NfcAdapter {
    FLAG_READER_NFC_A = 0x1,
    FLAG_READER_NFC_B = 0x2,
    FLAG_READER_NFC_F = 0x4,
    FLAG_READER_NFC_V = 0x8,
    FLAG_READER_NFC_BARCODE = 0x10,
    FLAG_READER_SKIP_NDEF_CHECK = 0x80,
    FLAG_READER_NO_PLATFORM_SOUNDS = 0x100,
  }

  export interface NdefRecord {
    id?: number[];
    tnf: number;
    type: number[];
    payload: any[];
  }

  export interface TagEvent {
    ndefMessage: NdefRecord[];
    maxSize?: number;
    type?: string;
    techTypes?: string[];
    id?: number[];
  }

  interface RegisterTagEventOpts {
    alertMessage?: string;
    invalidateAfterFirstRead?: boolean;
    isReaderModeEnabled?: boolean;
    readerModeFlags?: number;
  }

  interface NdefWriteOpts {
    format?: boolean;
    formatReadOnly?: boolean;
  }

  interface APDU {
    cla: number;
    ins: number;
    p1: number;
    p2: number;
    data: number[];
    le: number;
  }

  /** [iOS ONLY] */
  interface Iso15693HandlerIOS {
    getSystemInfo: (
      requestFloags: number,
    ) => Promise<{ dsfid: number, afi: number, blockSize: number, blockCount: number, icReference: number}>;
    readSingleBlock: (params: {flags: number, blockNumber: number}) => Promise<number[]>;
    writeSingleBlock: (params: {flags: number, blockNumber: number, dataBlock: number[]}) => Promise<void>; 
    lockBlock: (params: {flags: number, blockNumber: number}) => Promise<void>; 
    writeAFI: (params: {flags: number, afi: number}) => Promise<void>; 
    lockAFI: (params: {flags: number}) => Promise<void>; 
    writeDSFID: (params: {flags: number, dsfid: number}) => Promise<void>; 
    lockDSFID: (params: {flags: number}) => Promise<void>; 
    resetToReady: (params: {flags: number}) => Promise<void>; 
    select: (params: {flags: number}) => Promise<void>; 
    stayQuite: () => Promise<void>; 
    customCommand: (params: {flags: number, customCommandCode: number, customRequestParameters: number[]}) => Promise<number[]>;
    extendedReadSingleBlock: (params: {flags: number, blockNumber: number}) => Promise<number[]>;
    extendedWriteSingleBlock: (params: {flags: number, blockNumber: number, dataBlock: number[]}) => Promise<void>; 
    extendedLockBlock: (params: {flags: number, blockNumber: number}) => Promise<void>; 
  }

  interface NfcManager {
    start(): Promise<void>;

    isSupported(): Promise<boolean>;

    registerTagEvent(options?: RegisterTagEventOpts): Promise<void>;

    unregisterTagEvent(): Promise<void>;

    setEventListener(name: NfcEvents, callback: OnNfcEvents | null): void;

    requestTechnology: (tech: NfcTech) => Promise<NfcTech>;

    cancelTechnologyRequest: () => Promise<void>;

    getTag: () => Promise<any>;

    writeNdefMessage: (bytes: number[]) => Promise<void>;

    getNdefMessage: () => Promise<TagEvent | null>;

    /** [iOS ONLY] */
    setAlertMessageIOS: (alertMessage: string) => Promise<void>;
    /** [iOS ONLY] */
    invalidateSessionIOS: () => Promise<void>;
    /** [iOS ONLY] */
    invalidateSessionWithErrorIOS: (errorMessage: string) => Promise<void>;
    /** [iOS ONLY] */
    sendMifareCommandIOS: (bytes: number[]) => Promise<number[]>;
    /** [iOS ONLY] */
    sendCommandAPDUIOS: (
      bytesOrApdu: number[] | APDU,
    ) => Promise<{response: number[]; sw1: number; sw2: number}>;
    /** [iOS ONLY] */
    getIso15693HandlerIOS: () => Iso15693HandlerIOS;

    /** [ANDROID ONLY] */
    isEnabled(): Promise<boolean>;
    /** [ANDROID ONLY] */
    goToNfcSetting(): Promise<any>;
    /** [ANDROID ONLY] */
    getLaunchTagEvent(): Promise<TagEvent | null>;
    /** [ANDROID ONLY] */
    requestNdefWrite(bytes: number[], opts?: NdefWriteOpts): Promise<any>;
    /** [ANDROID ONLY] */
    cancelNdefWrite(): Promise<any>;
    /** [ANDROID ONLY] */
    getCachedNdefMessageAndroid: () => Promise<TagEvent | null>;
    /** [ANDROID ONLY] */
    makeReadOnlyAndroid: () => Promise<boolean>;
    /** [ANDROID ONLY] */
    transceive(bytes: number[]): Promise<number[]>;
    /** [ANDROID ONLY] */
    getMaxTransceiveLength(): Promise<number>;
    /** [ANDROID ONLY] */
    mifareClassicSectorToBlock: (sector: number) => Promise<ArrayLike<number>>;
    /** [ANDROID ONLY] */
    mifareClassicReadBlock: (
      block: ArrayLike<number>,
    ) => Promise<ArrayLike<number>>;
    /** [ANDROID ONLY] */
    mifareClassicWriteBlock: (
      block: ArrayLike<number>,
      simpliArr: any[],
    ) => Promise<void>;
    /** [ANDROID ONLY] */
    mifareClassicGetSectorCount: () => Promise<number>;
    /** [ANDROID ONLY] */
    mifareClassicAuthenticateA: (
      sector: number,
      keys: number[],
    ) => Promise<void>;
  }

  const nfcManager: NfcManager;

  export namespace NdefParser {
    function parseUri(ndef: NdefRecord): {uri: string};
    function parseText(ndef: NdefRecord): string | null;
  }

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

    MIME_WFA_WSC: "application/vnd.wfa.wsc";

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
    isType(record: NdefRecord, tnf: number, type: string): boolean;
    stringify(data: number[], separator: string): string;
    encodeMessage(records: NdefRecord[]): Uint8Array;
    decodeMessage(bytes: any[] | Buffer): NdefRecord[];
    textRecord(text: string, lang?: ISOLangCode, encoding?: any): NdefRecord;
    uriRecord(uri: URI, id?: any): NdefRecord;
    wifiSimpleRecord(credentials: WifiSimpleCredentials, id?: any): NdefRecord;
  };
}

export default nfcManager;
