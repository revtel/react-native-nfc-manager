#import <Foundation/Foundation.h>

#if __has_include(<React/RCTBridgeModule.h>)
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#elif __has_include("React/RCTBridgeModule.h")
#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"
#else
#import "RCTBridgeModule.h"
#import "RCTEventEmitter.h"
#endif

NS_ASSUME_NONNULL_BEGIN

@interface RNNfcBridgeUtil : NSObject

+ (void)setEventEmitter:(RCTEventEmitter * _Nullable)eventEmitter;

+ (void)sendResultToCallback:(RCTResponseSenderBlock)callback
                       error:(NSError * _Nullable)error
                     payload:(id _Nullable)payload;

+ (void)emitEvent:(NSString *)name
             body:(id _Nullable)body;

@end

NS_ASSUME_NONNULL_END
