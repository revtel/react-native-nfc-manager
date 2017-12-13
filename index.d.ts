// Type definitions for react-native-nfc-manager
// Project: https://github.com/whitedogg13/react-native-nfc-manager
// Definitions by: April Ayres <april.ayres@papercut.com> and Paul Huynh <paul.huynh@papercut.com>

declare module 'react-native-nfc-manager' {

	export interface Tag {
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
		ndefMessage: Tag[];
		maxSize: number;
		type: string;
		techTypes: string[];
		id: number[];
	}

	interface NfcManager {

		start(options?: StartOptions): Promise<any>;

		isEnabled(): Promise<boolean>;

		goToNfcSetting(): Promise<any>;

		getLaunchTagEvent(): Promise<Tag>;

		registerTagEvent(listener: (tag: TagEvent) => void): Promise<any>;

		unregisterTagEvent(): Promise<any>;

	}
	const nfcManager: NfcManager;
	export default nfcManager;

	export namespace NdefParser {
		function parseUri(ndef: Tag): ParseUriResult;
	}
}
