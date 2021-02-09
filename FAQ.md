# FAQ

## [iOS] cannot write NDEF into NFC tags

iOS won't allow writing NDEF into un-formatted tags, so you should first format your tags. For type 2 tags (most NTAG2xx), you can use an app like NFC Tools or NXP Tag Writer to do perform formatting.

## [iOS] cannot read NDEF from NFC tags

The same as above, please check if the tag is properly formatted, and contain at least 1 NdefMessage 
* This NdefMessage can contain only one NdefRecord as [TNF_EMPTY](https://developer.android.com/reference/android/nfc/NdefRecord#TNF_EMPTY)

## [iOS] cannot read / write Mifare Classic

Indeed, currently MifareClassic isn't supported by Core NFC in our tests. It is also not listed in Core NFC's [NFCMiFareFamily](https://developer.apple.com/documentation/corenfc/nfcmifarefamily?language=objc)
