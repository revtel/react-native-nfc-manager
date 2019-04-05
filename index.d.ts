import { EmitterSubscription } from "react-native";

// Type definitions for react-native-nfc-manager
// Project: https://github.com/whitedogg13/react-native-nfc-manager
// Definitions by: April Ayres <april.ayres@papercut.com> and Paul Huynh <paul.huynh@papercut.com>

declare module 'react-native-nfc-manager' {
	export interface NdefRecord {
		id?: number[];
		tnf: number;
		type: number[];
		payload: any[];
	}

	export interface ParseUriResult {
		uri: string;
	}

	export interface StartOptions {
		onSessionClosedIOS(): void;
	}

	export interface TagEvent {
		ndefMessage: NdefRecord[];
		maxSize: number;
		type: string;
		techTypes: string[];
		id: number[];
	}

	interface RegisterTagEventOpts {
    invalidateAfterFirstRead?: boolean;
    isReaderModeEnabled?: boolean;
    readerModeFlags?: number;
  }

	interface NdefWriteOpts {
		format?: boolean
		formatReadOnly?: boolean
	}
	interface EventStateChange {
		state: string
	}
	interface NfcManager {

		start(options?: StartOptions): Promise<any>;

		stop(): void;

		isSupported(): Promise<boolean>;

		/** [ANDROID ONLY] */
		isEnabled(): Promise<boolean>;

		/** [ANDROID ONLY] */
		goToNfcSetting(): Promise<any>;

		/** [ANDROID ONLY] */
		getLaunchTagEvent(): Promise<TagEvent | null>;

		 /**
     * Start to listen to ANY NFC Tags
     * @param listener The callback function when a tag is found.
     * @param alertMessage [iOS ONLY] Message displayed when NFC Scanning popup appears.
     * @param invalidateAfterFirstRead [iOS ONLY] When set to true, will auto-dismiss the NFC Scanning popup after scanning.
     */
    registerTagEvent(
      listener: (tag: TagEvent) => void,
      alertMessage?: string,
      options?: RegisterTagEventOpts,
		): Promise<any>;

		unregisterTagEvent(): Promise<any>;
		/* android only */
		cancelNdefWrite(): Promise<any>;
		requestNdefWrite(bytes: number[], opts?: NdefWriteOpts): Promise<any>;
		onStateChanged(listener: (event: EventStateChange) => void): Promise<EmitterSubscription>;
	}
	const nfcManager: NfcManager;
	export namespace NdefParser {
		function parseUri(ndef: NdefRecord): ParseUriResult;
		function parseText(ndef: NdefRecord): string | null;
	}

	type ISOLangCode = "en" | string;
	type URI = string;

	export enum NfcAdapter {
		FLAG_READER_NFC_A= 0x1,
		FLAG_READER_NFC_B= 0x2,
		FLAG_READER_NFC_F= 0x4,
		FLAG_READER_NFC_V= 0x8,
		FLAG_READER_NFC_BARCODE= 0x10,
		FLAG_READER_SKIP_NDEF_CHECK= 0x80,
		FLAG_READER_NO_PLATFORM_SOUNDS= 0x100,
	}

	export const Ndef: {
		TNF_EMPTY: 0x0,
		TNF_WELL_KNOWN: 0x01,
		TNF_MIME_MEDIA: 0x02,
		TNF_ABSOLUTE_URI: 0x03,
		TNF_EXTERNAL_TYPE: 0x04,
		TNF_UNKNOWN: 0x05,
		TNF_UNCHANGED: 0x06,
		TNF_RESERVED: 0x07,
	
		RTD_TEXT: "T", // [0x54]
		RTD_URI: "U", // [0x55]
		RTD_SMART_POSTER: "Sp", // [0x53, 0x70]
		RTD_ALTERNATIVE_CARRIER: "ac", //[0x61, 0x63]
		RTD_HANDOVER_CARRIER: "Hc", // [0x48, 0x63]
		RTD_HANDOVER_REQUEST: "Hr", // [0x48, 0x72]
		RTD_HANDOVER_SELECT: "Hs", // [0x48, 0x73]
		
		text: {
			encodePayload: (text: string, lang?: ISOLangCode, encoding?: any) => NdefRecord;
			decodePayload: (data: byte[]) => string;
		};
		uri: {
			encodePayload: (uri: URI) => NdefRecord;
			decodePayload: (data: byte[]) => string;
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
		encodeMessage(records: NdefRecord[]): byte[];
		decodeMessage(bytes: any[] | Buffer): NdefRecord[];
		textRecord(text: string, lang?: ISOLangCode, encoding?: any): NdefRecord;
		uriRecord(uri: URI, id?: any): NdefRecord;
	}
}

export default nfcManager;
