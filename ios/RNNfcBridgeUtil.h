#import <Foundation/Foundation.h>

#if __has_include(<React/RCTBridgeModule.h>)
#import <React/RCTBridgeModule.h>
#elif __has_include("React/RCTBridgeModule.h")
#import "React/RCTBridgeModule.h"
#else
#import "RCTBridgeModule.h"
#endif

NS_ASSUME_NONNULL_BEGIN

typedef void (^RNNfcEventEmitterBlock)(NSString *name, id _Nullable body);

@interface RNNfcBridgeUtil : NSObject

+ (void)setEventEmitter:(RNNfcEventEmitterBlock _Nullable)eventEmitter;

+ (void)sendResultToCallback:(RCTResponseSenderBlock)callback
                       error:(NSError * _Nullable)error
                     payload:(id _Nullable)payload;

+ (void)emitEvent:(NSString *)name
             body:(id _Nullable)body;

@end

NS_ASSUME_NONNULL_END
