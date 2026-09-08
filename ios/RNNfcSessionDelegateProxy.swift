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
        guard RNNfcManager.isCurrentNdefSession(session) else {
            return
        }
        let invalidationCallback = RNNfcManager.takeSessionInvalidationCallback()
        RNNfcManager.resetSessionsState()
        RNNfcManager.resetRequestState()
        invalidationCallback?([])
        RNNfcBridgeUtil.emitEvent("NfcManagerSessionClosed", body: ["error": RNNfcSwiftUtil.errorMessage(from: error as NSError)])
    }

    @available(iOS 13.0, *)
    public func tagReaderSession(_ session: NFCTagReaderSession, didDetect tags: [NFCTag]) {
        NSLog("NFCTag didDetectTags")
        guard let requestedTypes = RNNfcManager.pendingTechnologyRequestTypes(for: session) else {
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
                    guard RNNfcManager.isCurrentTagSession(session) else {
                        return
                    }
                    NSLog("NFCTag restarting polling")
                    session.restartPolling()
                    return
                }

                guard let callback = RNNfcManager.takeTechnologyRequestCallback(for: session) else {
                    return
                }
                callback([NSNull(), matchedRequestType])
            }
            return
        }
    }

    @available(iOS 13.0, *)
    public func tagReaderSession(_ session: NFCTagReaderSession, didInvalidateWithError error: Error) {
        NSLog("NFCTag didInvalidateWithError")

        guard RNNfcManager.isCurrentTagSession(session) else {
            return
        }

        let callback = RNNfcManager.takeTechnologyRequestCallback(for: session)
        let invalidationCallback = RNNfcManager.takeSessionInvalidationCallback()
        RNNfcManager.resetSessionsState()
        RNNfcManager.resetRequestState()
        callback?([RNNfcSwiftUtil.errorMessage(from: error as NSError)])
        invalidationCallback?([])
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
