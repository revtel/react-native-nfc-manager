import Foundation

@objc(RNNfcSwiftUtil)
public class RNNfcSwiftUtil: NSObject {
    @objc(hexStringFromData:)
    public static func hexString(from data: Data) -> String {
        var output = String()
        output.reserveCapacity(data.count * 2)
        for byte in data {
            output += String(format: "%02X", byte)
        }
        return output
    }

    @objc(errorMessageFromError:)
    public static func errorMessage(from error: NSError) -> String {
        if let underlyingError = error.userInfo[NSUnderlyingErrorKey] as? NSError {
            return "\(error.domain):\(error.code),\(underlyingError.domain):\(underlyingError.code)"
        }

        return "\(error.domain):\(error.code)"
    }

    @objc(dataFromNumberArray:)
    public static func data(from numberArray: [NSNumber]) -> Data {
        let bytes = numberArray.map { $0.uint8Value }
        return Data(bytes)
    }

    @objc(numberArrayFromData:)
    public static func numberArray(from data: Data) -> [NSNumber] {
        return data.map { NSNumber(value: Int($0)) }
    }
}
