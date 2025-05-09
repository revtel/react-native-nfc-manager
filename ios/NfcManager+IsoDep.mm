#import "NfcManager.h"
#import "React/RCTBridge.h"
#import "React/RCTConvert.h"
#import "React/RCTEventDispatcher.h"
#import "React/RCTLog.h"

@interface NfcManager (IsoDep)
@end

@implementation NfcManager (IsoDep)

RCT_EXPORT_METHOD(sendCommandAPDUBytes:(NSArray *)bytes callback: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if ([self tagSession] != nil) {
            if ([self tagSession].connectedTag) {
                id<NFCISO7816Tag> iso7816Tag = [[self tagSession].connectedTag asNFCISO7816Tag];
                NSData *data = arrayToData(bytes);
                NFCISO7816APDU *apdu = [[NFCISO7816APDU alloc] initWithData:data];
                if (iso7816Tag) {
                    [iso7816Tag sendCommandAPDU:apdu completionHandler:^(NSData* response, uint8_t sw1, uint8_t sw2, NSError* error) {
                        if (error) {
                            callback(@[getErrorMessage(error), [NSNull null]]);
                        } else {
                            callback(@[[NSNull null], dataToArray(response), [NSNumber numberWithInt:sw1], [NSNumber numberWithInt:sw2]]);
                        }
                    }];
                    return;
                } else {
                    callback(@[@"not an iso7816 tag", [NSNull null]]);
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

RCT_EXPORT_METHOD(sendCommandAPDU:(NSDictionary *)apduData callback: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if ([self tagSession] != nil) {
            if ([self tagSession].connectedTag) {
                id<NFCISO7816Tag> iso7816Tag = [[self tagSession].connectedTag asNFCISO7816Tag];
                NSNumber *cla = [apduData objectForKey:@"cla"];
                NSNumber *ins = [apduData objectForKey:@"ins"];
                NSNumber *p1 = [apduData objectForKey:@"p1"];
                NSNumber *p2 = [apduData objectForKey:@"p2"];
                NSArray *dataArray = [apduData objectForKey:@"data"];
                NSData *data = arrayToData(dataArray);
                NSNumber *le = [apduData objectForKey:@"le"];
                
                /*
                NFCISO7816APDU *apdu = [[NFCISO7816APDU alloc] initWithInstructionClass:0 instructionCode:0x84 p1Parameter:0 p2Parameter:0 data:[[NSData alloc] init] expectedResponseLength:8]
                 */
                
                NFCISO7816APDU *apdu = [[NFCISO7816APDU alloc] initWithInstructionClass:[cla unsignedCharValue] instructionCode:[ins unsignedCharValue] p1Parameter:[p1 unsignedCharValue] p2Parameter:[p2 unsignedCharValue] data:data expectedResponseLength:[le integerValue]];
                if (iso7816Tag) {
                    [iso7816Tag sendCommandAPDU:apdu completionHandler:^(NSData* response, uint8_t sw1, uint8_t sw2, NSError* error) {
                        if (error) {
                            callback(@[getErrorMessage(error), [NSNull null]]);
                        } else {
                            callback(@[[NSNull null], dataToArray(response), [NSNumber numberWithInt:sw1], [NSNumber numberWithInt:sw2]]);
                        }
                    }];
                    return;
                } else {
                    callback(@[@"not an iso7816 tag", [NSNull null]]);
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
