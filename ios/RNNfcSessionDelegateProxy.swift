import CoreNFC
import Foundation

@objcMembers
@objc(RNNfcSessionDelegateProxy)
public class RNNfcSessionDelegateProxy: NSObject, NFCNDEFReaderSessionDelegate, NFCTagReaderSessionDelegate {
    public func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        NSLog("readerSession:didDetectNDEFs")
        if let firstMessage = messages.first {
            RNNfcBridgeUtil.emitEvent("NfcManagerDiscoverTag", body: ["ndefMessage": RNNfcManager.convertNdefMessage(firstMessage)])
        } else {
            RNNfcBridgeUtil.emitEvent("NfcManagerDiscoverTag", body: ["ndefMessage": []])
        }
    }

    public func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        NSLog("readerSession:didInvalidateWithError: (%@)", (error as NSError).localizedDescription)
        RNNfcManager.resetSessionsState()
        RNNfcManager.resetRequestState()
        RNNfcBridgeUtil.emitEvent("NfcManagerSessionClosed", body: ["error": RNNfcSwiftUtil.errorMessage(from: error as NSError)])
    }

    @available(iOS 13.0, *)
    public func tagReaderSession(_ session: NFCTagReaderSession, didDetect tags: [NFCTag]) {
        NSLog("NFCTag didDetectTags")
          guard let requestedTypes = RNNfcManager.runtimeTechRequestTypes,
              let callback = RNNfcManager.runtimeTechRequestCallback else {
            return
        }

        for tag in tags {
            let tagType = techName(for: tag)
            var matchedRequestType: String?
            for requestType in requestedTypes {
                if tagType == requestType || requestType == "Ndef" {
                    matchedRequestType = requestType
                    break
                }
            }

            guard let matchedRequestType else {
                continue
            }

            session.connect(to: tag) { error in
                if error != nil {
                    NSLog("NFCTag restarting polling")
                    session.restartPolling()
                    return
                }

                RNNfcManager.runtimeTechRequestCallback = nil
                callback([NSNull(), matchedRequestType])
            }
            return
        }
    }

    @available(iOS 13.0, *)
    public func tagReaderSession(_ session: NFCTagReaderSession, didInvalidateWithError error: Error) {
        NSLog("NFCTag didInvalidateWithError")

        if let callback = RNNfcManager.runtimeTechRequestCallback {
            callback([RNNfcSwiftUtil.errorMessage(from: error as NSError)])
            RNNfcManager.runtimeTechRequestCallback = nil
        }

        RNNfcManager.resetSessionsState()
        RNNfcManager.resetRequestState()
        RNNfcBridgeUtil.emitEvent("NfcManagerSessionClosed", body: ["error": RNNfcSwiftUtil.errorMessage(from: error as NSError)])
    }

    @available(iOS 13.0, *)
    public func tagReaderSessionDidBecomeActive(_ session: NFCTagReaderSession) {
        NSLog("NFCTag didBecomeActive")
    }

    private func techName(for tag: NFCTag) -> String {
        switch tag {
        case .miFare:
            return "mifare"
        case .feliCa:
            return "felica"
        case .iso15693:
            return "iso15693"
        case .iso7816:
            return "IsoDep"
        @unknown default:
            return "unknown"
        }
    }
}
