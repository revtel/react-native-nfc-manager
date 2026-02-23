import CoreNFC
import Foundation

@objc(RNNfcManager)
public class RNNfcManager: NSObject {
    static var runtimeSession: NFCNDEFReaderSession?
    static var runtimeTagSession: NFCTagReaderSession?
    static var runtimeSessionDelegateProxy: NSObject?
    static var runtimeTechRequestTypes: [String]?
    static var runtimeTechRequestCallback: RNNfcResponseSenderBlock?

    static func resetSessionsState() {
        runtimeSession = nil
        runtimeTagSession = nil
        runtimeSessionDelegateProxy = nil
    }

    static func resetRequestState() {
        runtimeTechRequestTypes = nil
        runtimeTechRequestCallback = nil
    }

    @objc(isTagSessionSupported)
    public static func isTagSessionSupported() -> Bool {
        if #available(iOS 13.0, *) {
            return true
        }
        return false
    }

    @objc(isIso15693Supported)
    public static func isIso15693Supported() -> Bool {
        if #available(iOS 14.0, *) {
            return true
        }
        return false
    }

    static func forwardWithTagSessionSupport(
        _ isSupported: Bool,
        callback: @escaping RNNfcResponseSenderBlock,
        operation: @escaping (NFCTagReaderSession) -> Void
    ) {
        forwardWithTagSessionSupport(
            isSupported,
            callback: callback,
            noSessionMessage: "Not even registered",
            operation: operation
        )
    }

    static func forwardWithTagSessionSupport(
        _ isSupported: Bool,
        callback: @escaping RNNfcResponseSenderBlock,
        noSessionMessage: String,
        operation: @escaping (NFCTagReaderSession) -> Void
    ) {
        if !isSupported {
            callback(["Not support in this device", NSNull()])
            return
        }

        guard let tagSession = runtimeTagSession else {
            callback([noSessionMessage, NSNull()])
            return
        }

        guard tagSession.connectedTag != nil else {
            callback(["Not connected", NSNull()])
            return
        }

        operation(tagSession)
    }
}

public extension RNNfcManager {
    @objc(convertNdefMessage:)
    static func convertNdefMessage(_ message: NFCNDEFMessage) -> NSArray {
        return message.records.map { record in
            [
                "id": RNNfcSwiftUtil.numberArray(from: record.identifier),
                "payload": RNNfcSwiftUtil.numberArray(from: record.payload),
                "type": RNNfcSwiftUtil.numberArray(from: record.type),
                "tnf": NSNumber(value: Int(record.typeNameFormat.rawValue)),
            ]
        } as NSArray
    }

    @objc(getTagFromTagSession:callback:)
    static func getTag(
        from tagSession: NFCTagReaderSession?,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        guard let tagSession else {
            callback(["No session available", NSNull()])
            return
        }

        guard let connectedTag = tagSession.connectedTag else {
            callback([NSNull(), [:]])
            return
        }

        var tagInfo = rnTag(from: connectedTag)
        guard let ndefTag = ndefTagHandle(from: connectedTag) else {
            callback([NSNull(), tagInfo])
            return
        }

        ndefTag.readNDEF { ndefMessage, _ in
            if let ndefMessage {
                tagInfo["ndefMessage"] = convertNdefMessage(ndefMessage)
            }
            callback([NSNull(), tagInfo])
        }
    }

    @objc(getTagWithCallback:)
    static func getTag(
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 13.0, *) {
            getTag(from: runtimeTagSession, callback: callback)
            return
        }

