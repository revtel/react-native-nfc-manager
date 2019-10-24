#import "NfcManager.h"
#import "React/RCTBridge.h"
#import "React/RCTConvert.h"
#import "React/RCTEventDispatcher.h"
#import "React/RCTLog.h"

int isSupported() {
    bool result = NO;
    if (@available(iOS 11.0, *)) {
        @try {
            if (NFCNDEFReaderSession.readingAvailable) {
                result = YES;
            }
        }
        @catch (NSException *exception) {
            RCTLogError(@"Exception thrown during NfcManager.isSupported: %@", exception);
        }
    }
    return result;
}

NSString* getHexString(NSData *data) {
    NSUInteger capacity = data.length * 2;
    NSMutableString *sbuf = [NSMutableString stringWithCapacity:capacity];
    const unsigned char *buf = data.bytes;
    NSInteger i;
    for (i=0; i<data.length; ++i) {
        [sbuf appendFormat:@"%02lX", (unsigned long)buf[i]];
    }
    return sbuf;
}

NSString* getErrorMessage(NSError *error) {
    NSDictionary *userInfo = [error userInfo];
    NSError *underlyingError = [userInfo objectForKey:NSUnderlyingErrorKey];
    NSString* result = [underlyingError localizedDescription];
    if (result == nil) {
        return @"unknown error";
    }
    return result;
}

@implementation NfcManager {
    NSDictionary *nfcTechTypes;
    NSArray *techRequestTypes;
    RCTResponseSenderBlock techRequestCallback;
    id<NFCNDEFTag> connectedNdefTag;
}

RCT_EXPORT_MODULE()

@synthesize session;
@synthesize sessionEx;
@synthesize bridge = _bridge;

- (instancetype)init
{
    if (self = [super init]) {
        NSLog(@"NfcManager created");
    }
    
    if (@available(iOS 13.0, *)) {
        nfcTechTypes = @{
            [NSNumber numberWithInt: NFCTagTypeMiFare]: @"mifare",
            [NSNumber numberWithInt: NFCTagTypeFeliCa]: @"felica",
            [NSNumber numberWithInt: NFCTagTypeISO15693]: @"iso15693",
            // compatible with Android
            [NSNumber numberWithInt: NFCTagTypeISO7816Compatible]: @"IsoDep",
        };
    } else {
        nfcTechTypes = nil;
    }
    
    return self;
}

- (void)reset
{
    session = nil;
    sessionEx = nil;
    techRequestTypes = nil;
    techRequestCallback = nil;
    connectedNdefTag = nil;
}

- (NSArray<NSString *> *)supportedEvents
{
    return @[
             @"NfcManagerDiscoverTag",
             @"NfcManagerSessionClosed"
             ];
}

- (NSData *)arrayToData: (NSArray *) array
{
  Byte bytes[[array count]];
  for (int i = 0; i < [array count]; i++) {
    bytes[i] = [[array objectAtIndex:i] integerValue];
  }
  NSData *payload = [[NSData alloc] initWithBytes:bytes length:[array count]];
  return payload;
}

- (NSArray *)dataToArray:(NSData *)data
{
    const unsigned char *dataBuffer = (const unsigned char *)[data bytes];
    
    if (!dataBuffer)
        return @[];
    
    NSUInteger          dataLength  = [data length];
    NSMutableArray     *array  = [NSMutableArray arrayWithCapacity:dataLength];
    
    for (int i = 0; i < dataLength; ++i)
        [array addObject:[NSNumber numberWithInteger:dataBuffer[i]]];
    
    return array;
}

- (NSDictionary*)convertNdefRecord:(NFCNDEFPayload *) record
{
    return @{
             @"id": [self dataToArray:[record identifier]],
             @"payload": [self dataToArray: [record payload]],
             @"type": [self dataToArray:[record type]],
             @"tnf": [NSNumber numberWithInt:[record typeNameFormat]]
             };
}

- (NSArray*)convertNdefMessage:(NFCNDEFMessage *)message
{
    NSArray * records = [message records];
    NSMutableArray *resultArray = [NSMutableArray arrayWithCapacity: [records count]];
    for (int i = 0; i < [records count]; i++) {
        [resultArray addObject:[self convertNdefRecord: records[i]]];
    }
    return resultArray;
}

- (NSString*)getRNTechName:(id<NFCTag>)tag {
    NSString * tech = [nfcTechTypes objectForKey:[NSNumber numberWithInt:(int)tag.type]];
    if (tech == nil) {
        tech = @"unknown";
    }
    return tech;
}

