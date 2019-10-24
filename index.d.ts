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

  interface NfcManager {
    start(): Promise<void>;

    isSupported(): Promise<boolean>;

    registerTagEvent(options?: RegisterTagEventOpts): Promise<void>;

    unregisterTagEvent(): Promise<void>;

    setEventListener(name: NfcEvents, callback: OnNfcEvents): void;

    requestTechnology: (tech: NfcTech) => Promise<NfcTech>;

    cancelTechnologyRequest: () => Promise<void>;

    getTag: () => Promise<any>;

    writeNdefMessage: (bytes: number[]) => Promise<void>;

    getNdefMessage: (bytes: number[]) => Promise<TagEvent | null>;

    /** [iOS ONLY] */
    setAlertMessageIOS: (alertMessage: string) => Promise<void>;
    /** [iOS ONLY] */
    sendMifareCommandIOS: (bytes: number[]) => Promise<number[]>;
    /** [iOS ONLY] */
    sendCommandAPDUIOS: (
      bytes: number[],
    ) => Promise<{response: number[]; sw1: number; sw2: number}>;

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
  };
}

export default nfcManager;
