import CoreNFC
import Foundation

public extension RNNfcManager {
    @objc(iso15693GetSystemInfo:callback:)
    static func iso15693GetSystemInfo(
        _ flags: NSNumber,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693GetSystemInfo(with: tagSession, flags: flags) { systemInfo, error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([NSNull(), systemInfo ?? [:]])
                }
            }
        )
    }

    @objc(iso15693ReadSingleBlock:callback:)
    static func iso15693ReadSingleBlock(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693ReadSingleBlock(with: tagSession, options: options) { resp, error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([NSNull(), resp ?? []])
                }
            }
        )
    }

    @objc(iso15693ReadMultipleBlocks:callback:)
    static func iso15693ReadMultipleBlocks(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693ReadMultipleBlocks(with: tagSession, options: options) { dataBlocks, error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([NSNull(), dataBlocks ?? []])
                }
            }
        )
    }

    @objc(iso15693WriteSingleBlock:callback:)
    static func iso15693WriteSingleBlock(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693WriteSingleBlock(with: tagSession, options: options) { error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([])
                }
            }
        )
    }

    @objc(iso15693LockBlock:callback:)
    static func iso15693LockBlock(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693LockBlock(with: tagSession, options: options) { error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([])
                }
            }
        )
    }

    @objc(iso15693WriteAFI:callback:)
    static func iso15693WriteAFI(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693WriteAFI(with: tagSession, options: options) { error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([])
                }
            }
        )
    }

    @objc(iso15693LockAFI:callback:)
    static func iso15693LockAFI(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693LockAFI(with: tagSession, options: options) { error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([])
                }
            }
        )
    }

    @objc(iso15693WriteDSFID:callback:)
    static func iso15693WriteDSFID(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693WriteDSFID(with: tagSession, options: options) { error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([])
                }
            }
        )
    }

    @objc(iso15693LockDSFID:callback:)
    static func iso15693LockDSFID(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693LockDSFID(with: tagSession, options: options) { error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([])
                }
            }
        )
    }

    @objc(iso15693ResetToReady:callback:)
    static func iso15693ResetToReady(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693ResetToReady(with: tagSession, options: options) { error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([])
                }
            }
        )
    }

    @objc(iso15693Select:callback:)
    static func iso15693Select(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693Select(with: tagSession, options: options) { error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([])
                }
            }
        )
    }

    @objc(iso15693StayQuiet:)
    static func iso15693StayQuiet(
        _ callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693StayQuiet(with: tagSession) { error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([])
                }
            }
        )
    }

    @objc(iso15693CustomCommand:callback:)
    static func iso15693CustomCommand(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            operation: { tagSession in
                iso15693CustomCommand(with: tagSession, options: options) { resp, error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([NSNull(), resp ?? []])
                }
            }
        )
    }

    @objc(iso15693SendRequest:callback:)
    static func iso15693SendRequest(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693SendRequest(with: tagSession, options: options) { responseFlag, resp, error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([NSNull(), [responseFlag ?? 0, resp ?? []]])
                }
            }
        )
    }

    @objc(iso15693ExtendedReadSingleBlock:callback:)
    static func iso15693ExtendedReadSingleBlock(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693ExtendedReadSingleBlock(with: tagSession, options: options) { resp, error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([NSNull(), resp ?? []])
                }
            }
        )
    }

    @objc(iso15693ExtendedReadMultipleBlocks:callback:)
    static func iso15693ExtendedReadMultipleBlocks(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693ExtendedReadMultipleBlocks(with: tagSession, options: options) { dataBlocks, error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([NSNull(), dataBlocks ?? []])
                }
            }
        )
    }

    @objc(iso15693ExtendedWriteSingleBlock:callback:)
    static func iso15693ExtendedWriteSingleBlock(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693ExtendedWriteSingleBlock(with: tagSession, options: options) { error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([])
                }
            }
        )
    }

    @objc(iso15693ExtendedLockBlock:callback:)
    static func iso15693ExtendedLockBlock(
        _ options: NSDictionary,
        callback: @escaping RNNfcResponseSenderBlock
    ) {
        forwardWithTagSessionSupport(
            isIso15693Supported(),
            callback: callback,
            noSessionMessage: "Not connected",
            operation: { tagSession in
                iso15693ExtendedLockBlock(with: tagSession, options: options) { error in
                    if let error {
                        callback([RNNfcSwiftUtil.errorMessage(from: error as NSError), NSNull()])
                        return
                    }

                    callback([])
                }
            }
        )
    }

    @objc(iso15693GetSystemInfoWithSession:flags:completion:)
    static func iso15693GetSystemInfo(
        with session: NFCTagReaderSession,
        flags: NSNumber,
        completion: @escaping RNNfcIso15693SystemInfoResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = NFCISO15693RequestFlag(rawValue: flags.uint8Value)
        tag.getSystemInfo(requestFlags: requestFlags) { dsfid, afi, blockSize, blockCount, icReference, error in
            if let error {
                completion(nil, error as NSError)
                return
            }

            completion(
                [
                    "dsfid": NSNumber(value: dsfid),
                    "afi": NSNumber(value: afi),
                    "blockSize": NSNumber(value: blockSize),
                    "blockCount": NSNumber(value: blockCount),
                    "icReference": NSNumber(value: icReference),
                ],
                nil
            )
        }
    }

    @objc(iso15693ReadSingleBlockWithSession:options:completion:)
    static func iso15693ReadSingleBlock(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcDataResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let flags = (options["flags"] as? NSNumber)?.uint8Value ?? 0
        let blockNumber = (options["blockNumber"] as? NSNumber)?.uint8Value ?? 0
        let requestFlags = NFCISO15693RequestFlag(rawValue: flags)

        tag.readSingleBlock(requestFlags: requestFlags, blockNumber: blockNumber) { resp, error in
            if let error {
                completion(nil, error as NSError)
                return
            }

            completion(RNNfcSwiftUtil.numberArray(from: resp), nil)
        }
    }

    @objc(iso15693ReadMultipleBlocksWithSession:options:completion:)
    static func iso15693ReadMultipleBlocks(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcIso15693BlocksResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let flags = (options["flags"] as? NSNumber)?.uint8Value ?? 0
        let blockNumber = (options["blockNumber"] as? NSNumber)?.intValue ?? 0
        let blockCount = (options["blockCount"] as? NSNumber)?.intValue ?? 0
        let requestFlags = NFCISO15693RequestFlag(rawValue: flags)
        let blockRange = NSRange(location: blockNumber, length: blockCount)

        tag.readMultipleBlocks(requestFlags: requestFlags, blockRange: blockRange) { dataBlocks, error in
            if let error {
                completion(nil, error as NSError)
                return
            }

            let blocks = dataBlocks.map { RNNfcSwiftUtil.numberArray(from: $0) }
            completion(blocks, nil)
        }
    }

    @objc(iso15693WriteSingleBlockWithSession:options:completion:)
    static func iso15693WriteSingleBlock(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcVoidResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = iso15693RequestFlags(from: options)
        let blockNumber = (options["blockNumber"] as? NSNumber)?.uint8Value ?? 0
        let dataBlockArray = (options["dataBlock"] as? [NSNumber]) ?? []
        let dataBlock = RNNfcSwiftUtil.data(from: dataBlockArray)

        tag.writeSingleBlock(requestFlags: requestFlags, blockNumber: blockNumber, dataBlock: dataBlock) { error in
            completion(error as NSError?)
        }
    }

    @objc(iso15693LockBlockWithSession:options:completion:)
    static func iso15693LockBlock(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcVoidResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = iso15693RequestFlags(from: options)
        let blockNumber = (options["blockNumber"] as? NSNumber)?.uint8Value ?? 0

        tag.lockBlock(requestFlags: requestFlags, blockNumber: blockNumber) { error in
            completion(error as NSError?)
        }
    }

    @objc(iso15693WriteAFIWithSession:options:completion:)
    static func iso15693WriteAFI(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcVoidResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = iso15693RequestFlags(from: options)
        let afi = (options["afi"] as? NSNumber)?.uint8Value ?? 0

        tag.writeAFI(requestFlags: requestFlags, afi: afi) { error in
            completion(error as NSError?)
        }
    }

    @objc(iso15693LockAFIWithSession:options:completion:)
    static func iso15693LockAFI(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcVoidResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = iso15693RequestFlags(from: options)
        tag.lockAFI(requestFlags: requestFlags) { error in
            completion(error as NSError?)
        }
    }

    @objc(iso15693WriteDSFIDWithSession:options:completion:)
    static func iso15693WriteDSFID(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcVoidResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = iso15693RequestFlags(from: options)
        let dsfid = (options["dsfid"] as? NSNumber)?.uint8Value ?? 0

        tag.writeDSFID(requestFlags: requestFlags, dsfid: dsfid) { error in
            completion(error as NSError?)
        }
    }

    @objc(iso15693LockDSFIDWithSession:options:completion:)
    static func iso15693LockDSFID(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcVoidResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = iso15693RequestFlags(from: options)
        tag.lockDFSID(requestFlags: requestFlags) { error in
            completion(error as NSError?)
        }
    }

    @objc(iso15693ResetToReadyWithSession:options:completion:)
    static func iso15693ResetToReady(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcVoidResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = iso15693RequestFlags(from: options)
        tag.resetToReady(requestFlags: requestFlags) { error in
            completion(error as NSError?)
        }
    }

    @objc(iso15693SelectWithSession:options:completion:)
    static func iso15693Select(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcVoidResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = iso15693RequestFlags(from: options)
        tag.select(requestFlags: requestFlags) { error in
            completion(error as NSError?)
        }
    }

    @objc(iso15693StayQuietWithSession:completion:)
    static func iso15693StayQuiet(
        with session: NFCTagReaderSession,
        completion: @escaping RNNfcVoidResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        tag.stayQuiet { error in
            completion(error as NSError?)
        }
    }

    @objc(iso15693CustomCommandWithSession:options:completion:)
    static func iso15693CustomCommand(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcDataResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = iso15693RequestFlags(from: options)
        let customCommandCode = (options["customCommandCode"] as? NSNumber)?.intValue ?? 0
        let requestParamsArray = (options["customRequestParameters"] as? [NSNumber]) ?? []
        let requestParams = RNNfcSwiftUtil.data(from: requestParamsArray)

        tag.customCommand(requestFlags: requestFlags, customCommandCode: customCommandCode, customRequestParameters: requestParams) { resp, error in
            if let error {
                completion(nil, error as NSError)
                return
            }

            completion(RNNfcSwiftUtil.numberArray(from: resp), nil)
        }
    }

    @objc(iso15693SendRequestWithSession:options:completion:)
    static func iso15693SendRequest(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcIso15693SendRequestResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(nil, nil, NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(nil, nil, NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = (options["flags"] as? NSNumber)?.intValue ?? 0
        let commandCode = (options["commandCode"] as? NSNumber)?.intValue ?? 0
        let dataArray = (options["data"] as? [NSNumber]) ?? []
        let data = RNNfcSwiftUtil.data(from: dataArray)

        tag.sendRequest(requestFlags: requestFlags, commandCode: commandCode, data: data) { result in
            switch result {
            case .failure(let error):
                completion(nil, nil, error as NSError)
            case .success(let payload):
                let (responseFlag, responseData) = payload
                completion(
                    NSNumber(value: responseFlag.rawValue),
                    RNNfcSwiftUtil.numberArray(from: responseData ?? Data()),
                    nil
                )
            }
        }
    }

    @objc(iso15693ExtendedReadSingleBlockWithSession:options:completion:)
    static func iso15693ExtendedReadSingleBlock(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcDataResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = iso15693RequestFlags(from: options)
        let blockNumber = (options["blockNumber"] as? NSNumber)?.intValue ?? 0

        tag.extendedReadSingleBlock(requestFlags: requestFlags, blockNumber: blockNumber) { resp, error in
            if let error {
                completion(nil, error as NSError)
                return
            }

            completion(RNNfcSwiftUtil.numberArray(from: resp), nil)
        }
    }

    @objc(iso15693ExtendedReadMultipleBlocksWithSession:options:completion:)
    static func iso15693ExtendedReadMultipleBlocks(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcIso15693BlocksResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(nil, NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = iso15693RequestFlags(from: options)
        let blockNumber = (options["blockNumber"] as? NSNumber)?.intValue ?? 0
        let blockCount = (options["blockCount"] as? NSNumber)?.intValue ?? 0
        let blockRange = NSRange(location: blockNumber, length: blockCount)

        tag.extendedReadMultipleBlocks(requestFlags: requestFlags, blockRange: blockRange) { dataBlocks, error in
            if let error {
                completion(nil, error as NSError)
                return
            }

            let blocks = dataBlocks.map { RNNfcSwiftUtil.numberArray(from: $0) }
            completion(blocks, nil)
        }
    }

    @objc(iso15693ExtendedWriteSingleBlockWithSession:options:completion:)
    static func iso15693ExtendedWriteSingleBlock(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcVoidResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = iso15693RequestFlags(from: options)
        let blockNumber = (options["blockNumber"] as? NSNumber)?.intValue ?? 0
        let dataBlockArray = (options["dataBlock"] as? [NSNumber]) ?? []
        let dataBlock = RNNfcSwiftUtil.data(from: dataBlockArray)

        tag.extendedWriteSingleBlock(requestFlags: requestFlags, blockNumber: blockNumber, dataBlock: dataBlock) { error in
            completion(error as NSError?)
        }
    }

    @objc(iso15693ExtendedLockBlockWithSession:options:completion:)
    static func iso15693ExtendedLockBlock(
        with session: NFCTagReaderSession,
        options: NSDictionary,
        completion: @escaping RNNfcVoidResultBlock
    ) {
        guard let connectedTag = session.connectedTag else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected"]))
            return
        }

        guard let tag = extractIso15693Tag(from: connectedTag) else {
            completion(NSError(domain: "RNNfcTechSwiftService", code: 7, userInfo: [NSLocalizedDescriptionKey: "incorrect tag type"]))
            return
        }

        let requestFlags = iso15693RequestFlags(from: options)
        let blockNumber = (options["blockNumber"] as? NSNumber)?.intValue ?? 0

        tag.extendedLockBlock(requestFlags: requestFlags, blockNumber: blockNumber) { error in
            completion(error as NSError?)
        }
    }

    @available(iOS 14.0, *)
    private static func extractIso15693Tag(from connectedTag: NFCTag) -> NFCISO15693Tag? {
        if case let .iso15693(tag) = connectedTag {
            return tag
        }
        return nil
    }

    @available(iOS 14.0, *)
    private static func iso15693RequestFlags(from options: NSDictionary) -> NFCISO15693RequestFlag {
        let rawValue = (options["flags"] as? NSNumber)?.uint8Value ?? 0
        return NFCISO15693RequestFlag(rawValue: rawValue)
    }
}