- (NSDictionary*)getRNTag:(id<NFCTag>)tag {
    NSMutableDictionary *tagInfo = @{}.mutableCopy;
    NSString* tech = [self getRNTechName:tag];
    [tagInfo setObject:tech forKey:@"tech"];
                   
    if (@available(iOS 13.0, *)) {
        if (tag.type == NFCTagTypeMiFare) {
            id<NFCMiFareTag> mifareTag = [tag asNFCMiFareTag];
            [tagInfo setObject:getHexString(mifareTag.identifier) forKey:@"id"];
        } else if (tag.type == NFCTagTypeISO7816Compatible) {
            id<NFCISO7816Tag> iso7816Tag = [tag asNFCISO7816Tag];
            [tagInfo setObject:getHexString(iso7816Tag.identifier) forKey:@"id"];
            [tagInfo setObject:iso7816Tag.initialSelectedAID forKey:@"initialSelectedAID"];
            [tagInfo setObject:iso7816Tag.historicalBytes forKey:@"historicalBytes"];
            [tagInfo setObject:iso7816Tag.applicationData forKey:@"applicationData"];
        } else if (tag.type == NFCTagTypeISO15693) {
            id<NFCISO15693Tag> iso15693Tag = [tag asNFCISO15693Tag];
            [tagInfo setObject:getHexString(iso15693Tag.identifier) forKey:@"id"];
        } else if (tag.type == NFCTagTypeFeliCa) {
            // TODO
        }
    }

    return tagInfo;
}

- (void)readerSession:(NFCNDEFReaderSession *)session didDetectNDEFs:(NSArray<NFCNDEFMessage *> *)messages
{
    NSLog(@"readerSession:didDetectNDEFs");
    if ([messages count] > 0) {
        // parse the first message for now
        [self sendEventWithName:@"NfcManagerDiscoverTag"
                           body:@{@"ndefMessage": [self convertNdefMessage:messages[0]]}];
    } else {
        [self sendEventWithName:@"NfcManagerDiscoverTag"
                           body:@{@"ndefMessage": @[]}];
    }
}

- (void)readerSession:(NFCNDEFReaderSession *)session didInvalidateWithError:(NSError *)error
{
    NSLog(@"readerSession:didInvalidateWithError: (%@)", [error localizedDescription]);
    [self reset];
    [self sendEventWithName:@"NfcManagerSessionClosed"
                       body:@{}];
}

- (void)readerSession:(NFCNDEFReaderSession *)session didDetectTags:(NSArray<__kindof id<NFCNDEFTag>> *)tags {
    NSLog(@"readerSession:didDetectTags");
    if (techRequestCallback != nil) {
        if ([tags count] > 1) {
            self->techRequestCallback(@[@"only 1 tag allows"]);
            return;
        }
        
        id<NFCNDEFTag> ndefTag = tags[0];
        if (@available(iOS 13.0, *)) {
            [session connectToTag:ndefTag completionHandler:^(NSError *error) {
                if (error != nil) {
                    self->techRequestCallback(@[getErrorMessage(error)]);
                    return;
                }
                
                self->connectedNdefTag = ndefTag;
                self->techRequestCallback(@[[NSNull null], @"Ndef"]);
            }];
        } else {
            self->techRequestCallback(@[@"api not available"]);
        }
    } else {
        if ([tags count] > 1) {
            return;
        }

        // no tech request, just a normal tag discover listener
        id<NFCNDEFTag> ndefTag = tags[0];
        if (@available(iOS 13.0, *)) {
            [session connectToTag:ndefTag completionHandler:^(NSError *error) {
                if (error != nil) {
                    return;
                }
                
                [ndefTag readNDEFWithCompletionHandler:^(NFCNDEFMessage *ndefMessage, NSError *error) {
                    if (error != nil) {
                        return;
                    }

                    if (ndefMessage != nil) {
                        [self sendEventWithName:@"NfcManagerDiscoverTag"
                                           body:@{@"ndefMessage": [self convertNdefMessage:ndefMessage]}];
                    }
                }];
            }];
        }
    }
}

