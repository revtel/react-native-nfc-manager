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
    return [underlyingError localizedDescription];
}

@implementation NfcManager {
    NSDictionary *nfcTechTypes;
    NSString *techRequestType;
    RCTResponseSenderBlock techRequestCallback;
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
            [NSNumber numberWithInt: NFCTagTypeISO7816Compatible]: @"iso7816",
            [NSNumber numberWithInt: NFCTagTypeISO15693]: @"iso15693",
        };
    } else {
        nfcTechTypes = nil;
    }
    
    return self;
}

- (NSArray<NSString *> *)supportedEvents
{
    return @[
             @"NfcManagerDiscoverTag",
             @"NfcManagerSessionClosed",
             @"NfcManagerDidDetectNdefTags",
             @"NfcManagerDidDetectTags"
             ];
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
    NSLog(@"didDetectNDEFs");
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
    NSLog(@"didInvalidateWithError: (%@)", [error localizedDescription]);
    self.session = nil;
    [self sendEventWithName:@"NfcManagerSessionClosed"
                       body:@{}];
}

- (void)readerSession:(NFCNDEFReaderSession *)session didDetectTags:(NSArray<__kindof id<NFCNDEFTag>> *)tags {
    NSLog(@"didDetectNdefTag");
    [self sendEventWithName:@"NfcManagerDidDetectNdefTags"
                       body:@{}];
}

- (void)tagReaderSession:(NFCTagReaderSession *)session didDetectTags:(NSArray<__kindof id<NFCTag>> *)tags
{
    NSLog(@"NFCTag didDetectTags");
    if (@available(iOS 13.0, *)) {
        [self sendEventWithName:@"NfcManagerDidDetectTags"
                           body:@{}];
        
        if (techRequestCallback != nil) {
            id<NFCTag> tagFound = nil;
            for (id<NFCTag> tag in tags) {
                NSString * tagType = [self getRNTechName:tag];
                if ([tagType isEqualToString:techRequestType]) {
                    tagFound = tag;
                    break;
                }
            }
            
            if (tagFound == nil) {
                techRequestCallback(@[@"No tech matches", [NSNull null]]);
                return;
            }
            
            [sessionEx connectToTag:tagFound completionHandler:^(NSError *error) {
                if (error != nil) {
                    self->techRequestCallback(@[getErrorMessage(error), [NSNull null]]);
                    return;
                }
                
                self->techRequestCallback(@[[NSNull null], self->techRequestType]);
            }];
        }
    }
}

- (void)tagReaderSession:(NFCTagReaderSession *)session didInvalidateWithError:(NSError *)error
{
    NSLog(@"NFCTag didInvalidateWithError");
    sessionEx = nil;
    techRequestType = nil;
    techRequestCallback = nil;
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
        session = nil;
        callback(@[]);
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(requestTechnology: (NSString *)tech callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (sessionEx == nil) {
        callback(@[@"you need to call registerTagEvent first", [NSNull null]]);
        return;
    }
    
    if (techRequestCallback == nil) {
        techRequestType = tech;
        techRequestCallback = callback;
    } else {
        callback(@[@"duplicate tech request, please call cancelTechnologyRequest to cancel previous one", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(cancelTechnologyRequest:(nonnull RCTResponseSenderBlock)callback)
{
    techRequestType = nil;
    techRequestCallback = nil;
    callback(@[]);
}

RCT_EXPORT_METHOD(registerTagEvent: (NSString *)alertMessage options:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 11.0, *)) {
        if (session == nil) {
            BOOL invalidateAfterFirstRead = [[options objectForKey:@"invalidateAfterFirstRead"] boolValue];
            session = [[NFCNDEFReaderSession alloc] initWithDelegate:self queue:dispatch_get_main_queue() invalidateAfterFirstRead:invalidateAfterFirstRead];
            session.alertMessage = alertMessage;
            [session beginSession];
            callback(@[]);
        } else {
            callback(@[@"Duplicated registration", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(unregisterTagEvent: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 11.0, *)) {
        if (session != nil) {
            [session invalidateSession];
            session = nil;
            techRequestType = nil;
            techRequestCallback = nil;
            callback(@[]);
        } else {
            callback(@[@"Not even registered", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(registerTagEventEx: (NSString *)alertMessage options:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (sessionEx == nil) {
            sessionEx = [[NFCTagReaderSession alloc] initWithPollingOption:NFCPollingISO14443 delegate:self queue:dispatch_get_main_queue()];
            sessionEx.alertMessage = alertMessage;
            [sessionEx beginSession];
            callback(@[]);
        } else {
            callback(@[@"Duplicated registration", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(unregisterTagEventEx: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (sessionEx != nil) {
            [sessionEx invalidateSession];
            sessionEx = nil;
            techRequestType = nil;
            techRequestCallback = nil;
            callback(@[]);
        } else {
            callback(@[@"Not even registered", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
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

@end
  
