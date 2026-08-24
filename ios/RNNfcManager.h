#import <Foundation/Foundation.h>
#import <CoreNFC/CoreNFC.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^RNNfcDataResultBlock)(NSArray<NSNumber *> * _Nullable response, NSError * _Nullable error);
typedef void (^RNNfcIsoDepResultBlock)(NSArray<NSNumber *> * _Nullable response, NSNumber * _Nullable sw1, NSNumber * _Nullable sw2, NSError * _Nullable error);
typedef void (^RNNfcIso15693SystemInfoResultBlock)(NSDictionary * _Nullable systemInfo, NSError * _Nullable error);
typedef void (^RNNfcIso15693BlocksResultBlock)(NSArray * _Nullable blocks, NSError * _Nullable error);
typedef void (^RNNfcVoidResultBlock)(NSError * _Nullable error);
typedef void (^RNNfcIso15693SendRequestResultBlock)(NSNumber * _Nullable responseFlag, NSArray<NSNumber *> * _Nullable response, NSError * _Nullable error);
typedef void (^RNNfcResponseSenderBlock)(NSArray * _Nonnull response);

@interface RNNfcManager : NSObject

+ (BOOL)isTagSessionSupported;
+ (BOOL)isIso15693Supported;

+ (void)isSupported:(NSString *)tech
           callback:(RNNfcResponseSenderBlock)callback;

+ (void)startWithCallback:(RNNfcResponseSenderBlock)callback;

+ (void)resetRuntimeState;
+ (void)invalidateRuntimeState;

+ (NSObject *)createSessionDelegateProxy;

+ (BOOL)ensureNoActiveSessionForCallback:(RNNfcResponseSenderBlock)callback;

+ (void)createAndBeginTagSessionWithTechs:(NSArray<NSString *> *)techs
                                  options:(NSDictionary *)options
                                 callback:(RNNfcResponseSenderBlock)callback;

+ (void)createAndBeginNdefSessionWithOptions:(NSDictionary *)options
                                     callback:(RNNfcResponseSenderBlock)callback;

+ (NFCTagReaderSession * _Nullable)requireTagSessionRegisteredWithCallback:(RNNfcResponseSenderBlock)callback
                                                          noSessionMessage:(NSString *)noSessionMessage;

+ (NFCNDEFReaderSession * _Nullable)requireNdefSessionRegisteredWithCallback:(RNNfcResponseSenderBlock)callback
                                                             noSessionMessage:(NSString *)noSessionMessage;

+ (void)invalidateActiveSessionWithCallback:(RNNfcResponseSenderBlock)callback;

+ (void)invalidateSessionWithCallback:(RNNfcResponseSenderBlock)callback;

+ (void)invalidateActiveSessionWithErrorMessage:(NSString *)errorMessage
                                       callback:(RNNfcResponseSenderBlock)callback;

+ (void)invalidateSessionWithErrorMessage:(NSString *)errorMessage
                                 callback:(RNNfcResponseSenderBlock)callback;

+ (void)restartTechnologyRequestWithCallback:(RNNfcResponseSenderBlock)callback;

+ (void)cancelTechnologyRequestWithCallback:(RNNfcResponseSenderBlock)callback;

+ (void)unregisterTagEventWithCallback:(RNNfcResponseSenderBlock)callback;

+ (void)setAlertMessage:(NSString *)alertMessage
               callback:(RNNfcResponseSenderBlock)callback;

+ (void)isSessionAvailableWithCallback:(RNNfcResponseSenderBlock)callback;

+ (void)isTagSessionAvailableWithCallback:(RNNfcResponseSenderBlock)callback;

+ (void)sendMifareCommand:(NSArray<NSNumber *> *)bytes
                                                        callback:(RNNfcResponseSenderBlock)callback;

+ (void)sendFelicaCommand:(NSArray<NSNumber *> *)bytes
                                                       callback:(RNNfcResponseSenderBlock)callback;

+ (void)sendCommandAPDUBytes:(NSArray<NSNumber *> *)bytes
                                                          callback:(RNNfcResponseSenderBlock)callback;

+ (void)sendCommandAPDU:(NSDictionary *)payload
                                          callback:(RNNfcResponseSenderBlock)callback;

+ (void)getNdefMessageFromTagSession:(NFCTagReaderSession * _Nullable)tagSession
                                               callback:(RNNfcResponseSenderBlock)callback;

+ (void)writeNdefMessage:(NSArray<NSNumber *> *)bytes
                           toTagSession:(NFCTagReaderSession * _Nullable)tagSession
                                callback:(RNNfcResponseSenderBlock)callback;

+ (void)makeTagReadOnlyFromTagSession:(NFCTagReaderSession * _Nullable)tagSession
                                                   callback:(RNNfcResponseSenderBlock)callback;

+ (void)queryNdefStatusFromTagSession:(NFCTagReaderSession * _Nullable)tagSession
                                                   callback:(RNNfcResponseSenderBlock)callback;

+ (NSArray *)convertNdefMessage:(NFCNDEFMessage *)message;

+ (void)getTagWithCallback:(RNNfcResponseSenderBlock)callback;

+ (void)getTagFromTagSession:(NFCTagReaderSession * _Nullable)tagSession
                      callback:(RNNfcResponseSenderBlock)callback;

+ (void)getNdefMessageWithCallback:(RNNfcResponseSenderBlock)callback;

+ (void)writeNdefMessage:(NSArray<NSNumber *> *)bytes
                 options:(NSDictionary *)options
                callback:(RNNfcResponseSenderBlock)callback;

+ (void)makeReadOnlyWithCallback:(RNNfcResponseSenderBlock)callback;

