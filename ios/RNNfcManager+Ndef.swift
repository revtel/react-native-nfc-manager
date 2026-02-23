import CoreNFC
import Foundation

public extension RNNfcManager {
    @objc(getNdefMessageFromTagSession:callback:)
    static func getNdefMessage(
        from tagSession: NFCTagReaderSession?,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        guard let ndefTag = requireConnectedNdefTag(from: tagSession) else {
            callback(["No ndef available", NSNull()])
            return
        }

        ndefTag.readNDEF { ndefMessage, error in
            if let error {
                callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                return
            }

            let converted = ndefMessage.map { convertNdefMessage($0) } ?? []
            callback([NSNull(), ["ndefMessage": converted]])
        }
    }

    @objc(writeNdefMessage:toTagSession:callback:)
    static func writeNdefMessage(
        _ bytes: [NSNumber],
        to tagSession: NFCTagReaderSession?,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        guard let ndefTag = requireConnectedNdefTag(from: tagSession) else {
            callback(["No ndef available", NSNull()])
            return
        }

        let data = RNNfcSwiftUtil.data(from: bytes)
        guard let ndefMessage = NFCNDEFMessage(data: data) else {
            callback(["invalid ndef msg"])
            return
        }

        ndefTag.writeNDEF(ndefMessage) { error in
            if let error {
                callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                return
            }

            callback([])
        }
    }

    @objc(makeTagReadOnlyFromTagSession:callback:)
    static func makeTagReadOnly(
        from tagSession: NFCTagReaderSession?,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        guard let ndefTag = requireConnectedNdefTag(from: tagSession) else {
            callback(["No ndef available", NSNull()])
            return
        }

        ndefTag.writeLock { error in
            if let error {
                callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                return
            }

            callback([])
        }
    }

    @objc(queryNdefStatusFromTagSession:callback:)
    static func queryNdefStatus(
        from tagSession: NFCTagReaderSession?,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        guard let ndefTag = requireConnectedNdefTag(from: tagSession) else {
            callback(["No ndef available", NSNull()])
            return
        }

        ndefTag.queryNDEFStatus { status, capacity, error in
            if let error {
                callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                return
            }

            let payload: [String: NSNumber] = [
                "status": NSNumber(value: Int(status.rawValue)),
                "capacity": NSNumber(value: Int(capacity)),
            ]
            callback([NSNull(), payload])
        }
    }

    private static func requireConnectedNdefTag(from tagSession: NFCTagReaderSession?) -> NFCNDEFTag? {
        guard let connectedTag = tagSession?.connectedTag else {
            return nil
        }

        return getNdefTagHandle(from: connectedTag)
    }

    private static func getNdefTagHandle(from tag: NFCTag) -> NFCNDEFTag? {
        switch tag {
        case .miFare(let mifareTag):
            return mifareTag
        case .iso7816(let iso7816Tag):
            return iso7816Tag
        case .feliCa(let felicaTag):
            return felicaTag
        case .iso15693(let iso15693Tag):
            return iso15693Tag
        @unknown default:
            return nil
        }
    }

}
