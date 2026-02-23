import CoreNFC
import Foundation

public extension RNNfcManager {
    @objc(sendCommandAPDUBytes:callback:)
    static func sendCommandAPDUBytes(
        _ bytes: [NSNumber],
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isTagSessionSupported(),
            callback: callback,
            operation: { tagSession in
                sendCommandAPDUBytes(with: tagSession, bytes: bytes) { response, sw1, sw2, error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([NSNull(), response ?? [], sw1 ?? 0, sw2 ?? 0])
                }
            }
        )
    }

    @objc(sendCommandAPDU:callback:)
    static func sendCommandAPDU(
        _ payload: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isTagSessionSupported(),
            callback: callback,
            operation: { tagSession in
                sendCommandAPDU(with: tagSession, payload: payload) { response, sw1, sw2, error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([NSNull(), response ?? [], sw1 ?? 0, sw2 ?? 0])
                }
            }
        )
    }

    @objc(sendCommandAPDUBytesWithSession:bytes:completion:)
    static func sendCommandAPDUBytes(
        with session: NFCTagReaderSession,
        bytes: [NSNumber],
        completion: @escaping RNNfcIsoDepResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(nil, nil, nil, NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        let iso7816Tag = extractIso7816Tag(from: connectedTag)
        guard let iso7816Tag else {
            completion(nil, nil, nil, NSError(domain: "RNNfcTechSwiftService", code: 4, userInfo: [NSLocalizedDescriptionKey: "not an iso7816 tag"]))
            return
        }

        let data = RNNfcSwiftUtil.data(from: bytes)
        guard let apdu = NFCISO7816APDU(data: data) else {
            completion(nil, nil, nil, NSError(domain: "RNNfcTechSwiftService", code: 5, userInfo: [NSLocalizedDescriptionKey: "invalid apdu data"]))
            return
        }

        iso7816Tag.sendCommand(apdu: apdu) { response, sw1, sw2, error in
            if let error {
                completion(nil, nil, nil, error as NSError)
                return
            }

            completion(
                RNNfcSwiftUtil.numberArray(from: response),
                NSNumber(value: Int(sw1)),
                NSNumber(value: Int(sw2)),
                nil
            )
        }
    }

    @objc(sendCommandAPDUWithSession:payload:completion:)
    static func sendCommandAPDU(
        with session: NFCTagReaderSession,
        payload: NSDictionary,
        completion: @escaping RNNfcIsoDepResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(nil, nil, nil, NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        let iso7816Tag = extractIso7816Tag(from: connectedTag)
        guard let iso7816Tag else {
            completion(nil, nil, nil, NSError(domain: "RNNfcTechSwiftService", code: 4, userInfo: [NSLocalizedDescriptionKey: "not an iso7816 tag"]))
            return
        }

        guard
            let cla = payload["cla"] as? NSNumber,
            let ins = payload["ins"] as? NSNumber,
            let p1 = payload["p1"] as? NSNumber,
            let p2 = payload["p2"] as? NSNumber,
            let dataArray = payload["data"] as? [NSNumber],
            let le = payload["le"] as? NSNumber
        else {
            completion(nil, nil, nil, NSError(domain: "RNNfcTechSwiftService", code: 6, userInfo: [NSLocalizedDescriptionKey: "invalid apdu payload"]))
            return
        }

        let data = RNNfcSwiftUtil.data(from: dataArray)
        let apdu = NFCISO7816APDU(
            instructionClass: cla.uint8Value,
            instructionCode: ins.uint8Value,
            p1Parameter: p1.uint8Value,
            p2Parameter: p2.uint8Value,
            data: data,
            expectedResponseLength: le.intValue
        )

        iso7816Tag.sendCommand(apdu: apdu) { response, sw1, sw2, error in
            if let error {
                completion(nil, nil, nil, error as NSError)
                return
            }

            completion(
                RNNfcSwiftUtil.numberArray(from: response),
                NSNumber(value: Int(sw1)),
                NSNumber(value: Int(sw2)),
                nil
            )
        }
    }

    private static func extractIso7816Tag(from connectedTag: NFCTag) -> NFCISO7816Tag? {
        if case let .iso7816(tag) = connectedTag {
            return tag
        }
        return nil
    }
}