+ (void)queryNdefStatusWithCallback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693GetSystemInfo:(NSNumber *)flags
                                            callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693ReadSingleBlock:(NSDictionary *)options
                                              callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693ReadMultipleBlocks:(NSDictionary *)options
                                                  callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693WriteSingleBlock:(NSDictionary *)options
                                               callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693LockBlock:(NSDictionary *)options
                                          callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693WriteAFI:(NSDictionary *)options
                                        callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693LockAFI:(NSDictionary *)options
                                       callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693WriteDSFID:(NSDictionary *)options
                                          callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693LockDSFID:(NSDictionary *)options
                                         callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693ResetToReady:(NSDictionary *)options
                                            callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693Select:(NSDictionary *)options
                                       callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693StayQuiet:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693CustomCommand:(NSDictionary *)options
                                             callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693SendRequest:(NSDictionary *)options
                                           callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693ExtendedReadSingleBlock:(NSDictionary *)options
                                                      callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693ExtendedReadMultipleBlocks:(NSDictionary *)options
                                                           callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693ExtendedWriteSingleBlock:(NSDictionary *)options
                                                       callback:(RNNfcResponseSenderBlock)callback;

+ (void)iso15693ExtendedLockBlock:(NSDictionary *)options
                                                 callback:(RNNfcResponseSenderBlock)callback;

+ (void)sendMifareCommandWithSession:(NFCTagReaderSession *)session
                               bytes:(NSArray<NSNumber *> *)bytes
                                          completion:(RNNfcDataResultBlock)completion;

+ (void)sendFelicaCommandWithSession:(NFCTagReaderSession *)session
                               bytes:(NSArray<NSNumber *> *)bytes
                                          completion:(RNNfcDataResultBlock)completion;

+ (void)sendCommandAPDUBytesWithSession:(NFCTagReaderSession *)session
                                   bytes:(NSArray<NSNumber *> *)bytes
                                                  completion:(RNNfcIsoDepResultBlock)completion;

+ (void)sendCommandAPDUWithSession:(NFCTagReaderSession *)session
                            payload:(NSDictionary *)payload
                                         completion:(RNNfcIsoDepResultBlock)completion;

+ (void)iso15693GetSystemInfoWithSession:(NFCTagReaderSession *)session
                                                            flags:(NSNumber *)flags
                                                   completion:(RNNfcIso15693SystemInfoResultBlock)completion;

+ (void)iso15693ReadSingleBlockWithSession:(NFCTagReaderSession *)session
                                                            options:(NSDictionary *)options
                                                       completion:(RNNfcDataResultBlock)completion;

+ (void)iso15693ReadMultipleBlocksWithSession:(NFCTagReaderSession *)session
                                                                 options:(NSDictionary *)options
                                                            completion:(RNNfcIso15693BlocksResultBlock)completion;

+ (void)iso15693WriteSingleBlockWithSession:(NFCTagReaderSession *)session
                                                             options:(NSDictionary *)options
                                                        completion:(RNNfcVoidResultBlock)completion;

+ (void)iso15693LockBlockWithSession:(NFCTagReaderSession *)session
                                                  options:(NSDictionary *)options
                                             completion:(RNNfcVoidResultBlock)completion;

+ (void)iso15693WriteAFIWithSession:(NFCTagReaderSession *)session
                                              options:(NSDictionary *)options
                                         completion:(RNNfcVoidResultBlock)completion;

+ (void)iso15693LockAFIWithSession:(NFCTagReaderSession *)session
                                             options:(NSDictionary *)options
                                        completion:(RNNfcVoidResultBlock)completion;

+ (void)iso15693WriteDSFIDWithSession:(NFCTagReaderSession *)session
                                                  options:(NSDictionary *)options
                                             completion:(RNNfcVoidResultBlock)completion;

+ (void)iso15693LockDSFIDWithSession:(NFCTagReaderSession *)session
                                               options:(NSDictionary *)options
                                          completion:(RNNfcVoidResultBlock)completion;

+ (void)iso15693ResetToReadyWithSession:(NFCTagReaderSession *)session
                                                       options:(NSDictionary *)options
                                                  completion:(RNNfcVoidResultBlock)completion;

+ (void)iso15693SelectWithSession:(NFCTagReaderSession *)session
                                             options:(NSDictionary *)options
                                        completion:(RNNfcVoidResultBlock)completion;

+ (void)iso15693StayQuietWithSession:(NFCTagReaderSession *)session
                                              completion:(RNNfcVoidResultBlock)completion;

+ (void)iso15693CustomCommandWithSession:(NFCTagReaderSession *)session
                                                        options:(NSDictionary *)options
                                                   completion:(RNNfcDataResultBlock)completion;

+ (void)iso15693SendRequestWithSession:(NFCTagReaderSession *)session
                                                    options:(NSDictionary *)options
                                               completion:(RNNfcIso15693SendRequestResultBlock)completion;

+ (void)iso15693ExtendedReadSingleBlockWithSession:(NFCTagReaderSession *)session
                                                                        options:(NSDictionary *)options
                                                                   completion:(RNNfcDataResultBlock)completion;

+ (void)iso15693ExtendedReadMultipleBlocksWithSession:(NFCTagReaderSession *)session
                                                                             options:(NSDictionary *)options
                                                                        completion:(RNNfcIso15693BlocksResultBlock)completion;

+ (void)iso15693ExtendedWriteSingleBlockWithSession:(NFCTagReaderSession *)session
                                                                           options:(NSDictionary *)options
                                                                      completion:(RNNfcVoidResultBlock)completion;

+ (void)iso15693ExtendedLockBlockWithSession:(NFCTagReaderSession *)session
                                                              options:(NSDictionary *)options
                                                         completion:(RNNfcVoidResultBlock)completion;

@end

NS_ASSUME_NONNULL_END