- (void)tagReaderSession:(NFCTagReaderSession *)session didDetectTags:(NSArray<__kindof id<NFCTag>> *)tags
{
    NSLog(@"NFCTag didDetectTags");
    if (@available(iOS 13.0, *)) {
        if (techRequestCallback != nil) {
            BOOL found = false;
            for (NSString* requestType in techRequestTypes) {
                for (id<NFCTag> tag in tags) {
                    NSString * tagType = [self getRNTechName:tag];
                    if ([tagType isEqualToString:requestType]) {
                        [sessionEx connectToTag:tag
                              completionHandler:^(NSError *error) {
                            if (error != nil) {
                                self->techRequestCallback(@[getErrorMessage(error)]);
                                return;
                            }
                            
                            self->techRequestCallback(@[[NSNull null], requestType]);
                        }];
                        found = true;
                        break;
                    }
                }
            }
            
            if (!found) {
                techRequestCallback(@[@"No tech matches", [NSNull null]]);
            }
        }
    }
}

- (void)tagReaderSession:(NFCTagReaderSession *)session didInvalidateWithError:(NSError *)error
{
    NSLog(@"NFCTag didInvalidateWithError");
    [self reset];
    [self sendEventWithName:@"NfcManagerSessionClosed"
                       body:@{}];
}

