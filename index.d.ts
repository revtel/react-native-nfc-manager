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
    invalidateAfterFirstRead: boolean;
    isReaderModeEnabled: boolean;
    readerModeFlags: number;
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

	export const Ndef: {
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
		stringify(data: number[], separator: string);
		encodeMessage(records: NdefRecord[]);
		decodeMessage(bytes: any[] | Buffer): NdefRecord[];
		textRecord(text: string, lang?: ISOLangCode, encoding?: any): NdefRecord;
		uriRecord(uri: URI, id?: any): NdefRecord;
	}
}

export default nfcManager;
