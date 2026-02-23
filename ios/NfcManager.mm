#import "NfcManager.h"
#import "React/RCTBridge.h"
#import "React/RCTConvert.h"
#import "React/RCTEventDispatcher.h"
#import "React/RCTLog.h"
#import "RNNfcBridgeUtil.h"
#import "RNNfcManager.h"

@implementation NfcManager {
}

RCT_EXPORT_MODULE()

static NSString *const kBgNfcTagNotification = @"RNBgNfcTagNotification";
NSArray * bgNdefRecords = nil;

+ (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && (__IPHONE_OS_VERSION_MAX_ALLOWED >= 12000) /* __IPHONE_12_0 */
(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> *_Nullable))restorationHandler {
#else
    (nonnull void (^)(NSArray *_Nullable))restorationHandler {
#endif
    if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
        if (@available(iOS 12.0, *)) {
            NFCNDEFMessage * ndefMessage = userActivity.ndefMessagePayload;
            if (ndefMessage != nil) {
                bgNdefRecords = [RNNfcManager convertNdefMessage:ndefMessage];
                [[NSNotificationCenter defaultCenter] postNotificationName:kBgNfcTagNotification
                                                                    object:self
                                                                  userInfo:nil];
            }
        }
    }
    return YES;
}
    
- (void)handleBgNfcTagNotification:(NSNotification *)notification
{
    [RNNfcBridgeUtil emitEvent:@"NfcManagerDiscoverBackgroundTag"
                          body:@{@"ndefMessage": bgNdefRecords}];
}
    
- (instancetype)init
{
    if (self = [super init]) {
        NSLog(@"NfcManager created");
        [RNNfcBridgeUtil setEventEmitter:self];
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(handleBgNfcTagNotification:)
                                                     name:kBgNfcTagNotification
                                                   object:nil];
    }
    
    return self;
}

- (void)reset
{
    [RNNfcManager resetRuntimeState];
}

- (NSArray<NSString *> *)supportedEvents
{
    return @[
             @"NfcManagerDiscoverTag",
             @"NfcManagerDiscoverBackgroundTag",
             @"NfcManagerSessionClosed"
             ];
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}
    
- (void)getBackgroundTag: (nonnull RCTResponseSenderBlock)callback
{
    if (bgNdefRecords != nil) {
        // iOS doesn't report the full tag, only the ndefMessage part
        callback(@[[NSNull null], @{@"ndefMessage": bgNdefRecords}]);
    } else {
        callback(@[[NSNull null], [NSNull null]]);
    }
}

- (void)clearBackgroundTag: (nonnull RCTResponseSenderBlock)callback
{
    bgNdefRecords = nil;
    callback(@[[NSNull null]]);
}

- (void)isSupported: (NSString *)tech callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager isSupported:tech callback:callback];
}

- (void)start: (nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager startWithCallback:callback];
}

-(void)requestTechnology: (NSArray *)techs options: (NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager createAndBeginTagSessionWithTechs:techs options:options callback:callback];
}

- (void)restartTechnologyRequest:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager restartTechnologyRequestWithCallback:callback];
}

- (void)cancelTechnologyRequest:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager cancelTechnologyRequestWithCallback:callback];
}

- (void)registerTagEvent:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager createAndBeginNdefSessionWithOptions:options callback:callback];
}

- (void)unregisterTagEvent:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager unregisterTagEventWithCallback:callback];
}

- (void)invalidateSession:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager invalidateSessionWithCallback:callback];
}

- (void)invalidateSessionWithError:(NSString *)errorMessage callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager invalidateSessionWithErrorMessage:errorMessage callback:callback];
}

- (void)getTag: (nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager getTagWithCallback:callback];
}

- (void)getNdefMessage: (nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager getNdefMessageWithCallback:callback];
}

- (void)writeNdefMessage:(NSArray*)bytes options:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager writeNdefMessage:bytes options:options callback:callback];
}

- (void)makeReadOnly:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager makeReadOnlyWithCallback:callback];
}

- (void)queryNdefStatus:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager queryNdefStatusWithCallback:callback];
}

- (void)setAlertMessage: (NSString *)alertMessage callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager setAlertMessage:alertMessage callback:callback];
}

- (void)isSessionAvailable:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager isSessionAvailableWithCallback:callback];
}

- (void)isTagSessionAvailable:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager isTagSessionAvailableWithCallback:callback];
}

- (void)sendMifareCommand:(NSArray *)bytes callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager sendMifareCommand:bytes callback:callback];
}

- (void)sendFelicaCommand:(NSArray *)bytes callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager sendFelicaCommand:bytes callback:callback];
}

- (void)sendCommandAPDUBytes:(NSArray *)bytes callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager sendCommandAPDUBytes:bytes callback:callback];
}

- (void)sendCommandAPDU:(NSDictionary *)apduData callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager sendCommandAPDU:apduData callback:callback];
}

- (void)iso15693_getSystemInfo:(nonnull NSNumber *)flags callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693GetSystemInfo:flags callback:callback];
}

- (void)iso15693_readSingleBlock:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693ReadSingleBlock:options callback:callback];
}

- (void)iso15693_readMultipleBlocks:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693ReadMultipleBlocks:options callback:callback];
}

- (void)iso15693_writeSingleBlock:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693WriteSingleBlock:options callback:callback];
}

- (void)iso15693_lockBlock:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693LockBlock:options callback:callback];
}

- (void)iso15693_writeAFI:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693WriteAFI:options callback:callback];
}

- (void)iso15693_lockAFI:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693LockAFI:options callback:callback];
}

- (void)iso15693_writeDSFID:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693WriteDSFID:options callback:callback];
}

- (void)iso15693_lockDSFID:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693LockDSFID:options callback:callback];
}

- (void)iso15693_resetToReady:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693ResetToReady:options callback:callback];
}

- (void)iso15693_select:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693Select:options callback:callback];
}

- (void)iso15693_stayQuiet:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693StayQuiet:callback];
}

- (void)iso15693_customCommand:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693CustomCommand:options callback:callback];
}

- (void)iso15693_sendRequest:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693SendRequest:options callback:callback];
}

- (void)iso15693_extendedReadSingleBlock:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693ExtendedReadSingleBlock:options callback:callback];
}

- (void)iso15693_extendedReadMultipleBlocks:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693ExtendedReadMultipleBlocks:options callback:callback];
}

- (void)iso15693_extendedWriteSingleBlock:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693ExtendedWriteSingleBlock:options callback:callback];
}

- (void)iso15693_extendedLockBlock:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback
{
    [RNNfcManager iso15693ExtendedLockBlock:options callback:callback];
}
    
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeNfcManagerSpecJSI>(params);
}
#endif

- (void)hasTagEventRegistration:(RCTResponseSenderBlock)callback {
    // bypass, Android's interface
}
    
- (void)isEnabled:(RCTResponseSenderBlock)callback {
    // bypass, Android's interface
}
    
@end
  
