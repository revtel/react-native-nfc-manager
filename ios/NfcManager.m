#import "NfcManager.h"
#import "React/RCTBridge.h"
#import "React/RCTConvert.h"
#import "React/RCTEventDispatcher.h"
#import "React/RCTLog.h"

@implementation NfcManager {
    NSDictionary *nfcTechTypes;
    NSArray *techRequestTypes;
    RCTResponseSenderBlock techRequestCallback;
}

RCT_EXPORT_MODULE()

@synthesize session;
@synthesize tagSession;

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
                bgNdefRecords = [NfcManager convertNdefMessage: ndefMessage];
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
    [self sendEventWithName:@"NfcManagerDiscoverBackgroundTag"
                       body:@{@"ndefMessage": bgNdefRecords}];
}
    
- (instancetype)init
{
    if (self = [super init]) {
        NSLog(@"NfcManager created");
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(handleBgNfcTagNotification:)
                                                     name:kBgNfcTagNotification
                                                   object:nil];
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
    tagSession = nil;
    techRequestTypes = nil;
    techRequestCallback = nil;
}

- (NSArray<NSString *> *)supportedEvents
{
    return @[
             @"NfcManagerDiscoverTag",
             @"NfcManagerDiscoverBackgroundTag",
             @"NfcManagerSessionClosed"
             ];
}

+ (NSDictionary*)convertNdefRecord:(NFCNDEFPayload *) record
{
    return @{
             @"id": dataToArray([record identifier]),
             @"payload": dataToArray([record payload]),
             @"type": dataToArray([record type]),
             @"tnf": [NSNumber numberWithInt:[record typeNameFormat]]
             };
}

+ (NSArray*)convertNdefMessage:(NFCNDEFMessage *)message
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
            [tagInfo setObject:dataToArray(iso7816Tag.historicalBytes) forKey:@"historicalBytes"];
            [tagInfo setObject:dataToArray(iso7816Tag.applicationData) forKey:@"applicationData"];
        } else if (tag.type == NFCTagTypeISO15693) {
            id<NFCISO15693Tag> iso15693Tag = [tag asNFCISO15693Tag];
            [tagInfo setObject:getHexString(iso15693Tag.identifier) forKey:@"id"];
            [tagInfo setObject:[NSNumber numberWithUnsignedInteger:iso15693Tag.icManufacturerCode] forKey:@"icManufacturerCode"];
            [tagInfo setObject:dataToArray(iso15693Tag.icSerialNumber) forKey:@"icSerialNumber"];
        } else if (tag.type == NFCTagTypeFeliCa) {
            id<NFCFeliCaTag> felicaTag = [tag asNFCFeliCaTag];
            [tagInfo setObject:getHexString(felicaTag.currentIDm) forKey:@"idm"];
            [tagInfo setObject:getHexString(felicaTag.currentSystemCode) forKey:@"systemCode"];
        }
    }

    return tagInfo;
}

- (id<NFCNDEFTag>)getNDEFTagHandle:(id<NFCTag>)tag
    API_AVAILABLE(ios(13.0)) {
    // all following types inherite from NFCNDEFTag
    if (tag.type == NFCTagTypeMiFare) {
        return [tag asNFCMiFareTag];
    } else if (tag.type == NFCTagTypeISO7816Compatible) {
        return [tag asNFCISO7816Tag];
    } else if (tag.type == NFCTagTypeISO15693) {
        return [tag asNFCISO15693Tag];
    } else if (tag.type == NFCTagTypeFeliCa) {
        return [tag asNFCFeliCaTag];
    }

    return nil;
}

- (void)readerSession:(NFCNDEFReaderSession *)session didDetectNDEFs:(NSArray<NFCNDEFMessage *> *)messages
{
    NSLog(@"readerSession:didDetectNDEFs");
    if ([messages count] > 0) {
        // parse the first message for now
        [self sendEventWithName:@"NfcManagerDiscoverTag"
                           body:@{@"ndefMessage": [NfcManager convertNdefMessage:messages[0]]}];
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
                       body:@{@"error": getErrorMessage(error)}];
}

