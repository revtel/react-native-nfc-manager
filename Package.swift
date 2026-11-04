// swift-tools-version: 6.0

import Foundation
import PackageDescription

let reactHeaders: [Target.Dependency] = [
    .product(name: "ReactHeaders", package: "ReactNative"),
    .product(name: "ReactNativeHeaders", package: "ReactNative"),
    .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
    .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
]

let usedRootEntries: Set<String> = ["ios", "spm-bridge", "spm-headers", "spm-support", "Package.swift"]
let unusedRootEntries = try! FileManager.default.contentsOfDirectory(atPath: Context.packageDirectory)
    .filter { !usedRootEntries.contains($0) }
    .sorted()
let iosDirectory = URL(fileURLWithPath: Context.packageDirectory).appendingPathComponent("ios")
let iosEntries = try! FileManager.default.subpathsOfDirectory(atPath: iosDirectory.path)
    .filter { !$0.contains(".xcodeproj/") }
func unusedIosEntries(sourceExtensions: Set<String>) -> [String] {
    iosEntries.filter { entry in
        let url = iosDirectory.appendingPathComponent(entry)
        if url.pathExtension == "xcodeproj" { return true }
        let isFile = try! url.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile == true
        return isFile && !sourceExtensions.contains(url.pathExtension)
    }
    .map { "ios/" + $0 }
    .sorted()
}
let unusedSwiftIosEntries = unusedIosEntries(sourceExtensions: ["swift"])
let unusedObjCIosEntries = unusedIosEntries(sourceExtensions: ["h", "m", "mm", "c", "cc", "cpp", "cxx"])
let bridgeSource = "ios/RNNfcBridgeUtil.mm"
let unusedBridgeIosEntries = unusedIosEntries(sourceExtensions: []).filter { $0 != bridgeSource }

let package = Package(
    name: "react_native_nfc_manager",
    platforms: [.iOS("15.1")],
    products: [
        .library(name: "react_native_nfc_manager", targets: ["react_native_nfc_manager", "NfcManagerObjC"]),
    ],
    dependencies: [
        // Resolved through React Native's generated autolinking libs directory.
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
    ],
    targets: [
        // The event bridge is independent of Swift, avoiding a dependency cycle.
        .target(
            name: "NfcManagerBridge",
            dependencies: reactHeaders,
            path: ".",
            exclude: unusedRootEntries + ["spm-support", "spm-headers"] + unusedBridgeIosEntries,
            sources: [bridgeSource],
            publicHeadersPath: "spm-bridge/include",
            cSettings: [.define("RCT_NEW_ARCH_ENABLED", to: "1")],
            cxxSettings: [
                .define("RCT_NEW_ARCH_ENABLED", to: "1"),
                .define("DEBUG", .when(configuration: .debug)),
                .define("NDEBUG", .when(configuration: .release)),
            ]
        ),
        .target(
            name: "react_native_nfc_manager",
            dependencies: [.target(name: "NfcManagerBridge")],
            path: ".",
            exclude: unusedRootEntries + ["spm-bridge", "spm-headers"] + unusedSwiftIosEntries,
            sources: ["ios", "spm-support"]
        ),
        .target(
            name: "NfcManagerObjC",
            dependencies: [.target(name: "react_native_nfc_manager")] + reactHeaders,
            path: ".",
            exclude: unusedRootEntries + ["spm-bridge", "spm-support", bridgeSource] + unusedObjCIosEntries,
            sources: ["ios"],
            publicHeadersPath: "spm-headers/public",
            cSettings: [.define("RCT_NEW_ARCH_ENABLED", to: "1")],
            cxxSettings: [
                .define("RCT_NEW_ARCH_ENABLED", to: "1"),
                .define("DEBUG", .when(configuration: .debug)),
                .define("NDEBUG", .when(configuration: .release)),
            ]
        ),
    ],
    swiftLanguageModes: [.v5],
    cxxLanguageStandard: .cxx20
)