        callback(["Not support in this device", NSNull()])
    }

    private static func rnTechName(for tag: NFCTag) -> String {
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

    private static func rnTag(from tag: NFCTag) -> [String: Any] {
        var tagInfo: [String: Any] = ["tech": rnTechName(for: tag)]

        switch tag {
        case .miFare(let mifareTag):
            tagInfo["id"] = RNNfcSwiftUtil.hexString(from: mifareTag.identifier)
        case .iso7816(let iso7816Tag):
            tagInfo["id"] = RNNfcSwiftUtil.hexString(from: iso7816Tag.identifier)
            tagInfo["initialSelectedAID"] = iso7816Tag.initialSelectedAID
            if let historicalBytes = iso7816Tag.historicalBytes {
                tagInfo["historicalBytes"] = RNNfcSwiftUtil.numberArray(from: historicalBytes)
            }
            if let applicationData = iso7816Tag.applicationData {
                tagInfo["applicationData"] = RNNfcSwiftUtil.numberArray(from: applicationData)
            }
        case .iso15693(let iso15693Tag):
            tagInfo["id"] = RNNfcSwiftUtil.hexString(from: iso15693Tag.identifier)
            tagInfo["icManufacturerCode"] = NSNumber(value: Int(iso15693Tag.icManufacturerCode))
            tagInfo["icSerialNumber"] = RNNfcSwiftUtil.numberArray(from: iso15693Tag.icSerialNumber)
        case .feliCa(let felicaTag):
            tagInfo["idm"] = RNNfcSwiftUtil.hexString(from: felicaTag.currentIDm)
            tagInfo["systemCode"] = RNNfcSwiftUtil.hexString(from: felicaTag.currentSystemCode)
        @unknown default:
            break
        }

        return tagInfo
    }

    private static func ndefTagHandle(from tag: NFCTag) -> NFCNDEFTag? {
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

public extension RNNfcManager {
    @objc(resetRuntimeState)
    static func resetRuntimeState() {
        resetSessionsState()
        resetRequestState()
    }

    @objc(isSupported:callback:)
    static func isSupported(
        _ tech: String,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if tech.isEmpty || tech == "Ndef" {
            if #available(iOS 11.0, *) {
                callback([NSNull(), NFCNDEFReaderSession.readingAvailable ? NSNumber(value: true) : NSNumber(value: false)])
                return
            }
        } else if tech == "mifare" || tech == "felica" || tech == "iso15693" || tech == "IsoDep" {
            if #available(iOS 13.0, *) {
                callback([NSNull(), NFCTagReaderSession.readingAvailable ? NSNumber(value: true) : NSNumber(value: false)])
                return
            }
        }

        callback([NSNull(), NSNumber(value: false)])
    }

    @objc(startWithCallback:)
    static func start(
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 11.0, *) {
            if NFCNDEFReaderSession.readingAvailable {
                NSLog("NfcManager initialized")
                resetRuntimeState()
                callback([])
                return
            }
        }

        callback(["Not support in this device", NSNull()])
    }

    @objc(createSessionDelegateProxy)
    static func createSessionDelegateProxy() -> NSObject {
        return RNNfcSessionDelegateProxy()
    }

    @objc(ensureNoActiveSessionForCallback:)
    static func ensureNoActiveSession(
        for callback: @escaping RNNfcResponseSenderBlock
    ) -> Bool {
        if runtimeSession == nil && runtimeTagSession == nil {
            return true
        }

        callback(["Duplicated registration", NSNull()])
        return false
    }

    @objc(createAndBeginTagSessionWithTechs:options:callback:)
    static func createAndBeginTagSession(
        with techs: [String],
        options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 13.0, *) {
            if !ensureNoActiveSession(for: callback) {
                return
            }

            var pollFlags: NFCTagReaderSession.PollingOption = [.iso14443, .iso15693]
            if techs.contains("felica") {
                pollFlags.insert(.iso18092)
            }

            let delegate = RNNfcSessionDelegateProxy()
            guard let tagSession = NFCTagReaderSession(pollingOption: pollFlags, delegate: delegate, queue: .main) else {
                callback(["Failed to create NFC session", NSNull()])
                return
            }
            if let alertMessage = options["alertMessage"] as? String {
                tagSession.alertMessage = alertMessage
            }

            runtimeSessionDelegateProxy = delegate
            runtimeTagSession = tagSession
            runtimeTechRequestTypes = techs
            runtimeTechRequestCallback = callback

            tagSession.begin()
            return
        }

        callback(["Not support in this device", NSNull()])
    }

    @objc(createAndBeginNdefSessionWithOptions:callback:)
    static func createAndBeginNdefSession(
        with options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 11.0, *) {
            if !ensureNoActiveSession(for: callback) {
                return
            }

            let invalidateAfterFirstRead = options["invalidateAfterFirstRead"] as? Bool ?? false
            let delegate = RNNfcSessionDelegateProxy()
            let ndefSession = NFCNDEFReaderSession(delegate: delegate, queue: .main, invalidateAfterFirstRead: invalidateAfterFirstRead)

            if let alertMessage = options["alertMessage"] as? String {
                ndefSession.alertMessage = alertMessage
            }

            runtimeSessionDelegateProxy = delegate
            runtimeSession = ndefSession

            ndefSession.begin()
            callback([])
            return
        }

        callback(["Not support in this device", NSNull()])
    }

    @objc(requireTagSessionRegisteredWithCallback:noSessionMessage:)
    static func requireTagSessionRegistered(
        callback: @escaping RNNfcResponseSenderBlock,
        noSessionMessage: String
    ) -> NFCTagReaderSession? {
        guard let tagSession = runtimeTagSession else {
            callback([noSessionMessage, NSNull()])
            return nil
        }

        return tagSession
    }

    @objc(requireNdefSessionRegisteredWithCallback:noSessionMessage:)
    static func requireNdefSessionRegistered(
        callback: @escaping RNNfcResponseSenderBlock,
        noSessionMessage: String
    ) -> NFCNDEFReaderSession? {
        guard let ndefSession = runtimeSession else {
            callback([noSessionMessage, NSNull()])
            return nil
        }

        return ndefSession
    }

    @objc(invalidateActiveSessionWithCallback:)
    static func invalidateActiveSession(
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if let ndefSession = runtimeSession {
            ndefSession.invalidate()
            runtimeSession = nil
            callback([])
            return
        }

        if #available(iOS 13.0, *), let tagSession = runtimeTagSession {
            tagSession.invalidate()
            runtimeTagSession = nil
            callback([])
            return
        }

        callback(["No active session", NSNull()])
    }

    @objc(invalidateSessionWithCallback:)
    static func invalidateSession(
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 13.0, *) {
            invalidateActiveSession(callback: callback)
        }
    }

    @objc(invalidateActiveSessionWithErrorMessage:callback:)
    static func invalidateActiveSession(
        withErrorMessage errorMessage: String,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if let ndefSession = runtimeSession {
            ndefSession.invalidate(errorMessage: errorMessage)
            runtimeSession = nil
            callback([])
            return
        }

        if #available(iOS 13.0, *), let tagSession = runtimeTagSession {
            tagSession.invalidate(errorMessage: errorMessage)
            runtimeTagSession = nil
            callback([])
            return
        }

        callback(["No active session", NSNull()])
    }

    @objc(invalidateSessionWithErrorMessage:callback:)
    static func invalidateSession(
        withErrorMessage errorMessage: String,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 13.0, *) {
            invalidateActiveSession(withErrorMessage: errorMessage, callback: callback)
        }
    }

    @objc(restartTechnologyRequestWithCallback:)
    static func restartTechnologyRequest(
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 13.0, *) {
            guard let tagSession = requireTagSessionRegistered(
                callback: callback,
                noSessionMessage: "No active registration"
            ) else {
                return
            }

            NSLog("NfcManager restarting polling")
            tagSession.restartPolling()
            runtimeTechRequestCallback = callback
            return
        }

        callback(["Not support in this device", NSNull()])
    }

    @objc(cancelTechnologyRequestWithCallback:)
    static func cancelTechnologyRequest(
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 13.0, *) {
            guard let tagSession = requireTagSessionRegistered(
                callback: callback,
                noSessionMessage: "Not even registered"
            ) else {
                return
            }

            tagSession.invalidate()
            runtimeTagSession = nil
            callback([])
            return
        }

        callback(["Not support in this device", NSNull()])
    }

    @objc(unregisterTagEventWithCallback:)
    static func unregisterTagEvent(
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 11.0, *) {
            guard let ndefSession = requireNdefSessionRegistered(
                callback: callback,
                noSessionMessage: "Not even registered"
            ) else {
                return
            }

            ndefSession.invalidate()
            runtimeSession = nil
            callback([])
            return
        }

        callback(["Not support in this device", NSNull()])
    }

    @objc(setAlertMessage:callback:)
    static func setAlertMessage(
        _ alertMessage: String,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 11.0, *) {
            if let ndefSession = runtimeSession {
                ndefSession.alertMessage = alertMessage
                callback([])
                return
            }

            if #available(iOS 13.0, *), let tagSession = runtimeTagSession {
                tagSession.alertMessage = alertMessage
                callback([])
                return
            }

            callback(["Not even registered", NSNull()])
            return
        }

        callback(["Not support in this device", NSNull()])
    }

    @objc(isSessionAvailableWithCallback:)
    static func isSessionAvailable(
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 11.0, *) {
            callback([NSNull(), runtimeSession != nil ? NSNumber(value: true) : NSNumber(value: false)])
            return
        }

        callback(["Not support in this device", NSNull()])
    }

    @objc(isTagSessionAvailableWithCallback:)
    static func isTagSessionAvailable(
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 11.0, *) {
            callback([NSNull(), runtimeTagSession != nil ? NSNumber(value: true) : NSNumber(value: false)])
            return
        }

        callback(["Not support in this device", NSNull()])
    }

    @objc(getNdefMessageWithCallback:)
    static func getNdefMessage(
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 13.0, *) {
            getNdefMessage(from: runtimeTagSession, callback: callback)
            return
        }

        callback(["Not support in this device", NSNull()])
    }

    @objc(writeNdefMessage:options:callback:)
    static func writeNdefMessage(
        _ bytes: [NSNumber],
        options _: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 13.0, *) {
            writeNdefMessage(bytes, to: runtimeTagSession, callback: callback)
            return
        }

        callback(["Not support in this device", NSNull()])
    }

    @objc(makeReadOnlyWithCallback:)
    static func makeReadOnly(
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 13.0, *) {
            makeTagReadOnly(from: runtimeTagSession, callback: callback)
            return
        }

        callback(["Not support in this device", NSNull()])
    }

    @objc(queryNdefStatusWithCallback:)
    static func queryNdefStatus(
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        if #available(iOS 13.0, *) {
            queryNdefStatus(from: runtimeTagSession, callback: callback)
            return
        }

        callback(["Not support in this device", NSNull()])
    }
}