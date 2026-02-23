#import "RNNfcBridgeUtil.h"

@implementation RNNfcBridgeUtil

static __weak RCTEventEmitter *sEventEmitter = nil;

static NSString *RNNfcErrorMessageFromError(NSError *error)
{
    NSError *underlyingError = error.userInfo[NSUnderlyingErrorKey];
    if (underlyingError != nil) {
        return [NSString stringWithFormat:@"%@:%ld,%@:%ld",
                error.domain,
                (long)error.code,
                underlyingError.domain,
                (long)underlyingError.code];
    }

    return [NSString stringWithFormat:@"%@:%ld", error.domain, (long)error.code];
}

+ (void)setEventEmitter:(RCTEventEmitter * _Nullable)eventEmitter
{
    sEventEmitter = eventEmitter;
}

+ (void)sendResultToCallback:(RCTResponseSenderBlock)callback
                       error:(NSError * _Nullable)error
                     payload:(id _Nullable)payload
{
    if (error) {
        callback(@[RNNfcErrorMessageFromError(error), [NSNull null]]);
        return;
    }

    if (payload != nil) {
        callback(@[[NSNull null], payload]);
    } else {
        callback(@[]);
    }
}

+ (void)emitEvent:(NSString *)name
             body:(id _Nullable)body
{
    if (sEventEmitter == nil) {
        return;
    }

    [sEventEmitter sendEventWithName:name body:body];
}

@end
