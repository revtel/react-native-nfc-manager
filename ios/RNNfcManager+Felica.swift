import CoreNFC
import Foundation

public extension RNNfcManager {
    @objc(sendFelicaCommand:callback:)
    static func sendFelicaCommand(
        _ bytes: [NSNumber],
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isTagSessionSupported(),
            callback: callback,
            operation: { tagSession in
                sendFelicaCommand(with: tagSession, bytes: bytes) { response, error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([NSNull(), response ?? []])
                }
            }
        )
    }

    @objc(sendFelicaCommandWithSession:bytes:completion:)
    static func sendFelicaCommand(
        with session: NFCTagReaderSession,
        bytes: [NSNumber],
        completion: @escaping RNNfcDataResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        let felicaTag = extractFelicaTag(from: connectedTag)
        guard let felicaTag else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 3, userInfo: [NSLocalizedDescriptionKey: "not a felica tag"]))
            return
        }

        let data = RNNfcSwiftUtil.data(from: bytes)
        NSLog("input bytes: %@", RNNfcSwiftUtil.hexString(from: data))
        felicaTag.sendFeliCaCommand(commandPacket: data) { response, error in
            if let error {
                completion(nil, error as NSError)
                return
            }

            completion(RNNfcSwiftUtil.numberArray(from: response), nil)
        }
    }

    private static func extractFelicaTag(from connectedTag: NFCTag) -> NFCFeliCaTag? {
        if case let .feliCa(tag) = connectedTag {
            return tag
        }
        return nil
    }
}