- (void)tagReaderSessionDidBecomeActive:(NFCTagReaderSession *)session
{
    NSLog(@"NFCTag didBecomeActive");
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

RCT_EXPORT_METHOD(isSupported: (NSString *)tech callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (isSupported()) {
        // iOS only supports Ndef starting from iOS 11.0 (on iPhone 7 onwards)
        if ([tech isEqualToString:@""] || [tech isEqualToString:@"Ndef"]) {
            callback(@[[NSNull null], @YES]);
            return;
        }
    }

    callback(@[[NSNull null], @NO]);
}

RCT_EXPORT_METHOD(start: (nonnull RCTResponseSenderBlock)callback)
{
    if (isSupported()) {
        NSLog(@"NfcManager initialized");
        [self reset];
        callback(@[]);
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(requestTechnology: (NSArray *)techs callback:(nonnull RCTResponseSenderBlock)callback)
{
    BOOL hasNdefTech = false;
    for (NSString *tech in techs) {
        if ([tech isEqualToString:@"Ndef"]) {
            hasNdefTech = true;
            break;
        }
    }
    
    if (hasNdefTech) {
        if (session == nil) {
            callback(@[@"you need to call registerTagEvent first", [NSNull null]]);
            return;
        }
        
        techRequestCallback = callback;
    } else {
        if (sessionEx == nil) {
            callback(@[@"you need to call registerTagEventEx first", [NSNull null]]);
            return;
        }
        
        if (techRequestCallback == nil) {
            techRequestTypes = techs;
            techRequestCallback = callback;
        } else {
            callback(@[@"duplicate tech request, please call cancelTechnologyRequest to cancel previous one", [NSNull null]]);
        }
    }
}

RCT_EXPORT_METHOD(cancelTechnologyRequest:(nonnull RCTResponseSenderBlock)callback)
{
    techRequestTypes = nil;
    techRequestCallback = nil;
    callback(@[]);
}

RCT_EXPORT_METHOD(registerTagEvent:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 11.0, *)) {
        if (session == nil) {
            session = [[NFCNDEFReaderSession alloc]
                       initWithDelegate:self queue:dispatch_get_main_queue() invalidateAfterFirstRead:[[options objectForKey:@"invalidateAfterFirstRead"] boolValue]];
            session.alertMessage = [options objectForKey:@"alertMessage"];
            [session beginSession];
            callback(@[]);
        } else {
            callback(@[@"Duplicated registration", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(unregisterTagEvent:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 11.0, *)) {
        if (session != nil) {
            [session invalidateSession];
            callback(@[]);
        } else {
            callback(@[@"Not even registered", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(registerTagEventEx:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (sessionEx == nil) {
            sessionEx = [[NFCTagReaderSession alloc]
                         initWithPollingOption:(NFCPollingISO14443 | NFCPollingISO15693 | NFCPollingISO15693) delegate:self queue:dispatch_get_main_queue()];
            sessionEx.alertMessage = [options objectForKey:@"alertMessage"];
            [sessionEx beginSession];
            callback(@[]);
        } else {
            callback(@[@"Duplicated registration", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(unregisterTagEventEx:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (sessionEx != nil) {
            [sessionEx invalidateSession];
            callback(@[]);
        } else {
            callback(@[@"Not even registered", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(invalidateSessionWithError:(NSString *)errorMessage callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (session != nil) {
            [session invalidateSessionWithErrorMessage: errorMessage];
            callback(@[]);
        } else if (sessionEx != nil) {
            [sessionEx invalidateSessionWithErrorMessage: errorMessage];
            callback(@[]);
        } else {
            callback(@[@"No active session", [NSNull null]]);
        }
    }
}

RCT_EXPORT_METHOD(getTag: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (sessionEx != nil) {
            if (sessionEx.connectedTag) {
                NSDictionary* rnTag = [self getRNTag:sessionEx.connectedTag];
                callback(@[[NSNull null], rnTag]);
                return;
            }
            callback(@[@"Not connected", [NSNull null]]);
        } else {
            callback(@[@"Not even registered", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(getNdefMessage: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (session != nil) {
            if (self->connectedNdefTag) {
                [self->connectedNdefTag readNDEFWithCompletionHandler:^(NFCNDEFMessage *ndefMessage, NSError *error) {
                    if (error) {
                        callback(@[getErrorMessage(error), [NSNull null]]);
                    } else {
                        callback(@[[NSNull null], [self convertNdefMessage:ndefMessage]]);
                    }
                }];
                return;
            }
            callback(@[@"Not connected", [NSNull null]]);
        } else {
            callback(@[@"Not even registered", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(writeNdefMessage:(NSArray*)bytes callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (session != nil) {
            if (self->connectedNdefTag) {
                NSData *data = [self arrayToData:bytes];
                NFCNDEFMessage *ndefMsg = [NFCNDEFMessage ndefMessageWithData:data];
                if (!ndefMsg) {
                    callback(@[@"invalid ndef msg"]);
                    return;
                }
                
                [self->connectedNdefTag writeNDEF:ndefMsg completionHandler:^(NSError *error) {
                    if (error) {
                        callback(@[getErrorMessage(error), [NSNull null]]);
                    } else {
                        callback(@[[NSNull null]]);
                    }
                }];
                return;
            }
            callback(@[@"Not connected", [NSNull null]]);
        } else {
            callback(@[@"Not even registered", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(sendMifareCommand:(NSArray *)bytes callback: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (sessionEx != nil) {
            if (sessionEx.connectedTag) {
                id<NFCMiFareTag> mifareTag = [sessionEx.connectedTag asNFCMiFareTag];
                NSData *data = [self arrayToData:bytes];
                NSLog(@"input bytes: %@", getHexString(data));
                if (mifareTag) {
                    [mifareTag sendMiFareCommand:data
                               completionHandler:^(NSData *response, NSError *error) {
                        if (error) {
                            callback(@[getErrorMessage(error), [NSNull null]]);
                        } else {
                            callback(@[[NSNull null], [self dataToArray:response]]);
                        }
                    }];
                    return;
                } else {
                    callback(@[@"not a mifare tag", [NSNull null]]);
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

RCT_EXPORT_METHOD(sendCommandAPDU:(NSArray *)bytes callback: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (sessionEx != nil) {
            if (sessionEx.connectedTag) {
                id<NFCISO7816Tag> iso7816Tag = [sessionEx.connectedTag asNFCISO7816Tag];
                NSData *data = [self arrayToData:bytes];
                NFCISO7816APDU *apdu = [[NFCISO7816APDU alloc] initWithData:data];
                if (iso7816Tag) {
                    [iso7816Tag sendCommandAPDU:apdu completionHandler:^(NSData* response, uint8_t sw1, uint8_t sw2, NSError* error) {
                        if (error) {
                            callback(@[getErrorMessage(error), [NSNull null]]);
                        } else {
                            callback(@[[NSNull null], [self dataToArray:response], [NSNumber numberWithInt:sw1], [NSNumber numberWithInt:sw2]]);
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

RCT_EXPORT_METHOD(setAlertMessage: (NSString *)alertMessage callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 11.0, *)) {
        if (session != nil) {
            session.alertMessage = alertMessage;
            callback(@[]);
        } else if (sessionEx != nil) {
            sessionEx.alertMessage = alertMessage;
            callback(@[]);
        } else {
            callback(@[@"Not even registered", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(isSessionAvailable:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 11.0, *)) {
        callback(@[[NSNull null], session != nil ? @YES : @NO]);
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(isSessionExAvailable:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 11.0, *)) {
        callback(@[[NSNull null], sessionEx != nil ? @YES : @NO]);
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}
@end
  