- (void)tagReaderSession:(NFCTagReaderSession *)session didDetectTags:(NSArray<__kindof id<NFCTag>> *)tags
    API_AVAILABLE(ios(13.0)) {
    NSLog(@"NFCTag didDetectTags");
    if (techRequestCallback != nil) {
        for (id<NFCTag> tag in tags) {
            NSString * tagType = [self getRNTechName:tag];
            
            for (NSString* requestType in techRequestTypes) {
                // here we treat Ndef is a special case, because all specific tech types
                // inherites from NFCNDEFTag, so we simply allow it to connect
                if ([tagType isEqualToString:requestType] || [requestType isEqualToString:@"Ndef"]) {
                    RCTResponseSenderBlock pendingCallback = techRequestCallback;
                    techRequestCallback = nil;

                    [tagSession connectToTag:tag
                           completionHandler:^(NSError *error) {
                        if (error != nil) {
                            pendingCallback(@[getErrorMessage(error)]);
                            return;
                        }
                        
                        pendingCallback(@[[NSNull null], requestType]);
                    }];
                    return;
                }
            }
        }
    }
}

- (void)tagReaderSession:(NFCTagReaderSession *)session didInvalidateWithError:(NSError *)error
    API_AVAILABLE(ios(13.0)) {
    NSLog(@"NFCTag didInvalidateWithError");
    if (techRequestCallback) {
        techRequestCallback(@[getErrorMessage(error)]);
        techRequestCallback = nil;
    }

    [self reset];
    [self sendEventWithName:@"NfcManagerSessionClosed"
                       body:@{@"error": getErrorMessage(error)}];
}

- (void)tagReaderSessionDidBecomeActive:(NFCTagReaderSession *)session
    API_AVAILABLE(ios(13.0)) {
    NSLog(@"NFCTag didBecomeActive");
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}
    
