import CoreNFC
import Foundation

public extension RNNfcManager {
    @objc(sendMifareCommand:callback:)
    static func sendMifareCommand(
        _ bytes: [NSNumber],
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isTagSessionSupported(),
            callback: callback,
            operation: { tagSession in
                sendMifareCommand(with: tagSession, bytes: bytes) { response, error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([NSNull(), response ?? []])
                }
            }
        )
    }

    @objc(sendMifareCommandWithSession:bytes:completion:)
    static func sendMifareCommand(
        with session: NFCTagReaderSession,
        bytes: [NSNumber],
        completion: @escaping RNNfcDataResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        let mifareTag = extractMifareTag(from: connectedTag)
        guard let mifareTag else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 2, userInfo: [NSLocalizedDescriptionKey: "not a mifare tag"]))
            return
        }

        let data = RNNfcSwiftUtil.data(from: bytes)
        NSLog("input bytes: %@", RNNfcSwiftUtil.hexString(from: data))
        mifareTag.sendMiFareCommand(commandPacket: data) { response, error in
            if let error {
                completion(nil, error as NSError)
                return
            }

            completion(RNNfcSwiftUtil.numberArray(from: response), nil)
        }
    }

    private static func extractMifareTag(from connectedTag: NFCTag) -> NFCMiFareTag? {
        if case let .miFare(tag) = connectedTag {
            return tag
        }
        return nil
    }
}
