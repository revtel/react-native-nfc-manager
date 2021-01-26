#if __has_include(<React/RCTBridgeModule.h>)
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#elif __has_include("React/RCTBridgeModule.h")
#import "React/RCTBridgeModule.h"
#else
#import "RCTBridgeModule.h"
#import <React/RCTEventEmitter.h>
#endif
#import <CoreNFC/CoreNFC.h>

@interface NfcManager : RCTEventEmitter <RCTBridgeModule, NFCNDEFReaderSessionDelegate, NFCTagReaderSessionDelegate> {

}

@property (strong, nonatomic) NFCNDEFReaderSession *session;
@property (strong, nonatomic) NFCTagReaderSession *tagSession;
@end