RCT_EXPORT_METHOD(getBackgroundNdef: (nonnull RCTResponseSenderBlock)callback)
{
    if (bgNdefRecords != nil) {
        callback(@[[NSNull null], bgNdefRecords]);
    } else {
        callback(@[[NSNull null], [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(clearBackgroundNdef: (nonnull RCTResponseSenderBlock)callback)
{
    bgNdefRecords = nil;
    callback(@[[NSNull null]]);
}

RCT_EXPORT_METHOD(isSupported: (NSString *)tech callback:(nonnull RCTResponseSenderBlock)callback)
{
    if ([tech isEqualToString:@""] || [tech isEqualToString:@"Ndef"]) {
        if (@available(iOS 11.0, *)) {
            callback(@[[NSNull null], NFCNDEFReaderSession.readingAvailable ? @YES : @NO]);
            return;
        }
    } else if ([tech isEqualToString:@"mifare"] || [tech isEqualToString:@"felica"] || [tech isEqualToString:@"iso15693"] || [tech isEqualToString:@"IsoDep"]) {
        if (@available(iOS 13.0, *)) {
            callback(@[[NSNull null], NFCTagReaderSession.readingAvailable ? @YES : @NO]);
            return;
        }
    }

    callback(@[[NSNull null], @NO]);
}

RCT_EXPORT_METHOD(start: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 11.0, *)) {
        if (NFCNDEFReaderSession.readingAvailable) {
            NSLog(@"NfcManager initialized");
            [self reset];
            callback(@[]);
            return;
        }
    }

    callback(@[@"Not support in this device", [NSNull null]]);
}

RCT_EXPORT_METHOD(requestTechnology: (NSArray *)techs options: (NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (tagSession == nil && session == nil) {
            tagSession = [[NFCTagReaderSession alloc]
                         initWithPollingOption:(NFCPollingISO14443 | NFCPollingISO15693 | NFCPollingISO18092) delegate:self queue:dispatch_get_main_queue()];
            tagSession.alertMessage = [options objectForKey:@"alertMessage"];
            [tagSession beginSession];
            techRequestTypes = techs;
            techRequestCallback = callback;
        } else {
            callback(@[@"Duplicated registration", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(cancelTechnologyRequest:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (tagSession != nil) {
            [tagSession invalidateSession];
            callback(@[]);
        } else {
            callback(@[@"Not even registered", [NSNull null]]);
        }
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(registerTagEvent:(NSDictionary *)options callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 11.0, *)) {
        if (session == nil && tagSession == nil) {
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

RCT_EXPORT_METHOD(invalidateSession:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (session != nil) {
            [session invalidateSession];
            callback(@[]);
        } else if (tagSession != nil) {
            [tagSession invalidateSession];
            callback(@[]);
        } else {
            callback(@[@"No active session", [NSNull null]]);
        }
    }
}

RCT_EXPORT_METHOD(invalidateSessionWithError:(NSString *)errorMessage callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (session != nil) {
            [session invalidateSessionWithErrorMessage: errorMessage];
            callback(@[]);
        } else if (tagSession != nil) {
            [tagSession invalidateSessionWithErrorMessage: errorMessage];
            callback(@[]);
        } else {
            callback(@[@"No active session", [NSNull null]]);
        }
    }
}

RCT_EXPORT_METHOD(getTag: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        NSMutableDictionary* rnTag = @{}.mutableCopy;
        id<NFCNDEFTag> ndefTag = nil;
        
        if (tagSession != nil) {
            if (tagSession.connectedTag) {
                rnTag = [self getRNTag:tagSession.connectedTag].mutableCopy;
                ndefTag = [self getNDEFTagHandle:tagSession.connectedTag];
            }
        } else {
            callback(@[@"No session available", [NSNull null]]);
        }
        
        if (ndefTag) {
            [ndefTag readNDEFWithCompletionHandler:^(NFCNDEFMessage *ndefMessage, NSError *error) {
                if (!error) {
                    [rnTag setObject:[NfcManager convertNdefMessage:ndefMessage] forKey:@"ndefMessage"];
                }
                callback(@[[NSNull null], rnTag]);
            }];
            return;
        }
        
        callback(@[[NSNull null], rnTag]);
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(getNdefMessage: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        id<NFCNDEFTag> ndefTag = nil;
        
        if (tagSession != nil) {
            if (tagSession.connectedTag) {
                ndefTag = [self getNDEFTagHandle:tagSession.connectedTag];
            }
        }
        
        if (ndefTag) {
            [ndefTag readNDEFWithCompletionHandler:^(NFCNDEFMessage *ndefMessage, NSError *error) {
                if (error) {
                    callback(@[getErrorMessage(error), [NSNull null]]);
                } else {
                    callback(@[[NSNull null], @{@"ndefMessage": [NfcManager convertNdefMessage:ndefMessage]}]);
                }
            }];
            return;
        }
        
        callback(@[@"No ndef available", [NSNull null]]);
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(writeNdefMessage:(NSArray*)bytes callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        id<NFCNDEFTag> ndefTag = nil;
        
        if (tagSession != nil) {
            if (tagSession.connectedTag) {
                ndefTag = [self getNDEFTagHandle:tagSession.connectedTag];
            }
        }
        
        if (ndefTag) {
            NSData *data = arrayToData(bytes);
            NFCNDEFMessage *ndefMsg = [NFCNDEFMessage ndefMessageWithData:data];
            if (!ndefMsg) {
                callback(@[@"invalid ndef msg"]);
                return;
            }

            [ndefTag writeNDEF:ndefMsg completionHandler:^(NSError *error) {
                if (error) {
                    callback(@[getErrorMessage(error), [NSNull null]]);
                } else {
                    callback(@[[NSNull null]]);
                }
            }];
            return;
        }
        
        callback(@[@"No ndef available", [NSNull null]]);
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(makeReadOnly:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        id<NFCNDEFTag> ndefTag = nil;
        
        if (tagSession != nil) {
            if (tagSession.connectedTag) {
                ndefTag = [self getNDEFTagHandle:tagSession.connectedTag];
            }
        }
        
        if (ndefTag) {
            [ndefTag writeLockWithCompletionHandler:^(NSError *error) {
                if (error) {
                    callback(@[getErrorMessage(error), [NSNull null]]);
                } else {
                    callback(@[[NSNull null]]);
                }
            }];
            return;
        }
        
        callback(@[@"No ndef available", [NSNull null]]);
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

RCT_EXPORT_METHOD(queryNDEFStatus:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        id<NFCNDEFTag> ndefTag = nil;
        
        if (tagSession != nil) {
            if (tagSession.connectedTag) {
                ndefTag = [self getNDEFTagHandle:tagSession.connectedTag];
            }
        }
        
        if (ndefTag) {
            [ndefTag queryNDEFStatusWithCompletionHandler:^(NFCNDEFStatus status, NSUInteger capacity, NSError *error) {
                if (error) {
                    callback(@[getErrorMessage(error), [NSNull null]]);
                } else {
                    callback(@[[NSNull null],
                               @{
                                   @"status": [[NSNumber alloc] initWithInt:(int)status],
                                   @"capacity": [[NSNumber alloc] initWithInt:(int)capacity]
                               }
                             ]);
                }
            }];
            return;
        }
        
        callback(@[@"No ndef available", [NSNull null]]);
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}



RCT_EXPORT_METHOD(sendMifareCommand:(NSArray *)bytes callback: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (tagSession != nil) {
            if (tagSession.connectedTag) {
                id<NFCMiFareTag> mifareTag = [tagSession.connectedTag asNFCMiFareTag];
                NSData *data = arrayToData(bytes);
                NSLog(@"input bytes: %@", getHexString(data));
                if (mifareTag) {
                    [mifareTag sendMiFareCommand:data
                               completionHandler:^(NSData *response, NSError *error) {
                        if (error) {
                            callback(@[getErrorMessage(error), [NSNull null]]);
                        } else {
                            callback(@[[NSNull null], dataToArray(response)]);
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

RCT_EXPORT_METHOD(sendFelicaCommand:(NSArray *)bytes callback: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (tagSession != nil) {
            if (tagSession.connectedTag) {
                id<NFCFeliCaTag> felicaTag = [tagSession.connectedTag asNFCFeliCaTag];
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

RCT_EXPORT_METHOD(sendCommandAPDUBytes:(NSArray *)bytes callback: (nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 13.0, *)) {
        if (tagSession != nil) {
            if (tagSession.connectedTag) {
                id<NFCISO7816Tag> iso7816Tag = [tagSession.connectedTag asNFCISO7816Tag];
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
        if (tagSession != nil) {
            if (tagSession.connectedTag) {
                id<NFCISO7816Tag> iso7816Tag = [tagSession.connectedTag asNFCISO7816Tag];
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

RCT_EXPORT_METHOD(setAlertMessage: (NSString *)alertMessage callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 11.0, *)) {
        if (session != nil) {
            session.alertMessage = alertMessage;
            callback(@[]);
        } else if (tagSession != nil) {
            tagSession.alertMessage = alertMessage;
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

RCT_EXPORT_METHOD(isTagSessionAvailable:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 11.0, *)) {
        callback(@[[NSNull null], tagSession != nil ? @YES : @NO]);
    } else {
        callback(@[@"Not support in this device", [NSNull null]]);
    }
}

// ---------------------------
// iso15693
// ---------------------------
RCT_EXPORT_METHOD(iso15693_getSystemInfo:(nonnull NSNumber *)flags callback:(nonnull RCTResponseSenderBlock)callback)
{
    if (@available(iOS 14.0, *)) {
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }

        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
        if (!tagSession || !tagSession.connectedTag) {
            callback(@[@"Not connected", [NSNull null]]);
            return;
        }
        
        id<NFCISO15693Tag> tag = [tagSession.connectedTag asNFCISO15693Tag];
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
  
