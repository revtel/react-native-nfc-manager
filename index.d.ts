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

	interface NfcManager {

		start(options?: StartOptions): Promise<any>;

		isEnabled(): Promise<boolean>;

		goToNfcSetting(): Promise<any>;

		getLaunchTagEvent(): Promise<TagEvent>;

		registerTagEvent(listener: (tag: TagEvent) => void): Promise<any>;

		unregisterTagEvent(): Promise<any>;

	}
	const nfcManager: NfcManager;
	export default nfcManager;

	export namespace NdefParser {
		function parseUri(ndef: NdefRecord): ParseUriResult;
	}
}
