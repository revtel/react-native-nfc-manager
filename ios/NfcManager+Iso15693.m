#import "NfcManager.h"
#import "React/RCTBridge.h"
#import "React/RCTConvert.h"
#import "React/RCTEventDispatcher.h"
#import "React/RCTLog.h"

@interface NfcManager (Iso15693)
@end

@implementation NfcManager (Iso15693)

RCT_EXPORT_METHOD(iso15693_getSystemInfo:(nonnull NSNumber *)flags callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag rFlag = [flags unsignedIntValue];
        
        [tag getSystemInfoWithRequestFlag:rFlag completionHandler:
         ^(NSInteger dsfid, NSInteger afi, NSInteger blockSize, NSInteger blockCount, NSInteger icReference, NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[[NSNull null], @{
                           @"dsfid": @(dsfid),
                           @"afi": @(afi),
                           @"blockSize": @(blockSize),
                           @"blockCount": @(blockCount),
                           @"icReference": @(icReference)
            }]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_readSingleBlock:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag flags = [[options objectForKey:@"flags"] unsignedIntValue];
        uint8_t blockNumber = [[options objectForKey:@"blockNumber"] unsignedIntValue];
        
        [tag readSingleBlockWithRequestFlags:flags
                                 blockNumber:blockNumber
                           completionHandler:^(NSData *resp, NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[[NSNull null], dataToArray(resp)]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_readMultipleBlocks:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }

        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag flags = [[options objectForKey:@"flags"] unsignedIntValue];
        NSRange blockRange = NSMakeRange(
            [[options objectForKey:@"blockNumber"] unsignedIntValue],
            [[options objectForKey:@"blockCount"] unsignedIntValue]
        );

        [tag readMultipleBlocksWithRequestFlags:flags
                                 blockRange:blockRange
                           completionHandler:^(NSArray<NSData *> *dataBlocks, NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            NSMutableArray *blocks = [NSMutableArray arrayWithCapacity:[dataBlocks count]];
            [dataBlocks enumerateObjectsUsingBlock:^(NSData *blockData, NSUInteger idx, BOOL *stop) {
                [blocks addObject:dataToArray(blockData)];
            }];
            callback(@[[NSNull null], blocks]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_writeSingleBlock:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag flags = [[options objectForKey:@"flags"] unsignedIntValue];
        uint8_t blockNumber = [[options objectForKey:@"blockNumber"] unsignedIntValue];
        NSData *dataBlock = arrayToData([options mutableArrayValueForKey:@"dataBlock"]);
        
        [tag writeSingleBlockWithRequestFlags:flags
                                  blockNumber:blockNumber
                                    dataBlock:dataBlock
                           completionHandler:^(NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_lockBlock:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag flags = [[options objectForKey:@"flags"] unsignedIntValue];
        uint8_t blockNumber = [[options objectForKey:@"blockNumber"] unsignedIntValue];
        
        [tag lockBlockWithRequestFlags:flags
                                  blockNumber:blockNumber
                           completionHandler:^(NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_writeAFI:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag flags = [[options objectForKey:@"flags"] unsignedIntValue];
        uint8_t afi = [[options objectForKey:@"afi"] unsignedIntValue];
        
        [tag writeAFIWithRequestFlag:flags
                                 afi:afi
                   completionHandler:^(NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_lockAFI:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag flags = [[options objectForKey:@"flags"] unsignedIntValue];
        
        [tag lockAFIWithRequestFlag:flags
                  completionHandler:^(NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_writeDSFID:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag flags = [[options objectForKey:@"flags"] unsignedIntValue];
        uint8_t dsfid = [[options objectForKey:@"dsfid"] unsignedIntValue];
        
        [tag writeDSFIDWithRequestFlag:flags
                                 dsfid:dsfid
                   completionHandler:^(NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_lockDSFID:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag flags = [[options objectForKey:@"flags"] unsignedIntValue];
        
        // notice thie method name, DSFID -> DFSID, seems to be a typo in Core NFC
        [tag lockDFSIDWithRequestFlag:flags
                  completionHandler:^(NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_resetToReady:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag flags = [[options objectForKey:@"flags"] unsignedIntValue];
        
        [tag resetToReadyWithRequestFlags:flags
                  completionHandler:^(NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_select:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag flags = [[options objectForKey:@"flags"] unsignedIntValue];
        
        [tag selectWithRequestFlags:flags
                  completionHandler:^(NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_stayQuiet:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        [tag stayQuietWithCompletionHandler:^(NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}


RCT_EXPORT_METHOD(iso15693_customCommand:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag flags = [[options objectForKey:@"flags"] unsignedIntValue];
        NSInteger customCommandCode = [[options objectForKey:@"customCommandCode"] integerValue];
        NSData *customRequestParameters = arrayToData([options mutableArrayValueForKey:@"customRequestParameters"]);
        
        [tag customCommandWithRequestFlag:flags
                        customCommandCode: customCommandCode
                  customRequestParameters: customRequestParameters
                   completionHandler:^(NSData *resp, NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[[NSNull null], dataToArray(resp)]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_sendRequest:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }
        
        NSInteger flags = [[options objectForKey:@"flags"] integerValue];
        NSInteger commandCode = [[options objectForKey:@"commandCode"] integerValue];
        NSData *data = arrayToData([options mutableArrayValueForKey:@"data"]);
        
        [tag sendRequestWithFlag:flags
                     commandCode:commandCode
                            data:data
               completionHandler:^(NFCISO15693ResponseFlag responseFlag, NSData *resp, NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            callback(@[[NSNull null], [NSNumber numberWithLong:responseFlag], dataToArray(resp)]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_extendedReadSingleBlock:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag flags = [[options objectForKey:@"flags"] unsignedIntValue];
        uint16_t blockNumber = [[options objectForKey:@"blockNumber"] unsignedIntValue];
        
        [tag extendedReadSingleBlockWithRequestFlags:flags
                                         blockNumber:blockNumber
                                   completionHandler:^(NSData *resp, NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[[NSNull null], dataToArray(resp)]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_extendedWriteSingleBlock:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag flags = [[options objectForKey:@"flags"] unsignedIntValue];
        uint16_t blockNumber = [[options objectForKey:@"blockNumber"] unsignedIntValue];
        NSData *dataBlock = arrayToData([options mutableArrayValueForKey:@"dataBlock"]);
        
        [tag extendedWriteSingleBlockWithRequestFlags:flags
                                  blockNumber:blockNumber
                                    dataBlock: dataBlock
                           completionHandler:^(NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(iso15693_extendedLockBlock:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (![self tagSession] || ![self tagSession].connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [[self tagSession].connectedTag asNFCISO15693Tag];
        if (!tag) {
            callback(@[@"incorrect tag type", [NSNull null]]);
            return;
        }

        RequestFlag flags = [[options objectForKey:@"flags"] unsignedIntValue];
        uint16_t blockNumber = [[options objectForKey:@"blockNumber"] unsignedIntValue];
        
        [tag extendedLockBlockWithRequestFlags:flags
                                  blockNumber:blockNumber
                           completionHandler:^(NSError *error) {
            if (error) {
                callback(@[getErrorMessage(error), [NSNull null]]);
                return;
            }
            
            callback(@[]);
        }];
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

@end
