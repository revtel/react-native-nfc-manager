#import "NfcManager.h"
#import "React/RCTBridge.h"
#import "React/RCTConvert.h"
#import "React/RCTEventDispatcher.h"
#import "React/RCTLog.h"

@interface NfcManager (Felica)
@end

@implementation NfcManager (Felica)

RCT_EXPORT_METHOD(sendFelicaCommand:(NSArray *)bytes callback: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if ([self tagSession] != nil) {
            if ([self tagSession].connectedTag) {
                id<NFCFeliCaTag> felicaTag = [[self tagSession].connectedTag asNFCFeliCaTag];
                NSData *data = arrayToData(bytes);
                NSLog(@"input bytes: %@", getHexString(data));
                if (felicaTag) {
                    [felicaTag sendFeliCaCommandPacket:data
                               completionHandler:^(NSData *response, NSError *error) {
                        if (error) {
                            callback(@[getErrorMessage(error), [NSNull null]]);
                        } else {
                            callback(@[[NSNull null], dataToArray(response)]);
                        }
                    }];
                    return;
                } else {
                    callback(@[@"not a felica tag", [NSNull null]]);
                }
            }
            callback(@[@"Not connected", [NSNull null]]);
        } else {
            callback(@[@"Not even registered", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

@end
